import { useFocusEffect } from "expo-router";
import { useCallback, useRef, type EffectCallback } from "react";

/** Run on focus or manual refresh, cleaning up the previous request first. */
export default function useReloadableFocusEffect(effect: EffectCallback) {
  const focused = useRef(false);
  const cleanup = useRef<ReturnType<EffectCallback>>(undefined);

  const reload = useCallback(() => {
    if (!focused.current) return;
    cleanup.current?.();
    cleanup.current = effect();
  }, [effect]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      reload();

      return () => {
        focused.current = false;
        cleanup.current?.();
        cleanup.current = undefined;
      };
    }, [reload]),
  );

  return reload;
}
