import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

import type { AddressLocationStatus } from "@/hooks/useRecipientAddressLocation";

type Props = {
  status: AddressLocationStatus;
  message?: string;
  forOtherPerson: boolean;
  onEnable: () => void;
  onRetry: () => void;
};

export default function AddressDistanceNotice({
  status,
  message,
  forOtherPerson,
  onEnable,
  onRetry,
}: Props) {
  if (["idle", "loading", "ready"].includes(status)) return null;
  const needsPermission = status === "permission" || status === "blocked";
  const text = needsPermission
    ? `Aktivera adressbaserade avstånd så att volontärer kan se ungefär hur långt det är till ${forOtherPerson ? "personens" : "din"} bostad.`
    : status === "incomplete"
      ? "Fyll i gata, ett femsiffrigt postnummer och ort i Profil för att visa avstånd för volontärer."
      : status === "unsupported"
        ? "Öppna profilen i appen på telefonen för att aktivera adressbaserade avstånd."
        : message ||
          "Avstånd till adressen kunde inte förberedas. Försök igen.";
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{text}</Text>
      {(needsPermission || status === "error") && (
        <Pressable
          accessibilityRole="button"
          onPress={needsPermission ? onEnable : onRetry}
          style={styles.button}
        >
          <Text style={styles.link}>
            {status === "blocked"
              ? "Öppna platsinställningar"
              : needsPermission
                ? "Aktivera avstånd"
                : "Försök igen"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginTop: 14,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  text: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  button: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
});
