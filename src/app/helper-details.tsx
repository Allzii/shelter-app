import { router } from "expo-router";
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

import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";

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
    backgroundColor: colors.background,
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
    color: colors.text,
  },

  description: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
