import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { AppState, Linking } from "react-native";

import useReloadableFocusEffect from "@/hooks/useReloadableFocusEffect";
import { supabase } from "@/lib/supabase";
import { getCurrentCoordinate } from "@/services/locations";

import type { Coordinate } from "@/types/location";

type Position = {
  accountId: string;
  coordinate: Coordinate | null;
  status: "ready" | "loading" | "permission" | "blocked" | "error";
  fetchedAt: number;
  checkedAt: number;
};
type Distances = {
  key: string;
  accountId: string;
  values: Record<string, number>;
  failed: boolean;
};

const MAX_POSITION_AGE_MS = 5 * 60_000;

export default function useRequestDistances(
  accountId: string | undefined,
  requestIds: string[],
) {
  const [position, setPosition] = useState<Position | null>(null);
  const [distances, setDistances] = useState<Distances | null>(null);
  const requestKey = requestIds.slice().sort().join(",");

  const reloadLocation = useReloadableFocusEffect(
    useCallback(() => {
      if (!accountId) return;
      let active = true;
      let fetching = false;
      const load = async () => {
        if (fetching || AppState.currentState === "background") return;
        fetching = true;
        const update = (
          coordinate: Coordinate | null,
          status: Position["status"],
        ) => {
          if (!active) return;
          const checkedAt = Date.now();
          setPosition((previous) => {
            const keepPrevious =
              (status === "loading" || status === "error") &&
              previous?.accountId === accountId;
            return {
              accountId,
              coordinate: keepPrevious ? previous.coordinate : coordinate,
              fetchedAt: keepPrevious
                ? previous.fetchedAt
                : coordinate
                  ? checkedAt
                  : 0,
              checkedAt,
              status,
            };
          });
        };
        try {
          const permission = await Location.getForegroundPermissionsAsync();
          if (!active || AppState.currentState === "background") return;
          if (!permission.granted) {
            update(null, permission.canAskAgain ? "permission" : "blocked");
            return;
          }
          update(null, "loading");
          const coordinate = await getCurrentCoordinate();
          update(coordinate, "ready");
        } catch {
          update(null, "error");
        } finally {
          fetching = false;
        }
      };
      void load();
      const timer = setInterval(() => void load(), 60_000);
      const app = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        active = false;
        clearInterval(timer);
        app.remove();
      };
    }, [accountId]),
  );

  const current = position?.accountId === accountId ? position : null;
  const freshPosition =
    current && current.checkedAt - current.fetchedAt < MAX_POSITION_AGE_MS;
  const latitude = freshPosition ? current.coordinate?.latitude : undefined;
  const longitude = freshPosition ? current.coordinate?.longitude : undefined;
  const distanceKey = `${accountId}:${latitude}:${longitude}:${requestKey}`;

  const reloadDistances = useReloadableFocusEffect(
    useCallback(() => {
      if (
        !accountId ||
        latitude === undefined ||
        longitude === undefined ||
        !requestKey
      )
        return;
      let active = true;
      let fetching = false;
      const abort = new AbortController();
      const load = async () => {
        if (fetching || AppState.currentState === "background") return;
        fetching = true;
        let responseStatus = 0;
        try {
          const { data, error, status } = await supabase
            .rpc("get_request_distances", {
              p_request_ids: requestKey.split(","),
              p_latitude: latitude,
              p_longitude: longitude,
            })
            .abortSignal(abort.signal);
          responseStatus = status;
          if (!active) return;
          if (error) throw error;
          const values: Record<string, number> = {};
          if (Array.isArray(data)) {
            for (const row of data) {
              if (
                typeof row.request_id === "string" &&
                requestKey.split(",").includes(row.request_id) &&
                typeof row.distance_m === "number" &&
                Number.isFinite(row.distance_m) &&
                row.distance_m >= 0
              ) {
                values[row.request_id] = row.distance_m;
              }
            }
          }
          setDistances({ key: distanceKey, accountId, values, failed: false });
        } catch (error) {
          if (active) {
            const code =
              error && typeof error === "object" && "code" in error
                ? String(error.code)
                : "unknown";
            console.warn("Request distances could not be loaded", { code });
            const transientFailure =
              responseStatus === 0 || responseStatus >= 500;
            setDistances((previous) => ({
              key: distanceKey,
              accountId,
              values:
                transientFailure && previous?.accountId === accountId
                  ? previous.values
                  : {},
              failed: true,
            }));
          }
        } finally {
          fetching = false;
        }
      };
      void load();
      const timer = setInterval(() => void load(), 30_000);
      const app = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        active = false;
        abort.abort();
        clearInterval(timer);
        app.remove();
      };
    }, [accountId, latitude, longitude, requestKey, distanceKey]),
  );

  const enableLocation = async () => {
    try {
      if (current?.status === "blocked") {
        await Linking.openSettings();
      } else {
        await Location.requestForegroundPermissionsAsync();
        reloadLocation();
      }
    } catch {
      if (accountId)
        setPosition({
          accountId,
          coordinate: null,
          status: "error",
          fetchedAt: 0,
          checkedAt: Date.now(),
        });
    }
  };

  return {
    distances:
      freshPosition &&
      current.coordinate &&
      distances &&
      distances.accountId === accountId
        ? Object.fromEntries(
            Object.entries(distances.values).filter(([id]) =>
              requestIds.includes(id),
            ),
          )
        : {},
    distanceStatus:
      distances?.key === distanceKey
        ? distances.failed
          ? "error"
          : "ready"
        : "loading",
    reloadDistances,
    locationStatus: current?.status ?? "loading",
    enableLocation,
  };
}
