import { router } from "expo-router";
import { Phone, User } from "lucide-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import {
  capitalizeFirstLetter,
  formatPhoneNumber,
} from "@/components/formatters";

export default function HelperDetailsScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const isComplete = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      phone.replace(/\D/g, "").length === 10
  );

  const continueRegistration = () => {
    // Restore validation after testing:
    // if (!isComplete) return;

    Keyboard.dismiss();
    router.push("/helper-skills");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 2 av 4" />

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

          <Text style={styles.description}>
            Uppgifterna visas för personen du hjälper.
          </Text>

          <FormInput
            label="Förnamn"
            icon={User}
            value={firstName}
            onChangeText={(value) =>
              setFirstName(capitalizeFirstLetter(value))
            }
            placeholder="Skriv ditt förnamn"
            autoCapitalize="words"
            autoComplete="given-name"
          />

          <FormInput
            label="Efternamn"
            icon={User}
            value={lastName}
            onChangeText={(value) =>
              setLastName(capitalizeFirstLetter(value))
            }
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
            // Restore validation after testing:
            // disabled={!isComplete}
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