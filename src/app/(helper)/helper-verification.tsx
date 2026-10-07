import { router } from "expo-router";

import VerificationScreen from "@/components/ui/VerificationScreen";

export default function HelperVerificationScreen() {
  return (
    <VerificationScreen
      step="Steg 1 av 4"
      title="Verifiera din identitet"
      description="Alla hjälpare identifierar sig med BankID innan de kan ta emot en hjälpförfrågan."
      verificationDescription="BankID bekräftar vem du är när du registrerar dig som hjälpare."
      onContinue={() => router.push("/helper-details")}
    />
  );
}