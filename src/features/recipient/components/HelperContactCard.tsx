import { Phone } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants/colors";
import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";

type HelperContact = {
  first_name: string;
  last_name: string;
  phone: string;
};

type Props = {
  requestId: string;
  fallbackName: string;
};

export default function HelperContactCard({ requestId, fallbackName }: Props) {
  const [contact, setContact] = useState<HelperContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const reload = useReloadableFocusEffect(
    useCallback(() => {
      let active = true;
      const abort = new AbortController();

      setLoading(true);
      setContact(null);
      setMessage("");

      const load = async () => {
        try {
          const { data, error } = await supabase
            .rpc("get_request_helper_contact", {
              p_request_id: requestId,
            })
            .abortSignal(abort.signal)
            .maybeSingle();

          if (!active) return;
          if (error || !data) throw new Error("Contact unavailable");

          setContact(data as HelperContact);
        } catch {
          if (active) {
            setMessage("Kunde inte hämta volontärens kontaktuppgifter.");
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
    }, [requestId]),
  );

  const fullName = contact
    ? [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || fallbackName
    : fallbackName;

  const initials = contact
    ? [contact.first_name, contact.last_name]
        .map((part) => part?.trim().charAt(0) || "")
        .join("")
        .toLocaleUpperCase("sv-SE") ||
      fallbackName.charAt(0).toLocaleUpperCase("sv-SE")
    : fallbackName.charAt(0).toLocaleUpperCase("sv-SE");

  const phone = contact?.phone?.trim() || "";
  const dialNumber = phone.replace(/[^+\d]/g, "");
  const canCall = /^\+?\d{5,15}$/.test(dialNumber);

  const callHelper = async () => {
    if (!canCall) return;

    setMessage("");

    try {
      await Linking.openURL(`tel:${dialNumber}`);
    } catch {
      setMessage(
        "Kunde inte öppna telefonen. Du kan ringa numret ovan via telefonappen.",
      );
    }
  };

  return (
    <View style={styles.helperCard}>
      <View style={styles.helperHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.helperInfo}>
          <Text style={styles.smallText}>Din volontär</Text>
          <Text style={styles.helperName}>{fullName}</Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.contactLoading}
            />
          ) : phone ? (
            <Text selectable style={styles.helperPhone}>
              {phone}
            </Text>
          ) : !message ? (
            <Text style={styles.smallText}>Telefonnummer saknas</Text>
          ) : null}
        </View>
      </View>

      {canCall && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ring ${fullName}`}
          onPress={() => void callHelper()}
          style={({ pressed }) => [
            styles.callButton,
            pressed && styles.pressed,
          ]}
        >
          <Phone size={19} color={colors.surface} />
          <Text style={styles.callButtonText}>
            Ring {contact?.first_name?.trim() || "volontären"}
          </Text>
        </Pressable>
      )}

      {message ? (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      {!loading && !contact && (
        <Pressable
          accessibilityRole="button"
          onPress={() => reload()}
          style={styles.textButton}
        >
          <Text style={styles.link}>Försök igen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  helperCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  helperHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBackground,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.primary,
  },
  helperInfo: { flex: 1 },
  smallText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  helperName: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },
  contactLoading: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  helperPhone: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  callButton: {
    marginTop: 20,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
  },
  callButtonText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    fontWeight: "600",
    color: colors.surface,
  },
  pressed: { opacity: 0.65 },
  message: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.error,
  },
  textButton: {
    minHeight: 44,
    paddingVertical: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
