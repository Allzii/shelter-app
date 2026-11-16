import { router, useLocalSearchParams } from "expo-router";

import VerificationScreen from "@/features/registration/components/VerificationScreen";

export default function NeedsHelpVerificationScreen() {
  const { person } = useLocalSearchParams<{
    person?: string;
  }>();

  const isOtherPerson = person === "other";

  const continueRegistration = (verification: "demo-verified" | "pending") => {
    router.push({
      pathname: "/needs-help",
      params: {
        person: isOtherPerson ? "other" : "self",
        verification,
      },
    });
  };

  return (
    <VerificationScreen
      title={
        isOtherPerson
          ? "Verifiera personens identitet"
          : "Verifiera din identitet"
      }
      description={
        isOtherPerson
          ? "Personen som ska få hjälp identifierar sig med sitt eget BankID."
          : "Identifiera dig med BankID för att registrera dig."
      }
      verifiedTitle={
        isOtherPerson
          ? "Personens identitet är verifierad"
          : "Din identitet är verifierad"
      }
      onContinue={() => continueRegistration("demo-verified")}
      onManualVerification={() => continueRegistration("pending")}
    />
  );
}
