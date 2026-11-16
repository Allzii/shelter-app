import { router } from "expo-router";

import PermissionsScreen from "@/features/registration/components/PermissionsScreen";

export default function HelperPermissionsScreen() {
  return (
    <PermissionsScreen
      step="Steg 5 av 5"
      locationDescription="Används för att hitta förfrågningar nära dig"
      notificationDescription="Meddelar dig när någon behöver hjälp"
      buttonTitle="Slutför registreringen"
      onContinue={() => router.push("/helper-certification")}
    />
  );
}
