/**
 * Kiosk configuration lifecycle utilities.
 * Extracted to a pure module so they can be unit-tested independently.
 */

export const KIOSK_CONFIG_STORAGE_KEY = "smartQueue.kiosk.config.v1";
export const KIOSK_DEVICE_ID_STORAGE_KEY = "smartQueue.kiosk.deviceId.v1";

export const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Validates and normalizes a raw parsed config object.
 * Returns null if the shape is invalid.
 *
 * @param {unknown} value
 * @returns {{apiBaseUrl:string, mode:string, lockedDepartmentId:string, language:string, highContrast:boolean, printerName:string}|null}
 */
export const parseStoredConfig = (value) => {
  if (!isRecord(value)) {
    return null;
  }

  const { apiBaseUrl, mode, lockedDepartmentId, language, highContrast, printerName } = value;

  const hasValidShape =
    typeof apiBaseUrl === "string" &&
    (mode === "reception" || mode === "department-locked") &&
    typeof lockedDepartmentId === "string" &&
    (language === "en" || language === "ar") &&
    (typeof highContrast === "boolean" || typeof highContrast === "undefined") &&
    typeof printerName === "string";

  if (!hasValidShape) {
    return null;
  }

  return {
    apiBaseUrl: apiBaseUrl.trim(),
    mode,
    lockedDepartmentId: lockedDepartmentId.trim(),
    language,
    highContrast: typeof highContrast === "boolean" ? highContrast : false,
    printerName,
  };
};

/**
 * Reads and validates the stored config from localStorage (falls back to sessionStorage).
 *
 * @returns {ReturnType<typeof parseStoredConfig>}
 */
export const readStoredConfig = () => {
  const parseAndValidate = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const validated = parseStoredConfig(parsed);
      if (!validated) {
        console.warn("Ignoring invalid stored kiosk config", KIOSK_CONFIG_STORAGE_KEY);
        return null;
      }
      return validated;
    } catch {
      return null;
    }
  };

  let localRaw = null;
  let sessionRaw = null;

  try {
    localRaw = window.localStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
  } catch {
    localRaw = null;
  }

  const localValidated = parseAndValidate(localRaw);
  if (localValidated) return localValidated;

  try {
    sessionRaw = window.sessionStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
  } catch {
    sessionRaw = null;
  }

  return parseAndValidate(sessionRaw);
};

/**
 * Saves the config to localStorage, falling back to sessionStorage on permission error.
 *
 * @param {object} config
 * @returns {{ saved: boolean, message: string|null }}
 */
export const saveConfig = (config) => {
  try {
    window.localStorage.setItem(KIOSK_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return { saved: true, message: null };
  } catch (error) {
    console.error("Failed to save config to localStorage", KIOSK_CONFIG_STORAGE_KEY, error);
    try {
      window.sessionStorage.setItem(KIOSK_CONFIG_STORAGE_KEY, JSON.stringify(config));
      return {
        saved: true,
        message:
          "Configuration was saved to temporary session storage. Please check kiosk browser storage permissions.",
      };
    } catch {
      return {
        saved: false,
        message:
          "Unable to save kiosk configuration. Please enable browser storage and try again.",
      };
    }
  }
};

export const createKioskDeviceId = () => {
  const uniquePart =
    typeof globalThis?.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  return `KIOSK-${uniquePart.toUpperCase()}`;
};

export const getOrCreateKioskDeviceId = () => {
  const readStorage = (storage) => {
    try {
      const value = storage.getItem(KIOSK_DEVICE_ID_STORAGE_KEY);
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    } catch {
      return null;
    }
    return null;
  };

  const localDeviceId = readStorage(window.localStorage);
  if (localDeviceId) return localDeviceId;

  const sessionDeviceId = readStorage(window.sessionStorage);
  if (sessionDeviceId) return sessionDeviceId;

  const generatedId = createKioskDeviceId();

  try {
    window.localStorage.setItem(KIOSK_DEVICE_ID_STORAGE_KEY, generatedId);
    return generatedId;
  } catch {
    try {
      window.sessionStorage.setItem(KIOSK_DEVICE_ID_STORAGE_KEY, generatedId);
      return generatedId;
    } catch {
      return generatedId;
    }
  }
};
