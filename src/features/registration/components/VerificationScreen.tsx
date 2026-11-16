import { Check, Info, ShieldCheck, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/colors";

type VerificationState = "idle" | "verifying" | "verified";

type VerificationScreenProps = {
  step?: string;
  title: string;
  description?: string;
  verificationDescription?: string;
  verifiedTitle?: string;
  onContinue: () => void;
  onManualVerification?: () => void;
};

export default function VerificationScreen({
  step,
  title,
  description,
  verificationDescription,
  verifiedTitle = "Din identitet är verifierad",
  onContinue,
  onManualVerification,
}: VerificationScreenProps) {
  const [state, setState] = useState<VerificationState>("idle");
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const verificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verificationTimer.current !== null) {
        clearTimeout(verificationTimer.current);
        verificationTimer.current = null;
      }
    };
  }, []);

  const verify = () => {
    if (verificationTimer.current !== null || state === "verified") {
      return;
    }

    setState("verifying");

    // Simulerad verifiering tills riktig BankID-integration finns.
    verificationTimer.current = setTimeout(() => {
      verificationTimer.current = null;
      setState("verified");
    }, 1400);
  };

  const handleContinue = () => {
    if (state !== "verified") return;

    onContinue();
  };

  const isVerifying = state === "verifying";
  const isVerified = state === "verified";

  const currentVerificationDescription = isVerified
    ? "Du kan nu fortsätta registreringen."
    : isVerifying
      ? "Identifieringen pågår..."
      : verificationDescription;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step={step} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.title}>{title}</Text>

          {!!description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>

        <View style={styles.verification} accessibilityLiveRegion="polite">
          <View
            style={[styles.iconCircle, isVerified && styles.iconCircleVerified]}
          >
            {isVerified ? (
              <Check size={64} color={colors.success} strokeWidth={2.5} />
            ) : (
              <ShieldCheck size={72} color={colors.primary} strokeWidth={1.6} />
            )}
          </View>

          <Text style={styles.verificationTitle}>
            {isVerified
              ? verifiedTitle
              : isVerifying
                ? "Väntar på BankID"
                : "Identifiera dig med BankID"}
          </Text>

          {!!currentVerificationDescription && (
            <Text style={styles.verificationDescription}>
              {currentVerificationDescription}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.privacyCard}>
          <Info size={18} color={colors.primary} style={styles.infoIcon} />

          <View style={styles.privacyContent}>
            <Text style={styles.privacyText}>
              Vi behöver dina personuppgifter för att kunna verifiera din
              identitet och skapa din profil.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Så behandlar vi dina personuppgifter"
              onPress={() => setPrivacyVisible(true)}
              style={({ pressed }) => [
                styles.privacyLinkButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.privacyLink}>
                Så behandlar vi dina personuppgifter
              </Text>
            </Pressable>
          </View>
        </View>

        {isVerified ? (
          <PrimaryButton title="Fortsätt" onPress={handleContinue} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isVerifying ? "Väntar på BankID" : "Öppna BankID"
            }
            accessibilityState={{
              disabled: isVerifying,
              busy: isVerifying,
            }}
            disabled={isVerifying}
            onPress={verify}
            style={({ pressed }) => [
              styles.verifyButton,
              pressed && styles.pressed,
              isVerifying && styles.disabled,
            ]}
          >
            {isVerifying && <ActivityIndicator color={colors.surface} />}

            <Text style={styles.verifyButtonText}>
              {isVerifying ? "Väntar på BankID..." : "Öppna BankID"}
            </Text>
          </Pressable>
        )}

        {onManualVerification && !isVerified && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isVerifying }}
            disabled={isVerifying}
            onPress={onManualVerification}
            style={({ pressed }) => [
              styles.manualButton,
              pressed && styles.pressed,
              isVerifying && styles.disabled,
            ]}
          >
            <Text style={styles.manualButtonText}>Fortsätt utan BankID</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={privacyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Dina personuppgifter
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Stäng informationen"
                onPress={() => setPrivacyVisible(false)}
                style={styles.closeButton}
              >
                <X size={23} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>
                Varför vi behöver uppgifterna
              </Text>

              <Text style={styles.modalText}>
                Uppgifterna du lämnar vid registreringen används för att skapa
                din profil och samordna hjälp. Identifieringen är till för att
                bekräfta din identitet.
              </Text>

              <Text style={styles.sectionTitle}>Uppgifter i din profil</Text>

              <Text style={styles.modalText}>
                Registreringen omfattar namn, kontaktuppgifter och adress.
              </Text>
            </ScrollView>

            <PrimaryButton
              title="Stäng"
              onPress={() => setPrivacyVisible(false)}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 16,
  },

  title: {
    maxWidth: 320,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  verification: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 28,
  },

  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBackground,
    marginBottom: 28,
  },

  iconCircleVerified: {
    backgroundColor: colors.successBackground,
  },

  verificationTitle: {
    maxWidth: 300,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },

  verificationDescription: {
    maxWidth: 290,
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 12,
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#F7FAFC",
  },

  infoIcon: {
    marginTop: 2,
  },

  privacyContent: {
    flex: 1,
  },

  privacyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  privacyLinkButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingTop: 4,
  },

  privacyLink: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: colors.primary,
  },

  verifyButton: {
    width: "100%",
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  verifyButtonText: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },

  manualButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  manualButtonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 45, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  modalTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.text,
  },

  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalContent: {
    paddingBottom: 24,
  },

  sectionTitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },

  modalText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.82,
  },

  disabled: {
    opacity: 0.7,
  },
});
