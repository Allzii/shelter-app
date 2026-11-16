import { BlurTargetView, BlurView } from "expo-blur";
import { router, useFocusEffect } from "expo-router";
import { Bell, BellOff } from "lucide-react-native";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import NearbyShelterCard from "@/components/maps/NearbyShelterCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import HelperRequestCard from "@/features/helper/components/HelperRequestCard";
import HelperRequestScreen from "@/features/helper/components/HelperRequestScreen";
import useRequestDistances from "@/hooks/useRequestDistances";
import { supabase } from "@/lib/supabase";
import { getHelpRequestCompletion } from "@/services/help-request-completion";

import type { CertificateReview as Certificate } from "@/types/certificate";
import type { HelperHelpRequest as HelpRequest } from "@/types/help-request";

type Profile = {
  account_id: string;
  first_name: string;
  is_available: boolean;
};

type HomeData = {
  profile: Profile;
  certificate: Certificate | null;
  requests: HelpRequest[];
  accepted: HelpRequest | null;
};

const REQUEST_COLUMNS = "id, recipient_name, status, created_at, accepted_at";

export default function HelperOverviewScreen({
  showAll = false,
}: {
  showAll?: boolean;
}) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [releasingRequest, setReleasingRequest] = useState(false);
  const [requestingCompletion, setRequestingCompletion] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityOverride, setAvailabilityOverride] = useState<
    boolean | null
  >(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetching = useRef(false);
  const actionLock = useRef(false);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const lastAcceptedId = useRef<string | null>(null);
  const blurTarget = useRef<ComponentRef<typeof BlurTargetView> | null>(null);
  const {
    distances,
    distanceStatus,
    reloadDistances,
    locationStatus,
    enableLocation,
  } = useRequestDistances(
    data?.certificate?.status === "approved" &&
      data.profile.is_available &&
      !data.accepted &&
      data.requests.length > 0
      ? data.profile.account_id
      : undefined,
    data?.requests.map((request) => request.id) ?? [],
  );

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

      const accountId = auth.user.id;

      const [profileResult, certificateResult] = await Promise.all([
        supabase
          .from("helper_profiles")
          .select("account_id, first_name, is_available")
          .eq("account_id", accountId)
          .abortSignal(abort.signal)
          .maybeSingle(),

        supabase
          .from("helper_certificates")
          .select("status, review_note")
          .eq("account_id", accountId)
          .abortSignal(abort.signal)
          .maybeSingle(),
      ]);

      if (current !== sequence.current) return;

      if (profileResult.error || !profileResult.data) {
        throw new Error("Profile unavailable");
      }

      if (certificateResult.error) throw certificateResult.error;

      const certificate = certificateResult.data as Certificate | null;

      if (
        certificate &&
        !["pending", "approved", "needs_changes"].includes(certificate.status)
      ) {
        throw new Error("Unknown certificate status");
      }

      let requests: HelpRequest[] = [];
      let accepted: HelpRequest | null = null;

      if (certificate?.status === "approved") {
        const [pendingResult, acceptedResult] = await Promise.all([
          profileResult.data.is_available
            ? supabase
                .from("help_requests")
                .select(REQUEST_COLUMNS)
                .eq("status", "pending")
                .neq("created_by", accountId)
                .order("created_at", { ascending: true })
                .limit(20)
                .abortSignal(abort.signal)
            : Promise.resolve({ data: [], error: null }),

          supabase
            .from("help_requests")
            .select(REQUEST_COLUMNS)
            .eq("status", "accepted")
            .eq("helper_account_id", accountId)
            .abortSignal(abort.signal)
            .maybeSingle(),
        ]);

        if (current !== sequence.current) return;
        if (pendingResult.error) throw pendingResult.error;
        if (acceptedResult.error) throw acceptedResult.error;

        requests = (pendingResult.data ?? []) as HelpRequest[];
        accepted = acceptedResult.data as HelpRequest | null;
      }

      const completionId = accepted?.id ?? lastAcceptedId.current;
      if (completionId) {
        const completion = await getHelpRequestCompletion(
          completionId,
          abort.signal,
        );
        if (current !== sequence.current) return;
        if (accepted && completion?.status === "accepted") {
          accepted = {
            ...accepted,
            completion_supported: true,
            completion_requested_at: completion.completion_requested_at,
          };
        } else if (completion?.status === "completed") {
          accepted = null;
          setSelectedId(null);
          setActionMessage("Hjälpen har bekräftats. Uppdraget är slutfört.");
        } else if (completion && accepted) {
          accepted = null;
        }
      }
      lastAcceptedId.current = accepted?.id ?? null;

      setData((previous) => ({
        profile: profileResult.data as Profile,
        certificate,
        requests,
        accepted:
          accepted &&
          !accepted.completion_supported &&
          previous?.accepted?.id === accepted.id &&
          previous.accepted.accepted_at === accepted.accepted_at
            ? {
                ...accepted,
                completion_supported: previous.accepted.completion_supported,
                completion_requested_at:
                  previous.accepted.completion_requested_at,
              }
            : accepted,
      }));

      setError("");
    } catch {
      if (current === sequence.current) {
        setError(
          "Kunde inte uppdatera dina uppgifter och förfrågningar. Kontrollera anslutningen och försök igen.",
        );
      }
    } finally {
      fetching.current = false;

      if (current === sequence.current) {
        setLoading(false);
      }
    }
  }, []);

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

  const acceptRequest = async (requestId: string) => {
    if (
      actionLock.current ||
      error ||
      !data ||
      data.certificate?.status !== "approved" ||
      !data.profile.is_available ||
      data.accepted
    ) {
      return;
    }

    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();

    setAcceptingId(requestId);
    setActionMessage("");

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (authError || !auth.user || auth.user.id !== data.profile.account_id) {
        throw new Error("Kontrollera din inloggning och försök igen.");
      }

      const { data: saved, error: acceptError } = await supabase
        .from("help_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("status", "pending")
        .select(REQUEST_COLUMNS)
        .single();

      if (acceptError?.message === "Helper is not available") {
        throw new Error(
          "Du är pausad. Aktivera tillgänglighet för att acceptera nya förfrågningar.",
        );
      }

      if (acceptError?.code === "PGRST116") {
        throw new Error(
          "Förfrågan är inte längre tillgänglig. Listan uppdateras strax.",
        );
      }

      if (acceptError?.code === "23505") {
        throw new Error(
          "Du har redan en accepterad förfrågan. Statusen uppdateras strax.",
        );
      }

      if (acceptError || !saved) {
        throw new Error("Kunde inte acceptera förfrågan. Försök igen.");
      }

      setData((previous) => {
        if (!previous) return null;

        return {
          ...previous,
          accepted: saved as HelpRequest,
          requests: previous.requests.filter((item) => item.id !== requestId),
        };
      });
    } catch (failure) {
      setActionMessage(
        failure instanceof Error
          ? failure.message
          : "Något gick fel. Försök igen.",
      );
    } finally {
      actionLock.current = false;
      setAcceptingId(null);
      void refresh();
    }
  };

  const releaseRequest = async (requestId: string) => {
    if (actionLock.current || !data || data.accepted?.id !== requestId) return;

    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();
    setReleasingRequest(true);
    setActionMessage("");

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user || auth.user.id !== data.profile.account_id) {
        throw new Error("Session unavailable");
      }
      const { error: releaseError } = await supabase.rpc(
        "release_help_request",
        {
          p_request_id: requestId,
        },
      );
      if (releaseError) throw releaseError;

      setData((previous) =>
        previous ? { ...previous, accepted: null } : null,
      );
      setSelectedId(null);
      setActionMessage(
        "Uppdraget är avbrutet. Förfrågan är öppen för andra volontärer.",
      );
    } catch {
      setActionMessage(
        "Uppdraget kunde inte avbrytas. Försök igen. Det ligger kvar hos dig tills avbrytandet har lyckats.",
      );
    } finally {
      actionLock.current = false;
      setReleasingRequest(false);
      void refresh();
    }
  };

  const requestCompletion = async (requestId: string) => {
    if (
      actionLock.current ||
      !data ||
      data.accepted?.id !== requestId ||
      data.accepted.completion_requested_at
    )
      return;
    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();
    setRequestingCompletion(true);
    setActionMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== data.profile.account_id)
        throw new Error("Session unavailable");
      const { data: requestedAt, error: completionError } = await supabase.rpc(
        "request_help_completion",
        { p_request_id: requestId },
      );
      if (completionError || typeof requestedAt !== "string")
        throw completionError ?? new Error("Completion request unavailable");
      setData((previous) =>
        previous?.accepted?.id === requestId
          ? {
              ...previous,
              accepted: {
                ...previous.accepted,
                completion_supported: true,
                completion_requested_at: requestedAt,
              },
            }
          : previous,
      );
    } catch {
      setActionMessage(
        "Kunde inte be om bekräftelse. Försök igen. Uppdraget ligger kvar som pågående.",
      );
    } finally {
      actionLock.current = false;
      setRequestingCompletion(false);
      void refresh();
    }
  };

  const setAvailability = async (value: boolean) => {
    if (
      actionLock.current ||
      !data ||
      error ||
      data.certificate?.status !== "approved"
    ) {
      return;
    }

    actionLock.current = true;
    ++sequence.current;
    controller.current?.abort();

    setSavingAvailability(true);
    setAvailabilityOverride(value);
    setSelectedId(null);
    setActionMessage("");

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (authError || !auth.user || auth.user.id !== data.profile.account_id) {
        throw new Error("Session unavailable");
      }

      const accountId = auth.user.id;

      const { data: saved, error: saveError } = await supabase
        .from("helper_profiles")
        .update({ is_available: value })
        .eq("account_id", accountId)
        .select("is_available")
        .single();

      if (saveError || !saved || typeof saved.is_available !== "boolean") {
        throw new Error("Availability unavailable");
      }

      setData((previous) => {
        if (!previous) return null;
        if (previous.profile.account_id !== accountId) return previous;

        return {
          ...previous,
          profile: {
            ...previous.profile,
            is_available: saved.is_available,
          },
          requests: saved.is_available ? previous.requests : [],
        };
      });
    } catch {
      setActionMessage("Kunde inte ändra din tillgänglighet. Försök igen.");
    } finally {
      actionLock.current = false;
      setSavingAvailability(false);
      setAvailabilityOverride(null);
      void refresh();
    }
  };

  const firstName = data?.profile.first_name.trim();
  const approved = data?.certificate?.status === "approved";
  const pending = data?.certificate?.status === "pending";
  const needsChanges = data?.certificate?.status === "needs_changes";
  const showGate = !loading && !error && !!data && !approved;

  const greeting =
    hour >= 5 && hour < 10
      ? "God morgon"
      : hour >= 17 && hour < 23
        ? "God kväll"
        : "Hej";

  const available = availabilityOverride ?? data?.profile.is_available === true;

  const visibleRequests = showAll
    ? (data?.requests ?? [])
    : (data?.requests ?? []).slice(0, 2);

  const selectedRequest =
    data && selectedId
      ? (data.accepted ??
        data.requests.find((item) => item.id === selectedId) ??
        null)
      : null;

  const availabilityDisabled =
    loading ||
    savingAvailability ||
    acceptingId !== null ||
    releasingRequest ||
    requestingCompletion ||
    !!error ||
    !approved;

  if (
    approved &&
    selectedRequest &&
    (available || selectedRequest.status === "accepted")
  ) {
    return (
      <HelperRequestScreen
        key={selectedRequest.id}
        request={selectedRequest}
        busy={acceptingId !== null || releasingRequest || requestingCompletion}
        cancelling={releasingRequest}
        error={error}
        message={actionMessage}
        onBack={() => setSelectedId(null)}
        onAccept={() => void acceptRequest(selectedRequest.id)}
        onCancel={() => void releaseRequest(selectedRequest.id)}
        onRequestCompletion={() => void requestCompletion(selectedRequest.id)}
        onRefresh={() => void refresh()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <BlurTargetView
          ref={blurTarget}
          style={styles.screen}
          pointerEvents={showGate ? "none" : "auto"}
          accessibilityElementsHidden={showGate}
          importantForAccessibility={showGate ? "no-hide-descendants" : "auto"}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.page}>
              {showAll ? (
                <Text style={styles.pageTitle} accessibilityRole="header">
                  Uppdrag
                </Text>
              ) : (
                <Text style={styles.greeting} accessibilityRole="header">
                  {greeting}
                  {firstName ? ", " : "!"}
                  {firstName ? (
                    <Text style={styles.name}>{firstName}!</Text>
                  ) : null}
                </Text>
              )}

              {!showAll && (
                <View style={styles.availabilityCard}>
                  <View
                    style={[
                      styles.availabilityIcon,
                      !available && styles.availabilityIconPaused,
                    ]}
                  >
                    {available ? (
                      <Bell
                        size={24}
                        color={colors.primary}
                        strokeWidth={1.7}
                      />
                    ) : (
                      <BellOff
                        size={24}
                        color={colors.textSecondary}
                        strokeWidth={1.7}
                      />
                    )}
                  </View>

                  <View style={styles.availabilityText}>
                    <Text style={styles.availabilityTitle}>
                      {loading
                        ? "Tillgänglighet"
                        : available
                          ? "Tillgänglig för uppdrag"
                          : "Pausad"}
                    </Text>

                    <Text style={styles.availabilityDescription}>
                      {loading
                        ? "Välj när du vill ta emot förfrågningar."
                        : available
                          ? "Du kan ta emot nya förfrågningar."
                          : "Du tar inte emot nya förfrågningar."}
                    </Text>
                  </View>

                  <Switch
                    value={available}
                    disabled={availabilityDisabled}
                    onValueChange={(value) => void setAvailability(value)}
                    trackColor={{
                      false: "#CFD9E1",
                      true: colors.primary,
                    }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Tillgänglig för nya uppdrag"
                    accessibilityState={{
                      disabled: availabilityDisabled,
                      busy: savingAvailability,
                    }}
                  />
                </View>
              )}

              <View style={styles.requestsSection}>
                {!showAll && (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {data?.accepted ? "Pågående uppdrag" : "Aktuella uppdrag"}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.navigate("/helper-requests")}
                      style={styles.showAllButton}
                    >
                      <Text style={styles.link}>Visa alla</Text>
                    </Pressable>
                  </View>
                )}

                {approved &&
                  available &&
                  !data?.accepted &&
                  visibleRequests.length > 0 && (
                    <>
                      {locationStatus === "ready" &&
                        distanceStatus === "error" && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={reloadDistances}
                            style={styles.textButton}
                          >
                            <Text style={styles.link}>
                              Avstånden kunde inte hämtas. Försök igen
                            </Text>
                          </Pressable>
                        )}
                      {locationStatus === "ready" &&
                        distanceStatus === "ready" &&
                        Object.keys(distances).length === 0 && (
                          <Text style={styles.distanceDescription}>
                            Avstånd kan visas när personens registrerade adress
                            har hittats i appen.
                          </Text>
                        )}
                      {["permission", "blocked", "error"].includes(
                        locationStatus,
                      ) && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void enableLocation()}
                          style={styles.textButton}
                        >
                          <Text style={styles.link}>
                            {locationStatus === "blocked"
                              ? "Öppna platsinställningar för avstånd"
                              : locationStatus === "error"
                                ? "Försök hämta din position igen"
                                : "Aktivera plats för att se avstånd"}
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}

                {loading ? (
                  <ActivityIndicator
                    style={styles.loading}
                    color={colors.primary}
                  />
                ) : error ? (
                  <>
                    <Text
                      style={styles.message}
                      accessibilityLiveRegion="polite"
                    >
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
                ) : data?.accepted ? (
                  <View style={styles.requestCard}>
                    <Text style={styles.requestTitle}>
                      Du hjälper{" "}
                      {data.accepted.recipient_name.trim() || "en person"}
                    </Text>

                    <View style={styles.acceptButton}>
                      <PrimaryButton
                        title="Visa uppdrag"
                        onPress={() => {
                          setActionMessage("");
                          if (data?.accepted) {
                            setSelectedId(data.accepted.id);
                          }
                        }}
                      />
                    </View>
                  </View>
                ) : !available && approved ? (
                  <View style={styles.pausedCard}>
                    <Text style={styles.requestTitle}>Du är pausad</Text>

                    <Text style={styles.description}>
                      Aktivera tillgänglighet när du vill ta emot nya
                      förfrågningar.
                    </Text>

                    {showAll && (
                      <View style={styles.acceptButton}>
                        <PrimaryButton
                          title={
                            savingAvailability
                              ? "Sparar…"
                              : "Aktivera tillgänglighet"
                          }
                          disabled={savingAvailability}
                          onPress={() => void setAvailability(true)}
                        />
                      </View>
                    )}
                  </View>
                ) : visibleRequests.length ? (
                  visibleRequests.map((item, index) => (
                    <HelperRequestCard
                      key={item.id}
                      request={item}
                      distanceMetres={distances[item.id]}
                      highlight={index === 0}
                      disabled={acceptingId !== null || savingAvailability}
                      onPress={() => {
                        setActionMessage("");
                        setSelectedId(item.id);
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.description}>
                    Inga förfrågningar att visa just nu.
                  </Text>
                )}

                {actionMessage ? (
                  <Text style={styles.message} accessibilityLiveRegion="polite">
                    {actionMessage}
                  </Text>
                ) : null}
              </View>

              {!showAll && (
                <>
                  <View style={styles.spacer} />
                  <View style={styles.divider} />

                  <View style={styles.shelterSection}>
                    <NearbyShelterCard />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </BlurTargetView>

        {showGate && (
          <View style={styles.overlay} accessibilityViewIsModal>
            <BlurView
              blurTarget={blurTarget}
              blurMethod="dimezisBlurView"
              intensity={45}
              tint="light"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <ScrollView
              contentContainerStyle={styles.overlayContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>
                  {pending
                    ? "Ditt intyg granskas"
                    : needsChanges
                      ? "Komplettera ditt intyg"
                      : "Din hjälp behövs nära dig"}
                </Text>

                <Text style={styles.noticeText}>
                  {pending
                    ? "När intyget är godkänt kan du ta emot förfrågningar. Granskningen tar normalt upp till en vecka."
                    : needsChanges
                      ? "Ditt utbildningsintyg behöver kompletteras innan du kan ta emot förfrågningar."
                      : "Ladda upp ditt utbildningsintyg för att börja hjälpa."}
                </Text>

                {needsChanges && data?.certificate?.review_note ? (
                  <Text style={styles.review}>
                    {data.certificate.review_note}
                  </Text>
                ) : null}

                <View style={styles.acceptButton}>
                  <PrimaryButton
                    title={pending ? "Uppdatera status" : "Ladda upp intyg"}
                    onPress={
                      pending
                        ? () => void refresh()
                        : () =>
                            router.push({
                              pathname: "/helper-training",
                              params: { from: "profile" },
                            })
                    }
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.navigate("/helper-profile")}
                  style={styles.textButton}
                >
                  <Text style={styles.link}>Till din profil</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 38,
    paddingBottom: 28,
  },
  page: { flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center" },
  pageTitle: {
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },
  greeting: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "400",
    letterSpacing: -0.6,
    color: colors.text,
  },
  name: { fontSize: 31, fontWeight: "700", color: colors.primary },
  availabilityCard: {
    marginTop: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  availabilityIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  availabilityIconPaused: { backgroundColor: "#EDF0F3" },
  availabilityText: { flex: 1 },
  availabilityTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    color: colors.text,
  },
  availabilityDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  requestsSection: { marginTop: 22, paddingBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.text,
  },
  distanceDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  showAllButton: { minHeight: 44, paddingLeft: 10, justifyContent: "center" },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  loading: { marginTop: 20, alignSelf: "flex-start" },
  message: { marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.error },
  textButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  requestCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  requestTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.text,
  },
  acceptButton: { marginTop: 20 },
  pausedCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  spacer: { flexGrow: 1 },
  divider: { height: 1, backgroundColor: colors.border },
  shelterSection: { paddingTop: 26 },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  overlayContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  noticeCard: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    padding: 26,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  noticeTitle: {
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "700",
    color: colors.text,
  },
  noticeText: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  review: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
});
