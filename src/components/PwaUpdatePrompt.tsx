import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Ensures mobile/PWA clients refresh onto the latest build.
 * This prevents stale cached JS from causing checkout/order creation bugs.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered() {
      // no-op
    },
    onRegisterError(error) {
      console.warn("SW registration error", error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast("Update available", {
      duration: Infinity,
      action: {
        label: "Refresh",
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
