import { ArrowUpRight, MapPin } from "lucide-react-native";
import { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants/colors";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ShelterMapProps = {
  shelter: Coordinate;
  userLocation?: Coordinate;
};

export default function ShelterMap({
  shelter,
}: ShelterMapProps) {
  const [message, setMessage] = useState("");

  const openMap = async () => {
    setMessage("");

    const url =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        `${shelter.latitude},${shelter.longitude}`
      );

    try {
      await Linking.openURL(url);
    } catch {
      setMessage("Kunde inte öppna kartan. Försök igen.");
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Visa skyddsrummets position på Google Maps"
        onPress={() => void openMap()}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        <MapPin size={22} color={colors.primary} strokeWidth={1.7} />

        <View style={styles.linkRow}>
          <Text style={styles.linkText}>
            Öppna karta
          </Text>

          <ArrowUpRight
            size={18}
            color={colors.primary}
          />
        </View>
      </Pressable>

      {message !== "" && (
        <Text
          style={styles.message}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  linkRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },

  linkText: {
    flexShrink: 1,
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
    opacity: 0.75,
  },
});
