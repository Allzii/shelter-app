import { router } from "expo-router";
import { Info, MapPin, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  const [privacyVisible, setPrivacyVisible] = useState(false);

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

  const openPrivacy = () => {
    Keyboard.dismiss();
    setPrivacyVisible(true);
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

      <Modal
        visible={privacyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalCard}
            accessibilityViewIsModal
          >
            <View style={styles.modalHeader}>
              <Text
                style={styles.modalTitle}
                accessibilityRole="header"
              >
                Dina personuppgifter
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Stäng informationen"
                onPress={() => setPrivacyVisible(false)}
                style={styles.closeButton}
              >
                <X size={23} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>
                Varför vi behöver uppgifterna
              </Text>

              <Text style={styles.modalText}>
                Uppgifterna du lämnar vid registreringen används
                för att skapa din volontärprofil och samordna hjälp.
              </Text>

              <Text style={styles.sectionTitle}>
                Uppgifter i din profil
              </Text>

              <Text style={styles.modalText}>
                Ditt namn, telefonnummer och din adress sparas
                tillsammans med ditt konto när du trycker på
                Fortsätt.
              </Text>

              <Text style={styles.sectionTitle}>
                Vad du kan hjälpa till med
              </Text>

              <Text style={styles.modalText}>
                I nästa steg anger du vilken hjälp du kan
                erbjuda. Uppgifterna används för att matcha dig
                med personer som behöver hjälp.
              </Text>

              <Text style={styles.sectionTitle}>
                Utbildningsintyg
              </Text>

              <Text style={styles.modalText}>
                Om du laddar upp ett utbildningsintyg används
                det för att kontrollera din utbildning innan
                du kan börja hjälpa.
              </Text>
            </ScrollView>

            <PrimaryButton
              title="Stäng"
              onPress={() => setPrivacyVisible(false)}
            />
          </View>
        </View>
      </Modal>
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

  privacyCard: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F7FAFC",
  },

  infoIcon: {
    marginTop: 2,
  },

  privacyContent: {
    flex: 1,
  },

  privacyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  privacyLinkButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingTop: 4,
  },

  privacyLink: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: colors.primary,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 45, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  modalTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },

  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalContent: {
    paddingBottom: 24,
  },

  sectionTitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },

  modalText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.82,
  },
});