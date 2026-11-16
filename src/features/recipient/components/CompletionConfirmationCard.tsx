import { Pressable, StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";

type Props = {
  forOtherPerson: boolean;
  busy: boolean;
  onRespond: (confirmed: boolean) => void;
};

export default function CompletionConfirmationCard({
  forOtherPerson,
  busy,
  onRespond,
}: Props) {
  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title}>
        {forOtherPerson
          ? "Har personen fått den hjälp som behövs?"
          : "Har du fått den hjälp du behöver?"}
      </Text>
      <Text style={styles.description}>
        Volontären har markerat hjälpen som klar. Bekräfta först när hjälpen är
        färdig.
      </Text>
      <PrimaryButton
        title={busy ? "Sparar…" : "Ja, hjälpen är klar"}
        onPress={() => onRespond(true)}
        disabled={busy}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => onRespond(false)}
        style={styles.button}
      >
        <Text style={styles.link}>Nej, hjälp behövs fortfarande</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 48,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
    color: colors.primary,
  },
});
