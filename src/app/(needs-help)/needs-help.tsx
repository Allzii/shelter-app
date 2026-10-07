import { router, useLocalSearchParams } from "expo-router";
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
  const params = useLocalSearchParams<{
    person?: string;
    verification?: string;
  }>();

  const isOtherPerson = params.person === "other";
  const person = isOtherPerson ? "other" : "self";

  // Saknad verifieringsstatus räknas som väntande.
  const verification =
    params.verification === "demo-verified"
      ? "demo-verified"
      : "pending";

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
    // Återaktivera valideringen efter testning:
    // if (!isComplete) return;

    Keyboard.dismiss();

    router.push({
      pathname: "/emergency-contact",
      params: {
        person,
        verification,
      },
    });
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
          <Text style={styles.title}>
            {isOtherPerson ? "Om personen" : "Om dig"}
          </Text>

          <Text style={styles.description}>
            {isOtherPerson
              ? "Fyll i uppgifterna för personen som ska använda armbandet."
              : "Fyll i dina uppgifter."}
          </Text>

          {verification === "pending" && (
            <Text style={styles.verificationInfo}>
              {isOtherPerson
                ? "Personens identitet behöver verifieras manuellt."
                : "Din identitet behöver verifieras manuellt."}
            </Text>
          )}

          <NameFields
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            forOtherPerson={isOtherPerson}
          />

          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            forOtherPerson={isOtherPerson}
          />

          <FormInput
            label="Adress"
            icon={MapPin}
            value={street}
            onChangeText={(value) =>
              setStreet(capitalizeFirstLetter(value))
            }
            placeholder={
              isOtherPerson
                ? "Personens gata och nummer"
                : "Gata och nummer"
            }
            autoCapitalize="words"
            autoComplete={
              isOtherPerson ? "off" : "street-address"
            }
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
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={
                  isOtherPerson
                    ? "Personens postnummer"
                    : "Postnummer"
                }
                keyboardType="number-pad"
                autoComplete={
                  isOtherPerson ? "off" : "postal-code"
                }
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
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={
                  isOtherPerson ? "Personens ort" : "Ort"
                }
                autoCapitalize="words"
                autoComplete="off"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Fortsätt"
            // Återaktivera valideringen efter testning:
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

  verificationInfo: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
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