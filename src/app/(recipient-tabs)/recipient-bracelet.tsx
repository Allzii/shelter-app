import { Battery, Clock3, Link2 } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import BraceletWifiSetup from "@/features/bracelet/components/BraceletWifiSetup";

export default function RecipientBraceletScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ditt armband</Text>

        <View style={styles.braceletCard}>
          <BraceletIllustration />

          <Text style={styles.braceletName}>Ditt hjälparmband</Text>

          <Text style={styles.connectionMessage}>
            Armbandet behöver vara kopplat till rätt person och ha internet för
            att skicka en hjälpförfrågan.
          </Text>
        </View>

        <BraceletWifiSetup />

        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Battery size={23} color={colors.primary} strokeWidth={1.7} />

            <Text style={styles.statusLabel}>Batteri</Text>

            <Text style={styles.statusValue}>—</Text>

            <Text style={styles.statusDescription}>
              Visas när armbandet är anslutet
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Clock3 size={23} color={colors.primary} strokeWidth={1.7} />

            <Text style={styles.statusLabel}>Senaste kontakt</Text>

            <Text style={styles.statusValue}>—</Text>

            <Text style={styles.statusDescription}>
              Ingen kontakt registrerad
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Så ber du om hjälp</Text>

        <View style={styles.instructionsCard}>
          <Instruction
            number="1"
            text="Tryck och håll in knappen på armbandet när du behöver hjälp."
          />

          <Instruction number="2" text="Armbandet skickar en hjälpförfrågan." />

          <Instruction
            number="3"
            text="Följ din förfrågan och se när en hjälpare svarar under Hem."
            last
          />
        </View>

        <Text style={styles.prototypeNote}>
          Prova att förfrågan visas under Hem när du använder armbandets knapp.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BraceletIllustration() {
  return (
    <View
      style={styles.illustration}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.illustrationCircle} />

      <View style={styles.bracelet}>
        <View style={styles.topStrap}>
          <View style={styles.strapLine} />
          <View style={styles.strapLine} />
        </View>

        <View style={styles.braceletBody}>
          <View style={styles.braceletFace}>
            <View style={styles.braceletButton}>
              <View style={styles.buttonHighlight} />
            </View>

            <View style={styles.indicator} />
          </View>
        </View>

        <View style={styles.bottomStrap}>
          <View style={styles.strapHole} />
          <View style={styles.strapHole} />
          <View style={styles.strapHole} />
        </View>
      </View>

      <View style={styles.connectionBadge}>
        <Link2 size={21} color={colors.primary} strokeWidth={1.8} />
      </View>
    </View>
  );
}

type InstructionProps = {
  number: string;
  text: string;
  last?: boolean;
};

function Instruction({ number, text, last = false }: InstructionProps) {
  return (
    <View style={[styles.instruction, !last && styles.instructionSpacing]}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
  },

  braceletCard: {
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: "center",
  },

  illustration: {
    width: 136,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  illustrationCircle: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#DEEBF4",
  },

  bracelet: {
    alignItems: "center",
    transform: [{ scale: 0.6 }, { rotate: "-12deg" }],
  },

  topStrap: {
    width: 54,
    height: 48,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  strapLine: {
    width: 29,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#416D90",
  },

  braceletBody: {
    width: 94,
    height: 92,
    borderRadius: 28,
    padding: 6,
    backgroundColor: "#173B5A",
  },

  braceletFace: {
    flex: 1,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315F84",
    borderWidth: 1,
    borderColor: "#527C9C",
  },

  braceletButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: "#C2D6E4",
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonHighlight: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },

  indicator: {
    position: "absolute",
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#94B0C5",
  },

  bottomStrap: {
    width: 54,
    height: 48,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  strapHole: {
    width: 13,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#173B5A",
  },

  connectionBadge: {
    position: "absolute",
    right: 19,
    bottom: 27,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DCE7EE",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  braceletName: {
    marginTop: 12,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
  },

  connectionMessage: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.textSecondary,
  },

  statusGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statusCard: {
    flexGrow: 1,
    flexBasis: 135,
    padding: 17,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },

  statusLabel: {
    marginTop: 13,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  statusValue: {
    marginTop: 4,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },

  statusDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.text,
  },

  instructionsCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },

  instruction: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },

  instructionSpacing: {
    marginBottom: 21,
  },

  numberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  numberText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },

  instructionText: {
    flex: 1,
    paddingTop: 3,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },

  prototypeNote: {
    marginTop: 12,
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
