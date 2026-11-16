import { StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";

type Props = { requested: boolean; busy: boolean; onRequest: () => void };

export default function CompletionRequestCard({
  requested,
  busy,
  onRequest,
}: Props) {
  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title}>
        {requested ? "Inväntar bekräftelse" : "Är hjälpen klar?"}
      </Text>
      <Text style={styles.description}>
        {requested
          ? "Den som hanterar hjälpförfrågan bekräftar att hjälpen är klar. Uppdraget är pågående tills dess."
          : "När du är färdig kan du be om en bekräftelse från den som hanterar hjälpförfrågan."}
      </Text>
      {!requested && (
        <PrimaryButton
          title="Hjälpen är klar"
          onPress={onRequest}
          disabled={busy}
        />
      )}
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
  title: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
});
