import { router } from "expo-router";

import PermissionsScreen from "@/components/ui/PermissionsScreen";

export default function NeedsHelpPermissionsScreen() {
  return (
    <PermissionsScreen
      step="Steg 4 av 5"
      description="Positionen skickas när du ber om hjälp. Notiser meddelar dig när en hjälpare svarar."
      locationDescription="Används när du skickar ett hjälplarm"
      notificationDescription="Meddelar dig när en hjälpare svarar"
      buttonTitle="Fortsätt"
      onContinue={() => router.push("/connect-bracelet")}
    />
  );
}