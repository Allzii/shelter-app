const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function service(location = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("src/services/locations.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    setTimeout,
    clearTimeout,
    require: (name) => {
      if (name === "expo-location")
        return { Accuracy: { High: 4 }, ...location };
      if (name === "expo-crypto") {
        return {
          CryptoDigestAlgorithm: { SHA256: "sha256" },
          digestStringAsync: async (_, value) =>
            createHash("sha256").update(value).digest("hex"),
        };
      }
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  return module.exports;
}

const address = {
  street: "Testgatan 1",
  postal_code: "123 45",
  city: "Teststad",
};

test("address fingerprint ignores display whitespace and changes after an edit", async () => {
  const api = service();
  const key = await api.addressLocationKey(address);
  assert.equal(
    key,
    await api.addressLocationKey({
      ...address,
      street: " Testgatan 1 ",
      postal_code: "12345",
    }),
  );
  assert.notEqual(
    key,
    await api.addressLocationKey({ ...address, street: "Testgatan 2" }),
  );
});

test("incomplete address is rejected without calling a geocoder", async () => {
  const api = service({ geocodeAsync: () => assert.fail("Must not geocode") });
  await assert.rejects(api.geocodeRegisteredAddress({ ...address, city: "" }));
});

test("registered address, including another person's address, supplies the destination", async () => {
  const api = service({
    geocodeAsync: async (value) => {
      assert.equal(value, "Testgatan 1, 123 45, Teststad, Sverige");
      return [{ latitude: 59.3, longitude: 18.1, accuracy: 20 }];
    },
  });
  const coordinate = await api.geocodeRegisteredAddress(address);
  assert.equal(coordinate.latitude, 59.3);
  assert.equal(coordinate.longitude, 18.1);
});

test("no, ambiguous, imprecise and invalid address matches are rejected", async () => {
  const point = { latitude: 59.3, longitude: 18.1 };
  for (const result of [
    [],
    [point, point],
    [{ ...point, accuracy: 1000 }],
    [{ ...point, latitude: NaN }],
  ]) {
    await assert.rejects(
      service({ geocodeAsync: async () => result }).geocodeRegisteredAddress(
        address,
      ),
    );
  }
});

test("current position rejects coarse or missing accuracy instead of showing a precise distance", async () => {
  for (const accuracy of [null, 1000, NaN, -1]) {
    const api = service({
      getCurrentPositionAsync: async () => ({
        coords: { latitude: 59.3, longitude: 18.1, accuracy },
      }),
    });
    await assert.rejects(api.getCurrentCoordinate());
  }
  const api = service({
    getCurrentPositionAsync: async () => ({
      coords: { latitude: 59.3, longitude: 18.1, accuracy: 20 },
    }),
  });
  assert.equal((await api.getCurrentCoordinate()).latitude, 59.3);
});
