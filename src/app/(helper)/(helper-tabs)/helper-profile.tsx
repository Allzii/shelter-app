import { router, useFocusEffect } from "expo-router";
import {
  Check,
  CircleHelp,
  FileText,
  HandHelping,
  LockKeyhole,
  LogOut,
  RotateCcw,
  UserRound,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import AddressFields from "@/components/ui/AddressFields";
import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ProfileRow from "@/components/ui/ProfileRow";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";
import SkillFields from "@/features/helper/components/SkillFields";
import { supabase } from "@/lib/supabase";
import { formatPhoneNumber, formatPostalCode } from "@/utils/formatters";

import type { CertificateReview as Certificate } from "@/types/certificate";

type Profile = {
  account_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  selected_skills: string[];
};

type ProfileData = {
  profile: Profile;
  certificate: Certificate | null;
};

type Section = "details" | "skills";

const PROFILE_COLUMNS =
  "account_id, first_name, last_name, phone, street, postal_code, city, selected_skills";

export default function HelperProfileScreen() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [section, setSection] = useState<Section | null>(null);
  const [form, setForm] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [logoutMessage, setLogoutMessage] = useState("");

  const operation = useRef(false);
  const request = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (showIndicator = false) => {
    const current = ++request.current;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setRefreshing(showIndicator);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (current !== request.current) return;

      if (authError || !authData.user) {
        setData(null);
        throw new Error("Session unavailable");
      }

      const accountId = authData.user.id;

      setData((previous) =>
        previous?.profile.account_id === accountId ? previous : null,
      );

      const [profileResult, certificateResult] = await Promise.all([
        supabase
          .from("helper_profiles")
          .select(PROFILE_COLUMNS)
          .eq("account_id", accountId)
          .abortSignal(controller.signal)
          .maybeSingle(),

        supabase
          .from("helper_certificates")
          .select("status, review_note")
          .eq("account_id", accountId)
          .abortSignal(controller.signal)
          .maybeSingle(),
      ]);

      if (current !== request.current) return;

      if (profileResult.error) throw profileResult.error;
      if (certificateResult.error) throw certificateResult.error;
      if (!profileResult.data) throw new Error("Profile missing");

      const certificate = certificateResult.data;

      if (
        certificate &&
        !["pending", "approved", "needs_changes"].includes(certificate.status)
      ) {
        throw new Error("Unknown certificate status");
      }

      setData({
        profile: profileResult.data as Profile,
        certificate: certificate as Certificate | null,
      });

      setError("");
    } catch {
      if (current === request.current) {
        setError("Kunde inte hämta dina uppgifter. Försök igen.");
      }
    } finally {
      if (current === request.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();

      return () => {
        ++request.current;
        controllerRef.current?.abort();
      };
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  const profile = data?.profile;
  const certificate = data?.certificate;
  const approved = certificate?.status === "approved";

  const fullName = profile
    ? `${profile.first_name.trim()} ${profile.last_name.trim()}`.trim()
    : "";

  const initials = profile
    ? `${profile.first_name.trim().charAt(0)}${profile.last_name.trim().charAt(0)}`.toUpperCase()
    : "";

  const badge = approved
    ? "Verifierad volontär"
    : certificate?.status === "pending"
      ? "Intyg under granskning"
      : certificate?.status === "needs_changes"
        ? "Komplettering behövs"
        : "Intyg saknas";

  const open = (next: Section) => {
    if (!profile || error || operation.current) return;

    setForm({
      ...profile,
      phone: formatPhoneNumber(profile.phone),
      postal_code: formatPostalCode(profile.postal_code),
      selected_skills: [...profile.selected_skills],
    });

    setFormMessage("");
    setSavedMessage("");
    setSection(next);
  };

  const close = () => {
    if (operation.current) return;

    Keyboard.dismiss();
    setSection(null);
    setForm(null);
  };

  const update = (
    key:
      "first_name" | "last_name" | "phone" | "street" | "postal_code" | "city",
    value: string,
  ) => {
    if (operation.current) return;

    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const toggle = (id: string) => {
    if (operation.current) return;

    setForm((current) =>
      current
        ? {
            ...current,
            selected_skills: current.selected_skills.includes(id)
              ? current.selected_skills.filter((value) => value !== id)
              : [...current.selected_skills, id],
          }
        : current,
    );
  };

  const save = async () => {
    if (operation.current || !form || !section || !profile || error) {
      return;
    }

    if (
      section === "details" &&
      (!form.first_name.trim() ||
        !form.last_name.trim() ||
        !form.street.trim() ||
        !form.city.trim() ||
        form.postal_code.replace(/\D/g, "").length !== 5 ||
        form.phone.replace(/\D/g, "").length < 7)
    ) {
      setFormMessage(
        "Fyll i namn, telefon och fullständig adress med femsiffrigt postnummer.",
      );
      return;
    }

    Keyboard.dismiss();

    operation.current = true;
    setIsSaving(true);
    setFormMessage("");

    try {
      const patch =
        section === "skills"
          ? {
              selected_skills: form.selected_skills,
            }
          : {
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              phone: form.phone.replace(/\D/g, ""),
              street: form.street.trim(),
              postal_code: form.postal_code.replace(/\D/g, ""),
              city: form.city.trim(),
            };

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user || authData.user.id !== form.account_id) {
        throw new Error("Din inloggning har ändrats. Logga in igen.");
      }

      const { data: saved, error: saveError } = await supabase
        .from("helper_profiles")
        .update(patch)
        .eq("account_id", form.account_id)
        .select(PROFILE_COLUMNS)
        .single();

      if (saveError || !saved) {
        throw new Error("Kunde inte spara ändringarna. Försök igen.");
      }

      ++request.current;
      controllerRef.current?.abort();
      setRefreshing(false);

      setData((previous) => {
        if (!previous) return null;

        if (previous.profile.account_id !== saved.account_id) {
          return previous;
        }

        return {
          profile: saved as Profile,
          certificate: previous.certificate,
        };
      });

      setSection(null);
      setForm(null);
      setSavedMessage("Ändringarna är sparade.");
    } catch (saveError) {
      setFormMessage(
        saveError instanceof Error
          ? saveError.message
          : "Kunde inte spara ändringarna. Försök igen.",
      );
    } finally {
      operation.current = false;
      setIsSaving(false);
    }
  };

  const logout = async () => {
    if (operation.current) return;

    operation.current = true;
    setIsLoggingOut(true);
    setLogoutMessage("");

    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });

      if (signOutError) throw signOutError;

      router.replace("/login");
    } catch {
      setLogoutMessage("Kunde inte logga ut. Försök igen.");
    } finally {
      operation.current = false;
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <Text style={styles.title}>Profil</Text>

          {initialLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : profile ? (
            <>
              <View style={styles.identityCard}>
                <View style={styles.avatar} accessible={false}>
                  <Text style={styles.initials}>{initials || "–"}</Text>
                </View>

                <View style={styles.identityText}>
                  <Text style={styles.identityName}>
                    {fullName || "Din profil"}
                  </Text>

                  <View style={styles.profileBadge}>
                    {approved && !error ? (
                      <Check
                        size={14}
                        color={colors.primary}
                        strokeWidth={2.5}
                      />
                    ) : null}

                    <Text style={styles.profileBadgeText}>
                      {error ? "Status kunde inte uppdateras" : badge}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.groupHeading}>Mina uppgifter</Text>

              <View style={styles.detailsCard}>
                <ProfileRow
                  icon={UserRound}
                  title="Personuppgifter"
                  subtitle="Namn, telefon och adress"
                  disabled={!!error || isLoggingOut}
                  onPress={() => open("details")}
                />

                <ProfileRow
                  icon={HandHelping}
                  title="Så kan jag hjälpa"
                  subtitle="Ändra dina val"
                  last={approved}
                  disabled={!!error || isLoggingOut}
                  onPress={() => open("skills")}
                />

                {!approved && (
                  <ProfileRow
                    icon={FileText}
                    title="Utbildningsintyg"
                    subtitle={badge}
                    last
                    disabled={!!error || isLoggingOut}
                    onPress={() =>
                      router.push({
                        pathname: "/helper-training",
                        params: { from: "profile" },
                      })
                    }
                  />
                )}
              </View>
            </>
          ) : null}

          {error || (!initialLoading && !profile) ? (
            <View style={styles.errorBlock}>
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {error || "Din profil kunde inte hämtas."}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={refreshing}
                onPress={() => void refresh(true)}
                style={styles.smallButton}
              >
                <Text style={styles.linkText}>
                  {refreshing ? "Uppdaterar…" : "Försök igen"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {savedMessage ? (
            <Text style={styles.savedMessage} accessibilityLiveRegion="polite">
              {savedMessage}
            </Text>
          ) : null}

          <Text style={styles.groupHeading}>Mer</Text>

          <View style={styles.detailsCard}>
            <ProfileRow
              icon={LockKeyhole}
              title="Integritet och data"
              disabled={isLoggingOut}
              onPress={() =>
                Alert.alert(
                  "Integritet och data",
                  "Här kommer du att kunna läsa om hur dina uppgifter behandlas.",
                )
              }
            />

            <ProfileRow
              icon={CircleHelp}
              title="Hjälp och support"
              subtitle="Ring 08-123 456 00"
              last
              disabled={isLoggingOut}
              onPress={() =>
                Alert.alert(
                  "Hjälp och support",
                  "Telefon: 08-123 456 00\n\nSupportfunktionen är inte tillgänglig i prototypen ännu.",
                )
              }
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: isLoggingOut,
              busy: isLoggingOut,
            }}
            disabled={isLoggingOut}
            onPress={() => void logout()}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <LogOut size={20} color={colors.primary} />
            )}

            <Text style={styles.logoutText}>
              {isLoggingOut ? "Loggar ut…" : "Logga ut"}
            </Text>
          </Pressable>

          {logoutMessage ? (
            <Text style={styles.formMessage} accessibilityLiveRegion="polite">
              {logoutMessage}
            </Text>
          ) : null}

          {__DEV__ && (
            <Pressable
              accessibilityRole="button"
              disabled={isLoggingOut}
              onPress={() => router.push("/role")}
              style={styles.testButton}
            >
              <RotateCcw size={17} color={colors.textSecondary} />

              <Text style={styles.testText}>Testa registreringen igen</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={section !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <ScreenHeader onBack={close} backDisabled={isSaving} />

            <KeyboardAvoidingView
              style={styles.keyboardView}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.editorContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.editorTitle}>
                  {section === "details"
                    ? "Personuppgifter"
                    : "Så kan jag hjälpa"}
                </Text>

                {form && (
                  <View pointerEvents={isSaving ? "none" : "auto"}>
                    {section === "details" ? (
                      <>
                        <NameFields
                          firstName={form.first_name}
                          lastName={form.last_name}
                          onFirstNameChange={(value) =>
                            update("first_name", value)
                          }
                          onLastNameChange={(value) =>
                            update("last_name", value)
                          }
                        />

                        <PhoneInput
                          value={form.phone}
                          onChangeText={(value) => update("phone", value)}
                        />

                        <AddressFields
                          street={form.street}
                          postalCode={form.postal_code}
                          city={form.city}
                          onStreetChange={(value) => update("street", value)}
                          onPostalCodeChange={(value) =>
                            update("postal_code", value)
                          }
                          onCityChange={(value) => update("city", value)}
                          editable={!isSaving}
                        />
                      </>
                    ) : (
                      <SkillFields
                        selected={form.selected_skills}
                        onToggle={toggle}
                        disabled={isSaving}
                      />
                    )}
                  </View>
                )}

                {formMessage ? (
                  <Text
                    style={styles.formMessage}
                    accessibilityLiveRegion="polite"
                  >
                    {formMessage}
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.editorBottom}>
                <PrimaryButton
                  title={isSaving ? "Sparar…" : "Spara"}
                  disabled={isSaving || !form || !!error}
                  onPress={() => void save()}
                />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 24,
  },
  page: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },
  loading: {
    marginTop: 32,
    alignSelf: "flex-start",
  },
  identityCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    shadowColor: "#18344A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
  },
  identityText: {
    flex: 1,
  },
  identityName: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.text,
  },
  profileBadge: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.primary,
  },
  groupHeading: {
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 3,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },
  detailsCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  smallButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  errorBlock: {
    marginTop: 18,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  savedMessage: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: colors.success,
  },
  logoutButton: {
    minHeight: 52,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  testButton: {
    minHeight: 48,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  testText: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  editorContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 25,
  },
  editorTitle: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },
  editorBottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  formMessage: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.error,
  },
  pressed: {
    opacity: 0.65,
  },
});
