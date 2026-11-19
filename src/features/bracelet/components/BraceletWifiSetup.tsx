import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  getBraceletLink,
  getBraceletPeople,
  pairBracelet,
  readBraceletIdentity,
  unlinkBracelet,
} from "@/services/bracelet";

import type {
  BraceletIdentity,
  BraceletLink,
  BraceletPerson,
} from "@/services/bracelet";

const SETUP_URL = "http://192.168.4.1:8080";
// Accept the previous firmware until the updated file is installed on the bracelet.
const BRACELET_TYPES = new Set(["bracelet-wifi", "tryggnara-wifi"]);

async function request(path: string, token?: string, body?: object) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(SETUP_URL + path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(token ? { "X-Setup-Token": token } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Setup unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") throw new Error("Unexpected reply");
    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

async function readSetupToken() {
  const setup = await request("/api/setup");
  if (
    typeof setup.type !== "string" ||
    !BRACELET_TYPES.has(setup.type) ||
    typeof setup.token !== "string" ||
    !/^[a-f0-9]{32}$/.test(setup.token)
  ) {
    throw new Error("Unexpected bracelet");
  }
  return setup.token;
}

export default function BraceletWifiSetup({
  recipientId,
}: {
  recipientId?: string;
}) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | "done" | "paired">(0);
  const [people, setPeople] = useState<BraceletPerson[]>([]);
  const [person, setPerson] = useState<BraceletPerson | null>(null);
  const [link, setLink] = useState<BraceletLink | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [reload, setReload] = useState(0);
  const identity = useRef<BraceletIdentity | null>(null);
  const account = useRef<string | null>(null);
  const selection = useRef(0);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const working = useRef(false);

  useEffect(() => {
    let cancelled = false;
    selection.current++;
    identity.current = null;
    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setLoadingPeople(true);
        setPerson(null);
        setLink(null);
        setPeople([]);
        setStep(0);
        setMessage("");
        return getBraceletPeople(recipientId);
      })
      .then(async (context) => {
        if (cancelled || !context) return;
        account.current = context.accountId;
        setPeople(context.people);
        if (context.people.length === 1) {
          setPerson(context.people[0]);
          const savedLink = await getBraceletLink(context.people[0].id);
          if (!cancelled) setLink(savedLink);
        } else if (!context.people.length) {
          setMessage(
            "Ingen registrerad person hittades. Slutför registreringen innan du kopplar armbandet.",
          );
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setMessage(
            error instanceof Error
              ? error.message
              : "Kunde inte hämta armbandskopplingen.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingPeople(false);
      });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_OUT" ||
          (account.current && session?.user.id !== account.current)
        ) {
          cancelled = true;
          identity.current = null;
          account.current = null;
          selection.current++;
          setPassword("");
          setBusy(false);
          working.current = false;
          setReload((value) => value + 1);
        }
      },
    );
    return () => {
      cancelled = true;
      identity.current = null;
      authListener.subscription.unsubscribe();
    };
  }, [recipientId, reload]);

  const choosePerson = async (next: BraceletPerson) => {
    const ticket = ++selection.current;
    setPerson(next);
    setLink(null);
    setMessage("");
    setLoadingPeople(true);
    try {
      const savedLink = await getBraceletLink(next.id);
      if (ticket === selection.current) setLink(savedLink);
    } catch (error) {
      if (ticket === selection.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Kunde inte kontrollera kopplingen.",
        );
    } finally {
      if (ticket === selection.current) setLoadingPeople(false);
    }
  };

  const savePairing = async () => {
    if (working.current || !person || !identity.current || !account.current)
      return;
    working.current = true;
    setBusy(true);
    setMessage("Sparar kopplingen...");
    const owner = account.current;
    try {
      await pairBracelet(person.id, identity.current, owner);
      const savedLink = await getBraceletLink(person.id);
      if (account.current !== owner) return;
      if (!savedLink || savedLink.device_id !== identity.current?.device_id)
        throw new Error("Kopplingen kunde inte bekräftas. Försök igen.");
      setLink(savedLink);
      identity.current = null;
      setStep("paired");
      setMessage("");
    } catch (error) {
      if (account.current === owner)
        setMessage(
          error instanceof Error
            ? error.message
            : "Kopplingen kunde inte sparas.",
        );
    } finally {
      if (account.current === owner) {
        working.current = false;
        setBusy(false);
      }
    }
  };

  const removePairing = async () => {
    if (working.current || !person || !account.current) return;
    working.current = true;
    setBusy(true);
    const owner = account.current;
    try {
      await unlinkBracelet(person.id, owner);
      if (account.current !== owner) return;
      setLink(null);
      identity.current = null;
      setStep(0);
      setMessage("Armbandskopplingen är borttagen.");
    } catch (error) {
      if (account.current === owner)
        setMessage(
          error instanceof Error
            ? error.message
            : "Kopplingen kunde inte tas bort.",
        );
    } finally {
      if (account.current === owner) {
        working.current = false;
        setBusy(false);
      }
    }
  };

  const goToStep = (next: 0 | 1 | 2 | 3) => {
    if (next <= 1) identity.current = null;
    setStep(next);
    setMessage("");
    setPassword("");
    setShowPassword(false);
  };

  const finishWifiSetup = async (token: string) => {
    setStep("done");
    setMessage("");
    try {
      await request("/api/finish", token, {});
    } catch {
      // Setup also closes automatically; the verified Wi-Fi result stays valid.
    }
  };

  const keepSavedWifi = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    const owner = account.current;
    setMessage("Kontrollerar armbandets Wi-Fi...");
    try {
      const token = await readSetupToken();
      const actualIdentity = readBraceletIdentity(
        await request("/api/pairing", token),
      );
      if (account.current !== owner) return;
      if (
        !identity.current ||
        actualIdentity.device_id !== identity.current.device_id ||
        actualIdentity.device_secret !== identity.current.device_secret
      )
        throw new Error("Armbandet har ändrats. Börja om anslutningen.");
      const status = await request("/api/status", token);
      if (account.current !== owner) return;
      if (status.connected !== true)
        throw new Error(
          "Armbandet är inte anslutet till Wi-Fi. Fyll i nätverket nedan och anslut först.",
        );
      await finishWifiSetup(token);
    } catch (error) {
      if (account.current === owner)
        setMessage(
          error instanceof Error
            ? error.message
            : "Kunde inte kontrollera nätverket.",
        );
    } finally {
      if (account.current === owner) {
        working.current = false;
        setBusy(false);
      }
    }
  };

  const checkBracelet = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setMessage("Söker efter armbandet...");
    const owner = account.current;
    try {
      const token = await readSetupToken();
      const response = await request("/api/pairing", token);
      if (account.current !== owner) return;
      identity.current = readBraceletIdentity(response);
      goToStep(3);
    } catch {
      setMessage(
        "Armbandets kopplingsuppgifter kunde inte läsas. Kontrollera att mobilen är på Armband-nätverket och att den uppdaterade wifi_setup.py är installerad. Tryck tre korta gånger på knappen om WIFI har försvunnit.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  const connect = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setMessage("Söker efter armbandet...");
    const owner = account.current;
    try {
      const token = await readSetupToken();
      const actualIdentity = readBraceletIdentity(
        await request("/api/pairing", token),
      );
      if (account.current !== owner) return;
      if (
        !identity.current ||
        actualIdentity.device_id !== identity.current.device_id ||
        actualIdentity.device_secret !== identity.current.device_secret
      )
        throw new Error("Bracelet changed");
      await request("/api/wifi", token, { ssid, password });
      setPassword("");
      setMessage("Armbandet försöker ansluta till ditt Wi-Fi...");
      let missedReplies = 0;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        let status: Record<string, unknown>;
        try {
          status = await request("/api/status", token);
          missedReplies = 0;
        } catch (error) {
          // Joining the home network can briefly change the ESP32's Wi-Fi channel.
          if (++missedReplies >= 3) throw error;
          continue;
        }
        if (
          typeof status.type === "string" &&
          BRACELET_TYPES.has(status.type) &&
          status.state === "saved" &&
          status.connected === true
        ) {
          if (account.current !== owner) return;
          await finishWifiSetup(token);
          return;
        }
        if (status.state === "failed") {
          setMessage(
            "Armbandet kunde inte ansluta eller spara nätverket. Kontrollera Wi-Fi-namn och lösenord och försök igen. Tidigare sparade inställningar finns kvar.",
          );
          return;
        }
      }
      throw new Error("Connection timed out");
    } catch {
      setPassword("");
      setStep(2);
      setMessage(
        "Kontakten med armbandet bröts. Kontrollera mobilens Wi-Fi och försök igen. Om WIFI har försvunnit från armbandets skärm: tryck tre korta gånger på knappen för att öppna anslutningen igen.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityLiveRegion="polite">
        {step === "paired"
          ? "Armbandet är kopplat"
          : step === "done"
            ? "Wi-Fi är inställt"
            : "Anslut armbandet"}
      </Text>
      {Platform.OS === "web" ? (
        <Text style={styles.text}>
          Wi-Fi-installationen görs i iPhone- eller Android-appen.
        </Text>
      ) : (
        <>
          {step === 0 && (
            <>
              {people.length > 1 && (
                <>
                  <Text style={styles.subtitle}>
                    Vem ska använda armbandet?
                  </Text>
                  <Text style={styles.text}>
                    Tryck på rätt registrering för att välja. Du behöver välja
                    en person innan du fortsätter.
                  </Text>
                  {people.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: person?.id === item.id }}
                      disabled={loadingPeople || busy}
                      onPress={() => void choosePerson(item)}
                      style={[
                        styles.personOption,
                        person?.id === item.id && styles.personOptionSelected,
                      ]}
                    >
                      <View style={styles.personOptionHeader}>
                        <View
                          style={[
                            styles.radio,
                            person?.id === item.id && styles.radioSelected,
                          ]}
                        >
                          {person?.id === item.id && (
                            <View style={styles.radioDot} />
                          )}
                        </View>
                        <Text style={styles.personRole}>
                          {item.registration_for === "self"
                            ? "Jag själv"
                            : "Någon annan"}
                        </Text>
                        {person?.id === item.id && (
                          <Text style={styles.selectedLabel}>Vald</Text>
                        )}
                      </View>
                      <Text style={styles.personName}>
                        {item.first_name || "Namnlös registrering"}
                        {item.last_name ? ` ${item.last_name}` : ""}
                      </Text>
                      <Text style={styles.personDetails}>
                        {item.registration_for === "self"
                          ? "Min egen registrering"
                          : "Registrerad åt någon annan"}
                      </Text>
                      {[item.street, item.postal_code, item.city].some(
                        Boolean,
                      ) && (
                        <Text style={styles.personDetails}>
                          {[item.street, item.postal_code, item.city]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      )}
                      {!Number.isNaN(new Date(item.created_at).getTime()) && (
                        <Text style={styles.personDetails}>
                          Skapad{" "}
                          {new Date(item.created_at).toLocaleString("sv-SE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </>
              )}
              {person && (
                <Text style={styles.text}>
                  Vald person: {person.first_name || "vald person"}
                  {person.last_name ? ` ${person.last_name}` : ""}
                  {"\n"}
                  {person.registration_for === "self"
                    ? "Min egen registrering"
                    : "Registrerad åt någon annan"}
                </Text>
              )}
              {link && (
                <Text style={styles.subtitle}>
                  Ett armband är kopplat till {person?.first_name || "personen"}
                  .
                </Text>
              )}
              {link && (
                <Text style={styles.note}>
                  {link.sos_enabled === true
                    ? "SOS är aktiverat i appen. Med den uppdaterade armbandskoden kan du hålla inne knappen i 1,5 sekunder för att be om hjälp."
                    : link.sos_enabled === false
                      ? "Armbandet är kopplat. SOS är ännu inte aktiverat i appen."
                      : "Armbandet är kopplat. Anslut mobilen till internet för att kontrollera SOS-status."}
                </Text>
              )}
              <Text style={styles.text}>
                Vi hjälper dig att ställa in Wi-Fi, ett steg i taget. Armbandet
                minns sedan ditt nätverk.
              </Text>
              <Text style={styles.text}>
                Be gärna en närstående hjälpa till första gången.
              </Text>
              <View style={styles.button}>
                <PrimaryButton
                  title={
                    loadingPeople
                      ? "Hämtar..."
                      : link
                        ? "Ställ in Wi-Fi igen"
                        : "Börja här"
                  }
                  disabled={loadingPeople || busy || !person}
                  onPress={() => goToStep(1)}
                />
              </View>
              {link && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "Ta bort armbandskopplingen?",
                      "Wi-Fi-inställningarna på armbandet finns kvar.",
                      [
                        { text: "Behåll", style: "cancel" },
                        {
                          text: "Ta bort",
                          style: "destructive",
                          onPress: () => void removePairing(),
                        },
                      ],
                    )
                  }
                  style={styles.textButton}
                >
                  <Text style={styles.link}>Ta bort kopplingen</Text>
                </Pressable>
              )}
              {!loadingPeople && people.length === 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setReload((value) => value + 1)}
                  style={styles.textButton}
                >
                  <Text style={styles.link}>Försök hämta igen</Text>
                </Pressable>
              )}
            </>
          )}
          {typeof step === "number" && step > 0 && (
            <Text style={styles.step}>Steg {step} av 3</Text>
          )}
          {step === 1 && (
            <>
              <Text style={styles.subtitle}>Starta armbandet</Text>
              <Text style={styles.text}>Titta på skärmen. Står det WIFI?</Text>
              <Text style={styles.text}>
                Om det inte står WIFI: tryck tre korta gånger på armbandets
                knapp.
              </Text>
              <View style={styles.button}>
                <PrimaryButton
                  title="Jag ser WIFI"
                  onPress={() => goToStep(2)}
                />
              </View>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.subtitle}>Anslut mobilen till armbandet</Text>
              <Text style={styles.text}>
                Öppna Inställningar på mobilen och välj Wi-Fi.
              </Text>
              <Text style={styles.text}>
                Välj Armband- följt av de sex tecknen på armbandets skärm.
              </Text>
              <Text style={styles.text}>
                Lösenordet är de nio tecknen på skärmens nedersta rad.
              </Text>
              <Text style={styles.text}>
                Stanna kvar även om mobilen säger ”inget internet”. Gå sedan
                tillbaka hit utan att ladda om appen.
              </Text>
              <View style={styles.button}>
                <PrimaryButton
                  title={busy ? "Kontrollerar..." : "Jag har anslutit mobilen"}
                  disabled={busy}
                  onPress={() => void checkBracelet()}
                />
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.subtitle}>Ditt Wi-Fi hemma</Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void keepSavedWifi()}
                style={styles.textButton}
              >
                <Text style={styles.link}>Behåll armbandets Wi-Fi</Text>
              </Pressable>
              <Text style={styles.text}>
                Nu har vi kontakt med armbandet. Skriv namnet och lösenordet
                till nätverket du använder hemma.
              </Text>
              <FormInput
                label="Wi-Fi-namn hemma"
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <FormInput
                label="Wi-Fi-lösenord hemma"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: showPassword, disabled: busy }}
                disabled={busy}
                onPress={() => setShowPassword(!showPassword)}
                style={styles.textButton}
              >
                <Text style={styles.link}>
                  {showPassword ? "Dölj lösenord" : "Visa lösenord"}
                </Text>
              </Pressable>
              <Text style={styles.note}>
                Använd ett lösenordsskyddat nätverk på 2,4 GHz. Uppgifterna
                finns ofta på en etikett på din router.
              </Text>
              <View style={styles.button}>
                <PrimaryButton
                  title={busy ? "Ansluter..." : "Anslut armbandet"}
                  disabled={busy || !ssid.trim() || password.length < 8}
                  onPress={() => void connect()}
                />
              </View>
            </>
          )}
          {step === "done" && (
            <>
              <Text style={styles.text}>
                Armbandet har anslutit och sparat ditt nätverk. Du behöver inte
                göra om detta när du startar armbandet igen.
              </Text>
              <Text style={styles.text}>
                Sista steget: anslut mobilen till ditt vanliga Wi-Fi igen. Tryck
                sedan nedan för att koppla armbandet till{" "}
                {person?.first_name || "vald person"}.
              </Text>
              <View style={styles.button}>
                <PrimaryButton
                  title={busy ? "Vänta..." : "Spara armbandskopplingen"}
                  disabled={busy || !person}
                  onPress={() => void savePairing()}
                />
              </View>
              <Text style={styles.note}>
                Detta bekräftar Wi-Fi-anslutningen. Spara kopplingen för att
                ange vem som ska använda armbandet.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => goToStep(0)}
                style={styles.textButton}
              >
                <Text style={styles.link}>Ställ in ett annat nätverk</Text>
              </Pressable>
            </>
          )}
          {step === "paired" && (
            <>
              <Text style={styles.text}>
                Kopplingen till {person?.first_name || "personen"} är sparad på
                kontot och finns kvar efter omstart.
              </Text>
              <Text style={styles.note}>
                {link?.sos_enabled === true
                  ? "SOS är aktiverat i appen. Använd den uppdaterade armbandskoden och kontrollera att förfrågan syns under Hem när du provar knappen."
                  : link?.sos_enabled === false
                    ? "SOS från armbandet till appen är ännu inte aktiverat."
                    : "Anslut mobilen till internet för att kontrollera SOS-status."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => goToStep(0)}
                style={styles.textButton}
              >
                <Text style={styles.link}>Till armbandsinställningarna</Text>
              </Pressable>
            </>
          )}
          {typeof step === "number" && step > 0 && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => goToStep(step === 3 ? 2 : step === 2 ? 1 : 0)}
              style={styles.textButton}
            >
              <Text style={styles.link}>Tillbaka</Text>
            </Pressable>
          )}
        </>
      )}
      {message !== "" && (
        <Text style={styles.text} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    paddingVertical: 4,
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  step: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: colors.text,
  },
  text: { marginTop: 14, fontSize: 17, lineHeight: 26, color: colors.text },
  textButton: { minHeight: 48, justifyContent: "center", marginTop: 8 },
  personDetails: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  personOption: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  personOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E7F1F8",
  },
  personOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  personRole: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  personName: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.text,
  },
  selectedLabel: { fontSize: 14, fontWeight: "700", color: colors.primary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  link: { fontSize: 16, fontWeight: "600", color: colors.primary },
  note: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  button: { marginTop: 20 },
});
