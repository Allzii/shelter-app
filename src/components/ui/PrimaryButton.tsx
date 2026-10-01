import { ChevronRight } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { colors } from "@/constants/colors";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>

      <ChevronRight
        size={22}
        color={colors.surface}
        style={styles.arrow}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: colors.surface,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  arrow: {
    position: "absolute",
    right: 22,
  },
});