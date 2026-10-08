import { router, useLocalSearchParams } from "expo-router";
import {
  Accessibility,
  Footprints,
  Minus,
  MoveUp,
  PersonStanding,
  Plus,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HelpOption from "@/components/ui/HelpOption";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function HelpNeedsScreen() {
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

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [floor, setFloor] = useState(0);
  const [hasElevator, setHasElevator] = useState(false);

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

    const loadHelpNeeds = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setMessage("");

      try {
        if (!recipientId) {
          throw new Error("Recipient missing");
        }

        const { data, error } = await supabase
          .from("help_needs")
          .select(
            "selected_needs, additional_info, floor, has_elevator"
          )
          .eq("recipient_id", recipientId)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        setSelectedNeeds(data?.selected_needs ?? []);
        setAdditionalInfo(data?.additional_info ?? "");
        setFloor(data?.floor ?? 0);
        setHasElevator(data?.has_elevator ?? false);
      } catch {
        if (!isMounted) return;

        setLoadFailed(true);
        setMessage(
          recipientId
            ? "Kunde inte hämta hjälpbehoven. Kontrollera anslutningen och försök igen."
            : "Personkopplingen saknas. Gå tillbaka till Om dig och fortsätt därifrån."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadHelpNeeds();

    return () => {
      isMounted = false;
    };
  }, [recipientId, loadAttempt]);

  const toggleNeed = (need: string) => {
    if (isFormDisabled) return;

    setSelectedNeeds((previous) =>
      previous.includes(need)
        ? previous.filter((item) => item !== need)
        : [...previous, need]
    );
  };

  const handleContinue = async () => {
    if (saving.current || isLoading || loadFailed) return;

    Keyboard.dismiss();
    setMessage("");

    if (!recipientId) {
      setMessage(
        "Personkopplingen saknas. Gå tillbaka till Om dig och fortsätt därifrån."
      );
      return;
    }

    saving.current = true;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("help_needs")
        .upsert(
          {
            recipient_id: recipientId,
            selected_needs: selectedNeeds,
            additional_info: additionalInfo.trim(),
            floor,
            has_elevator: hasElevator,
          },
          { onConflict: "recipient_id" }
        )
        .select("recipient_id")
        .single();

      if (error) {
        setMessage(
          "Kunde inte spara hjälpbehoven. Kontrollera anslutningen och försök igen."
        );
        return;
      }

      router.push({
        pathname: "/needs-help-permissions",
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
      <ScreenHeader step="Steg 3 av 5" />

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
            {isOtherPerson
              ? "Vilken hjälp kan personen behöva?"
              : "Vilken hjälp kan du behöva?"}
          </Text>

          <Text style={styles.description}>
            {isOtherPerson
              ? "Välj alla alternativ som passar personen. Hjälparen får se detta innan de möts."
              : "Välj alla alternativ som passar dig. Din hjälpare får se detta innan ni möts."}
          </Text>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>
                Hämtar hjälpbehov...
              </Text>
            </View>
          ) : (
            <View
              pointerEvents={isFormDisabled ? "none" : "auto"}
            >
              <View style={styles.options}>
                <HelpOption
                  title="Rullstol"
                  description={
                    isOtherPerson
                      ? "Personen använder rullstol och kan behöva hjälp att ta sig fram."
                      : "Jag använder rullstol och kan behöva hjälp att ta mig fram."
                  }
                  icon={Accessibility}
                  selected={selectedNeeds.includes("wheelchair")}
                  onPress={() => toggleNeed("wheelchair")}
                />

                <HelpOption
                  title="Svårt att gå längre sträckor"
                  description={
                    isOtherPerson
                      ? "Personen går långsamt, använder gånghjälpmedel eller behöver ta pauser."
                      : "Jag går långsamt, använder gånghjälpmedel eller behöver ta pauser."
                  }
                  icon={Footprints}
                  selected={selectedNeeds.includes("walking")}
                  onPress={() => toggleNeed("walking")}
                />

                <HelpOption
                  title="Hjälp i trappor"
                  description={
                    isOtherPerson
                      ? "Personen har svårt att ta sig upp eller ner för trappor."
                      : "Jag har svårt att ta mig upp eller ner för trappor."
                  }
                  icon={MoveUp}
                  selected={selectedNeeds.includes("stairs")}
                  onPress={() => toggleNeed("stairs")}
                />

                <HelpOption
                  title="Fysiskt stöd"
                  description={
                    isOtherPerson
                      ? "Personen kan behöva stöd av en annan person när hen går."
                      : "Jag kan behöva stöd av en annan person när jag går."
                  }
                  icon={PersonStanding}
                  selected={selectedNeeds.includes("physical-support")}
                  onPress={() => toggleNeed("physical-support")}
                />
              </View>

              <View style={styles.extraSection}>
                <Text style={styles.sectionTitle}>
                  {isOtherPerson ? "Personens boende" : "Ditt boende"}
                </Text>

                <View style={styles.homeCard}>
                  <View style={styles.homeRow}>
                    <View style={styles.homeDetails}>
                      <Text style={styles.homeLabel}>Våningsplan</Text>
                      <Text style={styles.homeDescription}>
                        0 = entréplan
                      </Text>
                    </View>

                    <View style={styles.floorControls}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Minska våningsplan"
                        accessibilityState={{
                          disabled: floor === 0 || isFormDisabled,
                        }}
                        disabled={floor === 0 || isFormDisabled}
                        onPress={() =>
                          setFloor((value) => Math.max(0, value - 1))
                        }
                        style={({ pressed }) => [
                          styles.floorButton,
                          (floor === 0 || isFormDisabled) &&
                            styles.disabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Minus size={22} color={colors.text} />
                      </Pressable>

                      <Text
                        style={styles.floorValue}
                        accessibilityLabel={`Våningsplan ${floor}`}
                        accessibilityLiveRegion="polite"
                      >
                        {floor}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Öka våningsplan"
                        accessibilityState={{
                          disabled: isFormDisabled,
                        }}
                        disabled={isFormDisabled}
                        onPress={() => setFloor((value) => value + 1)}
                        style={({ pressed }) => [
                          styles.floorButton,
                          isFormDisabled && styles.disabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Plus size={22} color={colors.text} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={[styles.homeRow, styles.elevatorRow]}>
                    <View style={styles.homeDetails}>
                      <Text style={styles.homeLabel}>
                        Hiss i byggnaden
                      </Text>
                      <Text style={styles.homeDescription}>
                        {hasElevator ? "Hiss finns" : "Ingen hiss"}
                      </Text>
                    </View>

                    <Switch
                      accessibilityLabel="Hiss i byggnaden"
                      value={hasElevator}
                      onValueChange={setHasElevator}
                      disabled={isFormDisabled}
                      trackColor={{
                        false: "#C5D0DA",
                        true: colors.primary,
                      }}
                      thumbColor={colors.surface}
                      ios_backgroundColor="#C5D0DA"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.extraSection}>
                <Text style={styles.extraLabel}>
                  {isOtherPerson
                    ? "Något annat hjälparen bör veta?"
                    : "Något annat din hjälpare bör veta?"}
                </Text>

                <Text style={styles.optionalText}>Valfritt</Text>

                <TextInput
                  style={styles.extraInput}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder="Skriv här..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  maxLength={300}
                  editable={!isFormDisabled}
                  accessibilityLabel="Något annat hjälparen bör veta? Valfritt"
                />

                <Text style={styles.characterCount}>
                  {additionalInfo.length}/300
                </Text>
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
    maxWidth: 310,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
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

  options: {
    marginTop: 24,
    gap: 12,
  },

  extraSection: {
    marginTop: 28,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },

  homeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  homeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  homeDetails: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
  },

  homeLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },

  homeDescription: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  floorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  floorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F0F4",
    alignItems: "center",
    justifyContent: "center",
  },

  floorValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },

  elevatorRow: {
    borderTopWidth: 1,
    borderTopColor: "#E8EFF4",
  },

  disabled: {
    opacity: 0.4,
  },

  pressed: {
    opacity: 0.7,
  },

  extraLabel: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },

  optionalText: {
    marginTop: 3,
    fontSize: 13,
    color: "#7A8896",
  },

  extraInput: {
    minHeight: 105,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },

  characterCount: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 13,
    color: "#7A8896",
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