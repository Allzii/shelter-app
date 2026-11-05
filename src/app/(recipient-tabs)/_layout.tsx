import { Tabs } from "expo-router";
import { House, UserRound, Watch } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

export default function RecipientTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      initialRouteName="recipient-home"
      screenOptions={{
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
      }}
    >
      <Tabs.Screen
        name="recipient-home"
        options={{
          title: "Hem",
          tabBarIcon: ({ color, focused }) => (
            <House
              size={24}
              color={color}
              strokeWidth={focused ? 2.4 : 1.8}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="recipient-bracelet"
        options={{
          title: "Armband",
          tabBarIcon: ({ color, focused }) => (
            <Watch
              size={24}
              color={color}
              strokeWidth={focused ? 2.4 : 1.8}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="recipient-profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <UserRound
              size={24}
              color={color}
              strokeWidth={focused ? 2.4 : 1.8}
            />
          ),
        }}
      />
    </Tabs>
  );
}