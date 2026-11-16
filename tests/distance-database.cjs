// Only synthetic fixtures in a temporary, isolated PostgreSQL cluster.
// This runner cannot connect to a hosted project or the normal local database.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const bin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
const cluster = fs.mkdtempSync(
  path.join(os.tmpdir(), "tryggnara-distance-check-"),
);
let started = false;

function run(name, args, input) {
  const file = path.join(
    bin,
    `${name}${process.platform === "win32" ? ".exe" : ""}`,
  );
  const result = spawnSync(file, args, {
    input,
    encoding: "utf8",
    windowsHide: true,
    timeout: 60_000,
    // A background PostgreSQL process must not inherit Node's pipe handles.
    ...(name === "pg_ctl" ? { stdio: "ignore" } : {}),
  });
  if (result.error || result.status !== 0)
    throw new Error(result.error?.message || result.stderr || result.stdout);
  return (result.stdout || "").trim();
}

async function main() {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
  const query = (sql) =>
    run(
      "psql",
      [
        "-X",
        "-q",
        "-w",
        "-t",
        "-A",
        "-v",
        "ON_ERROR_STOP=1",
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-d",
        "postgres",
      ],
      sql,
    );
  const owner = "00000000-0000-0000-0000-000000000001";
  const helper = "00000000-0000-0000-0000-000000000002";
  const stranger = "00000000-0000-0000-0000-000000000003";
  const recipient = "00000000-0000-0000-0000-000000000011";
  const request = "00000000-0000-0000-0000-000000000021";
  const asUser = (id, sql) =>
    query(
      `set role authenticated; set request.jwt.claim.sub = '${id}'; ${sql}`,
    );
  const distances = `select * from public.get_request_distances(array['${request}'::uuid], 59, 18);`;

  try {
    run("initdb", [
      "-D",
      cluster,
      "-U",
      "postgres",
      "-A",
      "trust",
      "--no-locale",
      "-E",
      "UTF8",
    ]);
    run("pg_ctl", [
      "-D",
      cluster,
      "-l",
      path.join(cluster, "server.log"),
      "-o",
      `-p ${port} -h 127.0.0.1 -F`,
      "start",
    ]);
    started = true;
    query(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table public.help_recipients(id uuid primary key, account_id uuid, street text, postal_code text, city text);
      create table public.helper_profiles(account_id uuid primary key, is_available boolean);
      create table public.helper_certificates(account_id uuid primary key, status text);
      create table public.help_requests(id uuid primary key, recipient_id uuid, created_by uuid, helper_account_id uuid, status text);
      alter table public.help_recipients enable row level security;
      create policy own_profile on public.help_recipients for all to authenticated using(account_id=auth.uid()) with check(account_id=auth.uid());
      grant select, update on public.help_recipients to authenticated;
      insert into public.help_recipients values ('${recipient}', '${owner}', 'Testgatan 1', '123 45', 'Teststad');
      insert into public.helper_profiles values ('${helper}', true), ('${stranger}', true), ('${owner}', true);
      insert into public.helper_certificates values ('${helper}', 'approved'), ('${stranger}', 'pending'), ('${owner}', 'approved');
      insert into public.help_requests values ('${request}', '${recipient}', '${owner}', null, 'pending');
    `);
    query(
      fs.readFileSync(
        "supabase/migrations/20261116091030_recipient_address_distances.sql",
        "utf8",
      ),
    );
    const key =
      "encode(sha256(convert_to(E'Testgatan 1\\n12345\\nTeststad','UTF8')), 'hex')";
    asUser(
      owner,
      `insert into public.recipient_address_locations values ('${recipient}', 59.001, 18, ${key});`,
    );

    const row = asUser(helper, distances).split("|");
    assert.equal(row[0], request);
    assert.equal(Number(row[1]), 100);
    assert.equal(
      row.length,
      2,
      "Only request ID and rounded distance are returned",
    );
    assert.equal(
      asUser(
        helper,
        "select count(*) from public.recipient_address_locations;",
      ),
      "0",
    );
    assert.equal(
      asUser(owner, distances),
      "",
      "Cannot see a distance to your own request",
    );
    assert.throws(
      () => asUser(stranger, distances),
      /Approved helper required/,
    );
    assert.throws(
      () => query(`set role anon; ${distances}`),
      /permission denied/,
    );
    assert.throws(
      () =>
        asUser(
          helper,
          `select * from public.get_request_distances(array['${request}'::uuid], 'NaN', 18);`,
        ),
      /Invalid distance parameters/,
    );
    assert.throws(
      () =>
        asUser(
          helper,
          `insert into public.recipient_address_locations values ('${recipient}', 59, 18, ${key});`,
        ),
      /row-level security/,
    );
    assert.throws(
      () =>
        asUser(
          owner,
          `update public.recipient_address_locations set address_key = repeat('a',64);`,
        ),
      /row-level security/,
    );
    query(
      `update public.helper_profiles set is_available=false where account_id='${helper}';`,
    );
    assert.equal(
      asUser(helper, distances),
      "",
      "Paused volunteers cannot inspect pending requests",
    );
    query(
      `update public.help_requests set status='accepted', helper_account_id='${helper}'; update public.helper_certificates set status='approved' where account_id='${stranger}';`,
    );
    assert.equal(
      asUser(helper, distances).split("|")[1],
      "100",
      "Accepted assignment remains accessible while paused",
    );
    assert.equal(
      asUser(stranger, distances),
      "",
      "Other volunteers lose access after acceptance",
    );
    asUser(owner, "update public.help_recipients set street='Testgatan 2';");
    assert.equal(
      asUser(helper, distances),
      "",
      "Address edits immediately invalidate old coordinates",
    );
    assert.throws(
      () =>
        asUser(
          owner,
          `update public.recipient_address_locations set address_key=${key};`,
        ),
      /row-level security/,
    );
    asUser(owner, "update public.help_recipients set street='Testgatan 1';");
    query("update public.help_requests set status='cancelled';");
    assert.equal(
      asUser(helper, distances),
      "",
      "Cancelled requests have no distance access",
    );
    console.log("PASS: 15 distance and access checks in isolated PostgreSQL");
  } finally {
    if (started) run("pg_ctl", ["-D", cluster, "-m", "fast", "stop"]);
    // Never recursively remove anything outside this uniquely created temp folder.
    const resolved = path.resolve(cluster);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("tryggnara-distance-check-"));
    try {
      fs.rmSync(resolved, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 100,
      });
    } catch (error) {
      console.warn(
        `Temporary test files remain at ${resolved}: ${error.message}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
