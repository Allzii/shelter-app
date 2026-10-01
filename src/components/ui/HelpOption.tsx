import { Check, LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants/colors";

type HelpOptionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
};

export default function HelpOption({
  title,
  description,
  icon: Icon,
  selected,
  onPress,
}: HelpOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          selected && styles.iconContainerSelected,
        ]}
      >
        <Icon
          size={26}
          color={selected ? colors.surface : colors.textSecondary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          selected && styles.checkboxSelected,
        ]}
      >
        {selected && (
          <Check
            size={18}
            color={colors.surface}
            strokeWidth={3}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 105,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },

  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F4F9FC",
  },

  optionPressed: {
    opacity: 0.8,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8F0F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  iconContainerSelected: {
    backgroundColor: colors.primary,
  },

  content: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
  },

  description: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  checkbox: {
    width: 27,
    height: 27,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#B9C6D0",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
