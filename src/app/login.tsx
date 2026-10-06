import { router } from "expo-router";
import { LockKeyhole, Mail } from "lucide-react-native";
import { useState } from "react";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleContinue = () => {
    Keyboard.dismiss();
    // Connect authentication here when the backend is ready.
    setMessage("Inloggningen är inte ansluten ännu.");
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
          <Text style={styles.description}>
            Välkommen tillbaka till TryggNära.
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
          />
          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Dölj lösenord" : "Visa lösenord"}
            style={({ pressed }) => [styles.passwordButton, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>
              {showPassword ? "Dölj lösenord" : "Visa lösenord"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMessage("Återställning av lösenord är inte ansluten ännu.")}
            accessibilityRole="button"
            style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>Glömt lösenord?</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Logga in"
            onPress={handleContinue}
          />
          <Pressable
            onPress={() => router.replace("/sign-up")}
            accessibilityRole="button"
            style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
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
    color: colors.text,
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

