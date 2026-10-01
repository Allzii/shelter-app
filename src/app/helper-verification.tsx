import { router } from "expo-router";
import { Check, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

type VerificationState = "idle" | "verifying" | "verified";

export default function HelperVerificationScreen() {
  const [state, setState] = useState<VerificationState>("idle");

  const verificationTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verificationTimer.current !== null) {
        clearTimeout(verificationTimer.current);
        verificationTimer.current = null;
      }
    };
  }, []);

  const verify = () => {
    if (verificationTimer.current !== null || state === "verified") {
      return;
    }

    setState("verifying");

    verificationTimer.current = setTimeout(() => {
      verificationTimer.current = null;
      setState("verified");
    }, 1400);
  };

  const handleContinue = () => {
    if (state !== "verified") return;

    router.push("/helper-details");
  };

  const isVerifying = state === "verifying";
  const isVerified = state === "verified";

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 1 av 4" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.title}>Verifiera din identitet</Text>

          <Text style={styles.description}>
            Alla hjälpare identifierar sig med BankID innan de kan ta emot
            en hjälpförfrågan.
          </Text>
        </View>

        <View
          style={styles.verification}
          accessibilityLiveRegion="polite"
        >
          <View
            style={[
              styles.iconCircle,
              isVerified && styles.iconCircleVerified,
            ]}
          >
            {isVerified ? (
              <Check size={64} color="#286E69" strokeWidth={2.5} />
            ) : (
              <ShieldCheck size={72} color="#2F6591" strokeWidth={1.6} />
            )}
          </View>

          <Text style={styles.verificationTitle}>
            {isVerified
              ? "Din identitet är verifierad"
              : isVerifying
                ? "Väntar på BankID"
                : "Identifiera dig med BankID"}
          </Text>

          <Text style={styles.verificationDescription}>
            {isVerified
              ? "Du kan nu fortsätta registreringen."
              : isVerifying
                ? "Identifieringen pågår..."
                : "BankID bekräftar vem du är när du registrerar dig som hjälpare."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {isVerified ? (
          <PrimaryButton
            title="Fortsätt"
            onPress={handleContinue}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isVerifying ? "Väntar på BankID" : "Öppna BankID"
            }
            accessibilityState={{
              disabled: isVerifying,
              busy: isVerifying,
            }}
            disabled={isVerifying}
            onPress={verify}
            style={({ pressed }) => [
              styles.verifyButton,
              pressed && styles.pressed,
              isVerifying && styles.disabled,
            ]}
          >
            {isVerifying && (
              <ActivityIndicator color="#FFFFFF" />
            )}

            <Text style={styles.verifyButtonText}>
              {isVerifying ? "Väntar på BankID..." : "Öppna BankID"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },

  title: {
    maxWidth: 320,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#142235",
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: "#607080",
  },

  verification: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 44,
    paddingBottom: 44,
  },

  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAF3",
    marginBottom: 28,
  },

  iconCircleVerified: {
    backgroundColor: "#DDEFEA",
  },

  verificationTitle: {
    maxWidth: 300,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: "#142235",
  },

  verificationDescription: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: "#607080",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },

  verifyButton: {
    width: "100%",
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#2F6591",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  verifyButtonText: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.82,
  },

  disabled: {
    opacity: 0.7,
  },
});