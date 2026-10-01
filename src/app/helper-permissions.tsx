import { Alert } from "react-native";

import PermissionsScreen from "@/components/ui/PermissionsScreen";

export default function HelperPermissionsScreen() {
  return (
    <PermissionsScreen
      step="Steg 4 av 4"
      description="Detta behövs för att du ska kunna få hjälpförfrågningar i närheten."
      locationDescription="Används för att hitta förfrågningar nära dig"
      notificationDescription="Meddelar dig när någon behöver hjälp"
      buttonTitle="Slutför registreringen"
      onContinue={() =>
        Alert.alert(
          "Registreringen är klar",
          "Du är nu registrerad som hjälpare."
        )
      }
    />
  );
}