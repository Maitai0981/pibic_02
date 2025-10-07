import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.replace(/\/$/, "");
}

function resolveBaseUrl() {
  // Highest priority: explicit public env var (works for EAS/Expo builds)
  const explicitBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitBase) {
    return normalizeBaseUrl(explicitBase);
  }

  // Try to infer host from Expo dev server (LAN/localhost)
  const expoConfig = Constants?.expoConfig ?? Constants?.manifest ?? {};
  const extra = (expoConfig && expoConfig.extra) || {};
  if (extra.apiBaseUrl) {
    return normalizeBaseUrl(extra.apiBaseUrl); // Retornará 'http://172.25.153.3:5000'
  }
  const hostUri = expoConfig.hostUri || expoConfig.debuggerHost || "";

  let hostname = "";
  if (typeof hostUri === "string" && hostUri.length > 0) {
    hostname = hostUri.split(":")[0];
  } else if (typeof window !== "undefined" && window.location?.hostname) {
    hostname = window.location.hostname;
  }

  if (!hostname) {
    hostname = "localhost";
  }

  // Android emulator cannot reach host via localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (Platform.OS === "android") {
      // ALTERE AQUI: Use o IP do seu WSL ou rede, se '10.0.2.2' não funcionar.
      hostname = "172.25.153.3"; // Use o IP que o Flask está escutando
    }
  }
  const port = extra.apiPort || process.env.EXPO_PUBLIC_API_PORT || "5000";
  const protocol =
    extra.apiProtocol || process.env.EXPO_PUBLIC_API_PROTOCOL || "http";
  return `${protocol}://${hostname}:${port}`;
}

const API_BASE = resolveBaseUrl();
const expoConfigOuter = Constants?.expoConfig ?? Constants?.manifest ?? {};
const extraOuter = (expoConfigOuter && expoConfigOuter.extra) || {};
const API_PREFIX =
  extraOuter.apiPrefix || process.env.EXPO_PUBLIC_API_PREFIX || "/api";

export const HEALTH_URL = `${API_BASE}${API_PREFIX}/health`;
export const PREDICT_URL = `${API_BASE}${API_PREFIX}/predict`;

export default {
  BASE: API_BASE,
  PREFIX: API_PREFIX,
  HEALTH_URL,
  PREDICT_URL,
};
