import { useEffect, useMemo, useState } from "react";
import { kioskDataProvider, kioskRuntimeConfig } from "./data/provider";

export const App = () => {
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [printablePayload, setPrintablePayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const mode = kioskRuntimeConfig.defaultMode ?? "reception";
  const isDepartmentLocked = mode === "department-locked";

  const effectiveDepartmentId = useMemo(() => {
    if (isDepartmentLocked) {
      return kioskRuntimeConfig.lockedDepartmentId;
    }

    return selectedDepartmentId;
  }, [isDepartmentLocked, selectedDepartmentId]);

  useEffect(() => {
    const load = async () => {
      const departmentRows = await kioskDataProvider.listDepartments();
      const filtered = isDepartmentLocked
        ? departmentRows.filter(
            (department) => department.id === kioskRuntimeConfig.lockedDepartmentId
          )
        : departmentRows;

      setDepartments(filtered);

      const initialDepartmentId =
        filtered[0]?.id ?? kioskRuntimeConfig.lockedDepartmentId ?? "";
      setSelectedDepartmentId(initialDepartmentId);
    };

    void load();
  }, [isDepartmentLocked]);

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
  }, []);

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
