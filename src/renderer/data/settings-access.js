export const createSettingsAccessController = (config) => {
  const useMockApi = config?.useMockApi !== false;
  const apiBaseUrl = String(config?.apiBaseUrl || "").trim();

  return {
    protectionEnabled: false,
    async verifyAccess() {
      return {
        allowed: true,
        deferred: true,
        reason: "backend_auth_not_ready",
        useMockApi,
        apiBaseUrl,
      };
    },
  };
};
