import { router } from "expo-router";
import {
  ChevronDown,
  Phone,
  User,
  Users,
} from "lucide-react-native";
import { useState } from "react";

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

const relations = [
  "Partner",
  "Förälder",
  "Barn",
  "Syskon",
  "Annan släkting",
  "Vän",
  "Granne",
  "Annat",
];

export default function EmergencyContactScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");
  const [otherRelation, setOtherRelation] = useState("");
  const [phone, setPhone] = useState("");

  const [showRelations, setShowRelations] = useState(false);

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

  const selectRelation = (selectedRelation: string) => {
    setRelation(selectedRelation);
    setShowRelations(false);

    if (selectedRelation !== "Annat") {
      setOtherRelation("");
    }
  };

  const isComplete = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      relation &&
      (relation !== "Annat" || otherRelation.trim()) &&
      phone.replace(/\D/g, "").length === 10
  );

  const handleContinue = () => {
    Keyboard.dismiss();
    router.push("/help-needs");
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
          nestedScrollEnabled
        >
          <Text style={styles.title}>Nödkontakt</Text>

          <Text style={styles.description}>
            Vem vill du ska få veta när du ber om hjälp?
          </Text>

          <FormInput
            label="Förnamn"
            icon={User}
            value={firstName}
            onChangeText={(value) =>
              setFirstName(capitalizeWords(value))
            }
            placeholder="Skriv personens förnamn"
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
            placeholder="Skriv personens efternamn"
            autoCapitalize="words"
            autoComplete="family-name"
          />

          {/* Relation */}
          <View style={styles.relationWrapper}>
            <Text style={styles.label}>Relation</Text>

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setShowRelations(!showRelations);
              }}
              style={({ pressed }) => [
                styles.relationButton,
                pressed && styles.pressed,
              ]}
            >
              <Users size={21} color="#607080" />

              <Text
                style={[
                  styles.relationText,
                  !relation && styles.placeholderText,
                ]}
              >
                {relation || "Välj relation"}
              </Text>

              <ChevronDown
                size={21}
                color="#607080"
                style={{
                  transform: [
                    {
                      rotate: showRelations
                        ? "180deg"
                        : "0deg",
                    },
                  ],
                }}
              />
            </Pressable>

            {/* Scrollable dropdown */}
            {showRelations && (
              <View style={styles.dropdown}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {relations.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => selectRelation(item)}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        pressed && styles.dropdownPressed,
                      ]}
                    >
                      <Text style={styles.dropdownText}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Only shown when "Annat" is selected */}
          {relation === "Annat" && (
            <FormInput
              label="Ange relation"
              icon={Users}
              value={otherRelation}
              onChangeText={(value) =>
                setOtherRelation(capitalizeWords(value))
              }
              placeholder="Skriv relation"
              autoCapitalize="words"
            />
          )}

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

          <Text style={styles.infoText}>
            Din nödkontakt meddelas automatiskt när du ber om hjälp via
            TryggNära.
          </Text>
        </ScrollView>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Fortsätt"
            disabled={!isComplete}
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

  relationWrapper: {
    marginTop: 16,
    zIndex: 10,
  },

  label: {
    marginBottom: 7,
    fontSize: 16,
    fontWeight: "600",
    color: "#142235",
  },

  relationButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  relationText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 16,
    color: "#142235",
  },

  placeholderText: {
    color: "#8A97A5",
  },

  dropdown: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,

    maxHeight: 230,

    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DEE5",
    overflow: "hidden",
    zIndex: 20,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  dropdownText: {
    fontSize: 16,
    color: "#142235",
  },

  dropdownPressed: {
    backgroundColor: "#F2F6F8",
  },

  infoText: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 20,
    color: "#607080",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#EEF4F7",
  },

  pressed: {
    opacity: 0.7,
  },
});
