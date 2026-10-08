import * as Notifications from "expo-notifications";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

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

  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [isPhonePreview] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return false;
    }

    return (
      new URLSearchParams(window.location.search).get("phonePreview") ===
      "true"
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

    updateAutoRefresh(AppState.currentState);

    const subscription = AppState.addEventListener(
      "change",
      updateAutoRefresh
    );

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoadingSession) return;

    const routeSegments: string[] = [...segments];
    const firstSegment = routeSegments[0];

    const isAuthScreen = firstSegment === "(auth)";

    const isRegistrationScreen =
      firstSegment === "(helper)" ||
      firstSegment === "(needs-help)" ||
      firstSegment === "role";

    const isStartScreen =
      routeSegments.length === 0 || firstSegment === "index";

    if (session && (isStartScreen || isAuthScreen)) {
      // Byt destination när hemskärmen och registreringsstatusen är klara.
      router.replace("/role");
      return;
    }

    if (!session && isRegistrationScreen) {
      router.replace("/login");
    }
  }, [session, isLoadingSession, navigationState?.key, segments]);

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );

  if (isPhonePreview) {
    return (
      <SafeAreaInsetsContext.Provider
        value={{ top: 58, bottom: 34, left: 0, right: 0 }}
      >
        {stack}
      </SafeAreaInsetsContext.Provider>
    );
  }

  return stack;
}