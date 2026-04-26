import { Capacitor } from "@capacitor/core";

export const isNativeApp = () => {
  try {
    if (typeof Capacitor?.isNativePlatform === "function") {
      return Capacitor.isNativePlatform();
    }
    if (typeof Capacitor?.getPlatform === "function") {
      return Capacitor.getPlatform() !== "web";
    }
  } catch {
    return false;
  }

  return false;
};
