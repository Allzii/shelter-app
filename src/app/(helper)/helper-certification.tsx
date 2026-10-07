import { Award, Check } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";

export default function HelperCertificationScreen() {
  const identityVerified = true;
  const trainingCompleted = true;

  const isCertified = identityVerified && trainingCompleted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <View style={styles.iconCircle}>
            <Award
              size={72}
              color={colors.primary}
              strokeWidth={1.6}
            />
          </View>

          <Text style={styles.title}>
            {isCertified
              ? "Du är nu certifierad volontär"
              : "Din certifiering"}
          </Text>

          <Text style={styles.description}>
            {isCertified
              ? "Du har uppfyllt kraven för att bli volontär."
              : "Verifiera din identitet och genomför utbildningen för att bli volontär i TryggNära."}
          </Text>
        </View>

        <View style={styles.certificate}>
          <Text style={styles.brand}>AppNamn</Text>

          <Text style={styles.certificateTitle}>
            Certifierad volontär
          </Text>

          <View style={styles.requirements}>
            <View style={styles.requirementRow}>
              <View
                style={[
                  styles.checkCircle,
                  identityVerified && styles.checkCircleCompleted,
                ]}
              >
                {identityVerified && (
                  <Check
                    size={17}
                    color={colors.primary}
                    strokeWidth={3}
                  />
                )}
              </View>

              <View style={styles.requirementText}>
                <Text style={styles.requirementTitle}>
                  Identitet
                </Text>

                <Text style={styles.requirementDescription}>
                  {identityVerified
                    ? "Verifierad med BankID"
                    : "Inte verifierad"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.requirementRow}>
              <View
                style={[
                  styles.checkCircle,
                  trainingCompleted && styles.checkCircleCompleted,
                ]}
              >
                {trainingCompleted && (
                  <Check
                    size={17}
                    color={colors.primary}
                    strokeWidth={3}
                  />
                )}
              </View>

              <View style={styles.requirementText}>
                <Text style={styles.requirementTitle}>
                  Utbildning
                </Text>

                <Text style={styles.requirementDescription}>
                  {trainingCompleted
                    ? "Genomförd"
                    : "Inte genomförd"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isCertified ? "Godkänd" : "Inte klar"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Till hemskärmen"
          disabled
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },

  heading: {
    alignItems: "center",
  },

  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAF3",
    marginBottom: 26,
  },

  title: {
    maxWidth: 320,
    textAlign: "center",
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    maxWidth: 310,
    marginTop: 12,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  certificate: {
    marginTop: 30,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  certificateTitle: {
    marginTop: 6,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },

  requirements: {
    marginTop: 22,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircleCompleted: {
    borderColor: "#DCEAF3",
    backgroundColor: "#DCEAF3",
  },

  requirementText: {
    flex: 1,
  },

  requirementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  requirementDescription: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  divider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: colors.border,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#DCEAF3",
  },

  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});