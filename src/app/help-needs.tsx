import { useState } from "react";
import { router } from "expo-router";
import {
  Accessibility,
  Footprints,
  PersonStanding,
  MoveUp,
  Minus,
  Plus,
} from "lucide-react-native";

import {
  SafeAreaView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import HelpOption from "@/components/ui/HelpOption";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function HelpNeedsScreen() {
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [floor, setFloor] = useState(0);
  const [hasElevator, setHasElevator] = useState(false);

  const toggleNeed = (need: string) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(
        selectedNeeds.filter((item) => item !== need)
      );
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleContinue = () => {
    router.push("/needs-help-permissions");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 3 av 5" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.title}>
          Vilken hjälp kan du behöva?
        </Text>

        <Text style={styles.description}>
          Välj alla alternativ som passar dig. Din hjälpare får se detta
          innan ni möts.
        </Text>

        <View style={styles.options}>
          <HelpOption
            title="Rullstol"
            description="Jag använder rullstol och kan behöva hjälp att ta mig fram."
            icon={Accessibility}
            selected={selectedNeeds.includes("wheelchair")}
            onPress={() => toggleNeed("wheelchair")}
          />

          <HelpOption
            title="Svårt att gå längre sträckor"
            description="Jag går långsamt, använder gånghjälpmedel eller behöver ta pauser."
            icon={Footprints}
            selected={selectedNeeds.includes("walking")}
            onPress={() => toggleNeed("walking")}
          />

          <HelpOption
            title="Hjälp i trappor"
            description="Jag har svårt att ta mig upp eller ner för trappor."
            icon={MoveUp}
            selected={selectedNeeds.includes("stairs")}
            onPress={() => toggleNeed("stairs")}
          />

          <HelpOption
            title="Fysiskt stöd"
            description="Jag kan behöva stöd av en annan person när jag går."
            icon={PersonStanding}
            selected={selectedNeeds.includes("physical-support")}
            onPress={() => toggleNeed("physical-support")}
          />
        </View>

        <View style={styles.extraSection}>
          <Text style={styles.sectionTitle}>Ditt boende</Text>

          <View style={styles.homeCard}>
            <View style={styles.homeRow}>
              <View style={styles.homeDetails}>
                <Text style={styles.homeLabel}>Våningsplan</Text>
                <Text style={styles.homeDescription}>
                  {floor === 0 ? "0 = entréplan" : "Vilken våning bor du på?"}
                </Text>
              </View>

              <View style={styles.floorControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minska våningsplan"
                  accessibilityState={{ disabled: floor === 0 }}
                  disabled={floor === 0}
                  onPress={() => setFloor((value) => Math.max(0, value - 1))}
                  style={({ pressed }) => [
                    styles.floorButton,
                    floor === 0 && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Minus size={22} color="#142235" />
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
                  onPress={() => setFloor((value) => value + 1)}
                  style={({ pressed }) => [
                    styles.floorButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Plus size={22} color="#142235" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.homeRow, styles.elevatorRow]}>
              <View style={styles.homeDetails}>
                <Text style={styles.homeLabel}>Hiss i byggnaden</Text>
                <Text style={styles.homeDescription}>
                  {hasElevator ? "Hiss finns" : "Ingen hiss"}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Hiss i byggnaden"
                value={hasElevator}
                onValueChange={setHasElevator}
                trackColor={{ false: "#C5D0DA", true: "#2F6591" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#C5D0DA"
              />
            </View>
          </View>
        </View>

        <View style={styles.extraSection}>
          <Text style={styles.extraLabel}>
            Något annat din hjälpare bör veta?
          </Text>

          <Text style={styles.optionalText}>
            Valfritt
          </Text>

          <TextInput
            style={styles.extraInput}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder="Skriv här..."
            placeholderTextColor="#8A97A5"
            multiline
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel="Något annat din hjälpare bör veta? Valfritt"
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Fortsätt"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
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
    color: "#142235",
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: "#607080",
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
    color: "#142235",
  },

  homeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#142235",
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
    color: "#142235",
  },

  homeDescription: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: "#607080",
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
    color: "#142235",
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
    color: "#142235",
  },

  optionalText: {
    marginTop: 3,
    fontSize: 13,
    color: "#7A8896",
  },

  extraInput: {
    minHeight: 105,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#142235",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#EEF4F7",
  },
});
