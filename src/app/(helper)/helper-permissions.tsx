import { router } from "expo-router";

import PermissionsScreen from "@/components/ui/PermissionsScreen";

export default function HelperPermissionsScreen() {
  return (
    <PermissionsScreen
      step="Steg 5 av 5"
      description="Detta behövs för att du ska kunna få hjälpförfrågningar i närheten."
      locationDescription="Används för att hitta förfrågningar nära dig"
      notificationDescription="Meddelar dig när någon behöver hjälp"
      buttonTitle="Slutför registreringen"
      onContinue={() => router.push("/helper-certification")}
    />
  );
}