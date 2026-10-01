import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Bell, Check, MapPin, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "error";

type PermissionsScreenProps = {
  step: string;
  description: string;
  locationDescription: string;
  notificationDescription: string;
  buttonTitle: string;
  onContinue: () => void;
};

function notificationsAllowed(
  permission: Notifications.NotificationPermissionsStatus
) {
  return (
    permission.granted ||
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export default function PermissionsScreen({
  step,
  description,
  locationDescription,
  notificationDescription,
  buttonTitle,
  onContinue,
}: PermissionsScreenProps) {
  const [locationState, setLocationState] =
    useState<PermissionState>("idle");
  const [notificationState, setNotificationState] =
    useState<PermissionState>("idle");

  const requestingLocation = useRef(false);
  const requestingNotifications = useRef(false);

  useEffect(() => {
    let active = true;
    let latestCheck = 0;

    const loadCurrentPermissions = async () => {
      const check = ++latestCheck;

      const [locationResult, notificationResult] =
        await Promise.allSettled([
          Location.getForegroundPermissionsAsync(),
          Notifications.getPermissionsAsync(),
        ]);

      if (!active || check !== latestCheck) return;

      if (!requestingLocation.current) {
        if (locationResult.status === "fulfilled") {
          const permission = locationResult.value;

          setLocationState(
            permission.granted
              ? "granted"
              : permission.status === "denied"
                ? "denied"
                : "idle"
          );
        } else {
          setLocationState("error");
        }
      }

      if (!requestingNotifications.current) {
        if (notificationResult.status === "fulfilled") {
          const permission = notificationResult.value;

          setNotificationState(
            notificationsAllowed(permission)
              ? "granted"
              : permission.status === "denied"
                ? "denied"
                : "idle"
          );
        } else {
          setNotificationState("error");
        }
      }
    };

    void loadCurrentPermissions();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadCurrentPermissions();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const requestLocation = async () => {
    if (requestingLocation.current) return;

    requestingLocation.current = true;
    setLocationState("requesting");

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationState("denied");
        showPermissionDenied("position", permission.canAskAgain);
        return;
      }

      setLocationState("granted");
    } catch {
      setLocationState("error");

      Alert.alert(
        "Kunde inte kontrollera platsbehörigheten",
        "Försök igen eller kontrollera telefonens inställningar."
      );
    } finally {
      requestingLocation.current = false;
    }
  };

  const requestNotifications = async () => {
    if (requestingNotifications.current) return;

    requestingNotifications.current = true;
    setNotificationState("requesting");

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("alerts", {
          name: "Hjälpförfrågningar",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const permission = await Notifications.requestPermissionsAsync();

      if (!notificationsAllowed(permission)) {
        setNotificationState("denied");
        showPermissionDenied("notiser", permission.canAskAgain);
        return;
      }

      setNotificationState("granted");
    } catch {
      setNotificationState("error");

      Alert.alert(
        "Kunde inte kontrollera notisbehörigheten",
        "Försök igen eller kontrollera telefonens inställningar."
      );
    } finally {
      requestingNotifications.current = false;
    }
  };

  // Restore this check after testing:
  // const isComplete =
  //   locationState === "granted" &&
  //   notificationState === "granted";

  const handleContinue = () => {
    // if (!isComplete) return;
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
        <Text style={styles.title}>Notiser och position</Text>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.settings}>
          <PermissionRow
            icon={MapPin}
            title="Position"
            description={getPermissionDescription(
              locationState,
              "Platsbehörighet",
              locationDescription
            )}
            state={locationState}
            onPress={() => void requestLocation()}
          />

          <PermissionRow
            icon={Bell}
            title="Notiser"
            description={getPermissionDescription(
              notificationState,
              "Notiser",
              notificationDescription
            )}
            state={notificationState}
            onPress={() => void requestNotifications()}
            isLast
          />
        </View>

        <Text style={styles.infoText}>
          Du kan ändra behörigheterna senare i telefonens inställningar.
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title={buttonTitle}
          // disabled={!isComplete}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

function showPermissionDenied(
  permissionName: string,
  canAskAgain: boolean
) {
  if (canAskAgain) {
    Alert.alert(
      "Behörighet behövs",
      `Tillåt ${permissionName} för att använda den här funktionen.`
    );
    return;
  }

  Alert.alert(
    "Öppna Inställningar",
    `Tillåt ${permissionName} för TryggNära i telefonens inställningar.`,
    [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Öppna Inställningar",
        onPress: () => {
          void Linking.openSettings().catch(() => {
            Alert.alert(
              "Kunde inte öppna Inställningar",
              "Öppna telefonens inställningar och välj TryggNära."
            );
          });
        },
      },
    ]
  );
}

function getPermissionDescription(
  state: PermissionState,
  name: "Platsbehörighet" | "Notiser",
  idleDescription: string
) {
  switch (state) {
    case "requesting":
      return "Kontrollerar behörighet...";
    case "denied":
      return name === "Notiser"
        ? "Notiser är inte tillåtna"
        : "Platsbehörighet är inte tillåten";
    case "granted":
      return name === "Notiser"
        ? "Notiser är tillåtna"
        : "Platsbehörighet är tillåten";
    case "error":
      return "Kunde inte kontrollera behörigheten";
    default:
      return idleDescription;
  }
}

type PermissionRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  state: PermissionState;
  onPress: () => void;
  isLast?: boolean;
};

function PermissionRow({
  icon: Icon,
  title,
  description,
  state,
  onPress,
  isLast = false,
}: PermissionRowProps) {
  const isGranted = state === "granted";
  const isRequesting = state === "requesting";
  const needsRetry = state === "denied" || state === "error";
  const isDisabled = isGranted || isRequesting;

  const buttonLabel = isGranted
    ? `${title}: behörighet tillåten`
    : isRequesting
      ? `Kontrollerar behörighet för ${title.toLowerCase()}`
      : needsRetry
        ? `Försök igen med ${title.toLowerCase()}`
        : `Tillåt ${title.toLowerCase()}`;

  return (
    <View style={[styles.settingRow, isLast && styles.lastSettingRow]}>
      <View style={styles.settingIcon}>
        <Icon size={22} color= {colors.primary} />
      </View>

      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{
          disabled: isDisabled,
          busy: isRequesting,
        }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.permissionButton,
          isGranted && styles.permissionButtonGranted,
          needsRetry && styles.permissionButtonDenied,
          pressed && styles.pressed,
        ]}
      >
        {isRequesting ? (
          <ActivityIndicator size="small" color= {colors.primary } />
        ) : isGranted ? (
          <Check size={18} color= {colors.success} strokeWidth={3} />
        ) : (
          <Text
            style={[
              styles.permissionButtonText,
              needsRetry && styles.permissionButtonRetryText,
            ]}
          >
            {needsRetry ? "Försök igen" : "Tillåt"}
          </Text>
        )}
      </Pressable>
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 25,
  },

  title: {
    maxWidth: 320,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },

  settings: {
    marginTop: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  settingRow: {
    minHeight: 94,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  lastSettingRow: {
    borderBottomWidth: 0,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginRight: 12,
  },

  settingText: {
    flex: 1,
    paddingRight: 10,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  settingDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  permissionButton: {
    minWidth: 62,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAF1",
  },

  permissionButtonGranted: {
    minWidth: 44,
    paddingHorizontal: 9,
    backgroundColor: colors.successBackground,
  },

  permissionButtonDenied: {
    backgroundColor: colors.errorBackground,
  },

  permissionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  permissionButtonRetryText: {
    color: colors.error,
  },

  pressed: {
    opacity: 0.7,
  },

  infoText: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 19,
    color: "#6F7D8B",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 12,
  },
});