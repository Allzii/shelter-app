import * as Location from "expo-location";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import * as Notifications from "expo-notifications";
import {
  Bell,
  Check,
  Info,
  MapPin,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
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

type PermissionState =
  | "checking"
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "blocked"
  | "error"
  | "unavailable";

type PermissionsScreenProps = {
  step: string;
  locationDescription: string;
  notificationDescription: string;
  buttonTitle: string;
  onContinue: () => void;
  showLocation?: boolean;
};

function notificationsAllowed(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.granted ||
    permission.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

function permissionState(
  granted: boolean,
  status: string,
  canAskAgain: boolean,
): PermissionState {
  if (granted) return "granted";
  if (!canAskAgain) return "blocked";
  if (status === "denied") return "denied";

  return "idle";
}

export default function PermissionsScreen({
  step,
  locationDescription,
  notificationDescription,
  buttonTitle,
  onContinue,
  showLocation = true,
}: PermissionsScreenProps) {
  const [locationState, setLocationState] =
    useState<PermissionState>("checking");

  const [notificationState, setNotificationState] =
    useState<PermissionState>("checking");

  const [message, setMessage] = useState("");

  const requestingLocation = useRef(false);
  const requestingNotifications = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let latestCheck = 0;

    const loadPermissions = async () => {
      const check = ++latestCheck;

      const [locationResult, notificationResult] = await Promise.allSettled([
        showLocation
          ? Location.getForegroundPermissionsAsync()
          : Promise.resolve(null),
        Platform.OS === "web"
          ? Promise.resolve(null)
          : Notifications.getPermissionsAsync(),
      ]);

      if (!active || check !== latestCheck) return;

      if (showLocation && !requestingLocation.current) {
        if (locationResult.status === "fulfilled" && locationResult.value) {
          const permission = locationResult.value;

          setLocationState(
            permissionState(
              permission.granted,
              permission.status,
              permission.canAskAgain,
            ),
          );
        } else {
          setLocationState("error");
        }
      }

      if (!requestingNotifications.current) {
        if (Platform.OS === "web") {
          setNotificationState("unavailable");
        } else if (
          notificationResult.status === "fulfilled" &&
          notificationResult.value
        ) {
          const permission = notificationResult.value;

          setNotificationState(
            permissionState(
              notificationsAllowed(permission),
              permission.status,
              permission.canAskAgain,
            ),
          );
        } else {
          setNotificationState("error");
        }
      }
    };

    void loadPermissions();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadPermissions();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [showLocation]);

  const openSettings = async () => {
    setMessage("");

    if (Platform.OS === "web") {
      setMessage(
        "Ändra platsbehörigheten i webbläsarens inställningar för den här webbplatsen och ladda sedan om sidan.",
      );
      return;
    }

    try {
      await Linking.openSettings();
    } catch {
      if (!mounted.current) return;

      setMessage(
        "Kunde inte öppna inställningarna. Öppna telefonens inställningar och välj appen.",
      );
    }
  };

  const requestLocation = async () => {
    if (
      !showLocation ||
      requestingLocation.current ||
      requestingNotifications.current
    ) {
      return;
    }

    if (locationState === "blocked") {
      await openSettings();
      return;
    }

    requestingLocation.current = true;
    setLocationState("requesting");
    setMessage("");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted.current) return;

      setLocationState(
        permissionState(
          permission.granted,
          permission.status,
          permission.canAskAgain,
        ),
      );
    } catch {
      if (!mounted.current) return;

      setLocationState("error");
    } finally {
      requestingLocation.current = false;
    }
  };

  const requestNotifications = async () => {
    if (requestingNotifications.current || requestingLocation.current) {
      return;
    }

    if (Platform.OS === "web") return;

    if (notificationState === "blocked") {
      await openSettings();
      return;
    }

    requestingNotifications.current = true;
    setNotificationState("requesting");
    setMessage("");

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("alerts", {
          name: "Hjälpförfrågningar",
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const permission = await Notifications.requestPermissionsAsync();

      if (!mounted.current) return;

      setNotificationState(
        permissionState(
          notificationsAllowed(permission),
          permission.status,
          permission.canAskAgain,
        ),
      );
    } catch {
      if (!mounted.current) return;

      setNotificationState("error");
    } finally {
      requestingNotifications.current = false;
    }
  };

  const isRequesting =
    locationState === "requesting" || notificationState === "requesting";

  const handleContinue = () => {
    if (requestingLocation.current || requestingNotifications.current) {
      return;
    }

    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step={step} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Håll dig uppdaterad</Text>

        <View style={styles.cards}>
          <PermissionCard
            icon={Bell}
            title="Notiser"
            description={notificationDescription}
            state={notificationState}
            allowLabel="Tillåt notiser"
            disabled={isRequesting}
            onPress={() => void requestNotifications()}
          />

          {showLocation && (
            <PermissionCard
              icon={MapPin}
              title="Din position"
              description={locationDescription}
              state={locationState}
              allowLabel="Tillåt platsåtkomst"
              disabled={isRequesting}
              onPress={() => void requestLocation()}
            />
          )}
        </View>

        <View style={styles.infoRow}>
          <Info
            size={17}
            color={colors.textSecondary}
            style={styles.infoIcon}
          />

          <Text style={styles.infoText}>
            {Platform.OS === "web"
              ? "Platsåtkomst hanteras i webbläsaren. Notiser ställer du in i appen på telefonen."
              : "Du kan ändra behörigheterna senare i telefonens inställningar."}
          </Text>
        </View>

        {message !== "" && (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {message}
          </Text>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title={buttonTitle}
          disabled={isRequesting}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

type PermissionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  state: PermissionState;
  allowLabel: string;
  disabled: boolean;
  onPress: () => void;
};

function PermissionCard({
  icon: Icon,
  title,
  description,
  state,
  allowLabel,
  disabled,
  onPress,
}: PermissionCardProps) {
  const isGranted = state === "granted";
  const isBusy = state === "checking" || state === "requesting";
  const isUnavailable = state === "unavailable";

  const buttonLabel =
    state === "blocked"
      ? Platform.OS === "web"
        ? "Ändra i webbläsaren"
        : "Öppna inställningar"
      : state === "denied" || state === "error"
        ? "Försök igen"
        : allowLabel;

  const statusMessage =
    state === "blocked"
      ? Platform.OS === "web"
        ? "Behörigheten behöver ändras i webbläsarens inställningar."
        : "Behörigheten behöver ändras i telefonens inställningar."
      : state === "denied"
        ? "Inte tillåtet ännu. Du kan försöka igen."
        : state === "error"
          ? "Kunde inte kontrollera behörigheten. Försök igen."
          : "";

  return (
    <View style={[styles.card, isGranted && styles.cardGranted]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, isGranted && styles.cardIconGranted]}>
          <Icon
            size={23}
            color={isGranted ? colors.success : colors.primary}
            strokeWidth={1.8}
          />
        </View>

        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.cardDescription}>{description}</Text>

      <View accessibilityLiveRegion="polite">
        {isGranted ? (
          <View style={styles.grantedRow}>
            <Check size={19} color={colors.success} strokeWidth={2.5} />

            <Text style={styles.grantedText}>Tillåtet</Text>
          </View>
        ) : isUnavailable ? (
          <Text style={styles.unavailableText}>
            Aktiveras i appen på telefonen
          </Text>
        ) : (
          <>
            {statusMessage !== "" && (
              <Text style={styles.statusMessage}>{statusMessage}</Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title}: ${
                isBusy ? "Kontrollerar behörighet" : buttonLabel
              }`}
              accessibilityState={{
                disabled: disabled || isBusy,
                busy: isBusy,
              }}
              disabled={disabled || isBusy}
              onPress={onPress}
              style={({ pressed }) => [
                styles.permissionButton,
                pressed && styles.pressed,
                (disabled || isBusy) && styles.disabled,
              ]}
            >
              {isBusy && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}

              <Text style={styles.permissionButtonText}>
                {state === "checking"
                  ? "Kontrollerar..."
                  : state === "requesting"
                    ? "Väntar på ditt svar..."
                    : buttonLabel}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
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
    paddingTop: 24,
    paddingBottom: 20,
  },

  title: {
    fontSize: 29,
    lineHeight: 37,
    fontWeight: "700",
    color: colors.text,
  },

  cards: {
    marginTop: 24,
    gap: 16,
  },

  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  cardGranted: {
    borderColor: "#BDDBCD",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EFF6",
  },

  cardIconGranted: {
    backgroundColor: colors.successBackground,
  },

  cardTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },

  cardDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  permissionButton: {
    minHeight: 46,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#E6EFF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  permissionButtonText: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.primary,
  },

  grantedRow: {
    minHeight: 46,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  grantedText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.success,
  },

  statusMessage: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  unavailableText: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  infoRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 2,
  },

  infoIcon: {
    marginTop: 2,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  message: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.6,
  },
});
