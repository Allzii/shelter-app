import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { supabase } from "@/lib/supabase";
import {
  capitalizeFirstLetter,
  formatPhoneNumber,
  formatPostalCode,
} from "@/utils/formatters";

export default function HelperDetailsScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saving = useRef(false);
  const isBusy = isLoading || isSaving;
  const isFormDisabled = isBusy || loadFailed;

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setMessage("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("helper_profiles")
          .select(
            "first_name, last_name, phone, street, postal_code, city"
          )
          .eq("account_id", authData.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        setFirstName(data?.first_name ?? "");
        setLastName(data?.last_name ?? "");
        setPhone(formatPhoneNumber(data?.phone ?? ""));
        setStreet(data?.street ?? "");
        setPostalCode(formatPostalCode(data?.postal_code ?? ""));
        setCity(data?.city ?? "");
      } catch {
        if (!isMounted) return;

        setLoadFailed(true);
        setMessage(
          "Kunde inte hämta dina uppgifter. Kontrollera anslutningen och försök igen."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  const continueRegistration = async () => {
    if (saving.current || isLoading || loadFailed) return;

    Keyboard.dismiss();
    setMessage("");

    // Validering av obligatoriska fält läggs tillbaka efter testningen.

    saving.current = true;
    setIsSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage(
          "Kunde inte kontrollera inloggningen. Försök igen eller logga in på nytt."
        );
        return;
      }

      const { error } = await supabase
        .from("helper_profiles")
        .upsert(
          {
            account_id: authData.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.replace(/\D/g, ""),
            street: street.trim(),
            postal_code: postalCode.replace(/\D/g, ""),
            city: city.trim(),
          },
          { onConflict: "account_id" }
        )
        .select("account_id")
        .single();

      if (error) {
        setMessage(
          "Kunde inte spara uppgifterna. Kontrollera anslutningen och försök igen."
        );
        return;
      }

      router.push("/helper-skills");
    } catch {
      setMessage(
        "Kunde inte ansluta. Kontrollera din internetanslutning och försök igen."
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 2 av 5" />

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
            Fyll i dina uppgifter.
          </Text>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>
                Hämtar uppgifter...
              </Text>
            </View>
          ) : (
            <View pointerEvents={isFormDisabled ? "none" : "auto"}>
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
                editable={!isFormDisabled}
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
                    accessibilityLabel="Postnummer"
                    keyboardType="number-pad"
                    autoComplete="postal-code"
                    maxLength={6}
                    editable={!isFormDisabled}
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
                    accessibilityLabel="Ort"
                    autoCapitalize="words"
                    autoComplete="off"
                    editable={!isFormDisabled}
                  />
                </View>
              </View>
            </View>
          )}

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
            title={
              isLoading
                ? "Hämtar..."
                : isSaving
                  ? "Sparar..."
                  : loadFailed
                    ? "Hämta uppgifterna igen"
                    : "Fortsätt"
            }
            disabled={isBusy}
            onPress={
              loadFailed
                ? () => setLoadAttempt((current) => current + 1)
                : () => void continueRegistration()
            }
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

  loading: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 15,
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

  message: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
});