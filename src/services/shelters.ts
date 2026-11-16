import type { Coordinate } from "@/types/location";

export type Shelter = Coordinate & {
  id: string;
  number: string;
  property: string;
  distance: number;
};

type Feature = {
  id?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  } | null;
  properties?: {
    name?: string;
    additionallocationdescription?: string;
    statustype?: string;
    endlifespanversion?: string | null;
  } | null;
};

type FeatureCollection = {
  features?: Feature[];
  links?: {
    rel?: string;
    href?: string;
  }[];
};

const API_URL =
  "https://inspire.mcf.se/skyddsrum/ogc/features/v1/" +
  "collections/US_civilProtectionSite/items";

const EARTH_RADIUS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function calculateDistance(first: Coordinate, second: Coordinate) {
  const latitudeDifference = toRadians(second.latitude - first.latitude);

  const longitudeDifference = toRadians(second.longitude - first.longitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

function createBoundingBox(location: Coordinate, radius: number) {
  const angularDistance = radius / EARTH_RADIUS;
  const latitude = toRadians(location.latitude);

  const latitudeDelta = toDegrees(angularDistance);

  const longitudeDelta = toDegrees(
    Math.asin(
      Math.min(
        1,
        Math.sin(angularDistance) / Math.max(0.000001, Math.cos(latitude)),
      ),
    ),
  );

  return [
    location.longitude - longitudeDelta,
    location.latitude - latitudeDelta,
    location.longitude + longitudeDelta,
    location.latitude + latitudeDelta,
  ].join(",");
}

function readCoordinate(geometry: Feature["geometry"]): Coordinate | null {
  if (!geometry) return null;

  let point: unknown = geometry.coordinates;

  if (geometry.type === "MultiPoint" && Array.isArray(point)) {
    point = point[0];
  } else if (geometry.type !== "Point") {
    return null;
  }

  if (!Array.isArray(point) || point.length < 2) {
    return null;
  }

  const [longitude, latitude] = point;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

export async function findNearestShelter(
  location: Coordinate,
  signal: AbortSignal,
): Promise<Shelter | null> {
  // Sökningen utökas om inget skyddsrum finns nära.
  // Gränsen 1 km för volontärer gäller inte skyddsrum.
  for (const radius of [2_000, 10_000, 50_000]) {
    const query = new URLSearchParams({
      f: "application/geo+json",
      bbox: createBoundingBox(location, radius),
      limit: "1000",
    });

    let nextUrl: string | null = `${API_URL}?${query.toString()}`;

    let nearest: Shelter | null = null;
    let pageCount = 0;

    while (nextUrl) {
      pageCount += 1;

      if (pageCount > 40) {
        throw new Error("Too many result pages");
      }

      const response = await fetch(nextUrl, { signal });

      if (!response.ok) {
        throw new Error("Shelter service unavailable");
      }

      const data = (await response.json()) as FeatureCollection;

      if (!Array.isArray(data.features)) {
        throw new Error("Invalid shelter response");
      }

      for (const feature of data.features) {
        const properties = feature.properties;
        const coordinate = readCoordinate(feature.geometry);

        if (!coordinate || !properties) continue;

        if (properties.statustype !== "Skyddsrum") continue;
        if (properties.endlifespanversion) continue;

        const distance = calculateDistance(location, coordinate);

        if (distance > radius) continue;
        if (nearest && distance >= nearest.distance) continue;

        nearest = {
          ...coordinate,
          id: String(
            feature.id ?? `${coordinate.latitude},${coordinate.longitude}`,
          ),
          number: properties.name?.trim() ?? "",
          property: properties.additionallocationdescription?.trim() ?? "",
          distance,
        };
      }

      const nextLink = data.links?.find((link) => link.rel === "next")?.href;

      if (nextLink) {
        const parsedUrl: URL = new URL(nextLink, nextUrl);

        if (
          parsedUrl.protocol !== "https:" ||
          parsedUrl.hostname !== "inspire.mcf.se"
        ) {
          throw new Error("Unexpected pagination link");
        }

        nextUrl = parsedUrl.toString();
      } else {
        nextUrl = null;
      }
    }

    // Alla resultatsidor läses innan närmaste väljs.
    if (nearest) return nearest;
  }

  return null;
}
