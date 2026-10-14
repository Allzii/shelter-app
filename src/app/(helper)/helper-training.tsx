import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import {
  Check,
  Clock,
  FileText,
  GraduationCap,
  Info,
  UploadCloud,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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
import { supabase } from "@/lib/supabase";

type Certificate = {
  file_name: string;
  status: "pending" | "approved" | "needs_changes";
  review_note: string | null;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export default function HelperTrainingScreen() {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);
  const [message, setMessage] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  const uploadLock = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCertificate = async () => {
        setIsLoading(true);
        setLoadFailed(false);
        setProfileMissing(false);
        setMessage("");

        try {
          const { data: authData, error: authError } =
            await supabase.auth.getUser();

          if (authError || !authData.user) {
            throw new Error("Session unavailable");
          }

          const { data: profile, error: profileError } = await supabase
            .from("helper_profiles")
            .select("account_id")
            .eq("account_id", authData.user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          if (!active) return;

          if (!profile) {
            setProfileMissing(true);
            setMessage("Spara först dina uppgifter på Om dig.");
            return;
          }

          const { data, error } = await supabase
            .from("helper_certificates")
            .select("file_name, status, review_note")
            .eq("account_id", authData.user.id)
            .maybeSingle();

          if (error) throw error;
          if (!active) return;

          setCertificate(data as Certificate | null);
        } catch {
          if (!active) return;

          setLoadFailed(true);
          setMessage(
            "Kunde inte hämta ditt intyg. Kontrollera anslutningen och försök igen."
          );
        } finally {
          if (active) setIsLoading(false);
        }
      };

      void loadCertificate();

      return () => {
        active = false;
      };
    }, [loadAttempt])
  );

  const isApproved = certificate?.status === "approved";
  const isPending = certificate?.status === "pending";

  const handleUpload = async () => {
    if (
      uploadLock.current ||
      isLoading ||
      loadFailed ||
      profileMissing ||
      certificate
    ) {
      return;
    }

    uploadLock.current = true;
    setIsUploading(true);
    setMessage("");

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
        throw new Error("Intyget får vara högst 10 MB.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.mimeType || MIME_TYPES[extension];

      if (
        !mimeType ||
        !["application/pdf", "image/jpeg", "image/png"].includes(mimeType)
      ) {
        throw new Error("Välj ett intyg i PDF-, JPG- eller PNG-format.");
      }

      let fileBytes: ArrayBuffer;

      if (Platform.OS === "web") {
        if (!file.file) {
          throw new Error("Kunde inte läsa filen. Välj den igen.");
        }

        fileBytes = await file.file.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        fileBytes = decode(base64);
      }

      if (fileBytes.byteLength === 0) {
        throw new Error("Filen är tom. Välj ett annat intyg.");
      }

      if (fileBytes.byteLength > MAX_FILE_SIZE) {
        throw new Error("Intyget får vara högst 10 MB.");
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Kunde inte kontrollera inloggningen. Logga in igen.");
      }

      const savedExtension =
        mimeType === "application/pdf"
          ? "pdf"
          : mimeType === "image/png"
            ? "png"
            : "jpg";

      const filePath =
        `${authData.user.id}/${Crypto.randomUUID()}.${savedExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("helper-certificates")
        .upload(filePath, fileBytes, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          "Kunde inte ladda upp filen. Kontrollera anslutningen och försök igen."
        );
      }

      const { data: savedCertificate, error: saveError } = await supabase
        .from("helper_certificates")
        .insert({
          account_id: authData.user.id,
          file_path: filePath,
          file_name: file.name,
          status: "pending",
        })
        .select("file_name, status, review_note")
        .single();

      if (saveError) {
        throw new Error(
          "Filen laddades upp men intyget kunde inte sparas. Uppdatera statusen innan du försöker igen."
        );
      }

      setCertificate(savedCertificate as Certificate);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Något gick fel. Försök igen."
      );
    } finally {
      uploadLock.current = false;
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    if (
      isLoading ||
      uploadLock.current ||
      loadFailed ||
      profileMissing
    ) {
      return;
    }

    router.push("/helper-permissions");
  };

  const certificateTitle = isApproved
    ? "Ditt intyg är godkänt"
    : isPending
      ? "Ditt intyg granskas"
      : "Komplettering behövs";

  const certificateDescription = isApproved
    ? "Ditt utbildningsintyg har godkänts."
    : isPending
      ? "Ditt intyg granskas normalt inom 1 vecka. Du kan fortsätta registreringen under tiden."
      : "Se meddelandet från granskningen nedan.";

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 4 av 5" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Utbildningsintyg</Text>

        <Text style={styles.description}>
          Ladda upp ditt utbildningsintyg, eller komplettera senare.
        </Text>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />

            <Text style={styles.loadingText}>
              Hämtar ditt intyg...
            </Text>
          </View>
        ) : loadFailed || profileMissing ? (
          <View style={styles.errorCard}>
            <Info size={28} color={colors.primary} />

            <Text style={styles.errorTitle}>
              Kunde inte öppna utbildningssteget
            </Text>

            <Text
              style={styles.errorDescription}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>
          </View>
        ) : certificate ? (
          <View style={styles.certificateCard}>
            <View
              style={[
                styles.uploadIcon,
                isApproved && styles.approvedIcon,
              ]}
            >
              {isApproved ? (
                <Check size={26} color={colors.success} />
              ) : isPending ? (
                <Clock size={26} color={colors.primary} />
              ) : (
                <FileText size={26} color={colors.primary} />
              )}
            </View>

            <Text style={styles.uploadTitle}>
              {certificateTitle}
            </Text>

            <Text style={styles.certificateDescription}>
              {certificateDescription}
            </Text>

            <View style={styles.fileRow}>
              <FileText size={21} color={colors.primary} />

              <Text style={styles.fileName}>
                {certificate.file_name}
              </Text>
            </View>

            {certificate.status === "needs_changes" &&
              certificate.review_note && (
                <View style={styles.reviewNote}>
                  <Text style={styles.reviewTitle}>
                    Meddelande från granskningen
                  </Text>

                  <Text style={styles.reviewText}>
                    {certificate.review_note}
                  </Text>
                </View>
              )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setLoadAttempt((current) => current + 1)}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>
                Uppdatera status
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.uploadCard}>
            <View style={styles.uploadIcon}>
              <UploadCloud size={26} color={colors.primary} />
            </View>

            <Text style={styles.uploadTitle}>
              Ladda upp ditt intyg
            </Text>

            <Text style={styles.fileHint}>
              PDF, JPG eller PNG · Högst 10 MB
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Välj intygsfil"
              accessibilityState={{
                disabled: isUploading,
                busy: isUploading,
              }}
              disabled={isUploading}
              onPress={() => void handleUpload()}
              style={({ pressed }) => [
                styles.chooseButton,
                pressed && styles.pressed,
                isUploading && styles.disabled,
              ]}
            >
              {isUploading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.surface}
                />
              ) : (
                <FileText size={18} color={colors.surface} />
              )}

              <Text style={styles.chooseButtonText}>
                {isUploading ? "Laddar upp..." : "Välj fil"}
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading &&
          !loadFailed &&
          !profileMissing &&
          !certificate && (
            <View style={styles.educationCard}>
              <View style={styles.educationIcon}>
                <GraduationCap size={22} color="#247879" />
              </View>

              <View style={styles.educationText}>
                <Text style={styles.educationTitle}>
                  Har du inte gått utbildningen än?
                </Text>

                <Text style={styles.educationDescription}>
                  Utbildningen görs online eller på plats.
                  Ett godkänt intyg krävs för att börja hjälpa.
                </Text>
              </View>
            </View>
          )}

        {message !== "" && !loadFailed && !profileMissing && (
          <View style={styles.uploadError}>
            <Text
              style={styles.message}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isUploading}
              onPress={() => setLoadAttempt((current) => current + 1)}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>
                Uppdatera status
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title={
            isLoading
              ? "Hämtar..."
              : profileMissing
                ? "Till Om dig"
                : loadFailed
                  ? "Försök igen"
                  : isUploading
                    ? "Laddar upp..."
                    : certificate
                      ? "Fortsätt"
                      : "Fortsätt utan intyg"
          }
          disabled={isLoading || isUploading}
          onPress={() => {
            if (profileMissing) {
              router.replace("/helper-details");
            } else if (loadFailed) {
              setLoadAttempt((current) => current + 1);
            } else {
              handleContinue();
            }
          }}
        />
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },

  title: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  uploadCard: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A9CDE3",
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  uploadIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EDF4F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  uploadTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
  },

  fileHint: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.textSecondary,
  },

  chooseButton: {
    alignSelf: "stretch",
    minHeight: 46,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  chooseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },

  educationCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  educationIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E5F3F2",
    alignItems: "center",
    justifyContent: "center",
  },

  educationText: {
    flex: 1,
  },

  educationTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.text,
  },

  educationDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  certificateCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  certificateDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: colors.textSecondary,
  },

  fileRow: {
    alignSelf: "stretch",
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#EDF4F8",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  fileName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "500",
  },

  statusBadge: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#DCEAF3",
  },

  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

  approvedIcon: {
    backgroundColor: colors.successBackground,
  },

  approvedBadge: {
    backgroundColor: colors.successBackground,
  },

  approvedText: {
    color: colors.success,
  },

  reviewNote: {
    alignSelf: "stretch",
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
  },

  reviewTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },

  reviewText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  refreshButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  refreshText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  loadingCard: {
    marginTop: 20,
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.textSecondary,
  },

  errorCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "600",
    textAlign: "center",
    color: colors.text,
  },

  errorDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: colors.error,
  },

  uploadError: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.background,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.6,
  },
});