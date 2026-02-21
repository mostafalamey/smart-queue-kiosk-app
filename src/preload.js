const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("kioskRuntime", {
  config: {
    useMockApi: process.env.USE_MOCK_API !== "false",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
    defaultMode: process.env.KIOSK_MODE === "DEPARTMENT_LOCKED" ? "department-locked" : "reception",
    lockedDepartmentId: process.env.KIOSK_LOCKED_DEPARTMENT_ID || "dept-general",
  },
});
