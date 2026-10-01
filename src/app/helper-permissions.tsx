import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AlertCircle, Bell, Check, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";

type PermissionState = "idle" | "requesting" | "granted" | "denied";

export default function HelperPermissionsScreen() {
  const [locationState, setLocationState] =
    useState<PermissionState>("idle");
  const [notificationState, setNotificationState] =
    useState<PermissionState>("idle");
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    const loadCurrentPermissions = async () => {
      const [locationPermission, notificationPermission] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      if (locationPermission.status === "granted") {
        setLocationState("requesting");
        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation(position);
          setLocationState("granted");
        } catch {
          setLocationState("denied");
        }
      }

      if (notificationPermission.status === "granted") {
        setNotificationState("granted");
      }
    };

    void loadCurrentPermissions();
  }, []);

  const requestLocation = async () => {
    setLocationState("requesting");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationState("denied");
        showPermissionDenied("position", permission.canAskAgain);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(position);
      setLocationState("granted");
    } catch {
      setLocationState("denied");
      Alert.alert(
        "Kunde inte hämta positionen",
        "Kontrollera att platstjänster är aktiverade och försök igen."
      );
    }
  };

  const requestNotifications = async () => {
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

      if (permission.status !== "granted") {
        setNotificationState("denied");
        showPermissionDenied("notiser", permission.canAskAgain);
        return;
      }

      setNotificationState("granted");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TryggNära",
          body: "Notiser är aktiverade. Du kan nu få hjälpförfrågningar.",
          sound: "default",
        },
        trigger: null,
      });
    } catch {
      setNotificationState("denied");
      Alert.alert(
        "Kunde inte aktivera notiser",
        "Kontrollera telefonens inställningar och försök igen."
      );
    }
  };

  const isComplete =
    locationState === "granted" && notificationState === "granted";

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader step="Steg 4 av 4" />

      <View style={styles.content}>
        <Text style={styles.title}>Notiser och position</Text>
        <Text style={styles.description}>
          Detta behövs för att du ska kunna få hjälpförfrågningar i närheten.
        </Text>

        <View style={styles.settings}>
          <PermissionRow
            icon={MapPin}
            title="Position"
            description={getLocationDescription(locationState, currentLocation)}
            state={locationState}
            onPress={() => void requestLocation()}
          />
          <PermissionRow
            icon={Bell}
            title="Notiser"
            description={getNotificationDescription(notificationState)}
            state={notificationState}
            onPress={() => void requestNotifications()}
            isLast
          />
        </View>

        <Text style={styles.infoText}>
          Du kan ändra behörigheterna senare i telefonens inställningar.
        </Text>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Slutför registreringen"
          disabled={!isComplete}
          onPress={() =>
            Alert.alert(
              "Registreringen är klar",
              "Du är nu registrerad som hjälpare."
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

function showPermissionDenied(permissionName: string, canAskAgain: boolean) {
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
      { text: "Öppna Inställningar", onPress: () => void Linking.openSettings() },
    ]
  );
}

function getLocationDescription(
  state: PermissionState,
  location: Location.LocationObject | null
) {
  if (state === "requesting") return "Hämtar din position...";
  if (state === "denied") return "Position är inte tillåten";
  if (state === "granted" && location) {
    const { latitude, longitude, accuracy } = location.coords;
    const accuracyText = accuracy ? ` · noggrannhet ${Math.round(accuracy)} m` : "";
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracyText}`;
  }
  return "Används för att hitta förfrågningar nära dig";
}

function getNotificationDescription(state: PermissionState) {
  if (state === "requesting") return "Aktiverar notiser...";
  if (state === "denied") return "Notiser är inte tillåtna";
  if (state === "granted") return "Notiser är aktiverade";
  return "Meddelar dig när någon behöver hjälp";
}

type PermissionRowProps = {
  icon: typeof MapPin;
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

  return (
    <View style={[styles.settingRow, isLast && styles.lastSettingRow]}>
      <View style={styles.settingIcon}>
        <Icon size={22} color="#2F6591" />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isGranted || isRequesting}
        onPress={onPress}
        style={({ pressed }) => [
          styles.permissionButton,
          isGranted && styles.permissionButtonGranted,
          state === "denied" && styles.permissionButtonDenied,
          pressed && styles.pressed,
        ]}
      >
        {isRequesting ? (
          <ActivityIndicator size="small" color="#2F6591" />
        ) : isGranted ? (
          <Check size={18} color="#286E69" strokeWidth={3} />
        ) : state === "denied" ? (
          <AlertCircle size={18} color="#9B4A43" />
        ) : (
          <Text style={styles.permissionButtonText}>Tillåt</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF4F7",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  title: {
    maxWidth: 320,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#142235",
  },
  description: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    color: "#607080",
  },
  settings: {
    marginTop: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D5DEE5",
  },
  settingRow: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D5DEE5",
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
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#142235",
  },
  settingDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#607080",
  },
  permissionButton: {
    minWidth: 62,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAF1",
  },
  permissionButtonGranted: {
    minWidth: 38,
    paddingHorizontal: 9,
    backgroundColor: "#DDEFEA",
  },
  permissionButtonDenied: {
    minWidth: 38,
    paddingHorizontal: 9,
    backgroundColor: "#F5E3E1",
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F6591",
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
