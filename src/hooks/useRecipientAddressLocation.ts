import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { AppState, Linking, Platform } from "react-native";

import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";
import {
  addressLocationKey,
  geocodeRegisteredAddress,
  hasCompleteAddress,
} from "@/services/locations";

import type { RegisteredAddress } from "@/services/locations";

export type AddressLocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "permission"
  | "blocked"
  | "incomplete"
  | "unsupported"
  | "error";
type RecipientAddress = RegisteredAddress & { id: string; account_id: string };

export default function useRecipientAddressLocation(
  recipient: RecipientAddress | null,
) {
  const [result, setResult] = useState<{
    id: string;
    status: AddressLocationStatus;
    message?: string;
  } | null>(null);
  const id = recipient?.id;
  const accountId = recipient?.account_id;
  const street = recipient?.street ?? "";
  const postalCode = recipient?.postal_code ?? "";
  const city = recipient?.city ?? "";

  const reload = useReloadableFocusEffect(
    useCallback(() => {
      if (!id || !accountId) return;
      let active = true;
      let fetching = false;
      const abort = new AbortController();
      const update = (status: AddressLocationStatus, message?: string) => {
        if (active) setResult({ id, status, message });
      };

      const load = async () => {
        if (fetching || AppState.currentState === "background") return;
        const address = { street, postal_code: postalCode, city };
        if (!hasCompleteAddress(address)) {
          update("incomplete");
          return;
        }
        fetching = true;
        update("loading");
        let stage: "read" | "geocode" | "save" = "read";

        try {
          const key = await addressLocationKey(address);
          const { data: cached, error } = await supabase
            .from("recipient_address_locations")
            .select("address_key")
            .eq("recipient_id", id)
            .abortSignal(abort.signal)
            .maybeSingle();
          if (!active) return;
          if (error) throw error;
          if (cached?.address_key === key) {
            update("ready");
            return;
          }

          if (Platform.OS === "web") {
            update("unsupported");
            return;
          }
          // Android requires permission even for address geocoding. We never
          // use this phone's GPS as the registered person's position.
          if (Platform.OS === "android") {
            const permission = await Location.getForegroundPermissionsAsync();
            if (!active) return;
            if (!permission.granted) {
              update(permission.canAskAgain ? "permission" : "blocked");
              return;
            }
          }

          if (!active || AppState.currentState === "background") return;
          stage = "geocode";
          const coordinate = await geocodeRegisteredAddress(address);
          if (!active || AppState.currentState === "background") return;
          stage = "save";
          const { error: saveError } = await supabase
            .from("recipient_address_locations")
            .upsert(
              { recipient_id: id, address_key: key, ...coordinate },
              { onConflict: "recipient_id" },
            )
            .abortSignal(abort.signal);
          if (saveError) throw saveError;
          update("ready");
        } catch (error) {
          if (!active) return;
          const code =
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : "unknown";
          console.warn("Address distance setup failed", { stage, code });
          update(
            "error",
            stage === "geocode"
              ? "Adressen kunde inte hittas tillräckligt noggrant. Kontrollera gata, postnummer och ort i Profil."
              : stage === "save"
                ? "Adressens position kunde inte sparas. Försök igen."
                : "Adressens position kunde inte hämtas. Försök igen.",
          );
        } finally {
          fetching = false;
        }
      };

      void load();
      const app = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        active = false;
        abort.abort();
        app.remove();
      };
    }, [id, accountId, street, postalCode, city]),
  );

  const enable = async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && !permission.canAskAgain) {
        await Linking.openSettings();
      } else {
        await Location.requestForegroundPermissionsAsync();
        reload();
      }
    } catch {
      if (id) setResult({ id, status: "error" });
    }
  };

  return {
    status: result?.id === id ? (result?.status ?? "idle") : "idle",
    message: result?.id === id ? result?.message : undefined,
    reload,
    enable,
  };
}
