import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { ChevronRight, Watch } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import NearbyShelterCard from "@/components/maps/NearbyShelterCard";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function RecipientHomeScreen() {
  const params = useLocalSearchParams<{
    recipientId?: string;
    person?: string;
  }>();

  const [firstName, setFirstName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [currentHour, setCurrentHour] = useState(
    () => new Date().getHours()
  );

  const isOtherPerson = params.person === "other";

  useEffect(() => {
    const updateTime = () => {
      setCurrentHour(new Date().getHours());
    };

    const timer = setInterval(updateTime, 30_000);

    const subscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          updateTime();
        }
      }
    );

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCurrentHour(new Date().getHours());
    }, [])
  );

  useEffect(() => {
    let active = true;

    const loadName = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setFirstName("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        let query = supabase
          .from("help_recipients")
          .select("first_name")
          .eq("account_id", authData.user.id);

        if (params.recipientId) {
          query = query.eq("id", params.recipientId);
        } else {
          query = query
            .eq(
              "registration_for",
              isOtherPerson ? "other" : "self"
            )
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Recipient missing");
        if (!active) return;

        setFirstName(data.first_name.trim());
      } catch {
        if (active) {
          setLoadFailed(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadName();

    return () => {
      active = false;
    };
  }, [
    params.recipientId,
    isOtherPerson,
    loadAttempt,
  ]);

  const greetingText =
    currentHour >= 5 && currentHour < 10
      ? "God morgon"
      : currentHour >= 17 && currentHour < 23
        ? "God kväll"
        : "Hej";

  const openBracelet = () => {
    router.navigate({
      pathname: "/recipient-bracelet",
      params: {
        recipientId: params.recipientId ?? "",
        person: isOtherPerson ? "other" : "self",
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.page}>
          <View style={styles.header}>
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />

                <Text style={styles.loadingText}>
                  Hämtar dina uppgifter…
                </Text>
              </View>
            ) : (
              <Text
                style={styles.greeting}
                accessibilityRole="header"
              >
                {isOtherPerson
                  ? firstName
                    ? "Översikt för "
                    : "Översikt"
                  : firstName
                    ? `${greetingText}, `
                    : `${greetingText}!`}

                {firstName !== "" && (
                  <Text style={styles.name}>
                    {firstName}
                    {isOtherPerson ? "" : "!"}
                  </Text>
                )}
              </Text>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Visa armbandet"
            onPress={openBracelet}
            style={({ pressed }) => [
              styles.braceletRow,
              pressed && styles.pressed,
            ]}
          >
            <Watch
              size={34}
              color="#15181C"
              strokeWidth={1.5}
            />

            <View style={styles.rowText}>
              <Text style={styles.braceletTitle}>
                {isOtherPerson
                  ? "Armbandet"
                  : "Ditt armband"}
              </Text>
            </View>

            <ChevronRight
              size={22}
              color="#777D85"
              strokeWidth={1.7}
            />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.helpSection}>
            <Text style={styles.sectionTitle}>
              Din hjälp
            </Text>

            {/* Exempelstatus tills hjälpförfrågningar kopplas in. */}
            <Text style={styles.helpText}>
              Ingen pågående förfrågan
            </Text>

            <Text style={styles.helpDescription}>
              {isOtherPerson
                ? "Personen använder knappen på sitt armband för att be om hjälp."
                : "Använd knappen på armbandet för att be om hjälp."}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.shelterSection}>
            <NearbyShelterCard
              forOtherPerson={isOtherPerson}
            />
          </View>

          {loadFailed && (
            <View
              style={styles.error}
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.errorText}>
                Kunde inte hämta dina uppgifter.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setLoadAttempt((current) => current + 1)
                }
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>
                  Försök igen
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 28,
  },

  page: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  header: {
    marginTop: 8,
    marginBottom: 28,
  },

  greeting: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "400",
    letterSpacing: -0.6,
    color: "#15181C",
  },

  name: {
    fontSize: 31,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.primary,
  },

  loading: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    color: "#6C727A",
  },

  braceletRow: {
    minHeight: 76,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  rowText: {
    flex: 1,
  },

  braceletTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "#15181C",
  },

  divider: {
    height: 1,
    backgroundColor: "#D5DFE7",
  },

  helpSection: {
    paddingVertical: 26,
  },

  sectionTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: "#15181C",
  },

  helpText: {
    marginTop: 16,
    fontSize: 18,
    lineHeight: 27,
    color: "#15181C",
  },

  helpDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 23,
    color: "#6C727A",
  },

  shelterSection: {
    paddingTop: 26,
  },

  error: {
    marginTop: 20,
    alignItems: "flex-start",
  },

  errorText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },

  retryButton: {
    minHeight: 44,
    paddingVertical: 12,
    justifyContent: "center",
  },

  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  pressed: {
    opacity: 0.65,
  },
});