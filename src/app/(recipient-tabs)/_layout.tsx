import { Tabs } from "expo-router";
import { House, UserRound, Watch } from "lucide-react-native";

import useTabScreenOptions from "@/components/navigation/useTabScreenOptions";

export default function RecipientTabsLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="recipient-home"
        options={{
          title: "Hem",
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="recipient-bracelet"
        options={{
          title: "Armband",
          tabBarIcon: ({ color, focused }) => (
            <Watch size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
