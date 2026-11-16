import { ArrowLeft, Check, LockKeyhole } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FloatingFooterButton from "@/components/ui/FloatingFooterButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { needOptions } from "@/constants/help-options";
import CompletionRequestCard from "@/features/helper/components/CompletionRequestCard";
import RecipientContactCard, {
  type RecipientContact,
} from "@/features/helper/components/RecipientContactCard";
import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/utils/formatters";

import type { HelperHelpRequest as HelpRequest } from "@/types/help-request";

type RequestDetails = RecipientContact & {
  request_id: string;
  status: "pending" | "accepted";
  selected_needs: string[];
  additional_info: string | null;
  floor: number | null;
  has_elevator: boolean | null;
  created_at: string;
  accepted_at: string | null;
};

type Props = {
  request: HelpRequest;
  busy: boolean;
  cancelling: boolean;
  error: string;
  message: string;
  onBack: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onRequestCompletion: () => void;
  onRefresh: () => void;
};

export default function HelperRequestScreen({
  request,
  busy,
  cancelling,
  error,
  message,
  onBack,
  onAccept,
  onCancel,
  onRequestCompletion,
  onRefresh,
}: Props) {
  const [details, setDetails] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [footerHeight, setFooterHeight] = useState(0);

  const requestId = request.id;

  const reload = useReloadableFocusEffect(
    useCallback(() => {
      let active = true;
      const abort = new AbortController();

      // A status change must also refresh the newly available contact details.
      const acceptedRequest = request.status === "accepted";
      setLoading(true);
      setDetails(null);
      setLoadError("");

      const load = async () => {
        try {
          const { data, error: rpcError } = await supabase
            .rpc("get_request_recipient_details", {
              p_request_id: requestId,
            })
            .abortSignal(abort.signal)
            .maybeSingle();

          if (!active) return;
          if (rpcError) throw rpcError;

          if (!data) {
            setLoadError(
              "Förfrågan är inte längre tillgänglig, eller så saknar du behörighet att visa den.",
            );
            return;
          }

          const result = data as RequestDetails;

          if (
            result.request_id !== requestId ||
            !["pending", "accepted"].includes(result.status) ||
            (acceptedRequest && result.status !== "accepted")
          ) {
            throw new Error("Invalid request details");
          }

          setDetails(result);
        } catch {
          if (active) {
            setLoadError(
              "Kunde inte hämta uppgifterna. Kontrollera anslutningen och försök igen.",
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      void load();

      return () => {
        active = false;
        abort.abort();
      };
    }, [requestId, request.status]),
  );

  const accepted =
    request.status === "accepted" || details?.status === "accepted";

  const firstName =
    details?.first_name?.trim() || request.recipient_name.trim() || "En person";

  const selectedNeeds = needOptions.filter((option) =>
    details?.selected_needs?.includes(option.id),
  );

  const retry = () => {
    reload();
    onRefresh();
  };

  const confirmCancellation = () => {
    if (busy) return;
    Alert.alert(
      "Avbryt uppdraget?",
      "Hjälpförfrågan öppnas igen så att en annan volontär kan acceptera den.",
      [
        { text: "Behåll uppdraget", style: "cancel" },
        { text: "Avbryt uppdrag", style: "destructive", onPress: onCancel },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          accepted && { paddingBottom: Math.max(160, footerHeight + 38) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onBack}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text} />
            <Text style={styles.backText}>Hem</Text>
          </Pressable>

          <View
            style={[styles.heading, accepted && styles.headingAccepted]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.headingText}>
              <Text style={[styles.time, accepted && styles.timeAccepted]}>
                {accepted
                  ? `Accepterad kl. ${formatTime(details?.accepted_at || request.accepted_at)}`
                  : `Skickad kl. ${formatTime(request.created_at)}`}
              </Text>

              <Text
                accessibilityRole="header"
                style={[styles.title, accepted && styles.titleAccepted]}
              >
                {accepted ? "Du har accepterat" : `${firstName} behöver hjälp`}
              </Text>
            </View>

            {accepted && (
              <View style={styles.checkCircle}>
                <Check size={27} color={colors.surface} strokeWidth={2.5} />
              </View>
            )}
          </View>

          {accepted && details?.status === "accepted" && (
            <RecipientContactCard key={request.id} contact={details} />
          )}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : null}

          {loadError || error ? (
            <View style={styles.card}>
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {loadError || error}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={styles.textButton}
              >
                <Text style={styles.link}>Försök igen</Text>
              </Pressable>
            </View>
          ) : null}

          {details && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stöd som behövs</Text>

              {selectedNeeds.length ? (
                <View style={styles.chips}>
                  {selectedNeeds.map(({ id, title, icon: Icon }) => (
                    <View key={id} style={styles.chip}>
                      <Icon size={16} color={colors.primary} />
                      <Text style={styles.chipText}>{title}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.description}>
                  Inga hjälpbehov registrerade.
                </Text>
              )}

              {(details.floor !== null || details.has_elevator !== null) && (
                <View style={styles.housing}>
                  <Text style={styles.label}>Boende</Text>

                  <Text style={styles.housingText}>
                    {[
                      details.floor !== null
                        ? details.floor === 0
                          ? "Entréplan"
                          : `Våning ${details.floor}`
                        : "",
                      details.has_elevator === true
                        ? "Hiss finns"
                        : details.has_elevator === false
                          ? "Ingen hiss"
                          : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              )}

              {accepted && details.additional_info?.trim() ? (
                <View style={styles.note}>
                  <Text style={styles.label}>Övrig information</Text>
                  <Text style={styles.noteText}>
                    {details.additional_info.trim()}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {!accepted && (
            <View style={styles.privacyRow}>
              <LockKeyhole size={17} color={colors.textSecondary} />

              <Text style={styles.privacyText}>
                Fullständigt namn, telefonnummer och adress visas när du har
                accepterat.
              </Text>
            </View>
          )}

          {accepted && request.completion_supported && (
            <CompletionRequestCard
              requested={!!request.completion_requested_at}
              busy={busy}
              onRequest={onRequestCompletion}
            />
          )}

          {message ? (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {accepted ? (
        <FloatingFooterButton
          title={cancelling ? "Avbryter…" : "Avbryt uppdrag"}
          tone="danger"
          onHeightChange={setFooterHeight}
          disabled={busy}
          onPress={confirmCancellation}
          secondaryAction={{ title: "Till översikten", onPress: onBack }}
        />
      ) : (
        <View style={styles.bottom}>
          <View style={styles.bottomContent}>
            <PrimaryButton
              title={busy ? "Accepterar…" : "Acceptera förfrågan"}
              disabled={
                busy ||
                loading ||
                !!loadError ||
                !!error ||
                !details ||
                details.status !== "pending"
              }
              onPress={onAccept}
            />

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onBack}
              style={styles.laterButton}
            >
              <Text style={styles.laterText}>Inte just nu</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 24,
  },
  page: { width: "100%", maxWidth: 440, alignSelf: "center" },
  backButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    alignSelf: "flex-start",
    paddingRight: 16,
  },
  backText: { fontSize: 16, color: colors.text },
  heading: {
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headingAccepted: {
    marginTop: 16,
    marginBottom: 18,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#197849",
  },
  headingText: { flex: 1 },
  time: { fontSize: 13, lineHeight: 20, color: colors.primary },
  timeAccepted: { color: "#E1F3E8" },
  title: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text,
  },
  titleAccepted: { fontSize: 27, lineHeight: 34, color: colors.surface },
  checkCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  card: {
    padding: 22,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.text,
  },
  loading: { marginVertical: 24 },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  chips: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: colors.primary,
  },
  housing: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  housingText: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
  },
  note: { marginTop: 18 },
  noteText: { marginTop: 5, fontSize: 15, lineHeight: 24, color: colors.text },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  message: { marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.error },
  textButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  bottom: {
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.background,
  },
  bottomContent: { width: "100%", maxWidth: 440, alignSelf: "center" },
  laterButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  laterText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
});
