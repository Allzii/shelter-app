import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";

export default function useTabScreenOptions(): ComponentProps<
  typeof Tabs
>["screenOptions"] {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarLabelPosition: "below-icon",
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      height: 62 + bottomPadding,
      paddingTop: 8,
      paddingBottom: bottomPadding,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 3,
    },
  };
}
