import { MapPin } from "lucide-react-native";
import { StyleSheet, TextInput, View } from "react-native";

import FormInput from "@/components/ui/FormInput";
import { colors } from "@/constants/colors";
import { capitalizeFirstLetter, formatPostalCode } from "@/utils/formatters";

type AddressFieldsProps = {
  street: string;
  postalCode: string;
  city: string;
  onStreetChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  editable?: boolean;
  forOtherPerson?: boolean;
};

export default function AddressFields({
  street,
  postalCode,
  city,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  editable = true,
  forOtherPerson = false,
}: AddressFieldsProps) {
  return (
    <>
      <FormInput
        label="Adress"
        icon={MapPin}
        value={street}
        onChangeText={(value) => onStreetChange(capitalizeFirstLetter(value))}
        placeholder={
          forOtherPerson ? "Personens gata och nummer" : "Gata och nummer"
        }
        autoCapitalize="words"
        autoComplete={forOtherPerson ? "off" : "street-address"}
        editable={editable}
      />
      <View style={styles.addressRow}>
        <View style={styles.postalInput}>
          <TextInput
            style={styles.smallInput}
            value={postalCode}
            onChangeText={(value) =>
              onPostalCodeChange(formatPostalCode(value))
            }
            placeholder="Postnummer"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={
              forOtherPerson ? "Personens postnummer" : "Postnummer"
            }
            keyboardType="number-pad"
            autoComplete={forOtherPerson ? "off" : "postal-code"}
            maxLength={6}
            editable={editable}
          />
        </View>
        <View style={styles.cityInput}>
          <TextInput
            style={styles.smallInput}
            value={city}
            onChangeText={(value) => onCityChange(capitalizeFirstLetter(value))}
            placeholder="Ort"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={forOtherPerson ? "Personens ort" : "Ort"}
            autoCapitalize="words"
            autoComplete="off"
            editable={editable}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  addressRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  postalInput: {
    flex: 0.9,
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  cityInput: {
    flex: 1.3,
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  smallInput: { height: "100%", fontSize: 16, color: colors.text },
});
