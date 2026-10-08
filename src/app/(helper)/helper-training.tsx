import { router } from "expo-router";
import { BookOpen, Check } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

type TrainingState = "idle" | "in-progress" | "completed";

export default function HelperTrainingScreen() {
  const [state, setState] = useState<TrainingState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileMissing, setProfileMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const trainingTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const saving = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadTraining = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setProfileMissing(false);
      setMessage("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("helper_profiles")
          .select("training_demo_completed, training_status")
          .eq("account_id", authData.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        if (!data) {
          setProfileMissing(true);
          setMessage(
            "Spara dina uppgifter på Om dig innan du fortsätter."
          );
          return;
        }

        setState(
          data.training_demo_completed ||
          data.training_status === "completed"
            ? "completed"
            : "idle"
        );
      } catch {
        if (!isMounted) return;

        setLoadFailed(true);
        setMessage(
          "Kunde inte hämta utbildningsstatusen. Kontrollera anslutningen och försök igen."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTraining();

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    return () => {
      if (trainingTimer.current !== null) {
        clearTimeout(trainingTimer.current);
        trainingTimer.current = null;
      }
    };
  }, []);

  const isInProgress = state === "in-progress";
  const isCompleted = state === "completed";

  const startTraining = () => {
    if (
      trainingTimer.current !== null ||
      isCompleted ||
      isLoading ||
      loadFailed ||
      profileMissing ||
      saving.current
    ) {
      return;
    }

    setMessage("");
    setState("in-progress");

    // Ersätt med den riktiga utbildningen när innehållet är klart.
    trainingTimer.current = setTimeout(() => {
      trainingTimer.current = null;
      setState("completed");
    }, 1400);
  };

  const handleContinue = async () => {
    if (
      !isCompleted ||
      saving.current ||
      isLoading ||
      loadFailed ||
      profileMissing
    ) {
      return;
    }

    setMessage("");
    saving.current = true;
    setIsSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage(
          "Kunde inte kontrollera inloggningen. Försök igen eller logga in på nytt."
        );
        return;
      }

      const { error } = await supabase
        .from("helper_profiles")
        .update({
          training_demo_completed: true,
        })
        .eq("account_id", authData.user.id)
        .select("account_id")
        .single();

      if (error) {
        setMessage(
          "Kunde inte spara utbildningssteget. Kontrollera anslutningen och försök igen."
        );
        return;
      }

      router.push("/helper-permissions");
    } catch {
      setMessage(
        "Kunde inte ansluta. Kontrollera din internetanslutning och försök igen."
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 4 av 5" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Utbildning för volontärer</Text>

        <Text style={styles.description}>
          För att börja hjälpa behöver du verifiera din identitet
          och genomföra utbildningen.
        </Text>

        <View
          style={styles.training}
          accessibilityLiveRegion="polite"
        >
          <View
            style={[
              styles.iconCircle,
              isCompleted && styles.iconCircleCompleted,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
            ) : isCompleted ? (
              <Check
                size={64}
                color={colors.success}
                strokeWidth={2.5}
              />
            ) : (
              <BookOpen
                size={64}
                color={colors.primary}
                strokeWidth={1.6}
              />
            )}
          </View>

          <Text style={styles.trainingTitle}>
            {isLoading
              ? "Hämtar utbildningsstatus"
              : loadFailed || profileMissing
                ? "Kunde inte öppna utbildningen"
                : isCompleted
                  ? "Utbildningen är genomförd"
                  : isInProgress
                    ? "Utbildningen pågår"
                    : "Innan du börjar hjälpa"}
          </Text>

          <Text style={styles.trainingDescription}>
            {isLoading
              ? "Vänta ett ögonblick..."
              : loadFailed || profileMissing
                ? "Se informationen nedan."
                : isCompleted
                  ? "Du kan nu fortsätta registreringen."
                  : isInProgress
                    ? "Vänta ett ögonblick..."
                    : "Utbildningen förbereder dig för din roll som volontär."}
          </Text>

          {message !== "" && (
            <Text
              style={styles.message}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {isLoading ? (
          <PrimaryButton title="Hämtar..." disabled onPress={() => {}} />
        ) : profileMissing ? (
          <PrimaryButton
            title="Till Om dig"
            onPress={() => router.replace("/helper-details")}
          />
        ) : loadFailed ? (
          <PrimaryButton
            title="Försök igen"
            onPress={() => setLoadAttempt((current) => current + 1)}
          />
        ) : isCompleted ? (
          <PrimaryButton
            title={isSaving ? "Sparar..." : "Fortsätt"}
            disabled={isSaving}
            onPress={() => void handleContinue()}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isInProgress
                ? "Utbildningen pågår"
                : "Starta utbildningen"
            }
            accessibilityState={{
              disabled: isInProgress,
              busy: isInProgress,
            }}
            disabled={isInProgress}
            onPress={startTraining}
            style={({ pressed }) => [
              styles.trainingButton,
              pressed && styles.pressed,
              isInProgress && styles.disabled,
            ]}
          >
            {isInProgress && (
              <ActivityIndicator color={colors.surface} />
            )}

            <Text style={styles.trainingButtonText}>
              {isInProgress
                ? "Utbildningen pågår..."
                : "Starta utbildningen"}
            </Text>
          </Pressable>
        )}
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },
  title: {
    maxWidth: 320,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  training: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 44,
    paddingBottom: 44,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAF3",
    marginBottom: 28,
  },
  iconCircleCompleted: {
    backgroundColor: colors.successBackground,
  },
  trainingTitle: {
    maxWidth: 300,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },
  trainingDescription: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  message: {
    maxWidth: 310,
    marginTop: 18,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
  trainingButton: {
    width: "100%",
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trainingButtonText: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.7,
  },
});