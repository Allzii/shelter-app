import { Bluetooth, Check, ChevronRight } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import ScreenHeader from "@/components/ui/ScreenHeader";

type ConnectionState = "idle" | "searching" | "connected";

export default function ConnectBraceletScreen() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");

  const searchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimer.current !== null) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, []);

  const handleConnect = () => {
    if (searchTimer.current !== null) return;

    setConnectionState("searching");

    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      setConnectionState("connected");
    }, 1400);
  };

  const isSearching = connectionState === "searching";
  const isConnected = connectionState === "connected";

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 5 av 5" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Koppla armbandet</Text>

        <Text style={styles.description}>
          Armbandet behöver vara nära telefonen när du ansluter det.
        </Text>

        <Text style={styles.sectionTitle}>Gör så här</Text>

        <View style={styles.steps}>
          <Instruction number="1" text="Slå på armbandet." />

          <Instruction
            number="2"
            text="Håll knappen intryckt tills lampan blinkar."
          />

          <Instruction
            number="3"
            text="Tryck på Sök efter armband."
            isLast
          />
        </View>

        <View
          style={styles.statusRow}
          accessibilityLiveRegion="polite"
        >
          <View
            style={[
              styles.statusIcon,
              isConnected && styles.statusIconConnected,
            ]}
          >
            {isConnected ? (
              <Check size={21} color={colors.surface} strokeWidth={3} />
            ) : (
              <Bluetooth size={21} color= {colors.primary} />
            )}
          </View>

          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isSearching
                ? "Söker efter armband"
                : isConnected
                  ? "TryggNära-armband anslutet"
                  : "Inget armband anslutet"}
            </Text>

            <Text style={styles.statusDescription}>
              {isSearching
                ? "Håll armbandet nära telefonen"
                : isConnected
                  ? "Anslutningen fungerar"
                  : "Sök efter ditt TryggNära-armband"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSearching
              ? "Söker efter armband"
              : isConnected
                ? "Klart"
                : "Sök efter armband"
          }
          accessibilityState={{
            disabled: isSearching,
            busy: isSearching,
          }}
          disabled={isSearching}
          onPress={handleConnect}
          style={({ pressed }) => [
            styles.primaryButton,
            isConnected && styles.connectedButton,
            pressed && styles.buttonPressed,
            isSearching && styles.buttonDisabled,
          ]}
        >
          {isSearching ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {isConnected ? "Klart" : "Sök efter armband"}
              </Text>

              {isConnected ? (
                <Check
                  size={22}
                  color={colors.surface}
                  style={styles.buttonIcon}
                />
              ) : (
                <ChevronRight
                  size={22}
                  color={colors.surface}
                  style={styles.buttonIcon}
                />
              )}
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type InstructionProps = {
  number: string;
  text: string;
  isLast?: boolean;
};

function Instruction({
  number,
  text,
  isLast = false,
}: InstructionProps) {
  return (
    <View style={[styles.stepRow, isLast && styles.lastStepRow]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>

      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
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
    maxWidth: 330,
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: 34,
    marginBottom: 4,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  steps: {
    width: "100%",
  },

  stepRow: {
    minHeight: 58,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  lastStepRow: {
    borderBottomWidth: 0,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2F3",
    marginRight: 13,
  },

  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },

  statusRow: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginRight: 12,
  },

  statusIconConnected: {
    backgroundColor: colors.primary,
  },

  statusText: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: colors.text,
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },

  primaryButton: {
    width: "100%",
    minHeight: 58,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  connectedButton: {
    backgroundColor: colors.success,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    textAlign: "center",
    color: colors.surface,
    fontSize: 18,
    fontWeight: "700",
  },

  buttonIcon: {
    position: "absolute",
    right: 22,
  },
});