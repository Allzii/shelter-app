import { LucideIcon } from "lucide-react-native";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

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
        {Icon && <Icon size={21} color="#607080" />}

        <TextInput
          style={styles.input}
          placeholderTextColor="#8A97A5"
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
    color: "#142235",
  },

  inputContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 11,
    fontSize: 16,
    color: "#142235",
  },
});