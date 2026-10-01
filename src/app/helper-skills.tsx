import { router } from "expo-router";
import {
  Car,
  Check,
  HandHelping,
  Package,
  PersonStanding,
  Accessibility,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

const options: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "company", label: "Följa någon till skyddsrummet", icon: PersonStanding },
  { id: "wheelchair", label: "Hjälpa någon med rullstol", icon: Accessibility },
  { id: "support", label: "Ge stöd under promenaden", icon: HandHelping },
  { id: "carry", label: "Bära lättare saker", icon: Package },
  { id: "car", label: "Skjutsa någon med bil", icon: Car },
];

export default function HelperSkillsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 3 av 4" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Hur kan du hjälpa?</Text>
        <Text style={styles.description}>
          Välj det du känner dig trygg med. Du kan ändra detta senare.
        </Text>

        <View style={styles.options}>
          {options.map(({ id, label, icon: Icon }) => {
            const isSelected = selected.includes(id);

            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                onPress={() => toggleOption(id)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={23} color="#2F6591" />
                <Text style={styles.optionText}>{label}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Check size={15} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Fortsätt"
          //disabled={selected.length === 0}
          onPress={() => router.push("/helper-permissions")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#142235",
  },
  description: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    color: "#607080",
  },
  options: {
    marginTop: 26,
    gap: 10,
  },
  option: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  optionSelected: {
    borderColor: "#2F6591",
    backgroundColor: "#F7FBFD",
  },
  optionText: {
    flex: 1,
    marginHorizontal: 13,
    fontSize: 16,
    lineHeight: 21,
    color: "#142235",
  },
  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 1.5,
    borderColor: "#9BAAB7",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: "#2F6591",
    backgroundColor: "#2F6591",
  },
  pressed: {
    opacity: 0.75,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
