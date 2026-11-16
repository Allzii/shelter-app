import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

type FloatingFooterButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  onHeightChange?: (height: number) => void;
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
};

export default function FloatingFooterButton({
  title,
  onPress,
  disabled = false,
  tone = "default",
  onHeightChange,
  secondaryAction,
}: FloatingFooterButtonProps) {
  return (
    <View
      style={styles.footer}
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
    >
      {secondaryAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={secondaryAction.onPress}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.text}>{secondaryAction.title}</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          tone === "danger" && styles.dangerButton,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.text, tone === "danger" && styles.dangerText]}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: 220,
    maxWidth: "85%",
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: { opacity: 0.65 },
  dangerButton: {
    width: 240,
    minHeight: 58,
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.2,
  },
  dangerText: { color: colors.surface, fontWeight: "700" },
  secondaryButton: {
    width: 240,
    maxWidth: "85%",
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  text: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.primary,
  },
});
