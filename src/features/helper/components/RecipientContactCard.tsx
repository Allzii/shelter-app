import { ArrowUpRight, MapPin, Phone } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

export type RecipientContact = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
};

export default function RecipientContactCard({
  contact,
}: {
  contact: RecipientContact;
}) {
  const [message, setMessage] = useState("");

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() ||
    "Personen du hjälper";

  const phone = contact.phone?.trim() || "";
  const dialNumber = phone.replace(/[^+\d]/g, "");
  const canCall = /^\+?\d{5,15}$/.test(dialNumber);

  const locality = [contact.postal_code, contact.city]
    .filter(Boolean)
    .join(" ");

  const address = [contact.street, locality].filter(Boolean).join(", ").trim();

  const openUrl = async (url: string) => {
    setMessage("");

    try {
      await Linking.openURL(url);
    } catch {
      setMessage("Kunde inte öppna telefonen eller kartan. Försök igen.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Du hjälper</Text>
      <Text style={styles.name}>{fullName}</Text>

      <Text selectable style={styles.phone}>
        {phone || "Telefonnummer saknas"}
      </Text>

      {canCall && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ring ${fullName}`}
          onPress={() => void openUrl(`tel:${dialNumber}`)}
          style={({ pressed }) => [
            styles.callButton,
            pressed && styles.pressed,
          ]}
        >
          <Phone size={19} color={colors.surface} />

          <Text style={styles.callText}>
            Ring {contact.first_name?.trim() || "personen"}
          </Text>
        </Pressable>
      )}

      <View style={styles.addressRow}>
        <MapPin size={20} color={colors.primary} />

        <View style={styles.addressText}>
          <Text style={styles.label}>Adress</Text>

          <Text selectable style={styles.street}>
            {contact.street?.trim() || "Gatuadress saknas"}
          </Text>

          {locality ? (
            <Text selectable style={styles.locality}>
              {locality}
            </Text>
          ) : null}
        </View>
      </View>

      {contact.street?.trim() && address ? (
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void openUrl(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
            )
          }
          style={styles.mapLink}
        >
          <Text style={styles.link}>Öppna adressen i kartan</Text>
          <ArrowUpRight size={17} color={colors.primary} />
        </Pressable>
      ) : null}

      {message ? (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  name: {
    marginTop: 4,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.text,
  },
  phone: {
    marginTop: 7,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  callButton: {
    marginTop: 18,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  callText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.surface,
    textAlign: "center",
  },
  addressRow: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressText: { flex: 1 },
  street: {
    marginTop: 3,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.text,
  },
  locality: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  mapLink: {
    minHeight: 44,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  link: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.primary,
  },
  pressed: { opacity: 0.65 },
  message: { marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.error },
});
