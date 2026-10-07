import { router, useLocalSearchParams } from "expo-router";

import VerificationScreen from "@/components/ui/VerificationScreen";

export default function NeedsHelpVerificationScreen() {
  const { person } = useLocalSearchParams<{
    person?: string;
  }>();

  const isOtherPerson = person === "other";

  const continueRegistration = (
    verification: "demo-verified" | "pending"
  ) => {
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
          ? "BankID ska tillhöra personen som ska använda armbandet. Saknar personen BankID kan ni fortsätta med registreringen inför en manuell kontroll."
          : "Identifiera dig med BankID. Saknar du BankID kan du fortsätta med registreringen inför en manuell kontroll."
      }
      verificationDescription={
        isOtherPerson
          ? "Personen behöver själv identifiera sig med sitt BankID."
          : "BankID bekräftar vem du är."
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