import * as Notifications from "expo-notifications";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

import type { Session } from "@supabase/supabase-js";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [navigationMessage, setNavigationMessage] = useState("");
  const [navigationAttempt, setNavigationAttempt] = useState(0);

  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const routeSegments: string[] = [...segments];
  const firstSegment = routeSegments[0];
  const accountId = session?.user.id;

  const isAuthScreen = firstSegment === "(auth)";

  const isStartScreen = routeSegments.length === 0 || firstSegment === "index";

  const isRegistrationScreen =
    firstSegment === "(helper)" ||
    firstSegment === "(needs-help)" ||
    firstSegment === "role";

  const isRecipientScreen = firstSegment === "(recipient-tabs)";

  const isPrivateScreen = isRegistrationScreen || isRecipientScreen;

  const shouldChooseDestination =
    Boolean(accountId) && (isStartScreen || isAuthScreen);

  const [isPhonePreview] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return false;
    }

    return (
      new URLSearchParams(window.location.search).get("phonePreview") === "true"
    );
  });

  useEffect(() => {
    let isMounted = true;
    let receivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;

      if (!isMounted) return;

      setSession(nextSession);
      setIsLoadingSession(false);
    });

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted || receivedAuthEvent) return;

        setSession(error ? null : data.session);
      } catch {
        if (!isMounted || receivedAuthEvent) return;

        setSession(null);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const updateAutoRefresh = (state: string) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    updateAutoRefresh(AppState.currentState ?? "unknown");

    const subscription = AppState.addEventListener("change", updateAutoRefresh);

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoadingSession) return;

    if (!accountId && isPrivateScreen) {
      router.replace("/login");
    }
  }, [accountId, isLoadingSession, navigationState?.key, isPrivateScreen]);

  useEffect(() => {
    if (
      !navigationState?.key ||
      isLoadingSession ||
      !accountId ||
      !shouldChooseDestination
    ) {
      return;
    }

    let active = true;

    const chooseDestination = async () => {
      setNavigationMessage("");

      try {
        const { data, error } = await supabase
          .from("help_recipients")
          .select("id, registration_for")
          .eq("account_id", accountId)
          .not("registration_completed_at", "is", null)
          .order("registration_completed_at", {
            ascending: false,
          })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        if (data) {
          router.replace({
            pathname: "/recipient-home",
            params: {
              recipientId: data.id,
              person: data.registration_for === "other" ? "other" : "self",
            },
          });

          return;
        }

        const [helperProfile, helperCertificate] = await Promise.all([
          supabase
            .from("helper_profiles")
            .select("account_id")
            .eq("account_id", accountId)
            .maybeSingle(),
          supabase
            .from("helper_certificates")
            .select("account_id")
            .eq("account_id", accountId)
            .eq("status", "approved")
            .maybeSingle(),
        ]);

        if (helperProfile.error) throw helperProfile.error;
        if (helperCertificate.error) throw helperCertificate.error;
        if (!active) return;

        if (helperProfile.data && helperCertificate.data) {
          router.replace("/helper-home");
          return;
        }

        router.replace("/role");
      } catch {
        if (!active) return;

        setNavigationMessage(
          "Kunde inte hämta din registrering. Kontrollera anslutningen och försök igen.",
        );
      }
    };

    void chooseDestination();

    return () => {
      active = false;
    };
  }, [
    accountId,
    isLoadingSession,
    navigationState?.key,
    shouldChooseDestination,
    navigationAttempt,
  ]);

  const showLoadingScreen =
    isLoadingSession ||
    shouldChooseDestination ||
    (!accountId && isPrivateScreen);

  const content = (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />

      {showLoadingScreen && (
        <View style={styles.loadingOverlay} accessibilityViewIsModal>
          {shouldChooseDestination && navigationMessage !== "" ? (
            <>
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {navigationMessage}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setNavigationMessage("");
                  setNavigationAttempt((current) => current + 1);
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Försök igen</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.primary} />

              <Text style={styles.loadingText}>Öppnar appen…</Text>
            </>
          )}
        </View>
      )}
    </View>
  );

  if (isPhonePreview) {
    return (
      <SafeAreaInsetsContext.Provider
        value={{
          top: 58,
          bottom: 34,
          left: 0,
          right: 0,
        }}
      >
        {content}
      </SafeAreaInsetsContext.Provider>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
  },

  message: {
    maxWidth: 320,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },

  retryButton: {
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },

  pressed: {
    opacity: 0.8,
  },
});
