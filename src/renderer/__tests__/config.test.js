/**
 * Unit tests for kiosk config lifecycle utilities.
 * All browser storage APIs are stubbed via vi.stubGlobal so no jsdom runtime is needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  KIOSK_CONFIG_STORAGE_KEY,
  parseStoredConfig,
  readStoredConfig,
  saveConfig,
} from "../data/config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid stored-config object.
 * Any field can be overridden via the partial argument.
 */
const validConfig = (overrides = {}) => ({
  apiBaseUrl: "http://localhost:3000",
  mode: "reception",
  lockedDepartmentId: "",
  language: "en",
  highContrast: false,
  printerName: "",
  ...overrides,
});

// ---------------------------------------------------------------------------
// parseStoredConfig
// ---------------------------------------------------------------------------

describe("parseStoredConfig", () => {
  it("returns the normalised config when the shape is valid", () => {
    const result = parseStoredConfig(validConfig());

    expect(result).toEqual({
      apiBaseUrl: "http://localhost:3000",
      mode: "reception",
      lockedDepartmentId: "",
      language: "en",
      highContrast: false,
      printerName: "",
    });
  });

  it("trims whitespace from apiBaseUrl and lockedDepartmentId", () => {
    const result = parseStoredConfig(
      validConfig({ apiBaseUrl: "  http://localhost:3000  ", lockedDepartmentId: "  dept-1  " })
    );

    expect(result?.apiBaseUrl).toBe("http://localhost:3000");
    expect(result?.lockedDepartmentId).toBe("dept-1");
  });

  it("accepts both valid modes", () => {
    expect(parseStoredConfig(validConfig({ mode: "reception" }))).not.toBeNull();
    expect(parseStoredConfig(validConfig({ mode: "department-locked" }))).not.toBeNull();
  });

  it("accepts both valid languages", () => {
    expect(parseStoredConfig(validConfig({ language: "en" }))).not.toBeNull();
    expect(parseStoredConfig(validConfig({ language: "ar" }))).not.toBeNull();
  });

  it("defaults highContrast to false when omitted", () => {
    const input = validConfig();
    delete input.highContrast;
    const result = parseStoredConfig(input);
    expect(result?.highContrast).toBe(false);
  });

  it("allows empty apiBaseUrl (backward compat for configs before server-URL was mandatory)", () => {
    expect(parseStoredConfig(validConfig({ apiBaseUrl: "" }))).not.toBeNull();
  });

  it("gracefully ignores legacy useMockApi field without failing", () => {
    const withLegacy = { ...validConfig(), useMockApi: true };
    const result = parseStoredConfig(withLegacy);
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("useMockApi");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["number", 42],
    ["string", "not-an-object"],
    ["array", []],
  ])("returns null for non-object input: %s", (_label, value) => {
    expect(parseStoredConfig(value)).toBeNull();
  });

  it("returns null when mode is not a valid enum value", () => {
    expect(parseStoredConfig(validConfig({ mode: "invalid-mode" }))).toBeNull();
  });

  it("returns null when language is not en or ar", () => {
    expect(parseStoredConfig(validConfig({ language: "fr" }))).toBeNull();
  });

  it("returns null when printerName is missing", () => {
    const input = validConfig();
    delete input.printerName;
    expect(parseStoredConfig(input)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// readStoredConfig
// ---------------------------------------------------------------------------

describe("readStoredConfig", () => {
  let localStore = {};
  let sessionStore = {};

  const mockLocalStorage = {
    getItem: vi.fn((key) => localStore[key] ?? null),
    setItem: vi.fn((key, value) => { localStore[key] = String(value); }),
    removeItem: vi.fn((key) => { delete localStore[key]; }),
    clear: vi.fn(() => { localStore = {}; }),
  };

  const mockSessionStorage = {
    getItem: vi.fn((key) => sessionStore[key] ?? null),
    setItem: vi.fn((key, value) => { sessionStore[key] = String(value); }),
    removeItem: vi.fn((key) => { delete sessionStore[key]; }),
    clear: vi.fn(() => { sessionStore = {}; }),
  };

  beforeEach(() => {
    localStore = {};
    sessionStore = {};
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("sessionStorage", mockSessionStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns config from localStorage when present and valid", () => {
    localStore[KIOSK_CONFIG_STORAGE_KEY] = JSON.stringify(validConfig());
    const result = readStoredConfig();
    expect(result).not.toBeNull();
    expect(result?.mode).toBe("reception");
  });

  it("falls back to sessionStorage when localStorage is empty", () => {
    sessionStore[KIOSK_CONFIG_STORAGE_KEY] = JSON.stringify(validConfig({ language: "ar" }));
    const result = readStoredConfig();
    expect(result?.language).toBe("ar");
  });

  it("prefers localStorage over sessionStorage", () => {
    localStore[KIOSK_CONFIG_STORAGE_KEY] = JSON.stringify(validConfig({ language: "en" }));
    sessionStore[KIOSK_CONFIG_STORAGE_KEY] = JSON.stringify(validConfig({ language: "ar" }));
    expect(readStoredConfig()?.language).toBe("en");
  });

  it("returns null when both storages are empty", () => {
    expect(readStoredConfig()).toBeNull();
  });

  it("returns null when stored JSON is malformed", () => {
    localStore[KIOSK_CONFIG_STORAGE_KEY] = "{ not valid json }}}";
    expect(readStoredConfig()).toBeNull();
  });

  it("returns null and falls back gracefully when localStorage throws", () => {
    const throwingStorage = {
      getItem: vi.fn(() => { throw new Error("QuotaExceededError"); }),
    };
    vi.stubGlobal("localStorage", throwingStorage);
    sessionStore[KIOSK_CONFIG_STORAGE_KEY] = JSON.stringify(validConfig({ mode: "department-locked" }));
    const result = readStoredConfig();
    expect(result?.mode).toBe("department-locked");
  });
});

// ---------------------------------------------------------------------------
// saveConfig
// ---------------------------------------------------------------------------

describe("saveConfig", () => {
  let localStore = {};
  let sessionStore = {};

  const mockLocalStorage = {
    getItem: vi.fn((key) => localStore[key] ?? null),
    setItem: vi.fn((key, value) => { localStore[key] = String(value); }),
  };

  const mockSessionStorage = {
    getItem: vi.fn((key) => sessionStore[key] ?? null),
    setItem: vi.fn((key, value) => { sessionStore[key] = String(value); }),
  };

  beforeEach(() => {
    localStore = {};
    sessionStore = {};
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("sessionStorage", mockSessionStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves to localStorage and returns saved:true with no message", () => {
    const result = saveConfig(validConfig());
    expect(result).toEqual({ saved: true, message: null });
    expect(localStore[KIOSK_CONFIG_STORAGE_KEY]).toBeDefined();
  });

  it("persists the config in localStorage as serialised JSON", () => {
    const config = validConfig({ language: "ar", highContrast: true });
    saveConfig(config);
    const stored = JSON.parse(localStore[KIOSK_CONFIG_STORAGE_KEY]);
    expect(stored.language).toBe("ar");
    expect(stored.highContrast).toBe(true);
  });

  it("falls back to sessionStorage when localStorage throws, returns saved:true with a message", () => {
    const throwingLocal = {
      setItem: vi.fn(() => { throw new Error("QuotaExceededError"); }),
    };
    vi.stubGlobal("localStorage", throwingLocal);

    const result = saveConfig(validConfig());
    expect(result.saved).toBe(true);
    expect(typeof result.message).toBe("string");
    expect(result.message?.length).toBeGreaterThan(0);
    expect(sessionStore[KIOSK_CONFIG_STORAGE_KEY]).toBeDefined();
  });

  it("returns saved:false with a message when both storages throw", () => {
    const throwingStorage = { setItem: vi.fn(() => { throw new Error("blocked"); }) };
    vi.stubGlobal("localStorage", throwingStorage);
    vi.stubGlobal("sessionStorage", throwingStorage);

    const result = saveConfig(validConfig());
    expect(result.saved).toBe(false);
    expect(typeof result.message).toBe("string");
  });
});
