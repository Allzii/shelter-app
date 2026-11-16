import { router } from "expo-router";
import { Award, Check } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";

import type { CertificateReview as Certificate } from "@/types/certificate";

export default function HelperCertificationScreen() {
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");

  const logoutLock = useRef(false);
  const { height, fontScale } = useWindowDimensions();

  const isCompact = height < 740 || fontScale > 1.2;
  const isApproved = certificate?.status === "approved";
  const isPending = certificate?.status === "pending";
  const needsChanges = certificate?.status === "needs_changes";

  const reload = useReloadableFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCertification = async () => {
        setIsLoading(true);
        setMessage("");
        setProfileLoaded(false);
        setCertificate(null);

        try {
          const { data: authData, error: authError } =
            await supabase.auth.getUser();

          if (authError || !authData.user) {
            throw new Error("Session unavailable");
          }

          const { data: profile, error: profileError } = await supabase
            .from("helper_profiles")
            .select("account_id")
            .eq("account_id", authData.user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          if (!active) return;

          if (!profile) {
            setMessage(
              "Din volontärprofil saknas. Gå tillbaka och spara dina uppgifter på Om dig.",
            );
            return;
          }

          const { data, error } = await supabase
            .from("helper_certificates")
            .select("status, review_note")
            .eq("account_id", authData.user.id)
            .maybeSingle();

          if (error) throw error;
          if (!active) return;

          if (
            data &&
            !["pending", "approved", "needs_changes"].includes(data.status)
          ) {
            throw new Error("Unknown certificate status");
          }

          setCertificate(data as Certificate | null);
          setProfileLoaded(true);
        } catch {
          if (!active) return;

          setMessage(
            "Kunde inte hämta din certifiering. Kontrollera anslutningen och försök igen.",
          );
        } finally {
          if (active) setIsLoading(false);
        }
      };

      void loadCertification();

      return () => {
        active = false;
      };
    }, []),
  );

  const handleLogout = async () => {
    if (logoutLock.current) return;

    logoutLock.current = true;
    setIsLoggingOut(true);
    setLogoutMessage("");

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) throw error;

      router.replace("/");
    } catch {
      setLogoutMessage("Kunde inte logga ut. Försök igen.");
    } finally {
      logoutLock.current = false;
      setIsLoggingOut(false);
    }
  };

  const handleHome = () => {
    if (isLoading || isLoggingOut || !profileLoaded || message !== "") return;

    router.replace("/helper-home");
  };

  const refreshStatus = () => {
    reload();
  };

  const trainingDescription = isApproved
    ? "Intyget är godkänt"
    : isPending
      ? "Inväntar granskning"
      : needsChanges
        ? "Komplettering behövs"
        : "Intyg saknas";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isCompact && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.main}>
          <View style={styles.heading}>
            <View
              style={[styles.iconCircle, isCompact && styles.iconCircleCompact]}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Award
                  size={isCompact ? 48 : 58}
                  color={colors.primary}
                  strokeWidth={1.6}
                />
              )}
            </View>

            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              {isLoading
                ? "Hämtar din certifiering"
                : isApproved
                  ? "Du är nu certifierad volontär"
                  : "Din certifiering"}
            </Text>

            {!isLoading && profileLoaded && (
              <Text style={styles.description}>
                Tack för att du vill finnas där för andra.
              </Text>
            )}
          </View>

          {!isLoading && profileLoaded && (
            <View style={styles.statusCard}>
              <Requirement
                title="Identitet"
                description="Verifierad i prototypen"
                completed
              />

              <View style={styles.divider} />

              <Requirement
                title="Utbildningsintyg"
                description={trainingDescription}
                completed={isApproved}
              />
            </View>
          )}

          {message !== "" && (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {message !== "" ? (
          <PrimaryButton
            title="Försök igen"
            disabled={isLoggingOut || isLoading}
            onPress={refreshStatus}
          />
        ) : (
          <PrimaryButton
            title={isLoading ? "Hämtar..." : "Till hemskärmen"}
            disabled={isLoading || isLoggingOut || !profileLoaded}
            onPress={handleHome}
          />
        )}

        {logoutMessage !== "" && (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {logoutMessage}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: isLoggingOut,
            busy: isLoggingOut,
          }}
          disabled={isLoggingOut}
          onPress={() => void handleLogout()}
          style={({ pressed }) => [
            styles.textButton,
            pressed && styles.pressed,
            isLoggingOut && styles.disabled,
          ]}
        >
          {isLoggingOut && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}

          <Text style={styles.textButtonText}>
            {isLoggingOut ? "Loggar ut..." : "Logga ut"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type RequirementProps = {
  title: string;
  description: string;
  completed: boolean;
};

function Requirement({ title, description, completed }: RequirementProps) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[styles.checkCircle, completed && styles.checkCircleCompleted]}
      >
        {completed && (
          <Check size={17} color={colors.primary} strokeWidth={2.8} />
        )}
      </View>

      <View style={styles.requirementText}>
        <Text style={styles.requirementTitle}>{title}</Text>

        <Text style={styles.requirementDescription}>{description}</Text>
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
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  contentCompact: {
    paddingVertical: 12,
  },

  main: {
    width: "100%",
    maxWidth: 380,
  },

  heading: {
    alignItems: "center",
  },

  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBackground,
    marginBottom: 22,
  },

  iconCircleCompact: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16,
  },

  title: {
    maxWidth: 320,
    textAlign: "center",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
  },

  titleCompact: {
    fontSize: 26,
    lineHeight: 33,
  },

  description: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  statusCard: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    borderColor: colors.primaryBackground,
    backgroundColor: colors.primaryBackground,
  },

  requirementText: {
    flex: 1,
  },

  requirementTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.text,
  },

  requirementDescription: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  divider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: colors.border,
  },

  message: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },

  textButton: {
    minHeight: 48,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  textButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.5,
  },
});
