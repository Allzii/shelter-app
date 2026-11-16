import * as Crypto from "expo-crypto";
import * as Location from "expo-location";

import type { Coordinate } from "@/types/location";

export type RegisteredAddress = {
  street: string;
  postal_code: string;
  city: string;
};

export function isCoordinate(value: Coordinate): boolean {
  return (
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180
  );
}

export function hasCompleteAddress(address: RegisteredAddress): boolean {
  return (
    !!address.street.trim() &&
    /^\d{5}$/.test(address.postal_code.replace(/\D/g, "")) &&
    !!address.city.trim()
  );
}

export function addressLocationKey(address: RegisteredAddress) {
  // The database checks the same fingerprint, so edited addresses never use
  // coordinates from an older address, including saves racing with geocoding.
  const normalized = [
    address.street.trim(),
    address.postal_code.replace(/\D/g, ""),
    address.city.trim(),
  ].join("\n");
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized,
  );
}

export async function withLocationTimeout<T>(
  operation: Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Location timeout")), 20_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeRegisteredAddress(address: RegisteredAddress) {
  if (!hasCompleteAddress(address)) throw new Error("Incomplete address");

  const results = await withLocationTimeout(
    Location.geocodeAsync(
      `${address.street.trim()}, ${address.postal_code}, ${address.city.trim()}, Sverige`,
    ),
  );
  if (
    results.length !== 1 ||
    !isCoordinate(results[0]) ||
    (results[0].accuracy !== undefined &&
      (!Number.isFinite(results[0].accuracy) ||
        results[0].accuracy < 0 ||
        results[0].accuracy > 100))
  ) {
    throw new Error("Address could not be located precisely");
  }

  return { latitude: results[0].latitude, longitude: results[0].longitude };
}

export async function getCurrentCoordinate(): Promise<Coordinate> {
  const position = await withLocationTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
  );
  if (
    !isCoordinate(position.coords) ||
    typeof position.coords.accuracy !== "number" ||
    !Number.isFinite(position.coords.accuracy) ||
    position.coords.accuracy < 0 ||
    position.coords.accuracy > 100
  ) {
    throw new Error("Location is too imprecise");
  }
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
