import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronDown, Users } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  capitalizeFirstLetter,
  formatPhoneNumber,
} from "@/utils/formatters";

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
  const params = useLocalSearchParams<{
    recipientId?: string;
    person?: string;
    verification?: string;
  }>();

  const recipientId = params.recipientId;
  const isOtherPerson = params.person === "other";
  const person = isOtherPerson ? "other" : "self";

  const verification =
    params.verification === "demo-verified"
      ? "demo-verified"
      : "pending";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");
  const [otherRelation, setOtherRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [showRelations, setShowRelations] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saving = useRef(false);
  const isBusy = isLoading || isSaving;

  useEffect(() => {
    let isMounted = true;

    const loadContact = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setMessage("");
      setShowRelations(false);

      try {
        if (!recipientId) {
          throw new Error("Recipient missing");
        }

        const { data, error } = await supabase
          .from("emergency_contacts")
          .select(
            "first_name, last_name, relation, other_relation, phone"
          )
          .eq("recipient_id", recipientId)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        setFirstName(data?.first_name ?? "");
        setLastName(data?.last_name ?? "");
        setRelation(data?.relation ?? "");
        setOtherRelation(data?.other_relation ?? "");
        setPhone(formatPhoneNumber(data?.phone ?? ""));
      } catch {
        if (!isMounted) return;

        setLoadFailed(true);
        setMessage(
          recipientId
            ? "Kunde inte hämta nödkontakten. Kontrollera anslutningen och försök igen."
            : "Personkopplingen saknas. Gå tillbaka till Om dig och tryck på Fortsätt."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContact();

    return () => {
      isMounted = false;
    };
  }, [recipientId, loadAttempt]);

  const selectRelation = (selectedRelation: string) => {
    setRelation(selectedRelation);
    setShowRelations(false);

    if (selectedRelation !== "Annat") {
      setOtherRelation("");
    }
  };

  const handleContinue = async () => {
    if (saving.current || isLoading || loadFailed) return;

    Keyboard.dismiss();
    setShowRelations(false);
    setMessage("");

    if (!recipientId) {
      setMessage(
        "Personkopplingen saknas. Gå tillbaka till Om dig och tryck på Fortsätt."
      );
      return;
    }

    saving.current = true;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .upsert(
          {
            recipient_id: recipientId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            relation,
            other_relation:
              relation === "Annat" ? otherRelation.trim() : "",
            phone: phone.replace(/\D/g, ""),
          },
          { onConflict: "recipient_id" }
        )
        .select("recipient_id")
        .single();

      if (error) {
        setMessage(
          "Kunde inte spara nödkontakten. Kontrollera anslutningen och försök igen."
        );
        return;
      }

      router.push({
        pathname: "/help-needs",
        params: {
          recipientId,
          person,
          verification,
        },
      });
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
          nestedScrollEnabled
        >
          <Text style={styles.title}>Nödkontakt</Text>

          <Text style={styles.description}>
            {isOtherPerson
              ? "Vem ska få veta när personen ber om hjälp?"
              : "Vem vill du ska få veta när du ber om hjälp?"}
          </Text>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>
                Hämtar nödkontakt...
              </Text>
            </View>
          ) : (
            <View
              pointerEvents={isSaving || loadFailed ? "none" : "auto"}
            >
              <NameFields
                firstName={firstName}
                lastName={lastName}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                forOtherPerson
              />

              <View style={styles.relationWrapper}>
                <Text style={styles.label}>Relation</Text>

                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowRelations((previous) => !previous);
                  }}
                  disabled={isBusy || loadFailed}
                  accessibilityRole="button"
                  accessibilityLabel={`Relation: ${
                    relation || "Välj relation"
                  }`}
                  accessibilityState={{
                    expanded: showRelations,
                    disabled: isBusy || loadFailed,
                  }}
                  style={({ pressed }) => [
                    styles.relationButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Users size={21} color={colors.textSecondary} />

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
                    color={colors.textSecondary}
                    style={{
                      transform: [
                        {
                          rotate: showRelations ? "180deg" : "0deg",
                        },
                      ],
                    }}
                  />
                </Pressable>

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
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: relation === item,
                          }}
                          style={({ pressed }) => [
                            styles.dropdownOption,
                            relation === item &&
                              styles.dropdownSelected,
                            pressed && styles.dropdownPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownText,
                              relation === item &&
                                styles.dropdownSelectedText,
                            ]}
                          >
                            {item}
                          </Text>

                          {relation === item && (
                            <Check
                              size={20}
                              color={colors.primary}
                            />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {relation === "Annat" && (
                <FormInput
                  label="Ange relation"
                  icon={Users}
                  value={otherRelation}
                  onChangeText={(value) =>
                    setOtherRelation(capitalizeFirstLetter(value))
                  }
                  placeholder="Skriv relation"
                  autoCapitalize="words"
                  editable={!isBusy && !loadFailed}
                />
              )}

              <PhoneInput
                value={phone}
                onChangeText={setPhone}
                forOtherPerson
              />

              <Text style={styles.infoText}>
                {isOtherPerson
                  ? "Nödkontakten är den som ska meddelas när personen ber om hjälp."
                  : "Din nödkontakt är den som ska meddelas när du ber om hjälp."}
              </Text>
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
            disabled={isBusy || !recipientId}
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

  relationWrapper: {
    marginTop: 16,
    zIndex: 10,
  },

  label: {
    marginBottom: 7,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  relationButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  relationText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 16,
    color: colors.text,
  },

  placeholderText: {
    color: colors.placeholder,
  },

  dropdown: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,
    maxHeight: 230,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    zIndex: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  dropdownText: {
    fontSize: 16,
    color: colors.text,
  },

  dropdownSelected: {
    backgroundColor: "#E8F0F7",
  },

  dropdownSelectedText: {
    color: colors.primary,
    fontWeight: "600",
  },

  dropdownPressed: {
    backgroundColor: "#F2F6F8",
  },

  infoText: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 20,
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

  pressed: {
    opacity: 0.7,
  },
});