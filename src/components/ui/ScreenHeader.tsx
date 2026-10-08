import { router, useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

type ScreenHeaderProps = {
  step?: string;
};

export default function ScreenHeader({ step }: ScreenHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const currentStep = step ? Number(step.match(/\d+/)?.[0]) : 0;
  const totalSteps = step ? Number(step.match(/\d+$/)?.[0]) : 0;

  const progress =
    totalSteps > 0
      ? Math.min(100, Math.max(0, (currentStep / totalSteps) * 100))
      : 0;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gå tillbaka"
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={24} color={colors.primary} />
            <Text style={styles.backText}>Tillbaka</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {step && <Text style={styles.stepText}>{step}</Text>}
      </View>

      {totalSteps > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressValue,
              { width: `${progress}%` },
            ]}
          />
        </View>
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
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 16,
  },

  backPlaceholder: {
    height: 44,
  },

  backText: {
    marginLeft: 3,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  stepText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
  },

  progressValue: {
    height: 2,
    backgroundColor: colors.primary,
  },

  pressed: {
    opacity: 0.6,
  },
});