import {
  Accessibility,
  Car,
  Footprints,
  HandHelping,
  MoveUp,
  Package,
  PersonStanding,
  type LucideIcon,
} from "lucide-react-native";

export const skillOptions: { id: string; label: string; icon: LucideIcon }[] = [
  {
    id: "company",
    label: "Följa någon till skyddsrummet",
    icon: PersonStanding,
  },
  {
    id: "wheelchair",
    label: "Hjälpa någon med rullstol",
    icon: Accessibility,
  },
  {
    id: "support",
    label: "Ge stöd under promenaden",
    icon: HandHelping,
  },
  {
    id: "carryLight",
    label: "Bära lättare saker",
    icon: Package,
  },
  {
    id: "carryHeavy",
    label: "Bära tyngre saker",
    icon: Package,
  },
  {
    id: "car",
    label: "Skjutsa någon med bil",
    icon: Car,
  },
];

export const needOptions: {
  id: string;
  title: string;
  icon: LucideIcon;
}[] = [
  { id: "wheelchair", title: "Hjälp med rullstol", icon: Accessibility },
  { id: "walking", title: "Stöd vid gång", icon: Footprints },
  { id: "stairs", title: "Hjälp i trappor", icon: MoveUp },
  { id: "physical-support", title: "Fysiskt stöd", icon: HandHelping },
];
