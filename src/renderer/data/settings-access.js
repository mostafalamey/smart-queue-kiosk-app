const ALLOWED_SETTINGS_ROLES = new Set(["ADMIN", "IT", "MANAGER"]);
const SETTINGS_AUTH_TIMEOUT_MS = 8_000;

export const createSettingsAccessController = (config) => {
  const apiBaseUrl = String(config?.apiBaseUrl || "").trim();

  return {
    protectionEnabled: Boolean(apiBaseUrl),

    /**
     * Verify that the caller is an Admin, IT, or Manager.
     * @param {{ email: string, password: string }} credentials
     * @returns {Promise<{ allowed: boolean, reason?: string }>}
     */
    async verifyAccess(credentials) {
      if (!apiBaseUrl) {
        // No backend URL configured — allow access (should not happen in normal flow
        // since first-run wizard now requires a URL, but guard for safety).
        return { allowed: true, reason: "no_backend_configured" };
      }

      const controller = new AbortController();
      const timeoutHandle = window.setTimeout(() => {
        controller.abort();
      }, SETTINGS_AUTH_TIMEOUT_MS);

      try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(credentials?.email ?? "").trim(),
            password: String(credentials?.password ?? ""),
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutHandle);

        if (response.status === 429) {
          return { allowed: false, reason: "rate_limited" };
        }

        if (response.status === 401 || response.status === 403) {
          return { allowed: false, reason: "invalid_credentials" };
        }

        if (!response.ok) {
          return { allowed: false, reason: "server_error" };
        }

        let body;
        try {
          body = await response.json();
        } catch {
          return { allowed: false, reason: "server_error" };
        }

        const role = String(body?.user?.role ?? body?.role ?? "").toUpperCase();
        if (!ALLOWED_SETTINGS_ROLES.has(role)) {
          return { allowed: false, reason: "forbidden_role" };
        }

        return { allowed: true, role };
      } catch (error) {
        window.clearTimeout(timeoutHandle);

        if (error?.name === "AbortError") {
          return { allowed: false, reason: "network_error" };
        }

        return { allowed: false, reason: "network_error" };
      }
    },
  };
};
