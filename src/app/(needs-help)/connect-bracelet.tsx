import { router, useLocalSearchParams } from "expo-router";
import { Wifi } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import BraceletWifiSetup from "@/features/bracelet/components/BraceletWifiSetup";
import { supabase } from "@/lib/supabase";

export default function ConnectBraceletScreen() {
  const params = useLocalSearchParams<{
    recipientId?: string;
    person?: string;
    verification?: string;
  }>();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saving = useRef(false);

  const continueToHome = async () => {
    if (saving.current) return;

    if (!params.recipientId) {
      setMessage(
        "Kunde inte hitta registreringen. Gå tillbaka till Om dig och fortsätt därifrån.",
      );
      return;
    }

    saving.current = true;
    setIsSaving(true);
    setMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Session unavailable");
      }

      const { error } = await supabase
        .from("help_recipients")
        .update({
          registration_completed_at: new Date().toISOString(),
        })
        .eq("id", params.recipientId)
        .eq("account_id", authData.user.id)
        .select("id")
        .single();

      if (error) throw error;

      router.replace({
        pathname: "/recipient-home",
        params: {
          recipientId: params.recipientId,
          person: params.person === "other" ? "other" : "self",
          verification: params.verification ?? "pending",
        },
      });
    } catch (error) {
      console.error("Slutföra registrering:", error);

      const details =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Okänt fel";

      setMessage(`Kunde inte slutföra registreringen: ${details}`);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 5 av 5" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <View style={styles.icon}>
              <Wifi size={26} color={colors.primary} />
            </View>
            <Text style={styles.title}>Ditt armband</Text>
          </View>
          <Text style={styles.description}>
            Följ guiden för att ansluta armbandet. Du kan också göra detta
            senare under Armband.
          </Text>
          <BraceletWifiSetup recipientId={params.recipientId} />
        </ScrollView>
        <View style={styles.bottom}>
          {message !== "" && (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}
          <PrimaryButton
            title={isSaving ? "Sparar..." : "Till hemskärmen"}
            disabled={isSaving}
            onPress={() => void continueToHome()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  intro: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#DEEBF4",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  message: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },
});
