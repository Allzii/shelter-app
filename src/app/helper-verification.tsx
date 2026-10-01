import { router } from "expo-router";
import { Check, KeyRound, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

type VerificationState = "idle" | "verifying" | "verified";

export default function HelperVerificationScreen() {
  const [state, setState] = useState<VerificationState>("idle");
  const verificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verificationTimer.current) {
        clearTimeout(verificationTimer.current);
      }
    };
  }, []);

  const verify = () => {
    setState("verifying");
    verificationTimer.current = setTimeout(() => {
      setState("verified");
      verificationTimer.current = null;
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 1 av 4" />

      <View style={styles.content}>
        <Text style={styles.title}>Verifiera din identitet</Text>
        <Text style={styles.description}>
          Alla hjälpare identifierar sig med BankID innan de kan ta emot en
          hjälpförfrågan.
        </Text>

        <View style={styles.bankIdPanel}>
          <View style={styles.bankIdHeading}>
            <View style={styles.bankIdIcon}>
              <KeyRound size={25} color="#FFFFFF" />
            </View>
            <View style={styles.bankIdHeadingText}>
              <Text style={styles.bankIdName}>BankID</Text>
              <Text style={styles.bankIdCaption}>Säker identifiering</Text>
            </View>
          </View>

          <Text style={styles.bankIdInfo}>
            BankID bekräftar vem du är. Andra användare ser bara de uppgifter
            som behövs när du hjälper någon.
          </Text>

          {state === "verified" ? (
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedIcon}>
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View>
                <Text style={styles.verifiedTitle}>Identiteten är verifierad</Text>
                <Text style={styles.verifiedDescription}>
                  Du kan fortsätta registreringen
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={state === "verifying"}
              onPress={verify}
              style={({ pressed }) => [
                styles.verifyButton,
                pressed && styles.pressed,
                state === "verifying" && styles.disabled,
              ]}
            >
              {state === "verifying" ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Väntar på BankID...</Text>
                </>
              ) : (
                <>
                  <ShieldCheck size={21} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Öppna BankID</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        <Text style={styles.onceText}>
          Du behöver bara identifiera dig en gång.
        </Text>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Fortsätt"
          disabled={state !== "verified"}
          onPress={() => router.push("/helper-details")}
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
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
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
  bankIdPanel: {
    marginTop: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D5DEE5",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  bankIdHeading: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankIdIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173F67",
  },
  bankIdHeadingText: {
    flex: 1,
    marginLeft: 13,
  },
  bankIdName: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    color: "#142235",
  },
  bankIdCaption: {
    marginTop: 1,
    fontSize: 14,
    color: "#607080",
  },
  bankIdInfo: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: "#4F6071",
  },
  verifyButton: {
    height: 54,
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: "#173F67",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.7,
  },
  verifiedRow: {
    minHeight: 62,
    marginTop: 22,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#EAF4F1",
  },
  verifiedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: "#286E69",
  },
  verifiedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#174E4A",
  },
  verifiedDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "#49716D",
  },
  onceText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
    color: "#6F7D8B",
  },
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
