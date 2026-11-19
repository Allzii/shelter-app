import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddressFields from "@/components/ui/AddressFields";
import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { formatPhoneNumber, formatPostalCode } from "@/utils/formatters";
import { validatePersonDetails } from "@/utils/validation";

export default function NeedsHelpScreen() {
  const params = useLocalSearchParams<{
    person?: string;
    verification?: string;
  }>();

  const isOtherPerson = params.person === "other";
  const person = isOtherPerson ? "other" : "self";

  // Prototypens status är separat från riktig verifiering i databasen.
  const verification =
    params.verification === "demo-verified" ? "demo-verified" : "pending";

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
  const recipientId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRecipient = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setMessage("");
      recipientId.current = null;

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("help_recipients")
          .select("id, first_name, last_name, phone, street, postal_code, city")
          .eq("account_id", authData.user.id)
          .eq("registration_for", person)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        recipientId.current = data?.id ?? null;

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
          "Kunde inte hämta dina sparade uppgifter. Kontrollera anslutningen och försök igen.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRecipient();

    return () => {
      isMounted = false;
    };
  }, [person, loadAttempt]);

  const handleContinue = async () => {
    if (saving.current || isLoading || loadFailed) return;

    Keyboard.dismiss();
    setMessage("");

    const validationMessage = validatePersonDetails({
      firstName,
      lastName,
      phone,
      street,
      postalCode,
      city,
    });
    if (validationMessage) {
      setMessage(validationMessage);
      Alert.alert("Kontrollera uppgifterna", validationMessage);
      return;
    }

    saving.current = true;
    setIsSaving(true);

    try {
      const details = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\D/g, ""),
        street: street.trim(),
        postal_code: postalCode.replace(/\D/g, ""),
        city: city.trim(),
      };

      if (recipientId.current) {
        const { error } = await supabase
          .from("help_recipients")
          .update(details)
          .eq("id", recipientId.current)
          .select("id")
          .single();

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("help_recipients")
          .insert({
            registration_for: person,
            ...details,
          })
          .select("id")
          .single();

        if (error) throw error;

        recipientId.current = data.id;
      }

      const savedRecipientId = recipientId.current;

      if (!savedRecipientId) {
        throw new Error("Recipient missing");
      }

      router.push({
        pathname: "/emergency-contact",
        params: {
          recipientId: savedRecipientId,
          person,
          verification,
        },
      });
    } catch {
      setMessage(
        "Kunde inte spara uppgifterna. Kontrollera anslutningen och försök igen.",
      );

      // Läs tillbaka innan nästa försök. Sparandet kan ha nått databasen
      // även om anslutningen bröts innan appen fick svaret.
      setLoadFailed(true);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
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

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Hämtar uppgifter...</Text>
            </View>
          ) : (
            <View pointerEvents={isSaving || loadFailed ? "none" : "auto"}>
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

              <AddressFields
                street={street}
                postalCode={postalCode}
                city={city}
                onStreetChange={setStreet}
                onPostalCodeChange={setPostalCode}
                onCityChange={setCity}
                editable={!isSaving && !loadFailed}
                forOtherPerson={isOtherPerson}
              />
            </View>
          )}

          {message !== "" && (
            <Text style={styles.message} accessibilityLiveRegion="polite">
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
            disabled={isLoading || isSaving}
            onPress={
              loadFailed
                ? () => setLoadAttempt((current) => current + 1)
                : () => void handleContinue()
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
  verificationInfo: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
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
