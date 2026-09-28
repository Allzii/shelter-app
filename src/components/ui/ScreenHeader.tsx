import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ScreenHeaderProps = {
  step?: string;
};

export default function ScreenHeader({
  step,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <ChevronLeft size={24} color="#2F6591" />
        <Text style={styles.backText}>Tillbaka</Text>
      </Pressable>

      {step && (
        <Text style={styles.stepText}>{step}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 16,
  },

  backText: {
    marginLeft: 3,
    fontSize: 16,
    fontWeight: "600",
    color: "#2F6591",
  },

  stepText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#607080",
  },

  pressed: {
    opacity: 0.6,
  },
});