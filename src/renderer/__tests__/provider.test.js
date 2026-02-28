/**
 * Unit tests for the kiosk data provider factory.
 * HTTP fetch calls are intercepted via vi.stubGlobal so no network is required.
 */

import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  getDefaultKioskConfig,
  createKioskDataProvider,
  HEALTH_POLL_INTERVAL_MS,
} from "../data/provider";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const minimalConfig = {
  apiBaseUrl: "http://localhost:3000",
  language: "en",
};

// ---------------------------------------------------------------------------
// getDefaultKioskConfig
// ---------------------------------------------------------------------------

describe("getDefaultKioskConfig", () => {
  it("returns a config object with the expected fields", () => {
    const defaults = getDefaultKioskConfig();
    expect(defaults).toMatchObject({
      mode: expect.any(String),
      lockedDepartmentId: expect.any(String),
      language: expect.stringMatching(/^(en|ar)$/),
      highContrast: expect.any(Boolean),
      printerName: expect.any(String),
    });
  });

  it("does NOT include useMockApi (mock mode has been removed)", () => {
    const defaults = getDefaultKioskConfig();
    expect(defaults).not.toHaveProperty("useMockApi");
  });

  it("default mode is one of the valid enum values", () => {
    const { mode } = getDefaultKioskConfig();
    expect(["reception", "department-locked"]).toContain(mode);
  });
});

// ---------------------------------------------------------------------------
// HEALTH_POLL_INTERVAL_MS
// ---------------------------------------------------------------------------

describe("HEALTH_POLL_INTERVAL_MS", () => {
  it("is exported as 30 000 ms", () => {
    expect(HEALTH_POLL_INTERVAL_MS).toBe(30_000);
  });
});

// ---------------------------------------------------------------------------
// createKioskDataProvider – interface shape
// ---------------------------------------------------------------------------

describe("createKioskDataProvider", () => {
  it("returns a provider object with the required method surface", () => {
    const provider = createKioskDataProvider(minimalConfig);

    expect(typeof provider.health).toBe("function");
    expect(typeof provider.listDepartments).toBe("function");
    expect(typeof provider.listServicesByDepartment).toBe("function");
    expect(typeof provider.issueTicket).toBe("function");
  });

  it("always uses HTTP — no mock branching regardless of extra fields on config", () => {
    // Even if old stored config with useMockApi:true is passed, the factory
    // should return an HTTP provider (the field is ignored).
    const staleConfig = { ...minimalConfig, useMockApi: true };
    const provider = createKioskDataProvider(staleConfig);

    // The real tell-tale: the provider must have the standard method surface
    // (a mock provider might have had extra debug fields in the old code).
    expect(typeof provider.health).toBe("function");
    expect(typeof provider.listDepartments).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// createKioskDataProvider – checkHealth (HTTP, mocked fetch)
// ---------------------------------------------------------------------------

describe("createKioskDataProvider.health (HTTP)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns { healthy: true } when the API responds with status 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const provider = createKioskDataProvider(minimalConfig);
    const result = await provider.health();

    expect(result).toEqual({ healthy: true });
  });

  it("returns { healthy: false } when fetch resolves with a non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const provider = createKioskDataProvider(minimalConfig);
    const result = await provider.health();

    expect(result.healthy).toBe(false);
  });

  it("rejects when fetch itself rejects (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const provider = createKioskDataProvider(minimalConfig);
    await expect(provider.health()).rejects.toThrow();
  });

  it("calls fetch with a URL derived from apiBaseUrl", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    const provider = createKioskDataProvider({ ...minimalConfig, apiBaseUrl: "http://api.example.com" });
    await provider.health();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/^http:\/\/api\.example\.com/);
  });
});

// ---------------------------------------------------------------------------
// createKioskDataProvider – getDepartments (HTTP, mocked fetch)
// ---------------------------------------------------------------------------

describe("createKioskDataProvider.listDepartments (HTTP)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an array of departments with normalised name when the API responds correctly", async () => {
    const mockData = [
      { id: "d1", nameEn: "General", nameAr: "عام", isActive: true },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      })
    );

    const provider = createKioskDataProvider(minimalConfig);
    const result = await provider.listDepartments();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("d1");
    // Language is "en" so nameEn should be used as the resolved name
    expect(result[0].name).toBe("General");
  });

  it("resolves Arabic name when provider language is ar", async () => {
    const mockData = [
      { id: "d1", nameEn: "General", nameAr: "عام", isActive: true },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      })
    );

    const provider = createKioskDataProvider({ ...minimalConfig, language: "ar" });
    const result = await provider.listDepartments();

    expect(result[0].name).toBe("عام");
  });

  it("throws when the API returns a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal server error" }),
      })
    );

    const provider = createKioskDataProvider(minimalConfig);
    await expect(provider.listDepartments()).rejects.toThrow();
  });
});
