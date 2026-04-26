import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "../lib/platform";

export function NativeAuthBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    let removeListener = null;
    let active = true;

    const setupListener = async () => {
      try {
        const [{ App: CapacitorApp }, { Browser }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/browser"),
        ]);

        const handler = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
          if (!url) return;

          try {
            const parsedUrl = new URL(url);
            const isResolveHost = parsedUrl.host === "resolve--it.vercel.app";
            if (!isResolveHost) return;

            const targetPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
            Browser.close().catch(() => {});
            navigate(targetPath || "/dashboard", { replace: true });
            window.dispatchEvent(new Event("resolveit:auth-redirected"));
          } catch (err) {
            console.error("Failed handling deep-link callback", err);
          }
        });

        if (active) {
          removeListener = () => handler.remove();
        } else {
          handler.remove();
        }
      } catch (err) {
        console.error("Failed to initialize native auth bridge", err);
      }
    };

    setupListener();

    return () => {
      active = false;
      if (removeListener) removeListener();
    };
  }, [navigate]);

  return null;
}
