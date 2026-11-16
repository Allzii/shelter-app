import { router } from "expo-router";
import { LockKeyhole, Mail } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const submitting = useRef(false);

  const handleContinue = async () => {
    if (submitting.current || awaitingConfirmation) return;

    Keyboard.dismiss();
    setMessage("");
    setIsError(false);

    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setIsError(true);
      setMessage("Ange en giltig e-postadress.");
      return;
    }

    if (password.length < 8) {
      setIsError(true);
      setMessage("Lösenordet måste innehålla minst 8 tecken.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setIsError(true);

        if (error.code === "user_already_exists") {
          setMessage(
            "Det finns redan ett konto med den e-postadressen. Logga in.",
          );
        } else if (error.code === "weak_password") {
          setMessage("Välj ett starkare lösenord.");
        } else if (
          error.code === "over_email_send_rate_limit" ||
          error.code === "over_request_rate_limit"
        ) {
          setMessage("För många försök. Vänta en stund och försök igen.");
        } else {
          setMessage(
            "Kunde inte skapa kontot. Kontrollera uppgifterna och försök igen.",
          );
        }

        return;
      }

      setPassword("");
      setShowPassword(false);

      if (data.session) {
        router.replace("/role");
        return;
      }

      setAwaitingConfirmation(true);
      setMessage(
        "Kontrollera din mejl och bekräfta e-postadressen om ett bekräftelsemejl har skickats. Logga sedan in. Har du redan ett konto kan du logga in direkt.",
      );
    } catch {
      setIsError(true);
      setMessage(
        "Kunde inte ansluta. Kontrollera din internetanslutning och försök igen.",
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Skapa konto</Text>

          <Text style={styles.description}>
            Skapa ett konto för att använda appen.
          </Text>

          <FormInput
            label="E-postadress"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="namn@exempel.se"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            accessibilityLabel="E-postadress"
            editable={!isSubmitting && !awaitingConfirmation}
          />

          <FormInput
            label="Lösenord"
            icon={LockKeyhole}
            value={password}
            onChangeText={setPassword}
            placeholder="Minst 8 tecken"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            accessibilityLabel="Lösenord"
            editable={!isSubmitting && !awaitingConfirmation}
          />

          {!awaitingConfirmation && (
            <Pressable
              onPress={() => setShowPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Dölj lösenord" : "Visa lösenord"
              }
              style={({ pressed }) => [
                styles.passwordButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.linkText}>
                {showPassword ? "Dölj lösenord" : "Visa lösenord"}
              </Text>
            </Pressable>
          )}

          {message !== "" && (
            <Text
              style={[styles.message, isError && styles.errorMessage]}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title={
              awaitingConfirmation
                ? "Till inloggningen"
                : isSubmitting
                  ? "Skapar konto..."
                  : "Fortsätt"
            }
            disabled={isSubmitting}
            onPress={
              awaitingConfirmation
                ? () => router.replace("/login")
                : () => void handleContinue()
            }
          />

          <Pressable
            onPress={() => router.replace("/login")}
            accessibilityRole="button"
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.switchButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.linkText}>
              Har du redan ett konto? Logga in
            </Text>
          </Pressable>
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
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  passwordButton: {
    alignSelf: "flex-end",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  linkText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
    color: colors.primary,
  },

  message: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },

  errorMessage: {
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },

  switchButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },

  pressed: {
    opacity: 0.7,
  },
});
