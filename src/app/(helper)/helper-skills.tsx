import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import SkillFields from "@/features/helper/components/SkillFields";
import { supabase } from "@/lib/supabase";

export default function HelperSkillsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileMissing, setProfileMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saving = useRef(false);
  const isBusy = isLoading || isSaving;
  const isFormDisabled = isBusy || loadFailed || profileMissing;

  useEffect(() => {
    let isMounted = true;

    const loadSkills = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setProfileMissing(false);
      setMessage("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("helper_profiles")
          .select("selected_skills")
          .eq("account_id", authData.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!isMounted) return;

        if (!data) {
          setProfileMissing(true);
          setSelected([]);
          setMessage(
            "Spara dina uppgifter på Om dig innan du väljer vad du kan hjälpa med.",
          );
          return;
        }

        setSelected(data.selected_skills ?? []);
      } catch {
        if (!isMounted) return;

        setLoadFailed(true);
        setMessage(
          "Kunde inte hämta dina val. Kontrollera anslutningen och försök igen.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSkills();

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  const toggleOption = (id: string) => {
    if (isFormDisabled) return;

    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleContinue = async () => {
    if (saving.current || isFormDisabled) return;

    // Återaktivera efter testning:
    // if (selected.length === 0) return;

    setMessage("");
    saving.current = true;
    setIsSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage(
          "Kunde inte kontrollera inloggningen. Försök igen eller logga in på nytt.",
        );
        return;
      }

      const { error } = await supabase
        .from("helper_profiles")
        .update({
          selected_skills: selected,
        })
        .eq("account_id", authData.user.id)
        .select("account_id")
        .single();

      if (error) {
        setMessage(
          "Kunde inte spara dina val. Kontrollera anslutningen och försök igen.",
        );
        return;
      }

      router.push("/helper-training");
    } catch {
      setMessage(
        "Kunde inte ansluta. Kontrollera din internetanslutning och försök igen.",
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 3 av 5" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Hur kan du hjälpa?</Text>

        <Text style={styles.description}>
          Välj det du känner dig trygg med. Du kan ändra detta senare.
        </Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Hämtar dina val...</Text>
          </View>
        ) : (
          <SkillFields
            selected={selected}
            onToggle={toggleOption}
            disabled={isFormDisabled}
          />
        )}

        {message !== "" && (
          <Text style={styles.message} accessibilityLiveRegion="polite">
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
                : profileMissing
                  ? "Till Om dig"
                  : loadFailed
                    ? "Hämta dina val igen"
                    : "Fortsätt"
          }
          disabled={isBusy}
          // Efter testning: blockera även om inga alternativ valts.
          onPress={
            profileMissing
              ? () => router.replace("/helper-details")
              : loadFailed
                ? () => setLoadAttempt((current) => current + 1)
                : () => void handleContinue()
          }
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

  content: {
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
    marginTop: 9,
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
  },
});
