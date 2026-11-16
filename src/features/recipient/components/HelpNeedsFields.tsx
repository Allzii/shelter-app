import {
  Accessibility,
  Footprints,
  MoveUp,
  PersonStanding,
} from "lucide-react-native";

import HelpOption from "@/components/ui/HelpOption";

type Props = {
  selected: string[];
  onToggle: (id: string) => void;
  isOtherPerson?: boolean;
};
export default function HelpNeedsFields({
  selected,
  onToggle,
  isOtherPerson = false,
}: Props) {
  return (
    <>
      <HelpOption
        title="Rullstol"
        description={
          isOtherPerson
            ? "Personen använder rullstol och kan behöva hjälp att ta sig fram."
            : "Jag använder rullstol och kan behöva hjälp att ta mig fram."
        }
        icon={Accessibility}
        selected={selected.includes("wheelchair")}
        onPress={() => onToggle("wheelchair")}
      />
      <HelpOption
        title="Svårt att gå längre sträckor"
        description={
          isOtherPerson
            ? "Personen går långsamt, använder gånghjälpmedel eller behöver ta pauser."
            : "Jag går långsamt, använder gånghjälpmedel eller behöver ta pauser."
        }
        icon={Footprints}
        selected={selected.includes("walking")}
        onPress={() => onToggle("walking")}
      />
      <HelpOption
        title="Hjälp i trappor"
        description={
          isOtherPerson
            ? "Personen har svårt att ta sig upp eller ner för trappor."
            : "Jag har svårt att ta mig upp eller ner för trappor."
        }
        icon={MoveUp}
        selected={selected.includes("stairs")}
        onPress={() => onToggle("stairs")}
      />
      <HelpOption
        title="Fysiskt stöd"
        description={
          isOtherPerson
            ? "Personen kan behöva stöd av en annan person när hen går."
            : "Jag kan behöva stöd av en annan person när jag går."
        }
        icon={PersonStanding}
        selected={selected.includes("physical-support")}
        onPress={() => onToggle("physical-support")}
      />
    </>
  );
}
