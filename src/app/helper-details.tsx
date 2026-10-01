import { router } from "expo-router";
import { Phone, User } from "lucide-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function HelperDetailsScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const capitalizeWords = (value: string) =>
    value
      .toLowerCase()
      .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    if (numbers.length <= 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
  };

  const isComplete = Boolean(firstName.trim() && lastName.trim() && phone.length >= 12);

  const continueRegistration = () => {
    Keyboard.dismiss();
    router.push("/helper-skills");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 2 av 4" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Om dig</Text>
          <Text style={styles.description}>
            Uppgifterna visas för personen du hjälper.
          </Text>

          <FormInput
            label="Förnamn"
            icon={User}
            value={firstName}
            onChangeText={(value) => setFirstName(capitalizeWords(value))}
            placeholder="Skriv ditt förnamn"
            autoCapitalize="words"
            autoComplete="given-name"
          />
          <FormInput
            label="Efternamn"
            icon={User}
            value={lastName}
            onChangeText={(value) => setLastName(capitalizeWords(value))}
            placeholder="Skriv ditt efternamn"
            autoCapitalize="words"
            autoComplete="family-name"
          />
          <FormInput
            label="Telefonnummer"
            icon={Phone}
            value={phone}
            onChangeText={(value) => setPhone(formatPhoneNumber(value))}
            placeholder="070-123 45 67"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
          />
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Fortsätt"
            disabled={!isComplete}
            onPress={continueRegistration}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#142235",
  },
  description: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 23,
    color: "#607080",
  },
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
