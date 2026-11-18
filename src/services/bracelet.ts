import { supabase } from "@/lib/supabase";

export type BraceletIdentity = { device_id: string; device_secret: string };
export type BraceletPerson = {
  id: string;
  first_name: string;
  last_name: string;
  registration_for: string;
  street: string;
  postal_code: string;
  city: string;
  created_at: string;
};
export type BraceletLink = {
  device_id: string;
  paired_at: string;
  sos_enabled: boolean | null;
};

export function readBraceletIdentity(
  data: Record<string, unknown>,
): BraceletIdentity {
  if (
    typeof data.device_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      data.device_id,
    ) ||
    typeof data.device_secret !== "string" ||
    !/^[0-9a-f]{64}$/.test(data.device_secret)
  )
    throw new Error(
      "Armbandets identitet kunde inte läsas. Installera den uppdaterade wifi_setup.py på armbandet.",
    );
  return { device_id: data.device_id, device_secret: data.device_secret };
}

export async function getBraceletPeople(recipientId?: string) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    throw new Error("Logga in igen för att koppla armbandet.");
  let query = supabase
    .from("help_recipients")
    .select(
      "id, first_name, last_name, registration_for, street, postal_code, city, created_at",
    )
    .eq("account_id", auth.user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (recipientId) {
    // Registration step five must still be able to pair its unfinished profile.
    query = query.eq("id", recipientId);
  } else {
    query = query.not("registration_completed_at", "is", null);
  }
  const { data, error } = await query;
  if (error)
    throw new Error(
      "Kunde inte hämta registreringarna. Kontrollera internetanslutningen och försök igen.",
    );
  return { accountId: auth.user.id, people: data as BraceletPerson[] };
}

export async function getBraceletLink(recipientId: string) {
  const { data, error } = await supabase.rpc("get_bracelet_link", {
    p_recipient_id: recipientId,
  });
  if (error)
    throw new Error(
      "Kunde inte kontrollera armbandskopplingen. Kontrollera internetanslutningen och att SQL-filen för armband har körts.",
    );
  const link = data?.[0] as Omit<BraceletLink, "sos_enabled"> | undefined;
  if (!link) return null;
  const { data: version, error: versionError } = await supabase.rpc(
    "bracelet_sos_version",
  );
  return {
    ...link,
    sos_enabled: versionError
      ? ["PGRST202", "42883"].includes(versionError.code)
        ? false
        : null
      : version === 1,
  };
}

async function checkAccount(accountId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== accountId)
    throw new Error("Kontot har ändrats. Börja om kopplingen.");
}

export async function pairBracelet(
  recipientId: string,
  identity: BraceletIdentity,
  accountId: string,
) {
  await checkAccount(accountId);
  const { data, error } = await supabase.rpc("pair_bracelet", {
    p_recipient_id: recipientId,
    p_device_id: identity.device_id,
    p_device_secret: identity.device_secret,
  });
  if (error) {
    if (error.code === "23505")
      throw new Error(
        "Armbandet eller personen har redan en annan koppling. Ta bort den kopplingen först.",
      );
    throw new Error(
      "Kopplingen kunde inte sparas. Anslut mobilen till internet och försök igen. Kontrollera även att SQL-filen för armband har körts.",
    );
  }
  if (data !== identity.device_id)
    throw new Error("Kopplingen kunde inte bekräftas. Försök igen.");
}

export async function unlinkBracelet(recipientId: string, accountId: string) {
  await checkAccount(accountId);
  const { error } = await supabase.rpc("unlink_bracelet", {
    p_recipient_id: recipientId,
  });
  if (error)
    throw new Error(
      "Kopplingen kunde inte tas bort. Kontrollera internetanslutningen och försök igen.",
    );
}
