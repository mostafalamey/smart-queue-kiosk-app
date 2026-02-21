const runtime = window.kioskRuntime?.config ?? {};

export const getDefaultKioskConfig = () => {
  return {
    useMockApi: runtime.useMockApi !== false,
    apiBaseUrl: runtime.apiBaseUrl || "http://localhost:3000",
    mode: runtime.defaultMode || "reception",
    lockedDepartmentId: runtime.lockedDepartmentId || "dept-general",
    language: "en",
    printerName: "",
  };
};

const mockDepartments = [
  { id: "dept-general", name: "General Medicine" },
  { id: "dept-lab", name: "Laboratory" },
];

const mockServices = {
  "dept-general": [
    { id: "svc-general-1", name: "General Clinic" },
    { id: "svc-general-2", name: "Family Medicine" },
  ],
  "dept-lab": [{ id: "svc-lab-1", name: "Blood Test" }],
};

const mockProvider = {
  async health() {
    return { healthy: true };
  },

  async listDepartments() {
    return mockDepartments;
  },

  async listServicesByDepartment(departmentId) {
    return mockServices[departmentId] ?? [];
  },

  async issueTicket(input) {
    const sequence = Math.floor(Math.random() * 90) + 10;
    const ticketNumber = `K-${sequence}`;

    return {
      ticket: {
        id: `ticket-${Date.now()}`,
        ticketNumber,
        serviceId: input.serviceId,
        departmentId: input.departmentId,
        phoneNumber: input.phoneNumber,
      },
      queueSnapshot: {
        peopleAhead: Math.floor(Math.random() * 7),
        estimatedWaitMinutes: 5 + Math.floor(Math.random() * 20),
      },
      whatsappOptInQrUrl: `https://wa.me/201234567890?text=OPTIN%20${encodeURIComponent(ticketNumber)}`,
      issuedAt: new Date().toISOString(),
    };
  },
};

const createHttpProvider = (baseUrl) => ({
  async health() {
    const response = await fetch(`${baseUrl}/health`);
    return { healthy: response.ok };
  },

  async listDepartments() {
    const response = await fetch(`${baseUrl}/departments`);
    if (!response.ok) throw new Error("Failed to load departments");
    return response.json();
  },

  async listServicesByDepartment(departmentId) {
    const response = await fetch(`${baseUrl}/departments/${departmentId}/services`);
    if (!response.ok) throw new Error("Failed to load services");
    return response.json();
  },

  async issueTicket(input) {
    const response = await fetch(`${baseUrl}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to issue ticket");
    return response.json();
  },
});

export const createKioskDataProvider = (config) => {
  if (config?.useMockApi) {
    return mockProvider;
  }

  return createHttpProvider(config?.apiBaseUrl || "http://localhost:3000");
};
