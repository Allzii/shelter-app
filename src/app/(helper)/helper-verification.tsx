import { router } from "expo-router";

import VerificationScreen from "@/features/registration/components/VerificationScreen";

export default function HelperVerificationScreen() {
  return (
    <VerificationScreen
      step="Steg 1 av 5"
      title="Verifiera din identitet"
      description="För att bli volontär behöver du identifiera dig med BankID."
      verificationDescription=""
      onContinue={() => router.push("/helper-details")}
    />
  );
}
