import { useEffect, useMemo, useState } from "react";
import { createKioskDataProvider, getDefaultKioskConfig } from "./data/provider";

const KIOSK_CONFIG_STORAGE_KEY = "smartQueue.kiosk.config.v1";

const isRecord = (value) => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const parseStoredConfig = (value) => {
  if (!isRecord(value)) {
    return null;
  }

  const useMockApi = value.useMockApi;
  const apiBaseUrl = value.apiBaseUrl;
  const mode = value.mode;
  const lockedDepartmentId = value.lockedDepartmentId;
  const language = value.language;
  const printerName = value.printerName;

  const hasValidShape =
    typeof useMockApi === "boolean" &&
    typeof apiBaseUrl === "string" &&
    apiBaseUrl.trim().length > 0 &&
    (mode === "reception" || mode === "department-locked") &&
    typeof lockedDepartmentId === "string" &&
    lockedDepartmentId.trim().length > 0 &&
    (language === "en" || language === "ar") &&
    typeof printerName === "string";

  if (!hasValidShape) {
    return null;
  }

  return {
    useMockApi,
    apiBaseUrl: apiBaseUrl.trim(),
    mode,
    lockedDepartmentId: lockedDepartmentId.trim(),
    language,
    printerName,
  };
};

const readStoredConfig = () => {
  try {
    const raw = window.localStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }

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

const saveConfig = (config) => {
  try {
    window.localStorage.setItem(KIOSK_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return {
      saved: true,
      message: null,
    };
  } catch (error) {
    console.error(
      "Failed to save config",
      KIOSK_CONFIG_STORAGE_KEY,
      error,
      config
    );

    try {
      window.sessionStorage.setItem(
        KIOSK_CONFIG_STORAGE_KEY,
        JSON.stringify(config)
      );
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

export const App = () => {
  const [kioskConfig, setKioskConfig] = useState(null);
  const [previousKioskConfig, setPreviousKioskConfig] = useState(null);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [dataReloadKey, setDataReloadKey] = useState(0);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [printablePayload, setPrintablePayload] = useState(null);
  const [configPersistenceMessage, setConfigPersistenceMessage] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mode = kioskConfig?.mode ?? "reception";
  const isDepartmentLocked = mode === "department-locked";
  const kioskDataProvider = useMemo(
    () => createKioskDataProvider(kioskConfig ?? getDefaultKioskConfig()),
    [kioskConfig]
  );

  useEffect(() => {
    const stored = readStoredConfig();
    if (stored) {
      setKioskConfig({
        ...getDefaultKioskConfig(),
        ...stored,
      });
      return;
    }

    setIsConfigMode(true);
    setKioskConfig(getDefaultKioskConfig());
  }, []);

  const effectiveDepartmentId = useMemo(() => {
    if (isDepartmentLocked) {
      return kioskConfig?.lockedDepartmentId;
    }

    return selectedDepartmentId;
  }, [isDepartmentLocked, kioskConfig?.lockedDepartmentId, selectedDepartmentId]);

  useEffect(() => {
    if (!kioskConfig || isConfigMode) {
      return;
    }

    const load = async () => {
      try {
        const departmentRows = await kioskDataProvider.listDepartments();
        const filtered = isDepartmentLocked
          ? departmentRows.filter(
              (department) => department.id === kioskConfig.lockedDepartmentId
            )
          : departmentRows;

        setDepartments(filtered);

        const initialDepartmentId =
          filtered[0]?.id ?? kioskConfig.lockedDepartmentId ?? "";
        setSelectedDepartmentId(initialDepartmentId);
      } catch (error) {
        console.error("Failed to load departments", error);
        setDepartments([]);
        setSelectedDepartmentId("");
      }
    };

    void load();
  }, [kioskConfig, isDepartmentLocked, isConfigMode, dataReloadKey]);

  useEffect(() => {
    if (isConfigMode) {
      return;
    }

    if (!effectiveDepartmentId) {
      setServices([]);
      setSelectedServiceId("");
      return;
    }

    const loadServices = async () => {
      const serviceRows = await kioskDataProvider.listServicesByDepartment(
        effectiveDepartmentId
      );
      setServices(serviceRows);
      setSelectedServiceId(serviceRows[0]?.id ?? "");
    };

    void loadServices();
  }, [effectiveDepartmentId, kioskDataProvider, isConfigMode, dataReloadKey]);

  useEffect(() => {
    if (!kioskConfig || isConfigMode) {
      return;
    }

    const checkHealth = async () => {
      if (!navigator.onLine) {
        setIsBackendHealthy(false);
        return;
      }

      try {
        const health = await kioskDataProvider.health();
        setIsBackendHealthy(health.healthy);
      } catch {
        setIsBackendHealthy(false);
      }
    };

    void checkHealth();

    const onOnline = () => {
      void checkHealth();
    };
    const onOffline = () => {
      setIsBackendHealthy(false);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [kioskConfig, kioskDataProvider, isConfigMode]);

  const testServerConnection = async (config) => {
    if (config.useMockApi) {
      return true;
    }

    const normalizedApiBaseUrl = config.apiBaseUrl.trim();
    if (!normalizedApiBaseUrl) {
      setConfigPersistenceMessage("Server URL is required when Use Mock API is disabled.");
      return false;
    }

    const controller = new AbortController();
    const timeoutHandle = window.setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      const response = await fetch(`${normalizedApiBaseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        setConfigPersistenceMessage(
          "Unable to connect to the server URL. Please verify the address and backend health endpoint."
        );
        return false;
      }

      setConfigPersistenceMessage(null);
      return true;
    } catch (error) {
      console.error("Failed to test kiosk server connection", error);
      setConfigPersistenceMessage(
        "Unable to connect to the server URL. Please verify network access and try again."
      );
      return false;
    } finally {
      window.clearTimeout(timeoutHandle);
    }
  };

  const onTestConnection = async () => {
    if (!kioskConfig || kioskConfig.useMockApi || isTestingConnection) {
      return;
    }

    setIsTestingConnection(true);
    await testServerConnection(kioskConfig);
    setIsTestingConnection(false);
  };

  const onConfigSubmit = async (event) => {
    event.preventDefault();
    if (!kioskConfig || isTestingConnection) {
      return;
    }

    if (
      kioskConfig.mode === "department-locked" &&
      kioskConfig.lockedDepartmentId.trim().length === 0
    ) {
      setConfigPersistenceMessage(
        "Locked Department ID is required when kiosk mode is Department-Locked."
      );
      return;
    }

    setIsTestingConnection(true);
    const isConnectionValid = await testServerConnection(kioskConfig);
    setIsTestingConnection(false);

    if (!isConnectionValid) {
      return;
    }

    const saveResult = saveConfig(kioskConfig);
    setConfigPersistenceMessage(saveResult.message);

    if (!saveResult.saved) {
      return;
    }

    setDepartments([]);
    setServices([]);
    setSelectedDepartmentId("");
    setSelectedServiceId("");
    setPreviousKioskConfig(null);
    setIsConfigMode(false);
    setDataReloadKey((current) => current + 1);
  };

  const onCancelConfig = () => {
    if (!previousKioskConfig) {
      return;
    }

    setKioskConfig(previousKioskConfig);
    setPreviousKioskConfig(null);
    setConfigPersistenceMessage(null);
    setIsConfigMode(false);
  };

  const onOpenSettings = () => {
    if (!kioskConfig) {
      return;
    }

    setPreviousKioskConfig({ ...kioskConfig });
    setConfigPersistenceMessage(null);
    setIsConfigMode(true);
  };

  if (!kioskConfig) {
    return null;
  }

  if (isConfigMode) {
    return (
      <main className="container">
        <header className="header">
          <h1>Smart Queue Kiosk Setup</h1>
          <p>First-run configuration wizard</p>
        </header>

        <section className="card">
          {configPersistenceMessage && (
            <section className="banner banner--error">{configPersistenceMessage}</section>
          )}

          <form onSubmit={onConfigSubmit}>
            <label>
              Kiosk Mode
              <select
                value={kioskConfig.mode}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    mode: event.target.value,
                  }))
                }
              >
                <option value="reception">Reception</option>
                <option value="department-locked">Department-Locked</option>
              </select>
            </label>

            <label>
              Server URL
              <input
                type="url"
                required={!kioskConfig.useMockApi}
                disabled={kioskConfig.useMockApi}
                value={kioskConfig.apiBaseUrl}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    apiBaseUrl: event.target.value,
                  }))
                }
              />
            </label>

            {kioskConfig.mode === "department-locked" && (
              <label>
                Locked Department ID
                <input
                  type="text"
                  required
                  value={kioskConfig.lockedDepartmentId}
                  onChange={(event) =>
                    setKioskConfig((current) => ({
                      ...current,
                      lockedDepartmentId: event.target.value,
                    }))
                  }
                />
              </label>
            )}

            <label>
              Language
              <select
                value={kioskConfig.language}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    language: event.target.value,
                  }))
                }
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </label>

            <label>
              Default Printer Name
              <input
                type="text"
                value={kioskConfig.printerName}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    printerName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={kioskConfig.useMockApi}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    useMockApi: event.target.checked,
                  }))
                }
              />
              Use Mock API
            </label>

            {!kioskConfig.useMockApi && (
              <button type="button" onClick={onTestConnection} disabled={isTestingConnection}>
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </button>
            )}

            <button type="submit" disabled={isTestingConnection}>
              {isTestingConnection ? "Testing..." : "Save Configuration"}
            </button>
            {previousKioskConfig && (
              <button type="button" onClick={onCancelConfig}>
                Cancel
              </button>
            )}
          </form>
        </section>
      </main>
    );
  }

  const onIssueTicket = async (event) => {
    event.preventDefault();

    if (!isBackendHealthy || !phoneNumber.trim() || !selectedServiceId) {
      return;
    }

    try {
      setSubmitting(true);
      const issued = await kioskDataProvider.issueTicket({
        departmentId: effectiveDepartmentId,
        serviceId: selectedServiceId,
        phoneNumber: phoneNumber.trim(),
      });

      setPrintablePayload({
        ticketNumber: issued.ticket.ticketNumber,
        phoneNumber: issued.ticket.phoneNumber,
        departmentId: issued.ticket.departmentId,
        serviceId: issued.ticket.serviceId,
        queueSnapshot: issued.queueSnapshot,
        whatsappOptInQrUrl: issued.whatsappOptInQrUrl,
        issuedAt: issued.issuedAt,
      });

      setPhoneNumber("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Smart Queue Kiosk</h1>
        <p>Mode: {isDepartmentLocked ? "Department-Locked" : "Reception"}</p>
        <button type="button" onClick={onOpenSettings}>
          Open Settings
        </button>
      </header>

      <section className={`banner banner--error ${isBackendHealthy ? "hidden" : ""}`}>
        Backend is unavailable. Ticket issuance is disabled.
      </section>

      {configPersistenceMessage && (
        <section className="banner banner--error">{configPersistenceMessage}</section>
      )}

      <section className="card">
        <h2>Issue Ticket</h2>
        <form onSubmit={onIssueTicket}>
          <label>
            Department
            <select
              value={effectiveDepartmentId}
              disabled={isDepartmentLocked}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Service
            <select
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              placeholder="05XXXXXXXX"
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </label>

          <button type="submit" disabled={!isBackendHealthy || submitting}>
            Issue Ticket
          </button>
        </form>
      </section>

      {printablePayload && (
        <section className="card">
          <h2>Print Payload Preview</h2>
          <pre>{JSON.stringify(printablePayload, null, 2)}</pre>
        </section>
      )}
    </main>
  );
};
