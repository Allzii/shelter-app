import { User } from "lucide-react-native";

import FormInput from "@/components/ui/FormInput";
import { capitalizeFirstLetter } from "@/utils/formatters";

type NameFieldsProps = {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  forOtherPerson?: boolean;
};

export default function NameFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  forOtherPerson = false,
}: NameFieldsProps) {
  return (
    <>
      <FormInput
        label="Förnamn"
        icon={User}
        value={firstName}
        onChangeText={(value) =>
          onFirstNameChange(capitalizeFirstLetter(value))
        }
        placeholder={
          forOtherPerson
            ? "Skriv personens förnamn"
            : "Skriv ditt förnamn"
        }
        autoCapitalize="words"
        autoComplete={forOtherPerson ? "off" : "given-name"}
      />

      <FormInput
        label="Efternamn"
        icon={User}
        value={lastName}
        onChangeText={(value) =>
          onLastNameChange(capitalizeFirstLetter(value))
        }
        placeholder={
          forOtherPerson
            ? "Skriv personens efternamn"
            : "Skriv ditt efternamn"
        }
        autoCapitalize="words"
        autoComplete={forOtherPerson ? "off" : "family-name"}
      />
    </>
  );
}