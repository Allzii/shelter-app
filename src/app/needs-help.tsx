import { router } from "expo-router";
import { MapPin, Phone, User } from "lucide-react-native";
import { useState } from "react";

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function NeedsHelpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const capitalizeWords = (value: string) => {
    return value
      .toLowerCase()
      .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    if (numbers.length <= 8) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)} ${numbers.slice(
      6,
      8
    )} ${numbers.slice(8, 10)}`;
  };

  const formatPostalCode = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 5);

    if (numbers.length <= 3) {
      return numbers;
    }

    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    router.push("/emergency-contact")
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 1 av 4" />

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

          <FormInput
            label="Förnamn"
            icon={User}
            value={firstName}
            onChangeText={(value) =>
              setFirstName(capitalizeWords(value))
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
              setLastName(capitalizeWords(value))
            }
            placeholder="Skriv ditt efternamn"
            autoCapitalize="words"
            autoComplete="family-name"
          />

          <FormInput
            label="Telefonnummer"
            icon={Phone}
            value={phone}
            onChangeText={(value) =>
              setPhone(formatPhoneNumber(value))
            }
            placeholder="070-123 45 67"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
          />

          <FormInput
            label="Adress"
            icon={MapPin}
            value={street}
            onChangeText={setStreet}
            placeholder="Gata och nummer"
            autoCapitalize="words"
            autoComplete="street-address"
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
                placeholderTextColor="#8A97A5"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.cityInput}>
              <TextInput
                style={styles.smallInput}
                value={city}
                onChangeText={(value) =>
                  setCity(capitalizeWords(value))
                }
                placeholder="Ort"
                placeholderTextColor="#8A97A5"
                autoCapitalize="words"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Fortsätt"
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
    backgroundColor: "#EEF4F7",
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
    color: "#142235",
  },

  description: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 22,
    color: "#607080",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  cityInput: {
    flex: 1.1,
    height: 52,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  smallInput: {
    flex: 1,
    fontSize: 16,
    color: "#142235",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#EEF4F7",
  },
});