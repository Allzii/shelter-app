import { Award, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

type CertificationStatus = {
  identityVerified: boolean;
  trainingCompleted: boolean;
};

export default function HelperCertificationScreen() {
  const [status, setStatus] = useState<CertificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCertification = async () => {
      setIsLoading(true);
      setMessage("");
      setStatus(null);

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("helper_profiles")
          .select("training_status, training_demo_completed")
          .eq("account_id", authData.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        if (!data) {
          setMessage(
            "Din volontärprofil saknas. Gå tillbaka och spara dina uppgifter på Om dig."
          );
          return;
        }

        setStatus({
          // BankID-steget är simulerat i prototypen.
          identityVerified: true,
          trainingCompleted:
            data.training_demo_completed ||
            data.training_status === "completed",
        });
      } catch {
        if (!isMounted) return;

        setMessage(
          "Kunde inte hämta din certifiering. Kontrollera anslutningen och försök igen."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCertification();

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  const isCertified =
    status !== null &&
    status.identityVerified &&
    status.trainingCompleted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <View style={styles.iconCircle}>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
            ) : (
              <Award
                size={72}
                color={colors.primary}
                strokeWidth={1.6}
              />
            )}
          </View>

          <Text style={styles.title}>
            {isLoading
              ? "Hämtar din certifiering"
              : isCertified
                ? "Du är nu certifierad volontär"
                : "Din certifiering"}
          </Text>

          {status && (
            <Text style={styles.description}>
              {isCertified
                ? "Du har uppfyllt kraven för att bli volontär."
                : "Verifiera din identitet och genomför utbildningen för att bli volontär."}
            </Text>
          )}
        </View>

        {!isLoading && status && (
          <View style={styles.certificate}>
            <Text style={styles.brand}>AppNamn</Text>

            <Text style={styles.certificateTitle}>
              Certifierad volontär
            </Text>

            <View style={styles.requirements}>
              <Requirement
                title="Identitet"
                description={
                  status.identityVerified
                    ? "Verifierad med BankID"
                    : "Inte verifierad"
                }
                completed={status.identityVerified}
              />

              <View style={styles.divider} />

              <Requirement
                title="Utbildning"
                description={
                  status.trainingCompleted
                    ? "Genomförd"
                    : "Inte genomförd"
                }
                completed={status.trainingCompleted}
              />
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isCertified ? "Godkänd" : "Inte klar"}
              </Text>
            </View>
          </View>
        )}

        {message !== "" && (
          <Text
            style={styles.message}
            accessibilityLiveRegion="polite"
          >
            {message}
          </Text>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        {message !== "" ? (
          <PrimaryButton
            title="Försök igen"
            onPress={() => setLoadAttempt((current) => current + 1)}
          />
        ) : (
          <PrimaryButton
            title="Till hemskärmen"
            disabled
            onPress={() => {}}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type RequirementProps = {
  title: string;
  description: string;
  completed: boolean;
};

function Requirement({
  title,
  description,
  completed,
}: RequirementProps) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[
          styles.checkCircle,
          completed && styles.checkCircleCompleted,
        ]}
      >
        {completed && (
          <Check
            size={17}
            color={colors.primary}
            strokeWidth={3}
          />
        )}
      </View>

      <View style={styles.requirementText}>
        <Text style={styles.requirementTitle}>{title}</Text>

        <Text style={styles.requirementDescription}>
          {description}
        </Text>
      </View>
    </View>
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

  message: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});