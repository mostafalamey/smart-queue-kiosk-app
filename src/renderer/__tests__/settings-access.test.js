/**
 * Unit tests for createSettingsAccessController.verifyAccess.
 * fetch and window.setTimeout/clearTimeout are stubbed via vi so no network
 * or real timers are involved.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createSettingsAccessController } from "../data/settings-access";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:3000";
const GOOD_CREDS = { email: "admin@hospital.com", password: "Secret123!" };

/**
 * Build a mock fetch that resolves with the given status and optional body.
 * `body` can be any JSON-serialisable value; omit to simulate a non-JSON body.
 */
const mockFetch = ({ status, body, invalidJson = false }) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: invalidJson
      ? vi.fn().mockRejectedValue(new SyntaxError("Unexpected token"))
      : vi.fn().mockResolvedValue(body ?? {}),
  });

const controller = (apiBaseUrl = BASE_URL) =>
  createSettingsAccessController({ apiBaseUrl });

// ---------------------------------------------------------------------------
// no backend configured
// ---------------------------------------------------------------------------

describe("verifyAccess — no apiBaseUrl", () => {
  it("allows access and returns reason no_backend_configured when apiBaseUrl is empty", async () => {
    const ctrl = createSettingsAccessController({ apiBaseUrl: "" });
    const result = await ctrl.verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: true, reason: "no_backend_configured" });
  });

  it("allows access when config is undefined", async () => {
    const ctrl = createSettingsAccessController(undefined);
    const result = await ctrl.verifyAccess(GOOD_CREDS);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("no_backend_configured");
  });

  it("sets protectionEnabled to false when no URL is provided", () => {
    expect(createSettingsAccessController({}).protectionEnabled).toBe(false);
  });

  it("sets protectionEnabled to true when a URL is provided", () => {
    expect(controller().protectionEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// successful authentication — allowed roles
// ---------------------------------------------------------------------------

describe("verifyAccess — success: allowed roles", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["ADMIN", "IT", "MANAGER"])("allows access for role %s (top-level role field)", async (role) => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { user: { role }, auth: {} } }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result.allowed).toBe(true);
    expect(result.role).toBe(role);
  });

  it("is case-insensitive for role matching (lowercase 'admin')", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { user: { role: "admin" } } }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result.allowed).toBe(true);
  });

  it("accepts role on the body root when user.role is absent", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { role: "IT" } }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result.allowed).toBe(true);
  });

  it("calls fetch with POST /auth/login and the provided credentials", async () => {
    const spy = mockFetch({ status: 200, body: { user: { role: "ADMIN" } } });
    vi.stubGlobal("fetch", spy);
    await controller().verifyAccess({ email: "  it@hosp.com  ", password: "pw" });

    const [url, options] = spy.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/auth/login`);
    expect(options.method).toBe("POST");
    const sentBody = JSON.parse(options.body);
    // email should be trimmed
    expect(sentBody.email).toBe("it@hosp.com");
    expect(sentBody.password).toBe("pw");
  });
});

// ---------------------------------------------------------------------------
// forbidden role
// ---------------------------------------------------------------------------

describe("verifyAccess — forbidden role", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["STAFF", "UNKNOWN", ""])(
    "returns allowed:false + forbidden_role for role '%s'",
    async (role) => {
      vi.stubGlobal("fetch", mockFetch({ status: 200, body: { user: { role } } }));
      const result = await controller().verifyAccess(GOOD_CREDS);
      expect(result).toEqual({ allowed: false, reason: "forbidden_role" });
    }
  );
});

// ---------------------------------------------------------------------------
// 401 / 403 — invalid credentials
// ---------------------------------------------------------------------------

describe("verifyAccess — 401/403 invalid credentials", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([401, 403])("returns invalid_credentials for HTTP %d", async (status) => {
    vi.stubGlobal("fetch", mockFetch({ status }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "invalid_credentials" });
  });
});

// ---------------------------------------------------------------------------
// 429 — rate limited
// ---------------------------------------------------------------------------

describe("verifyAccess — 429 rate limited", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns rate_limited for HTTP 429", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 429 }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "rate_limited" });
  });
});

// ---------------------------------------------------------------------------
// non-OK server errors (5xx / unexpected 4xx)
// ---------------------------------------------------------------------------

describe("verifyAccess — non-OK server errors", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([500, 502, 503, 404])("returns server_error for HTTP %d", async (status) => {
    vi.stubGlobal("fetch", mockFetch({ status }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "server_error" });
  });
});

// ---------------------------------------------------------------------------
// invalid / malformed JSON in a 200 response
// ---------------------------------------------------------------------------

describe("verifyAccess — invalid JSON body", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns server_error when response.json() throws on a 200 response", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, invalidJson: true }));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "server_error" });
  });
});

// ---------------------------------------------------------------------------
// network / timeout errors
// ---------------------------------------------------------------------------

describe("verifyAccess — network and timeout errors", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns network_error when fetch rejects with a TypeError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "network_error" });
  });

  it("returns network_error when fetch is aborted (AbortError)", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    const result = await controller().verifyAccess(GOOD_CREDS);
    expect(result).toEqual({ allowed: false, reason: "network_error" });
  });

  it("cancels the timeout timer after a successful response", async () => {
    const clearSpy = vi.spyOn(window, "clearTimeout");
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { user: { role: "ADMIN" } } }));
    await controller().verifyAccess(GOOD_CREDS);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("cancels the timeout timer even when fetch rejects", async () => {
    const clearSpy = vi.spyOn(window, "clearTimeout");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("net::ERR_CONNECTION_REFUSED")));
    await controller().verifyAccess(GOOD_CREDS);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
