import { Check, LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
          color={selected ? "#FFFFFF" : "#607080"}
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
            color="#FFFFFF"
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
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },

  optionSelected: {
    borderColor: "#2F6591",
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
    backgroundColor: "#2F6591",
  },

  content: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#142235",
    marginBottom: 3,
  },

  description: {
    fontSize: 14,
    lineHeight: 19,
    color: "#607080",
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
    backgroundColor: "#2F6591",
    borderColor: "#2F6591",
  },
});
