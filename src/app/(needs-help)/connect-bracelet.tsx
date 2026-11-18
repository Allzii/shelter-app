import { router, useLocalSearchParams } from "expo-router";
import { Wifi } from "lucide-react-native";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Koppla armbandet</Text>

        <Text style={styles.description}>
          Armbandet används för att be om hjälp.
        </Text>

        <View style={styles.main}>
          <View
            style={styles.illustration}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.braceletShadow} />

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

            <View style={styles.wifiBadge}>
              <Wifi size={24} color={colors.primary} strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.braceletTitle}>Ditt armband</Text>

          <Text style={styles.braceletDescription}>
            Ställ in Wi-Fi nu eller fortsätt och gör det senare under Armband.
          </Text>
        </View>
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
    </SafeAreaView>
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
    paddingBottom: 28,
  },

  title: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 40,
  },

  illustration: {
    width: 250,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },

  bracelet: {
    alignItems: "center",
    transform: [{ rotate: "-14deg" }],
  },

  topStrap: {
    width: 65,
    height: 61,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  strapLine: {
    width: 37,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#416D90",
  },

  braceletBody: {
    width: 110,
    height: 108,
    borderRadius: 32,
    padding: 7,
    backgroundColor: "#173B5A",
    shadowColor: "#142235",
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  braceletFace: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315F84",
    borderWidth: 1,
    borderColor: "#527C9C",
  },

  braceletButton: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 4,
    borderColor: "#C2D6E4",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonHighlight: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },

  indicator: {
    position: "absolute",
    bottom: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#94B0C5",
  },

  bottomStrap: {
    width: 65,
    height: 61,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#234D72",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  strapHole: {
    width: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#173B5A",
  },

  braceletShadow: {
    position: "absolute",
    bottom: 3,
    width: 125,
    height: 13,
    borderRadius: 70,
    backgroundColor: "#254F75",
    opacity: 0.09,
  },

  wifiBadge: {
    position: "absolute",
    top: 37,
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#DCE7EE",
  },

  braceletTitle: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },

  braceletDescription: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
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
