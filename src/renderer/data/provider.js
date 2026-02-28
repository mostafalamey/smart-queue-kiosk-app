const runtime = window.kioskRuntime?.config ?? {};

export const HEALTH_POLL_INTERVAL_MS = 30_000;

const extractApiErrorCode = (body) => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidateCode =
    body.code ||
    body.errorCode ||
    body?.error?.code ||
    body?.error?.errorCode ||
    null;

  if (!candidateCode) {
    return null;
  }

  return String(candidateCode).toUpperCase();
};

const extractApiErrorMessage = (body, fallback) => {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const candidateMessage =
    body.message ||
    body.detail ||
    body?.error?.message ||
    body?.error?.detail ||
    (typeof body.error === "string" ? body.error : null) ||
     fallback;


  return String(candidateMessage || fallback);
};

const readJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const createApiError = async (response, fallbackMessage) => {
  const body = await readJsonSafely(response);
  const error = new Error(extractApiErrorMessage(body, fallbackMessage));

  error.name = "KioskApiError";
  error.status = response.status;
  error.code = extractApiErrorCode(body);
  error.details = body;

  return error;
};

export const getDefaultKioskConfig = () => {
  return {
    apiBaseUrl: runtime.apiBaseUrl || "http://localhost:3000",
    mode: runtime.defaultMode || "reception",
    lockedDepartmentId: runtime.lockedDepartmentId || "",
    language: "en",
    highContrast: false,
    printerName: "",
  };
};

const createHttpProvider = (baseUrl, language = "en") => {
  const normalizedLanguage = String(language || "en").toLowerCase();
  const isArabic = normalizedLanguage.startsWith("ar");
  const pickName = (item) =>
    isArabic
      ? (item.nameAr || item.nameEn || item.name || "")
      : (item.nameEn || item.nameAr || item.name || "");

  return {
    async health() {
      const response = await fetch(`${baseUrl}/health`);
      return { healthy: response.ok };
    },

    async listDepartments() {
      const response = await fetch(`${baseUrl}/departments`);
      if (!response.ok) {
        throw await createApiError(response, "Failed to load departments");
      }

      const data = await response.json();
      return data.map((d) => ({ ...d, name: pickName(d) }));
    },

    async listServicesByDepartment(departmentId) {
      const response = await fetch(`${baseUrl}/departments/${departmentId}/services`);
      if (!response.ok) {
        throw await createApiError(response, "Failed to load services");
      }

      const data = await response.json();
      return data.map((s) => ({ ...s, name: pickName(s) }));
    },

    async issueTicket(input) {
      const response = await fetch(`${baseUrl}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw await createApiError(response, "Failed to issue ticket");
      }

      return response.json();
    },
  };
};

export const createKioskDataProvider = (config) => {
  return createHttpProvider(config?.apiBaseUrl || "http://localhost:3000", config?.language || "en");
};
