import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronRight, Watch } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
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
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import AddressDistanceNotice from "@/features/recipient/components/AddressDistanceNotice";
import HelpRequestScreen from "@/features/recipient/components/HelpRequestScreen";
import useRecipientAddressLocation from "@/hooks/useRecipientAddressLocation";
import { supabase } from "@/lib/supabase";
import { getHelpRequestCompletion } from "@/services/help-request-completion";

import type { RecipientHelpRequest as HelpRequest } from "@/types/help-request";

type Recipient = {
  id: string;
  account_id: string;
  first_name: string;
  street: string;
  postal_code: string;
  city: string;
};

const REQUEST_COLUMNS =
  "id, recipient_id, status, helper_name, created_at, accepted_at";

export default function RecipientHomeScreen() {
  const params = useLocalSearchParams<{
    recipientId?: string;
    person?: string;
  }>();

  const other = params.person === "other";

  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [openRequest, setOpenRequest] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [hour, setHour] = useState(() => new Date().getHours());

  const fetching = useRef(false);
  const actionLock = useRef(false);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const seenCompletion = useRef<string | null>(null);
  const addressLocation = useRecipientAddressLocation(recipient);

  const refresh = useCallback(async () => {
    if (
      fetching.current ||
      actionLock.current ||
      AppState.currentState === "background"
    ) {
      return;
    }

    fetching.current = true;

    const current = ++sequence.current;
    const abort = new AbortController();

    controller.current = abort;
    setHour(new Date().getHours());

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (current !== sequence.current) return;

      if (authError || !auth.user) {
        throw new Error("Session unavailable");
      }

      let query = supabase
        .from("help_recipients")
        .select("id, account_id, first_name, street, postal_code, city")
        .eq("account_id", auth.user.id);

      if (params.recipientId) {
        query = query.eq("id", params.recipientId);
      } else {
        query = query
          .eq("registration_for", other ? "other" : "self")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1);
      }

      const { data: person, error: profileError } = await query
        .abortSignal(abort.signal)
        .maybeSingle();

      if (current !== sequence.current) return;

      if (profileError || !person) {
        throw new Error("Recipient missing");
      }

      const { data: request, error: requestError } = await supabase
        .from("help_requests")
        .select(REQUEST_COLUMNS)
        .eq("recipient_id", person.id)
        .eq("created_by", auth.user.id)
        .in("status", ["pending", "accepted"])
        .abortSignal(abort.signal)
        .maybeSingle();

      if (current !== sequence.current) return;
      if (requestError) throw requestError;

      let activeRequest = request as HelpRequest | null;
      if (activeRequest?.status === "accepted") {
        const completion = await getHelpRequestCompletion(
          activeRequest.id,
          abort.signal,
        );
        if (current !== sequence.current) return;
        if (completion?.status === "completed") {
          activeRequest = null;
        } else if (completion?.status === "accepted") {
          activeRequest = {
            ...activeRequest,
            completion_supported: true,
            completion_requested_at: completion.completion_requested_at,
          };
        }
      }
      const completionKey = activeRequest?.completion_requested_at
        ? `${activeRequest.id}:${activeRequest.completion_requested_at}`
        : null;
      if (
        !activeRequest ||
        activeRequest.status !== "accepted" ||
        activeRequest.completion_supported
      ) {
        if (completionKey && seenCompletion.current !== completionKey)
          setOpenRequest(true);
        seenCompletion.current = completionKey;
      }
      setRecipient(person as Recipient);
      setHelpRequest((previous) =>
        activeRequest &&
        !activeRequest.completion_supported &&
        previous?.id === activeRequest.id &&
        previous.status === "accepted" &&
        activeRequest.status === "accepted" &&
        previous.accepted_at === activeRequest.accepted_at
          ? {
              ...activeRequest,
              completion_supported: previous.completion_supported,
              completion_requested_at: previous.completion_requested_at,
            }
          : activeRequest,
      );
      setError("");
    } catch {
      if (current === sequence.current) {
        setError(
          "Kunde inte uppdatera hjälpförfrågan. Kontrollera anslutningen och försök igen.",
        );
      }
    } finally {
      fetching.current = false;

      if (current === sequence.current) {
        setLoading(false);
      }
    }
  }, [params.recipientId, other]);

  useFocusEffect(
    useCallback(() => {
      void refresh();

      const timer = setInterval(() => void refresh(), 3000);

      const app = AppState.addEventListener("change", (state) => {
        if (state === "active") void refresh();
      });

      return () => {
        clearInterval(timer);
        app.remove();
        ++sequence.current;
        controller.current?.abort();
      };
    }, [refresh]),
  );

  const changeRequest = async (cancel: boolean) => {
    if (actionLock.current || loading || error || !recipient) return;
    if (cancel ? !helpRequest : !!helpRequest) return;

    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();

    setBusy(true);
    setActionMessage("");

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (authError || !auth.user || auth.user.id !== recipient.account_id) {
        throw new Error("Kontrollera din inloggning och försök igen.");
      }

      if (cancel && helpRequest) {
        const { error: cancelError } = await supabase
          .from("help_requests")
          .update({ status: "cancelled" })
          .eq("id", helpRequest.id)
          .eq("created_by", auth.user.id)
          .in("status", ["pending", "accepted"])
          .select("id")
          .single();

        if (cancelError) {
          throw new Error("Kunde inte avbryta förfrågan. Försök igen.");
        }

        setHelpRequest(null);
      } else {
        const { data: saved, error: createError } = await supabase
          .from("help_requests")
          .insert({ recipient_id: recipient.id })
          .select(REQUEST_COLUMNS)
          .single();

        if (createError?.code === "23505") {
          throw new Error(
            "Det finns redan en aktiv förfrågan. Statusen uppdateras strax.",
          );
        }

        if (createError || !saved) {
          throw new Error("Kunde inte skicka förfrågan. Försök igen.");
        }

        setHelpRequest(saved as HelpRequest);
        setOpenRequest(true);
      }
    } catch (failure) {
      setActionMessage(
        failure instanceof Error
          ? failure.message
          : "Något gick fel. Försök igen.",
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
      void refresh();
    }
  };

  const respondToCompletion = async (confirmed: boolean) => {
    if (
      actionLock.current ||
      !recipient ||
      helpRequest?.status !== "accepted" ||
      !helpRequest.completion_requested_at
    )
      return;
    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();
    setBusy(true);
    setActionMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== recipient.account_id)
        throw new Error("Session unavailable");
      const { data: completedAt, error: completionError } = await supabase.rpc(
        "respond_help_completion",
        {
          p_request_id: helpRequest.id,
          p_requested_at: helpRequest.completion_requested_at,
          p_confirm: confirmed,
        },
      );
      if (completionError || (confirmed && typeof completedAt !== "string"))
        throw completionError ?? new Error("Confirmation unavailable");
      if (confirmed) {
        setHelpRequest(null);
        setOpenRequest(false);
        setActionMessage("Tack för bekräftelsen. Förfrågan är slutförd.");
      } else {
        setHelpRequest((previous) =>
          previous ? { ...previous, completion_requested_at: null } : null,
        );
        setActionMessage("Uppdraget ligger kvar som pågående.");
      }
    } catch {
      setActionMessage(
        "Svaret kunde inte sparas. Förfrågan kan ha ändrats. Uppdatera och försök igen.",
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
      void refresh();
    }
  };

  const firstName = recipient?.first_name.trim();

  const greeting =
    hour >= 5 && hour < 10
      ? "God morgon"
      : hour >= 17 && hour < 23
        ? "God kväll"
        : "Hej";

  const accepted = helpRequest?.status === "accepted";
  const helperName = helpRequest?.helper_name?.trim() || "En volontär";
  const addressNotice = (
    <AddressDistanceNotice
      status={addressLocation.status}
      message={addressLocation.message}
      forOtherPerson={other}
      onEnable={() => void addressLocation.enable()}
      onRetry={addressLocation.reload}
    />
  );

  if (helpRequest && openRequest) {
    return (
      <HelpRequestScreen
        request={helpRequest}
        recipientId={recipient?.id || helpRequest.recipient_id}
        forOtherPerson={other}
        busy={busy || loading}
        error={error}
        message={actionMessage}
        onBack={() => setOpenRequest(false)}
        onCancel={() => void changeRequest(true)}
        onRetry={() => void refresh()}
        onRespondCompletion={(confirmed) => void respondToCompletion(confirmed)}
        addressNotice={addressNotice}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <Text style={styles.greeting} accessibilityRole="header">
            {other
              ? firstName
                ? "Översikt för "
                : "Översikt"
              : firstName
                ? `${greeting}, `
                : `${greeting}!`}

            {firstName ? (
              <Text style={styles.name}>
                {firstName}
                {other ? "" : "!"}
              </Text>
            ) : null}
          </Text>

          {addressNotice}

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.navigate({
                pathname: "/recipient-bracelet",
                params: {
                  recipientId: recipient?.id || params.recipientId || "",
                  person: other ? "other" : "self",
                },
              })
            }
            style={({ pressed }) => [
              styles.braceletRow,
              pressed && styles.pressed,
            ]}
          >
            <Watch size={34} color={colors.text} strokeWidth={1.5} />
            <Text style={styles.braceletTitle}>
              {other ? "Armbandet" : "Ditt armband"}
            </Text>
            <ChevronRight size={22} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.helpSection}>
            <Text style={styles.sectionTitle}>Din hjälp</Text>

            {loading ? (
              <ActivityIndicator
                style={styles.loading}
                color={colors.primary}
              />
            ) : error ? (
              <>
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.textButton}
                  onPress={() => void refresh()}
                >
                  <Text style={styles.link}>Försök igen</Text>
                </Pressable>
              </>
            ) : helpRequest ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpenRequest(true)}
                style={({ pressed }) => [
                  styles.summaryCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryTitle}>
                    {helpRequest.completion_requested_at
                      ? "Bekräfta om hjälpen är klar"
                      : accepted
                        ? `${helperName} har accepterat`
                        : "Vi söker en volontär"}
                  </Text>
                  <Text style={styles.smallText}>Visa din förfrågan</Text>
                </View>
                <ChevronRight size={22} color={colors.primary} />
              </Pressable>
            ) : (
              <>
                <Text style={styles.helpText}>Ingen pågående förfrågan</Text>
                <Text style={styles.description}>
                  {other
                    ? "Personen använder knappen på sitt armband för att be om hjälp."
                    : "Använd knappen på armbandet för att be om hjälp."}
                </Text>

                {__DEV__ && (
                  <View style={styles.sendButton}>
                    <PrimaryButton
                      title={busy ? "Skickar…" : "Skicka förfrågan"}
                      disabled={busy || !recipient}
                      onPress={() => void changeRequest(false)}
                    />
                  </View>
                )}
              </>
            )}

            {actionMessage ? (
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {actionMessage}
              </Text>
            ) : null}
          </View>

          <View style={styles.spacer} />
          <View style={styles.divider} />

          <View style={styles.shelterSection}>
            <NearbyShelterCard forOtherPerson={other} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 28,
  },
  page: { flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center" },
  greeting: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "400",
    letterSpacing: -0.6,
    color: colors.text,
  },
  name: { fontSize: 31, fontWeight: "700", color: colors.primary },
  braceletRow: {
    minHeight: 76,
    marginTop: 28,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  pressed: { opacity: 0.65 },
  braceletTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
  },
  divider: { height: 1, backgroundColor: colors.border },
  helpSection: { paddingVertical: 26 },
  sectionTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  loading: { marginTop: 20, alignSelf: "flex-start" },
  message: { marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.error },
  textButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  summaryCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryInfo: { flex: 1 },
  summaryTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.text,
  },
  smallText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  helpText: { marginTop: 16, fontSize: 18, lineHeight: 27, color: colors.text },
  description: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  sendButton: { marginTop: 20 },
  spacer: { flexGrow: 1 },
  shelterSection: { paddingTop: 26 },
});
