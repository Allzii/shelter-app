import {
  ArrowLeft,
  Check,
  IdCard,
  KeyRound,
  Pill,
  Shirt,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import NearbyShelterCard from "@/components/maps/NearbyShelterCard";
import FloatingFooterButton from "@/components/ui/FloatingFooterButton";
import { colors } from "@/constants/colors";
import { needOptions } from "@/constants/help-options";
import CompletionConfirmationCard from "@/features/recipient/components/CompletionConfirmationCard";
import HelperContactCard from "@/features/recipient/components/HelperContactCard";
import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/utils/formatters";

import type { RecipientHelpRequest as HelpRequest } from "@/types/help-request";

type Needs = {
  selected_needs: string[];
  additional_info: string | null;
  floor: number | null;
  has_elevator: boolean | null;
};

type Contact = {
  first_name: string;
  last_name: string;
  relation: string;
  other_relation: string;
};

type Props = {
  request: HelpRequest;
  recipientId: string;
  forOtherPerson: boolean;
  busy: boolean;
  error: string;
  message: string;
  onBack: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRespondCompletion: (confirmed: boolean) => void;
  addressNotice?: ReactNode;
};

const waitingTips: {
  title: string;
  icon: LucideIcon;
}[] = [
  { title: "Ha skor och ytterkläder redo", icon: Shirt },
  { title: "Ta fram mediciner du behöver ta med", icon: Pill },
  { title: "Ha legitimation och telefon redo", icon: IdCard },
  { title: "Ha nycklarna till hands", icon: KeyRound },
];

export default function HelpRequestScreen({
  request,
  recipientId,
  forOtherPerson,
  busy,
  error,
  message,
  onBack,
  onCancel,
  onRetry,
  onRespondCompletion,
  addressNotice,
}: Props) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const [arrivalAnimation] = useState(() => new Animated.Value(1));
  const [footerHeight, setFooterHeight] = useState(0);

  const previousRequest = useRef<{
    id: string;
    status: HelpRequest["status"];
    completionRequestedAt?: string | null;
  } | null>(null);

  const requestId = request.id;
  const requestStatus = request.status;
  const completionRequestedAt = request.completion_requested_at;

  useLayoutEffect(() => {
    const previous = previousRequest.current;

    previousRequest.current = {
      id: requestId,
      status: requestStatus,
      completionRequestedAt,
    };

    const justAccepted =
      previous?.id === requestId &&
      previous?.status === "pending" &&
      requestStatus === "accepted";

    if (
      completionRequestedAt &&
      previous?.completionRequestedAt !== completionRequestedAt
    ) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }

    arrivalAnimation.stopAnimation();

    if (!justAccepted) {
      arrivalAnimation.setValue(1);
      return;
    }

    scrollRef.current?.scrollTo({ y: 0, animated: false });
    arrivalAnimation.setValue(0);

    const animation = Animated.timing(arrivalAnimation, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [requestId, requestStatus, arrivalAnimation, completionRequestedAt]);

  const accepted = request.status === "accepted";
  const helperName = request.helper_name?.trim() || "En volontär";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.requestContent,
          { paddingBottom: Math.max(100, footerHeight + 38) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.page,
            {
              opacity: arrivalAnimation,
              transform: [
                {
                  translateY: arrivalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tillbaka till hem"
            onPress={onBack}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text} />
            <Text style={styles.backText}>Hem</Text>
          </Pressable>

          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.requestHeading,
              accepted && styles.requestHeadingAccepted,
            ]}
          >
            <View style={styles.requestHeadingRow}>
              <View style={styles.requestHeadingText}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      accepted && styles.statusDotAccepted,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      accepted && styles.statusTextAccepted,
                    ]}
                  >
                    {accepted
                      ? `Accepterad kl. ${formatTime(request.accepted_at)}`
                      : `Skickad kl. ${formatTime(request.created_at)}`}
                  </Text>
                </View>

                <Text
                  accessibilityRole="header"
                  style={[
                    styles.requestHeadingTitle,
                    accepted && styles.requestTitleAccepted,
                  ]}
                >
                  {accepted
                    ? "Du har fått en volontär!"
                    : "Vi söker en volontär"}
                </Text>
              </View>

              {accepted && (
                <View style={styles.acceptedIcon}>
                  <Check size={28} color={colors.surface} strokeWidth={2.5} />
                </View>
              )}
            </View>

            {!accepted && (
              <Text style={styles.subtitle}>
                Här ser du när en volontär har svarat på din förfrågan.
              </Text>
            )}
          </View>

          {accepted && request.completion_requested_at && (
            <CompletionConfirmationCard
              forOtherPerson={forOtherPerson}
              busy={busy || !!error}
              onRespond={onRespondCompletion}
            />
          )}

          {accepted && (
            <HelperContactCard
              key={request.id}
              requestId={request.id}
              fallbackName={helperName}
            />
          )}

          <View style={styles.timelineCard}>
            <TimelineStep
              title="Förfrågan skickad"
              description={formatTime(request.created_at)}
              completed
            />
            <TimelineStep
              title="Söker volontär"
              description={accepted ? undefined : "Väntar på svar"}
              completed={accepted}
              active={!accepted}
            />
            <TimelineStep
              title="Volontär har accepterat"
              description={
                accepted ? formatTime(request.accepted_at) : undefined
              }
              completed={accepted}
              last
            />
          </View>

          <View style={styles.infoCard}>
            <NearbyShelterCard forOtherPerson={forOtherPerson} />
          </View>

          <RequestInformation key={recipientId} recipientId={recipientId} />

          {error ? (
            <View accessibilityLiveRegion="polite">
              <Text style={styles.message}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={styles.textButton}
              >
                <Text style={styles.link}>Försök igen</Text>
              </Pressable>
            </View>
          ) : null}

          {addressNotice}

          {message ? (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
          ) : null}
        </Animated.View>
      </ScrollView>

      <FloatingFooterButton
        tone="danger"
        onHeightChange={setFooterHeight}
        title="Avbryt förfrågan"
        disabled={busy || !!error}
        onPress={onCancel}
      />
    </SafeAreaView>
  );
}

function RequestInformation({ recipientId }: { recipientId: string }) {
  const [info, setInfo] = useState<{
    needs: Needs | null;
    contact: Contact | null;
  } | null>(null);

  const [message, setMessage] = useState("");

  const reload = useReloadableFocusEffect(
    useCallback(() => {
      let active = true;
      const abort = new AbortController();

      const load = async () => {
        setMessage("");

        try {
          const [needsResult, contactResult] = await Promise.all([
            supabase
              .from("help_needs")
              .select("selected_needs, additional_info, floor, has_elevator")
              .eq("recipient_id", recipientId)
              .abortSignal(abort.signal)
              .maybeSingle(),

            supabase
              .from("emergency_contacts")
              .select("first_name, last_name, relation, other_relation")
              .eq("recipient_id", recipientId)
              .abortSignal(abort.signal)
              .maybeSingle(),
          ]);

          if (!active) return;

          if (needsResult.error || contactResult.error) {
            throw new Error("Information unavailable");
          }

          setInfo({
            needs: needsResult.data as Needs | null,
            contact: contactResult.data as Contact | null,
          });
        } catch {
          if (active) {
            setMessage("Kunde inte uppdatera hjälpbehov och kontaktperson.");
          }
        }
      };

      void load();

      return () => {
        active = false;
        abort.abort();
      };
    }, [recipientId]),
  );

  const contactName = info?.contact
    ? [info.contact.first_name, info.contact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const relation =
    info?.contact?.relation === "Annat"
      ? info.contact.other_relation
      : info?.contact?.relation;

  const needs = info?.needs;
  const selectedNeeds = needOptions.filter((option) =>
    needs?.selected_needs?.includes(option.id),
  );

  return (
    <>
      <View style={styles.infoCard}>
        <Text style={styles.cardHeading}>Registrerat hjälpbehov</Text>

        {message ? (
          <>
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => reload()}
              style={styles.textButton}
            >
              <Text style={styles.link}>Försök igen</Text>
            </Pressable>
          </>
        ) : !info ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.infoLoading}
          />
        ) : null}

        {info && (
          <>
            {selectedNeeds.length ? (
              <View style={styles.chips}>
                {selectedNeeds.map(({ id, title, icon: Icon }) => (
                  <View key={id} style={styles.chip}>
                    <Icon size={15} color={colors.primary} />
                    <Text style={styles.chipText}>{title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.detailText}>
                Inga hjälpbehov registrerade.
              </Text>
            )}

            {needs && (needs.floor !== null || needs.has_elevator !== null) && (
              <Text style={styles.housingText}>
                {[
                  needs.floor !== null
                    ? needs.floor === 0
                      ? "Entréplan"
                      : `Våning ${needs.floor}`
                    : "",
                  needs.has_elevator === true
                    ? "Hiss finns"
                    : needs.has_elevator === false
                      ? "Ingen hiss"
                      : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}

            {needs?.additional_info?.trim() ? (
              <View style={styles.note}>
                <Text style={styles.noteText}>
                  {needs.additional_info.trim()}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {contactName ? (
        <View style={styles.contactCard}>
          <Users size={21} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.smallText}>Kontaktperson</Text>
            <Text style={styles.contactName}>
              {contactName}
              {relation ? ` (${relation.toLocaleLowerCase("sv-SE")})` : ""}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.waitingTitle}>Medan du väntar</Text>

      <View style={styles.waitingCard}>
        {waitingTips.map(({ title, icon: Icon }, index) => (
          <View
            key={title}
            style={[
              styles.waitingRow,
              index !== waitingTips.length - 1 && styles.waitingDivider,
            ]}
          >
            <View style={styles.infoIcon}>
              <Icon size={20} color={colors.primary} strokeWidth={1.7} />
            </View>
            <Text style={styles.waitingText}>{title}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function TimelineStep({
  title,
  description,
  completed = false,
  active = false,
  last = false,
}: {
  title: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepTrack}>
        <View
          style={[
            styles.stepCircle,
            completed && styles.stepComplete,
            active && styles.stepActive,
          ]}
        >
          {completed ? (
            <Check size={16} color={colors.surface} strokeWidth={2.5} />
          ) : active ? (
            <View style={styles.stepDot} />
          ) : null}
        </View>

        {!last && (
          <View
            style={[styles.stepLine, completed && styles.stepLineComplete]}
          />
        )}
      </View>

      <View style={[styles.stepText, !last && styles.stepSpacing]}>
        <Text style={[styles.stepTitle, !completed && !active && styles.muted]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.smallText}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  requestContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 100,
  },
  page: { flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
    alignSelf: "flex-start",
    paddingRight: 16,
  },
  backText: { fontSize: 16, color: colors.text },
  requestHeading: { paddingTop: 12, paddingBottom: 20 },
  requestHeadingAccepted: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderRadius: 22,
    backgroundColor: "#197849",
  },
  requestHeadingRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  requestHeadingText: { flex: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  statusDotAccepted: { backgroundColor: colors.surface },
  statusText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.primary,
  },
  statusTextAccepted: { color: "#E1F3E8" },
  requestHeadingTitle: {
    marginTop: 16,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.text,
  },
  requestTitleAccepted: { color: colors.surface, fontSize: 30, lineHeight: 37 },
  acceptedIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  timelineCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  message: { marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.error },
  textButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  cardHeading: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    color: colors.text,
  },
  infoLoading: { alignSelf: "flex-start", marginTop: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  detailText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  housingText: {
    marginTop: 13,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteText: { fontSize: 14, lineHeight: 23, color: colors.text },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: "#E3EDF4",
  },
  infoText: { flex: 1 },
  smallText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  contactName: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },
  waitingTitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  waitingCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginBottom: 12,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 17,
    minHeight: 70,
  },
  waitingDivider: { borderBottomWidth: 1, borderBottomColor: "#E8EFF4" },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  waitingText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: colors.text,
  },
  stepRow: { flexDirection: "row", gap: 14 },
  stepTrack: { width: 28, alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepActive: {
    borderWidth: 4,
    borderColor: colors.primaryBackground,
    backgroundColor: colors.primary,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 22,
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  stepLineComplete: { backgroundColor: "#AAC6DB" },
  stepText: { flex: 1, paddingTop: 2 },
  stepSpacing: { paddingBottom: 26 },
  stepTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },
  muted: {
    color: colors.textSecondary,
  },
});
