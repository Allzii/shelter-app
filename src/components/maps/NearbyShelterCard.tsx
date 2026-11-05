import * as Location from "expo-location";
import {
  ArrowUpRight,
  MapPin,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ShelterMap from "@/components/maps/ShelterMap";
import { colors } from "@/constants/colors";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Shelter = Coordinate & {
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

type CardState =
  | "loading"
  | "permission"
  | "blocked"
  | "ready"
  | "empty"
  | "error";

type NearbyShelterCardProps = {
  forOtherPerson?: boolean;
};

const API_URL =
  "https://inspire.mcf.se/skyddsrum/ogc/features/v1/" +
  "collections/US_civilProtectionSite/items";

const OFFICIAL_MAP_URL =
  "https://kartor.mcf.se/kartportal/";

const EARTH_RADIUS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function calculateDistance(
  first: Coordinate,
  second: Coordinate
) {
  const latitudeDifference = toRadians(
    second.latitude - first.latitude
  );

  const longitudeDifference = toRadians(
    second.longitude - first.longitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
  );
}

function createBoundingBox(
  location: Coordinate,
  radius: number
) {
  const angularDistance = radius / EARTH_RADIUS;
  const latitude = toRadians(location.latitude);

  const latitudeDelta = toDegrees(angularDistance);

  const longitudeDelta = toDegrees(
    Math.asin(
      Math.min(
        1,
        Math.sin(angularDistance) /
          Math.max(0.000001, Math.cos(latitude))
      )
    )
  );

  return [
    location.longitude - longitudeDelta,
    location.latitude - latitudeDelta,
    location.longitude + longitudeDelta,
    location.latitude + latitudeDelta,
  ].join(",");
}

function readCoordinate(
  geometry: Feature["geometry"]
): Coordinate | null {
  if (!geometry) return null;

  let point: unknown = geometry.coordinates;

  if (
    geometry.type === "MultiPoint" &&
    Array.isArray(point)
  ) {
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

async function findNearestShelter(
  location: Coordinate,
  signal: AbortSignal
): Promise<Shelter | null> {
  // Sökningen utökas om inget skyddsrum finns nära.
  // Gränsen 1 km för volontärer gäller inte skyddsrum.
  for (const radius of [2_000, 10_000, 50_000]) {
    const query = new URLSearchParams({
      f: "application/geo+json",
      bbox: createBoundingBox(location, radius),
      limit: "1000",
    });

    let nextUrl: string | null =
      `${API_URL}?${query.toString()}`;

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

      const data =
        (await response.json()) as FeatureCollection;

      if (!Array.isArray(data.features)) {
        throw new Error("Invalid shelter response");
      }

      for (const feature of data.features) {
        const properties = feature.properties;
        const coordinate = readCoordinate(feature.geometry);

        if (!coordinate || !properties) continue;

        if (properties.statustype !== "Skyddsrum") continue;
        if (properties.endlifespanversion) continue;

        const distance = calculateDistance(
          location,
          coordinate
        );

        if (distance > radius) continue;
        if (nearest && distance >= nearest.distance) continue;

        nearest = {
          ...coordinate,
          id: String(
            feature.id ??
              `${coordinate.latitude},${coordinate.longitude}`
          ),
          number: properties.name?.trim() ?? "",
          property:
            properties.additionallocationdescription?.trim() ??
            "",
          distance,
        };
      }

      const nextLink = data.links?.find(
        (link) => link.rel === "next"
      )?.href;

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

function formatDistance(metres: number) {
  if (metres < 1_000) {
    return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  }

  return `${(metres / 1_000)
    .toFixed(1)
    .replace(".", ",")} km`;
}

async function getPositionWithTimeout() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),

      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("Location timeout"));
        }, 20_000);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export default function NearbyShelterCard({
  forOtherPerson = false,
}: NearbyShelterCardProps) {
  const [state, setState] =
    useState<CardState>("loading");

  const [shelter, setShelter] = useState<Shelter | null>(
    null
  );

  const [userLocation, setUserLocation] =
    useState<Coordinate | null>(null);

  const [message, setMessage] = useState("");
  const [linkMessage, setLinkMessage] = useState("");

  const mounted = useRef(false);
  const busy = useRef(false);
  const requestId = useRef(0);

  const controller = useRef<AbortController | null>(
    null
  );

  const loadShelter = useCallback(
    async (requestPermission: boolean) => {
      if (busy.current) return;

      busy.current = true;

      const currentRequest = ++requestId.current;

      const isCurrent = () =>
        mounted.current &&
        currentRequest === requestId.current;

      let fetchTimer:
        | ReturnType<typeof setTimeout>
        | undefined;

      setState("loading");
      setMessage("");
      setLinkMessage("");

      try {
        let permission =
          await Location.getForegroundPermissionsAsync();

        if (
          !permission.granted &&
          requestPermission &&
          permission.canAskAgain
        ) {
          permission =
            await Location.requestForegroundPermissionsAsync();
        }

        if (!isCurrent()) return;

        if (!permission.granted) {
          setState(
            permission.canAskAgain ? "permission" : "blocked"
          );
          return;
        }

        const position = await getPositionWithTimeout();

        if (!isCurrent()) return;

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(location);

        const fetchController = new AbortController();
        controller.current = fetchController;

        fetchTimer = setTimeout(() => {
          fetchController.abort();
        }, 30_000);

        const nearest = await findNearestShelter(
          location,
          fetchController.signal
        );

        if (!isCurrent()) return;

        setShelter(nearest);
        setState(nearest ? "ready" : "empty");
      } catch {
        if (!isCurrent()) return;

        setState("error");
        setMessage(
          "Kunde inte hämta din position eller skyddsrummen. Kontrollera anslutningen och att platstjänster är på."
        );
      } finally {
        if (fetchTimer !== undefined) {
          clearTimeout(fetchTimer);
        }

        if (currentRequest === requestId.current) {
          busy.current = false;
          controller.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    mounted.current = true;

    if (!forOtherPerson) {
      void loadShelter(false);
    }

    return () => {
      mounted.current = false;
      requestId.current += 1;
      busy.current = false;
      controller.current?.abort();
      controller.current = null;
    };
  }, [forOtherPerson, loadShelter]);

  const openUrl = async (url: string) => {
    setLinkMessage("");

    try {
      await Linking.openURL(url);
    } catch {
      if (mounted.current) {
        setLinkMessage(
          "Kunde inte öppna kartan. Försök igen."
        );
      }
    }
  };

  const openSettings = async () => {
    setLinkMessage("");

    if (Platform.OS === "web") {
      setLinkMessage(
        "Tillåt platsåtkomst i webbläsarens webbplatsinställningar och tryck sedan på Uppdatera."
      );
      return;
    }

    try {
      await Linking.openSettings();
    } catch {
      if (mounted.current) {
        setLinkMessage(
          "Öppna telefonens inställningar och tillåt platsåtkomst för appen."
        );
      }
    }
  };

  const openShelter = () => {
    if (!shelter) return;

    const coordinates = encodeURIComponent(
      `${shelter.latitude},${shelter.longitude}`
    );

    void openUrl(
      `https://www.google.com/maps/search/?api=1&query=${coordinates}`
    );
  };

  if (forOtherPerson) {
    return (
      <View style={styles.card}>
        <Text style={styles.stateTitle}>
          Hitta skyddsrum
        </Text>

        <Text style={styles.stateDescription}>
          Sök nära personen du har registrerat på
          skyddsrumskartan.
        </Text>

        <Pressable
          accessibilityRole="link"
          onPress={() => void openUrl(OFFICIAL_MAP_URL)}
          style={styles.action}
        >
          <Text style={styles.actionText}>
            Öppna skyddsrumskartan
          </Text>

          <ArrowUpRight
            size={18}
            color={colors.primary}
          />
        </Pressable>

        {linkMessage !== "" && (
          <Text
            style={styles.message}
            accessibilityLiveRegion="polite"
          >
            {linkMessage}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {state === "ready" && shelter && userLocation ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.shelterTitle} accessibilityRole="header">
                Närmaste skyddsrum
              </Text>
              <Text style={styles.distance}>
                {shelter.property ? `${shelter.property} · ` : ""}
                {formatDistance(shelter.distance)}
              </Text>
            </View>
          </View>

          <ShelterMap
            shelter={shelter}
            userLocation={userLocation}
          />

          <View style={styles.footer}>
            <Text style={styles.source}>
              Källa: MCF
            </Text>

            {Platform.OS !== "web" && <Pressable
              accessibilityRole="link"
              accessibilityLabel="Visa skyddsrummet på Google Maps"
              onPress={openShelter}
              style={({ pressed }) => [
                styles.mapLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionText}>
                Öppna karta
              </Text>

              <ArrowUpRight
                size={17}
                color={colors.primary}
              />
            </Pressable>}
          </View>
        </>
      ) : state === "loading" ? (
        <View style={styles.loading}>
          <ActivityIndicator
            color={colors.primary}
          />

          <Text style={styles.stateDescription}>
            Söker skyddsrum nära dig…
          </Text>
        </View>
      ) : (
        <>
          <MapPin
            size={26}
            color={colors.primary}
            strokeWidth={1.7}
          />

          <Text style={styles.stateTitle}>
            {state === "permission" || state === "blocked"
              ? "Skyddsrum nära dig"
              : state === "empty"
                ? "Inget skyddsrum hittades inom 50 km"
                : "Kunde inte hämta skyddsrummen"}
          </Text>

          <Text style={styles.stateDescription}>
            {state === "permission"
              ? "Använd din position för att hitta närmaste skyddsrum."
              : state === "blocked"
                ? "Tillåt platsåtkomst i inställningarna för att söka nära dig."
                : state === "empty"
                  ? "Du kan söka vidare på myndighetens skyddsrumskarta."
                  : message}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (state === "blocked") {
                void openSettings();
              } else if (state === "empty") {
                void openUrl(OFFICIAL_MAP_URL);
              } else {
                void loadShelter(true);
              }
            }}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>
              {state === "permission"
                ? "Använd min position"
                : state === "blocked"
                  ? "Öppna inställningar"
                  : state === "empty"
                    ? "Öppna skyddsrumskartan"
                    : "Försök igen"}
            </Text>
          </Pressable>

          {state === "blocked" && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadShelter(false)}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>
                Uppdatera
              </Text>
            </Pressable>
          )}
        </>
      )}

      {linkMessage !== "" && (
        <Text
          style={styles.message}
          accessibilityLiveRegion="polite"
        >
          {linkMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  headerText: {
    flex: 1,
  },

  distance: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  shelterTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: colors.text,
  },

  footer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  source: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  mapLink: {
    minHeight: 44,
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  refreshButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  refreshText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

  loading: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  stateTitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
  },

  stateDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  action: {
    minHeight: 48,
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  message: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },

  pressed: {
    opacity: 0.7,
  },
});
