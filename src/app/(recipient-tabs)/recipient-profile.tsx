import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  HandHeart,
  LogOut,
  RotateCcw,
  UserRound,
  Users,
  Accessibility,
  Check,
  ChevronDown,
  Footprints,
  MapPin,
  Minus,
  MoveUp,
  PersonStanding,
  Plus,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import FormInput from "@/components/ui/FormInput";
import HelpOption from "@/components/ui/HelpOption";
import NameFields from "@/components/ui/NameFields";
import PhoneInput from "@/components/ui/PhoneInput";
import ScreenHeader from "@/components/ui/ScreenHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  capitalizeFirstLetter,
  formatPhoneNumber,
  formatPostalCode,
} from "@/utils/formatters";

type Section = "details" | "needs" | "contact";

type Recipient = {
  id: string;
  account_id: string;
  registration_for: string;
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
};

type FormData = {
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  relation: string;
  other_relation: string;
  selected_needs: string[];
  additional_info: string;
  floor: number;
  has_elevator: boolean;
};

const emptyForm: FormData = {
  first_name: "",
  last_name: "",
  phone: "",
  street: "",
  postal_code: "",
  city: "",
  relation: "",
  other_relation: "",
  selected_needs: [],
  additional_info: "",
  floor: 0,
  has_elevator: false,
};

const relations = [
  "Partner",
  "Förälder",
  "Barn",
  "Syskon",
  "Annan släkting",
  "Vän",
  "Granne",
  "Annat",
];

const sectionTitles: Record<Section, string> = {
  details: "Personuppgifter",
  needs: "Hjälpbehov",
  contact: "Kontaktperson",
};

export default function RecipientProfileScreen() {
  const params = useLocalSearchParams<{
    recipientId?: string;
  }>();

  const [recipients, setRecipients] = useState<Recipient[]>([]);

  const [selectedId, setSelectedId] = useState("");
  const [showProfiles, setShowProfiles] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [message, setMessage] = useState("");

  const [section, setSection] = useState<Section | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [formLoadFailed, setFormLoadFailed] = useState(false);
  const [formAttempt, setFormAttempt] = useState(0);
  const [formMessage, setFormMessage] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showRelations, setShowRelations] = useState(false);

  const operationLock = useRef(false);

  const recipient = recipients.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Session unavailable");
        }

        const { data, error } = await supabase
          .from("help_recipients")
          .select(
            "id, account_id, registration_for, first_name, last_name, phone, street, postal_code, city",
          )
          .eq("account_id", authData.user.id)
          .not("registration_completed_at", "is", null)
          .order("registration_completed_at", {
            ascending: false,
          })
          .order("id", { ascending: false });

        if (error) throw error;
        if (!active) return;

        const profiles = (data ?? []) as Recipient[];

        setRecipients(profiles);

        const requestedProfile = profiles.find(
          (item) => item.id === params.recipientId,
        );

        if (requestedProfile) {
          setSelectedId(requestedProfile.id);
          setShowProfiles(false);
        } else if (profiles.length === 1) {
          setSelectedId(profiles[0].id);
          setShowProfiles(false);
        } else {
          setSelectedId("");
          setShowProfiles(profiles.length > 1);
        }

        if (profiles.length === 0) {
          setMessage("Ingen färdig registrering hittades för kontot.");
        }
      } catch {
        if (!active) return;

        setMessage(
          "Kunde inte hämta profilen. Kontrollera anslutningen och försök igen.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadProfiles();

    return () => {
      active = false;
    };
  }, [params.recipientId, loadAttempt]);

  useEffect(() => {
    if (!section || !recipient) return;

    let active = true;

    const loadForm = async () => {
      setIsLoadingForm(true);
      setFormLoadFailed(false);
      setFormMessage("");
      setForm(emptyForm);
      setShowRelations(false);

      try {
        if (section === "details") {
          setForm({
            ...emptyForm,
            first_name: recipient.first_name,
            last_name: recipient.last_name,
            phone: formatPhoneNumber(recipient.phone),
            street: recipient.street,
            postal_code: formatPostalCode(recipient.postal_code),
            city: recipient.city,
          });

          return;
        }

        if (section === "contact") {
          const { data, error } = await supabase
            .from("emergency_contacts")
            .select("first_name, last_name, phone, relation, other_relation")
            .eq("recipient_id", recipient.id)
            .maybeSingle();

          if (error) throw error;
          if (!active) return;

          setForm({
            ...emptyForm,
            first_name: data?.first_name ?? "",
            last_name: data?.last_name ?? "",
            phone: formatPhoneNumber(data?.phone ?? ""),
            relation: data?.relation ?? "",
            other_relation: data?.other_relation ?? "",
          });
        } else {
          const { data, error } = await supabase
            .from("help_needs")
            .select("selected_needs, additional_info, floor, has_elevator")
            .eq("recipient_id", recipient.id)
            .maybeSingle();

          if (error) throw error;
          if (!active) return;

          setForm({
            ...emptyForm,
            selected_needs: data?.selected_needs ?? [],
            additional_info: data?.additional_info ?? "",
            floor: data?.floor ?? 0,
            has_elevator: data?.has_elevator ?? false,
          });
        }
      } catch {
        if (!active) return;

        setFormLoadFailed(true);
        setFormMessage("Kunde inte hämta uppgifterna. Försök igen.");
      } finally {
        if (active) setIsLoadingForm(false);
      }
    };

    void loadForm();

    return () => {
      active = false;
    };
  }, [section, recipient, formAttempt]);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const isOtherPerson = recipient?.registration_for === "other";

  const toggleNeed = (need: string) => {
    if (isSaving || isLoadingForm || formLoadFailed) return;
    setForm((current) => ({
      ...current,
      selected_needs: current.selected_needs.includes(need)
        ? current.selected_needs.filter((item) => item !== need)
        : [...current.selected_needs, need],
    }));
  };

  const selectRelation = (relation: string) => {
    updateForm("relation", relation);
    if (relation !== "Annat") updateForm("other_relation", "");
    setShowRelations(false);
  };

  const closeEditor = () => {
    if (operationLock.current) return;

    Keyboard.dismiss();
    setSection(null);
  };

  const save = async () => {
    if (
      operationLock.current ||
      !recipient ||
      !section ||
      isLoadingForm ||
      formLoadFailed
    ) {
      return;
    }

    operationLock.current = true;
    setIsSaving(true);
    setFormMessage("");
    Keyboard.dismiss();

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (
        authError ||
        !authData.user ||
        authData.user.id !== recipient.account_id
      ) {
        throw new Error("Session unavailable");
      }

      if (section === "details") {
        const details = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.replace(/\D/g, ""),
          street: form.street.trim(),
          postal_code: form.postal_code.replace(/\D/g, ""),
          city: form.city.trim(),
        };

        const { error } = await supabase
          .from("help_recipients")
          .update(details)
          .eq("id", recipient.id)
          .eq("account_id", authData.user.id)
          .select("id")
          .single();

        if (error) throw error;

        setRecipients((current) =>
          current.map((item) =>
            item.id === recipient.id ? { ...item, ...details } : item,
          ),
        );
      } else if (section === "contact") {
        const { error } = await supabase
          .from("emergency_contacts")
          .upsert(
            {
              recipient_id: recipient.id,
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              phone: form.phone.replace(/\D/g, ""),
              relation: form.relation,
              other_relation:
                form.relation === "Annat" ? form.other_relation.trim() : "",
            },
            { onConflict: "recipient_id" },
          )
          .select("recipient_id")
          .single();

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("help_needs")
          .upsert(
            {
              recipient_id: recipient.id,
              selected_needs: form.selected_needs,
              additional_info: form.additional_info.trim(),
              floor: form.floor,
              has_elevator: form.has_elevator,
            },
            { onConflict: "recipient_id" },
          )
          .select("recipient_id")
          .single();

        if (error) throw error;
      }

      setSection(null);
      setMessage("Ändringarna är sparade.");
    } catch {
      setFormMessage("Kunde inte spara uppgifterna. Försök igen.");
    } finally {
      operationLock.current = false;
      setIsSaving(false);
    }
  };

  const logout = async () => {
    if (operationLock.current) return;

    operationLock.current = true;
    setIsLoggingOut(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) throw error;

      router.replace("/");
    } catch {
      setMessage("Kunde inte logga ut. Försök igen.");
    } finally {
      operationLock.current = false;
      setIsLoggingOut(false);
    }
  };

  const fullName = recipient
    ? `${recipient.first_name} ${recipient.last_name}`.trim()
    : "";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <Text style={styles.title}>Profil</Text>

          {isLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : (
            <>
              {showProfiles ? (
                <View style={styles.profilePicker}>
                  <Text style={styles.description}>
                    Välj vems uppgifter du vill visa.
                  </Text>

                  <View style={styles.detailsCard}>
                    {recipients.map((item) => (
                      <ProfileRow
                        key={item.id}
                        icon={UserRound}
                        title={
                          `${item.first_name} ${item.last_name}`.trim() ||
                          "Namnlös profil"
                        }
                        onPress={() => {
                          setSelectedId(item.id);
                          setShowProfiles(false);
                          setMessage("");
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : recipient ? (
                <>
                  <View style={styles.identityCard}>
                    <View style={styles.avatar}>
                      {recipient.first_name.trim() ||
                      recipient.last_name.trim() ? (
                        <Text style={styles.initials}>
                          {recipient.first_name.trim().charAt(0).toUpperCase()}
                          {recipient.last_name.trim().charAt(0).toUpperCase()}
                        </Text>
                      ) : (
                        <UserRound
                          size={29}
                          color="#FFFFFF"
                          strokeWidth={1.8}
                        />
                      )}
                    </View>

                    <View style={styles.identityText}>
                      <Text style={styles.identityName}>
                        {fullName || "Din profil"}
                      </Text>

                      <View style={styles.profileBadge}>
                        <HandHeart
                          size={14}
                          color={colors.primary}
                          strokeWidth={1.8}
                        />

                        <Text style={styles.profileBadgeText}>Hjälpprofil</Text>
                      </View>
                    </View>
                  </View>

                  {recipients.length > 1 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowProfiles(true)}
                      style={styles.smallButton}
                    >
                      <Text style={styles.linkText}>Byt profil</Text>
                    </Pressable>
                  )}

                  <Text style={styles.groupHeading}>Mina uppgifter</Text>

                  <View style={styles.detailsCard}>
                    <ProfileRow
                      icon={UserRound}
                      title="Personuppgifter"
                      subtitle="Namn, telefon och adress"
                      onPress={() => {
                        setFormMessage("");
                        setSection("details");
                      }}
                    />

                    <ProfileRow
                      icon={HandHeart}
                      title="Hjälpbehov"
                      subtitle="Hjälp och information om boendet"
                      onPress={() => {
                        setFormMessage("");
                        setSection("needs");
                      }}
                    />

                    <ProfileRow
                      icon={Users}
                      title="Kontaktperson"
                      subtitle="Vem som ska meddelas"
                      last
                      onPress={() => {
                        setFormMessage("");
                        setSection("contact");
                      }}
                    />
                  </View>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLoadAttempt((current) => current + 1)}
                  style={styles.smallButton}
                >
                  <Text style={styles.linkText}>Hämta profilen igen</Text>
                </Pressable>
              )}

              {message !== "" && (
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  {message}
                </Text>
              )}
            </>
          )}

          <Text style={styles.groupHeading}>Mer</Text>

          <View style={styles.detailsCard}>
            <ProfileRow
              icon={LockKeyhole}
              title="Integritet och data"
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
              <LogOut size={21} color={colors.primary} strokeWidth={1.7} />
            )}

            <Text style={styles.logoutText}>
              {isLoggingOut ? "Loggar ut…" : "Logga ut"}
            </Text>
          </Pressable>

          {__DEV__ && (
            <Pressable
              accessibilityRole="button"
              disabled={isLoggingOut}
              onPress={() => router.push("/role")}
              style={({ pressed }) => [
                styles.testButton,
                pressed && styles.pressed,
              ]}
            >
              <RotateCcw size={16} color={colors.textSecondary} />

              <Text style={styles.testText}>Testa registreringen igen</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={section !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeEditor}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.editorContainer}>
            <ScreenHeader onBack={closeEditor} backDisabled={isSaving} />
            <KeyboardAvoidingView
              style={styles.keyboardView}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={10}
            >
              <ScrollView
                contentContainerStyle={styles.editorContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.editorTitle}>
                  {section ? sectionTitles[section] : ""}
                </Text>
                <Text style={styles.editorDescription}>
                  {section === "details"
                    ? "Här kan du ändra namn och kontaktuppgifter."
                    : section === "contact"
                      ? isOtherPerson
                        ? "Vem ska få veta när personen ber om hjälp?"
                        : "Vem vill du ska få veta när du ber om hjälp?"
                      : "Välj alla alternativ som passar. Hjälparen får se detta innan ni möts."}
                </Text>
                {isLoadingForm ? (
                  <ActivityIndicator
                    style={styles.loading}
                    color={colors.primary}
                  />
                ) : !formLoadFailed ? (
                  <View pointerEvents={isSaving ? "none" : "auto"}>
                    {section === "details" && (
                      <>
                        <NameFields
                          firstName={form.first_name}
                          lastName={form.last_name}
                          onFirstNameChange={(value) =>
                            updateForm("first_name", value)
                          }
                          onLastNameChange={(value) =>
                            updateForm("last_name", value)
                          }
                          forOtherPerson={isOtherPerson}
                        />

                        <PhoneInput
                          value={form.phone}
                          onChangeText={(value) => updateForm("phone", value)}
                          forOtherPerson={isOtherPerson}
                        />

                        <FormInput
                          label="Adress"
                          icon={MapPin}
                          value={form.street}
                          onChangeText={(value) =>
                            updateForm("street", capitalizeFirstLetter(value))
                          }
                          placeholder={
                            isOtherPerson
                              ? "Personens gata och nummer"
                              : "Gata och nummer"
                          }
                          autoCapitalize="words"
                          autoComplete={
                            isOtherPerson ? "off" : "street-address"
                          }
                          editable={!isSaving && !formLoadFailed}
                        />

                        <View style={styles.detailsAddressRow}>
                          <View style={styles.detailsPostalInput}>
                            <TextInput
                              style={styles.detailsSmallInput}
                              value={form.postal_code}
                              onChangeText={(value) =>
                                updateForm(
                                  "postal_code",
                                  formatPostalCode(value),
                                )
                              }
                              placeholder="Postnummer"
                              placeholderTextColor={colors.placeholder}
                              accessibilityLabel={
                                isOtherPerson
                                  ? "Personens postnummer"
                                  : "Postnummer"
                              }
                              keyboardType="number-pad"
                              autoComplete={
                                isOtherPerson ? "off" : "postal-code"
                              }
                              maxLength={6}
                              editable={!isSaving && !formLoadFailed}
                            />
                          </View>

                          <View style={styles.detailsCityInput}>
                            <TextInput
                              style={styles.detailsSmallInput}
                              value={form.city}
                              onChangeText={(value) =>
                                updateForm("city", capitalizeFirstLetter(value))
                              }
                              placeholder="Ort"
                              placeholderTextColor={colors.placeholder}
                              accessibilityLabel={
                                isOtherPerson ? "Personens ort" : "Ort"
                              }
                              autoCapitalize="words"
                              autoComplete="off"
                              editable={!isSaving && !formLoadFailed}
                            />
                          </View>
                        </View>
                      </>
                    )}
                    {section === "contact" && (
                      <>
                        <NameFields
                          firstName={form.first_name}
                          lastName={form.last_name}
                          onFirstNameChange={(value) =>
                            updateForm("first_name", value)
                          }
                          onLastNameChange={(value) =>
                            updateForm("last_name", value)
                          }
                          forOtherPerson
                        />

                        <View style={styles.contactRelationWrapper}>
                          <Text style={styles.contactLabel}>Relation</Text>

                          <Pressable
                            onPress={() => {
                              Keyboard.dismiss();
                              setShowRelations((previous) => !previous);
                            }}
                            disabled={
                              isSaving || isLoadingForm || formLoadFailed
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Relation: ${
                              form.relation || "Välj relation"
                            }`}
                            accessibilityState={{
                              expanded: showRelations,
                              disabled:
                                isSaving || isLoadingForm || formLoadFailed,
                            }}
                            style={({ pressed }) => [
                              styles.contactRelationButton,
                              pressed && styles.contactPressed,
                            ]}
                          >
                            <Users size={21} color={colors.textSecondary} />

                            <Text
                              style={[
                                styles.contactRelationText,
                                !form.relation && styles.contactPlaceholderText,
                              ]}
                            >
                              {form.relation || "Välj relation"}
                            </Text>

                            <ChevronDown
                              size={21}
                              color={colors.textSecondary}
                              style={{
                                transform: [
                                  {
                                    rotate: showRelations ? "180deg" : "0deg",
                                  },
                                ],
                              }}
                            />
                          </Pressable>

                          {showRelations && (
                            <View style={styles.contactDropdown}>
                              <ScrollView
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                              >
                                {relations.map((item) => (
                                  <Pressable
                                    key={item}
                                    onPress={() => selectRelation(item)}
                                    accessibilityRole="button"
                                    accessibilityState={{
                                      selected: form.relation === item,
                                    }}
                                    style={({ pressed }) => [
                                      styles.contactDropdownOption,
                                      form.relation === item &&
                                        styles.contactDropdownSelected,
                                      pressed && styles.contactDropdownPressed,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.contactDropdownText,
                                        form.relation === item &&
                                          styles.contactDropdownSelectedText,
                                      ]}
                                    >
                                      {item}
                                    </Text>

                                    {form.relation === item && (
                                      <Check size={20} color={colors.primary} />
                                    )}
                                  </Pressable>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>

                        {form.relation === "Annat" && (
                          <FormInput
                            label="Ange relation"
                            icon={Users}
                            value={form.other_relation}
                            onChangeText={(value) =>
                              updateForm(
                                "other_relation",
                                capitalizeFirstLetter(value),
                              )
                            }
                            placeholder="Skriv relation"
                            autoCapitalize="words"
                            editable={
                              !isSaving || (isLoadingForm && !formLoadFailed)
                            }
                          />
                        )}

                        <PhoneInput
                          value={form.phone}
                          onChangeText={(value) => updateForm("phone", value)}
                          forOtherPerson
                        />

                        <Text style={styles.contactInfoText}>
                          {isOtherPerson
                            ? "Nödkontakten är den som ska meddelas när personen ber om hjälp."
                            : "Din nödkontakt är den som ska meddelas när du ber om hjälp."}
                        </Text>
                      </>
                    )}
                    {section === "needs" && (
                      <>
                        <View style={styles.needsOptions}>
                          <HelpOption
                            title="Rullstol"
                            description={
                              isOtherPerson
                                ? "Personen använder rullstol och kan behöva hjälp att ta sig fram."
                                : "Jag använder rullstol och kan behöva hjälp att ta mig fram."
                            }
                            icon={Accessibility}
                            selected={form.selected_needs.includes(
                              "wheelchair",
                            )}
                            onPress={() => toggleNeed("wheelchair")}
                          />

                          <HelpOption
                            title="Svårt att gå längre sträckor"
                            description={
                              isOtherPerson
                                ? "Personen går långsamt, använder gånghjälpmedel eller behöver ta pauser."
                                : "Jag går långsamt, använder gånghjälpmedel eller behöver ta pauser."
                            }
                            icon={Footprints}
                            selected={form.selected_needs.includes("walking")}
                            onPress={() => toggleNeed("walking")}
                          />

                          <HelpOption
                            title="Hjälp i trappor"
                            description={
                              isOtherPerson
                                ? "Personen har svårt att ta sig upp eller ner för trappor."
                                : "Jag har svårt att ta mig upp eller ner för trappor."
                            }
                            icon={MoveUp}
                            selected={form.selected_needs.includes("stairs")}
                            onPress={() => toggleNeed("stairs")}
                          />

                          <HelpOption
                            title="Fysiskt stöd"
                            description={
                              isOtherPerson
                                ? "Personen kan behöva stöd av en annan person när hen går."
                                : "Jag kan behöva stöd av en annan person när jag går."
                            }
                            icon={PersonStanding}
                            selected={form.selected_needs.includes(
                              "physical-support",
                            )}
                            onPress={() => toggleNeed("physical-support")}
                          />
                        </View>

                        <View style={styles.needsExtraSection}>
                          <Text style={styles.needsSectionTitle}>
                            {isOtherPerson ? "Personens boende" : "Ditt boende"}
                          </Text>

                          <View style={styles.needsHomeCard}>
                            <View style={styles.needsHomeRow}>
                              <View style={styles.needsHomeDetails}>
                                <Text style={styles.needsHomeLabel}>
                                  Våningsplan
                                </Text>
                                <Text style={styles.needsHomeDescription}>
                                  0 = entréplan
                                </Text>
                              </View>

                              <View style={styles.needsFloorControls}>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Minska våningsplan"
                                  accessibilityState={{
                                    disabled:
                                      form.floor === 0 ||
                                      isSaving ||
                                      formLoadFailed,
                                  }}
                                  disabled={
                                    form.floor === 0 ||
                                    isSaving ||
                                    formLoadFailed
                                  }
                                  onPress={() =>
                                    updateForm(
                                      "floor",
                                      Math.max(0, form.floor - 1),
                                    )
                                  }
                                  style={({ pressed }) => [
                                    styles.needsFloorButton,
                                    (form.floor === 0 ||
                                      isSaving ||
                                      formLoadFailed) &&
                                      styles.needsDisabled,
                                    pressed && styles.needsPressed,
                                  ]}
                                >
                                  <Minus size={22} color={colors.text} />
                                </Pressable>

                                <Text
                                  style={styles.needsFloorValue}
                                  accessibilityLabel={`Våningsplan ${form.floor}`}
                                  accessibilityLiveRegion="polite"
                                >
                                  {form.floor}
                                </Text>

                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Öka våningsplan"
                                  accessibilityState={{
                                    disabled: isSaving || formLoadFailed,
                                  }}
                                  disabled={isSaving || formLoadFailed}
                                  onPress={() =>
                                    updateForm("floor", form.floor + 1)
                                  }
                                  style={({ pressed }) => [
                                    styles.needsFloorButton,
                                    (isSaving || formLoadFailed) &&
                                      styles.needsDisabled,
                                    pressed && styles.needsPressed,
                                  ]}
                                >
                                  <Plus size={22} color={colors.text} />
                                </Pressable>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.needsHomeRow,
                                styles.needsElevatorRow,
                              ]}
                            >
                              <View style={styles.needsHomeDetails}>
                                <Text style={styles.needsHomeLabel}>
                                  Hiss i byggnaden
                                </Text>
                                <Text style={styles.needsHomeDescription}>
                                  {form.has_elevator
                                    ? "Hiss finns"
                                    : "Ingen hiss"}
                                </Text>
                              </View>

                              <Switch
                                accessibilityLabel="Hiss i byggnaden"
                                value={form.has_elevator}
                                onValueChange={(value) =>
                                  updateForm("has_elevator", value)
                                }
                                disabled={isSaving || formLoadFailed}
                                trackColor={{
                                  false: "#C5D0DA",
                                  true: colors.primary,
                                }}
                                thumbColor={colors.surface}
                                ios_backgroundColor="#C5D0DA"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.needsExtraSection}>
                          <Text style={styles.needsExtraLabel}>
                            {isOtherPerson
                              ? "Något annat hjälparen bör veta?"
                              : "Något annat din hjälpare bör veta?"}
                          </Text>

                          <Text style={styles.needsOptionalText}>Valfritt</Text>

                          <TextInput
                            style={styles.needsExtraInput}
                            value={form.additional_info}
                            onChangeText={(value) =>
                              updateForm("additional_info", value)
                            }
                            placeholder="Skriv här..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            textAlignVertical="top"
                            maxLength={300}
                            editable={!isSaving || formLoadFailed}
                            accessibilityLabel="Något annat hjälparen bör veta? Valfritt"
                          />

                          <Text style={styles.needsCharacterCount}>
                            {form.additional_info.length}/300
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : null}
                {formMessage !== "" && (
                  <Text
                    style={styles.formMessage}
                    accessibilityLiveRegion="polite"
                  >
                    {formMessage}
                  </Text>
                )}
              </ScrollView>
              <View style={styles.editorBottom}>
                <PrimaryButton
                  title={
                    isLoadingForm
                      ? "Hämtar…"
                      : isSaving
                        ? "Sparar…"
                        : formLoadFailed
                          ? "Försök igen"
                          : "Spara"
                  }
                  disabled={isLoadingForm || isSaving}
                  onPress={
                    formLoadFailed
                      ? () => setFormAttempt((current) => current + 1)
                      : () => void save()
                  }
                />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

type ProfileRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  last?: boolean;
  onPress: () => void;
};

function ProfileRow({
  icon: Icon,
  title,
  subtitle,
  last = false,
  onPress,
}: ProfileRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailsRow,
        !last && styles.detailsRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowIcon}>
        <Icon size={21} color={colors.primary} strokeWidth={1.7} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>

        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>

      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.7} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: "#FFFFFF",
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
    backgroundColor: "#E8F1F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  profileBadgeText: {
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

  detailsRow: {
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  detailsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAF0F5",
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F1F7",
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardView: {
    flex: 1,
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

  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  rowText: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },

  rowSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  loading: {
    marginTop: 32,
    alignSelf: "flex-start",
  },

  profilePicker: {
    marginTop: 8,
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

  message: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
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

  editorTitle: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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

  editorContainer: { flex: 1, backgroundColor: colors.background },
  editorContent: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 25 },
  editorBottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  editorDescription: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  detailsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailsAddressRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  detailsPostalInput: {
    flex: 0.9,
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  detailsCityInput: {
    flex: 1.1,
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  detailsSmallInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  contactRelationWrapper: {
    marginTop: 16,
    zIndex: 10,
  },

  contactLabel: {
    marginBottom: 7,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  contactRelationButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  contactRelationText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 16,
    color: colors.text,
  },

  contactPlaceholderText: {
    color: colors.placeholder,
  },

  contactDropdown: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,
    maxHeight: 230,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    zIndex: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  contactDropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  contactDropdownText: {
    fontSize: 16,
    color: colors.text,
  },

  contactDropdownSelected: {
    backgroundColor: "#E8F0F7",
  },

  contactDropdownSelectedText: {
    color: colors.primary,
    fontWeight: "600",
  },

  contactDropdownPressed: {
    backgroundColor: "#F2F6F8",
  },

  contactInfoText: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  contactPressed: {
    opacity: 0.7,
  },

  needsOptions: {
    marginTop: 24,
    gap: 12,
  },

  needsExtraSection: {
    marginTop: 28,
  },

  needsSectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },

  needsHomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  needsHomeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  needsHomeDetails: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
  },

  needsHomeLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },

  needsHomeDescription: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  needsFloorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  needsFloorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F0F4",
    alignItems: "center",
    justifyContent: "center",
  },

  needsFloorValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },

  needsElevatorRow: {
    borderTopWidth: 1,
    borderTopColor: "#E8EFF4",
  },

  needsDisabled: {
    opacity: 0.4,
  },

  needsPressed: {
    opacity: 0.7,
  },

  needsExtraLabel: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },

  needsOptionalText: {
    marginTop: 3,
    fontSize: 13,
    color: "#7A8896",
  },

  needsExtraInput: {
    minHeight: 105,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },

  needsCharacterCount: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 13,
    color: "#7A8896",
  },
});
