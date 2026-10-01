import { Phone } from "lucide-react-native";

import FormInput from "@/components/ui/FormInput";
import { formatPhoneNumber } from "@/utils/formatters";

type PhoneInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  forOtherPerson?: boolean;
};

export default function PhoneInput({
  value,
  onChangeText,
  forOtherPerson = false,
}: PhoneInputProps) {
  return (
    <FormInput
      label="Telefonnummer"
      icon={Phone}
      value={value}
      onChangeText={(text) => onChangeText(formatPhoneNumber(text))}
      placeholder="070-123 45 67"
      keyboardType="phone-pad"
      autoComplete={forOtherPerson ? "off" : "tel"}
      maxLength={13}
    />
  );
}