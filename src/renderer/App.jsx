import { useEffect, useMemo, useState } from "react";
import { createKioskDataProvider, getDefaultKioskConfig } from "./data/provider";

const KIOSK_CONFIG_STORAGE_KEY = "smartQueue.kiosk.config.v1";

const readStoredConfig = () => {
  try {
    const raw = window.localStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const saveConfig = (config) => {
  window.localStorage.setItem(KIOSK_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const App = () => {
  const [kioskConfig, setKioskConfig] = useState(null);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [printablePayload, setPrintablePayload] = useState(null);
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
    if (!kioskConfig) {
      return;
    }

    const load = async () => {
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
    };

    void load();
  }, [kioskConfig, kioskDataProvider, isDepartmentLocked, kioskConfig?.lockedDepartmentId]);

  useEffect(() => {
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
  }, [effectiveDepartmentId]);

  useEffect(() => {
    if (!kioskConfig) {
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
  }, [kioskConfig, kioskDataProvider]);

  const onConfigSubmit = (event) => {
    event.preventDefault();
    if (!kioskConfig) {
      return;
    }

    saveConfig(kioskConfig);
    setIsConfigMode(false);
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
                required
                value={kioskConfig.apiBaseUrl}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    apiBaseUrl: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Locked Department ID
              <input
                type="text"
                value={kioskConfig.lockedDepartmentId}
                onChange={(event) =>
                  setKioskConfig((current) => ({
                    ...current,
                    lockedDepartmentId: event.target.value,
                  }))
                }
              />
            </label>

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

            <button type="submit">Save Configuration</button>
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
        <button type="button" onClick={() => setIsConfigMode(true)}>
          Open Settings
        </button>
      </header>

      <section className={`banner banner--error ${isBackendHealthy ? "hidden" : ""}`}>
        Backend is unavailable. Ticket issuance is disabled.
      </section>

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
