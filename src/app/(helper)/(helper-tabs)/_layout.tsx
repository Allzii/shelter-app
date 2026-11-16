import { Tabs } from "expo-router";
import { House, List, UserRound } from "lucide-react-native";

import useTabScreenOptions from "@/components/navigation/useTabScreenOptions";

export default function HelperTabsLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="helper-home"
        options={{
          title: "Hem",
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="helper-requests"
        options={{
          title: "Uppdrag",
          tabBarIcon: ({ color, focused }) => (
            <List size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="helper-profile"
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
