import { useFocusEffect } from "expo-router";
import { Clock3, HandHelping } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/colors";
import { needOptions } from "@/constants/help-options";
import { supabase } from "@/lib/supabase";
import { formatDistance } from "@/utils/formatters";

import type { HelperHelpRequest as HelpRequest } from "@/types/help-request";

type Props = {
  request: HelpRequest;
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
  distanceMetres?: number;
};

export default function HelperRequestCard({
  request,
  onPress,
  disabled = false,
  highlight = false,
  distanceMetres,
}: Props) {
  const [needs, setNeeds] = useState<string[]>([]);
  const requestId = request.id;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const abort = new AbortController();

      const load = async () => {
        try {
          const { data, error } = await supabase
            .rpc("get_request_recipient_details", {
              p_request_id: requestId,
            })
            .abortSignal(abort.signal)
            .maybeSingle();

          if (!active || error || !data) return;

          const selected = (data as { selected_needs?: unknown })
            .selected_needs;

          if (Array.isArray(selected)) {
            setNeeds(
              selected.filter(
                (value): value is string => typeof value === "string",
              ),
            );
          }
        } catch {
          // The request can still be opened if its summary is unavailable.
        }
      };

      void load();

      return () => {
        active = false;
        abort.abort();
      };
    }, [requestId]),
  );

  const selected = needOptions.filter((option) => needs.includes(option.id));

  const Icon = selected[0]?.icon || HandHelping;

  return (
    <View style={[styles.card, highlight && styles.highlight]}>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Icon size={25} color={colors.primary} strokeWidth={1.7} />
        </View>

        <View style={styles.headingText}>
          <Text style={styles.title}>
            {selected[0]?.title || "Behöver hjälp"}
          </Text>

          <Text style={styles.name}>
            {request.recipient_name.trim() || "En person"}
          </Text>
        </View>
        {distanceMetres !== undefined && (
          <Text style={styles.distance}>
            {distanceMetres < 50
              ? "Under 50 m"
              : `Ca ${formatDistance(distanceMetres)}`}
          </Text>
        )}
      </View>

      {selected.length > 0 && (
        <View style={styles.chips}>
          {selected.map(({ id, title, icon: NeedIcon }) => (
            <View key={id} style={styles.chip}>
              <NeedIcon size={13} color={colors.primary} />
              <Text style={styles.chipText}>{title}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.timeRow}>
        <Clock3 size={15} color={colors.textSecondary} />

        <Text style={styles.timeText}>{formatSent(request.created_at)}</Text>
      </View>

      <PrimaryButton
        title="Visa förfrågan"
        disabled={disabled}
        onPress={onPress}
      />
    </View>
  );
}

function formatSent(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Förfrågan skickad";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );

  if (minutes < 1) return "Nyligen skickad";
  if (minutes < 60) return `Skickad för ${minutes} min sedan`;

  return `Skickad kl. ${date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  highlight: { borderColor: colors.primary },
  heading: { flexDirection: "row", alignItems: "center", gap: 13 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headingText: { flex: 1 },
  distance: {
    flexShrink: 1,
    maxWidth: "40%",
    textAlign: "right",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.text,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  name: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  chips: { marginTop: 15, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.primary,
  },
  timeRow: {
    marginTop: 15,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  timeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
