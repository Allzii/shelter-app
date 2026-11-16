import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

type ProfileRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  last?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function ProfileRow({
  icon: Icon,
  title,
  subtitle,
  last = false,
  disabled = false,
  onPress,
}: ProfileRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailsRow,
        !last && styles.detailsRowBorder,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.rowIcon}>
        <Icon size={21} color={colors.primary} strokeWidth={1.7} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>

        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>

      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.7} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  detailsRow: {
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  detailsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAF0F5",
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.5,
  },
});
