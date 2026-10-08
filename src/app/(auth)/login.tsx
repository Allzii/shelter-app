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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitting = useRef(false);

  const handleContinue = async () => {
    if (submitting.current) return;

    Keyboard.dismiss();
    setMessage("");

    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Ange en giltig e-postadress.");
      return;
    }

    if (!password) {
      setMessage("Ange ditt lösenord.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.code === "invalid_credentials") {
          setMessage("Fel e-postadress eller lösenord.");
        } else if (error.code === "email_not_confirmed") {
          setMessage(
            "Bekräfta din e-postadress via mejlet innan du loggar in."
          );
        } else if (error.code === "over_request_rate_limit") {
          setMessage("För många försök. Vänta en stund och försök igen.");
        } else {
          setMessage("Kunde inte logga in. Försök igen.");
        }

        return;
      }

      if (!data.session) {
        setMessage("Kunde inte logga in. Försök igen.");
        return;
      }

      setPassword("");
      setShowPassword(false);
      router.replace("/role");
    } catch {
      setMessage(
        "Kunde inte ansluta. Kontrollera din internetanslutning och försök igen."
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
          <Text style={styles.title}>Logga in</Text>

          <Text style={styles.description}>Välkommen tillbaka.</Text>

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
            editable={!isSubmitting}
          />

          <FormInput
            label="Lösenord"
            icon={LockKeyhole}
            value={password}
            onChangeText={setPassword}
            placeholder="Skriv ditt lösenord"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            accessibilityLabel="Lösenord"
            editable={!isSubmitting}
            returnKeyType="go"
            onSubmitEditing={() => void handleContinue()}
          />

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

          <Pressable
            onPress={() =>
              setMessage(
                "Återställning av lösenord är inte ansluten ännu."
              )
            }
            accessibilityRole="button"
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.forgotButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.linkText}>Glömt lösenord?</Text>
          </Pressable>

          {message !== "" && (
            <Text
              style={styles.message}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title={isSubmitting ? "Loggar in..." : "Logga in"}
            disabled={isSubmitting}
            onPress={() => void handleContinue()}
          />

          <Pressable
            onPress={() => router.replace("/sign-up")}
            accessibilityRole="button"
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.switchButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.linkText}>
              Har du inget konto? Skapa konto
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

  forgotButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
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