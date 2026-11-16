import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { skillOptions } from "@/constants/help-options";

type Props = {
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
};
export default function SkillFields({
  selected,
  onToggle,
  disabled = false,
}: Props) {
  return (
    <View style={styles.options}>
      {skillOptions.map(({ id, label, icon: Icon }) => {
        const isSelected = selected.includes(id);

        return (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{
              checked: isSelected,
              disabled: disabled,
            }}
            disabled={disabled}
            onPress={() => onToggle(id)}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Icon size={23} color={colors.primary} />

            <Text style={styles.optionText}>{label}</Text>

            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && (
                <Check size={15} color={colors.surface} strokeWidth={3} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
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
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F7FBFD",
  },
  optionText: {
    flex: 1,
    marginHorizontal: 13,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
