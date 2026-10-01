import { LucideIcon } from "lucide-react-native";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { colors } from "@/constants/colors";

type FormInputProps = TextInputProps & {
  label: string;
  icon?: LucideIcon;
};

export default function FormInput({
  label,
  icon: Icon,
  ...textInputProps
}: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        {Icon && <Icon size={21} color= {colors.textSecondary} />}

        <TextInput
          style={styles.input}
          placeholderTextColor= {colors.placeholder}
          {...textInputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },

  label: {
    marginBottom: 7,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  inputContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 11,
    fontSize: 16,
    color: colors.text,
  },
});