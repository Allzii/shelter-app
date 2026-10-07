import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [isPhonePreview] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return false;
    }

    return (
      new URLSearchParams(window.location.search).get("phonePreview") === "true"
    );
  });

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