import { router, useLocalSearchParams } from "expo-router";

import PermissionsScreen from "@/components/ui/PermissionsScreen";

export default function NeedsHelpPermissionsScreen() {
  const params = useLocalSearchParams<{
    recipientId?: string;
    person?: string;
    verification?: string;
  }>();

  const isOtherPerson = params.person === "other";

  const handleContinue = () => {
    if (!params.recipientId) {
      router.replace("/role");
      return;
    }

    router.push({
      pathname: "/connect-bracelet",
      params: {
        recipientId: params.recipientId,
        person: isOtherPerson ? "other" : "self",
        verification:
          params.verification === "demo-verified"
            ? "demo-verified"
            : "pending",
      },
    });
  };

  return (
    <PermissionsScreen
      step="Steg 4 av 5"
      showLocation={!isOtherPerson}
      locationDescription="Ger appen tillgång till telefonens position"
      notificationDescription={
        isOtherPerson
          ? "Uppdateringar om personen du registrerar"
          : "Meddelar dig när en hjälpare svarar"
      }
      buttonTitle="Fortsätt"
      onContinue={handleContinue}
    />
  );
}