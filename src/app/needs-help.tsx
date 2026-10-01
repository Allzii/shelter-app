import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FormInput from "@/components/ui/FormInput";
import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import {
  capitalizeFirstLetter,
  formatPostalCode,
} from "@/utils/formatters";

export default function NeedsHelpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const isComplete = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      phone.replace(/\D/g, "").length === 10 &&
      street.trim() &&
      postalCode.replace(/\D/g, "").length === 5 &&
      city.trim()
  );

  const handleContinue = () => {
    // Restore validation after testing:
    // if (!isComplete) return;

    Keyboard.dismiss();
    router.push("/emergency-contact");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 1 av 5" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.title}>Om dig</Text>

          <Text style={styles.description}>Fyll i dina uppgifter.</Text>

          <NameFields
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
          />

          <PhoneInput
            value={phone}
            onChangeText={setPhone}
          />

          <FormInput
            label="Adress"
            icon={MapPin}
            value={street}
            onChangeText={(value) =>
              setStreet(capitalizeFirstLetter(value))
            }
            placeholder="Gata och nummer"
            autoCapitalize="words"
            autoComplete="street-address"
          />

          <View style={styles.addressRow}>
            <View style={styles.postalInput}>
              <TextInput
                style={styles.smallInput}
                value={postalCode}
                onChangeText={(value) =>
                  setPostalCode(formatPostalCode(value))
                }
                placeholder="Postnummer"
                placeholderTextColor= {colors.placeholder}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.cityInput}>
              <TextInput
                style={styles.smallInput}
                value={city}
                onChangeText={(value) =>
                  setCity(capitalizeFirstLetter(value))
                }
                placeholder="Ort"
                placeholderTextColor= {colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Fortsätt"
            // Restore validation after testing:
            // disabled={!isComplete}
            onPress={handleContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 25,
  },

  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  addressRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

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
    flex: 1.1,
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  smallInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
});
