import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createKioskDataProvider, getDefaultKioskConfig } from "./data/provider";
import { createSettingsAccessController } from "./data/settings-access";
import {
  AlertTriangle,
  Delete,
  CheckCircle2,
  Info,
  Languages,
  Printer,
  Settings,
  Ticket,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

const KIOSK_CONFIG_STORAGE_KEY = "smartQueue.kiosk.config.v1";
const KIOSK_DEVICE_ID_STORAGE_KEY = "smartQueue.kiosk.deviceId.v1";
const KIOSK_UX_METRICS_STORAGE_KEY = "smartQueue.kiosk.uxMetrics.v1";
const KIOSK_UX_METRICS_MAX_EVENTS = 300;
const KIOSK_IDLE_TIMEOUT_MS = 45_000;
const SUCCESS_POPUP_TIMEOUT_MS = 8_000;
const EGYPT_MOBILE_PATTERN = /^01[0125]\d{8}$/;

const PATIENT_UI_TEXT = {
  en: {
    stepDepartment: "Department",
    stepService: "Service",
    stepPhone: "Phone",
    modeLabel: "Mode",
    modeReception: "Reception",
    modeDepartmentLocked: "Department-Locked",
    languageToggleLabel: "Switch Language",
    languageToggleToArabic: "العربية",
    languageToggleToEnglish: "English",
    online: "Online",
    offline: "Offline",
    printerReady: "Printer Ready",
    printerOffline: "Printer Offline",
    setupTitle: "Smart Queue Kiosk Setup",
    setupSubtitle: "First-run configuration wizard",
    kioskModeLabel: "Kiosk Mode",
    serverUrlLabel: "Server URL",
    lockedDepartmentLabel: "Locked Department ID",
    noDepartmentsAvailable: "No departments available",
    languageLabel: "Language",
    defaultPrinterLabel: "Default Printer",
    noPrintersAvailable: "No printers available",
    printerDiscoveryUnavailable:
      "Printer discovery is unavailable in this runtime. Run inside Electron to list Windows printers.",
    noPrintersDetected: "No printers detected from Windows Print Services.",
    printerLoadFailed: "Failed to load system printers. Please retry.",
    highContrastModeLabel: "High Contrast Mode",
    useMockApiLabel: "Use Mock API",
    refreshPrinters: "Refresh Printers",
    refreshingPrinters: "Refreshing Printers...",
    testConnection: "Test Connection",
    testing: "Testing...",
    saveConfiguration: "Save Configuration",
    copyDeviceId: "Copy Device ID",
    copyDeviceIdDone: "Device ID copied.",
    copyDeviceIdFailed: "Unable to copy Device ID. Please copy it manually.",
    settingsAuthDeferredNotice:
      "Settings protection is deferred until backend authorization endpoints are available. Access remains open for this phase.",
    serverUrlRequiredWhenNoMock: "Server URL is required when Use Mock API is disabled.",
    serverConnectionFailedHealth:
      "Unable to connect to the server URL. Please verify the address and backend health endpoint.",
    serverConnectionFailedNetwork:
      "Unable to connect to the server URL. Please verify network access and try again.",
    noDepartmentsForLocked:
      "No departments are available for Department-Locked mode. Please verify department data source and try again.",
    lockedDepartmentRequired:
      "Locked Department ID is required when kiosk mode is Department-Locked.",
    settings: "Settings",
    settingsGeneralTab: "General",
    settingsPrinterTab: "Printer",
    settingsDiagnosticsTab: "Diagnostics",
    diagnosticsTitle: "Operator Diagnostics",
    diagnosticsBackendStatus: "Backend Status",
    diagnosticsBackendHealthy: "Healthy",
    diagnosticsBackendUnhealthy: "Unavailable",
    diagnosticsLastHealthCheck: "Last Health Check",
    diagnosticsLastPrintResult: "Last Print Result",
    diagnosticsPrintSuccess: "Printed successfully",
    diagnosticsPrintFailed: "Print failed",
    diagnosticsPrintNotRun: "No print attempts yet",
    diagnosticsDeviceId: "Kiosk Device ID",
    diagnosticsDeviceIdHint: "Use this ID in Admin Mapping.",
    diagnosticsUxSummaryTitle: "UX Baseline Summary",
    diagnosticsFlowsCount: "Flow Starts",
    diagnosticsIssuedCount: "Tickets Issued",
    diagnosticsMedianTimeToTicket: "Median Time to Ticket",
    diagnosticsPrintFailureRate: "Print Failure Rate",
    diagnosticsDuplicateErrorRate: "Duplicate Error Rate",
    diagnosticsNotEnoughData: "Not enough data",
    diagnosticsNever: "Never",
    kioskProgress: "Kiosk progress",
    selectDepartmentTitle: "1. Select Department",
    departmentLabel: "Department",
    chooseDepartmentPrompt: "Choose one department to continue.",
    loadingDepartments: "Loading departments...",
    selectServiceTitle: "2. Select Service",
    chooseServicePrompt: "Choose one service to continue.",
    loadingServices: "Loading services...",
    noServicesAvailable: "No services available for the selected department.",
    serviceList: "Service list",
    enterPhoneTitle: "3. Enter Phone Number",
    enterPhoneDescription: "Enter an Egypt mobile number to issue a ticket.",
    enterPhoneButton: "Enter Phone Number",
    phonePopupTitle: "Confirm your ticket",
    phonePopupDescription: "Enter your mobile number for updates.",
    phoneServiceLabel: "Service",
    phoneLabel: "Mobile number",
    phonePlaceholder: "01XXXXXXXXX",
    phoneHint: "Use Egypt mobile format: 01XXXXXXXXX.",
    dialPadClear: "Clear",
    dialPadBackspace: "⌫",
    phoneRequired: "Phone number is required.",
    phoneInvalid: "Enter a valid Egypt mobile number in this format: 01XXXXXXXXX.",
    cancel: "Cancel",
    continueButton: "Continue",
    backButton: "Back",
    issueTicket: "Issue Ticket",
    printTicket: "Print Ticket",
    issuing: "Issuing...",
    retryPrint: "Retry Print",
    startOver: "Start Over",
    close: "Close",
    done: "Done",
    printStateFailed: "Print failed",
    printStateSuccess: "Printed successfully",
    ticketIssuedTitle: (ticketNumber) => `Ticket ${ticketNumber} issued`,
    ticketPrintedTitle: (ticketNumber) => `Ticket ${ticketNumber} printed`,
    takePrintedTicket: "Please take the printed ticket.",
    printFailedDescription:
      "Ticket was issued, but printing failed. Please check printer settings.",
    issueTicketFailedTitle: "Unable to issue ticket",
    backendUnavailableTitle: "Backend unavailable",
    backendUnavailableDescription:
      "Ticket issuance is temporarily disabled. Please ask reception for assistance.",
    selectServiceFirstTitle: "Select a service first",
    selectServiceFirstDescription:
      "Please select a service before entering the phone number.",
    duplicateTicketError:
      "An active ticket already exists for this phone number and service. Please use another service or ask reception for help.",
    serviceUnavailableError:
      "This service is currently unavailable. Please choose another service or ask reception for help.",
    invalidRequestError:
      "The request data is invalid. Please verify the phone number and try again.",
    serviceTemporaryUnavailableError:
      "Ticket service is temporarily unavailable. Please wait a moment and try again.",
    serverError:
      "A server error occurred while issuing the ticket. Please try again or ask reception for help.",
    networkError:
      "Network connection appears unstable. Please try again or ask reception for help.",
    genericIssueError:
      "Unable to issue ticket right now. Please try again or ask reception for help.",
    ticketLabel: "Ticket",
    departmentSummaryLabel: "Department",
    serviceSummaryLabel: "Service",
    peopleAheadLabel: "People Ahead",
    estimatedWaitLabel: "Est. Wait",
    issuedAtLabel: "Issued At",
    whatsappLabel: "WhatsApp Link",
    whatsappQrLabel: "WhatsApp QR",
    whatsappQrHint: "Scan to open WhatsApp opt-in.",
    minutesSuffix: "min",
    notAvailable: "N/A",
    startOverHint:
      "If printing still fails, press Start Over and ask reception to assist the patient.",
  },
  ar: {
    stepDepartment: "القسم",
    stepService: "الخدمة",
    stepPhone: "الهاتف",
    modeLabel: "الوضع",
    modeReception: "الاستقبال",
    modeDepartmentLocked: "قسم محدد",
    languageToggleLabel: "تغيير اللغة",
    languageToggleToArabic: "العربية",
    languageToggleToEnglish: "English",
    online: "متصل",
    offline: "غير متصل",
    printerReady: "الطابعة جاهزة",
    printerOffline: "الطابعة غير متصلة",
    setupTitle: "إعداد كشك Smart Queue",
    setupSubtitle: "معالج الإعداد الأولي",
    kioskModeLabel: "وضع الكشك",
    serverUrlLabel: "رابط الخادم",
    lockedDepartmentLabel: "معرّف القسم المقيد",
    noDepartmentsAvailable: "لا توجد أقسام متاحة",
    languageLabel: "اللغة",
    defaultPrinterLabel: "الطابعة الافتراضية",
    noPrintersAvailable: "لا توجد طابعات متاحة",
    printerDiscoveryUnavailable:
      "ميزة اكتشاف الطابعات غير متاحة في هذا التشغيل. شغّل التطبيق داخل Electron لعرض طابعات ويندوز.",
    noPrintersDetected: "لم يتم العثور على طابعات عبر خدمات طباعة ويندوز.",
    printerLoadFailed: "تعذر تحميل طابعات النظام. يرجى إعادة المحاولة.",
    highContrastModeLabel: "وضع التباين العالي",
    useMockApiLabel: "استخدام واجهة تجريبية",
    refreshPrinters: "تحديث الطابعات",
    refreshingPrinters: "جارٍ تحديث الطابعات...",
    testConnection: "اختبار الاتصال",
    testing: "جارٍ الاختبار...",
    saveConfiguration: "حفظ الإعدادات",
    copyDeviceId: "نسخ معرّف الجهاز",
    copyDeviceIdDone: "تم نسخ معرّف الجهاز.",
    copyDeviceIdFailed: "تعذر نسخ معرّف الجهاز. يرجى نسخه يدويًا.",
    settingsAuthDeferredNotice:
      "حماية الإعدادات مؤجلة حتى توفر نقاط تفويض الخادم. الوصول يظل مفتوحًا في هذه المرحلة.",
    serverUrlRequiredWhenNoMock: "رابط الخادم مطلوب عند تعطيل الواجهة التجريبية.",
    serverConnectionFailedHealth:
      "تعذر الاتصال برابط الخادم. يرجى التحقق من العنوان ونقطة فحص صحة الخادم.",
    serverConnectionFailedNetwork:
      "تعذر الاتصال برابط الخادم. يرجى التحقق من الشبكة ثم المحاولة مرة أخرى.",
    noDepartmentsForLocked:
      "لا توجد أقسام متاحة لوضع القسم المقيد. يرجى التحقق من مصدر بيانات الأقسام ثم المحاولة مرة أخرى.",
    lockedDepartmentRequired:
      "معرّف القسم المقيد مطلوب عند تفعيل وضع القسم المقيد.",
    settings: "الإعدادات",
    settingsGeneralTab: "عام",
    settingsPrinterTab: "الطابعة",
    settingsDiagnosticsTab: "التشخيص",
    diagnosticsTitle: "تشخيص التشغيل",
    diagnosticsBackendStatus: "حالة الخادم",
    diagnosticsBackendHealthy: "متاح",
    diagnosticsBackendUnhealthy: "غير متاح",
    diagnosticsLastHealthCheck: "آخر فحص للخادم",
    diagnosticsLastPrintResult: "آخر نتيجة طباعة",
    diagnosticsPrintSuccess: "تمت الطباعة بنجاح",
    diagnosticsPrintFailed: "فشلت الطباعة",
    diagnosticsPrintNotRun: "لا توجد محاولات طباعة بعد",
    diagnosticsDeviceId: "معرّف جهاز الكشك",
    diagnosticsDeviceIdHint: "استخدم هذا المعرّف في الربط داخل لوحة الإدارة.",
    diagnosticsUxSummaryTitle: "ملخص خط الأساس لتجربة الاستخدام",
    diagnosticsFlowsCount: "بدايات الجلسات",
    diagnosticsIssuedCount: "التذاكر المُصدرة",
    diagnosticsMedianTimeToTicket: "الوقت الوسيط لإصدار التذكرة",
    diagnosticsPrintFailureRate: "معدل فشل الطباعة",
    diagnosticsDuplicateErrorRate: "معدل أخطاء التذاكر المكررة",
    diagnosticsNotEnoughData: "بيانات غير كافية",
    diagnosticsNever: "لا يوجد",
    kioskProgress: "تقدم الكشك",
    selectDepartmentTitle: "1. اختر القسم",
    departmentLabel: "القسم",
    chooseDepartmentPrompt: "اختر قسمًا واحدًا للمتابعة.",
    loadingDepartments: "جارٍ تحميل الأقسام...",
    selectServiceTitle: "2. اختر الخدمة",
    chooseServicePrompt: "اختر خدمة واحدة للمتابعة.",
    loadingServices: "جارٍ تحميل الخدمات...",
    noServicesAvailable: "لا توجد خدمات متاحة للقسم المحدد.",
    serviceList: "قائمة الخدمات",
    enterPhoneTitle: "3. أدخل رقم الهاتف",
    enterPhoneDescription: "أدخل رقم موبايل مصري لإصدار التذكرة.",
    enterPhoneButton: "إدخال رقم الهاتف",
    phonePopupTitle: "تأكيد التذكرة",
    phonePopupDescription: "أدخل رقم الموبايل لتلقي التحديثات.",
    phoneServiceLabel: "الخدمة",
    phoneLabel: "رقم الموبايل",
    phonePlaceholder: "01XXXXXXXXX",
    phoneHint: "استخدم صيغة الموبايل المصري: 01XXXXXXXXX.",
    dialPadClear: "مسح",
    dialPadBackspace: "⌫",
    phoneRequired: "رقم الهاتف مطلوب.",
    phoneInvalid: "أدخل رقم موبايل مصري صحيح بهذه الصيغة: 01XXXXXXXXX.",
    cancel: "إلغاء",
    continueButton: "متابعة",
    backButton: "رجوع",
    issueTicket: "إصدار التذكرة",
    printTicket: "طباعة التذكرة",
    issuing: "جارٍ الإصدار...",
    retryPrint: "إعادة الطباعة",
    startOver: "ابدأ من جديد",
    close: "إغلاق",
    done: "تم",
    printStateFailed: "فشلت الطباعة",
    printStateSuccess: "تمت الطباعة بنجاح",
    ticketIssuedTitle: (ticketNumber) => `تم إصدار التذكرة ${ticketNumber}`,
    ticketPrintedTitle: (ticketNumber) => `تمت طباعة التذكرة ${ticketNumber}`,
    takePrintedTicket: "يرجى استلام التذكرة المطبوعة.",
    printFailedDescription:
      "تم إصدار التذكرة لكن فشلت الطباعة. يرجى التحقق من إعدادات الطابعة.",
    issueTicketFailedTitle: "تعذر إصدار التذكرة",
    backendUnavailableTitle: "الخادم غير متاح",
    backendUnavailableDescription:
      "إصدار التذاكر متوقف مؤقتًا. يرجى طلب المساعدة من الاستقبال.",
    selectServiceFirstTitle: "اختر خدمة أولاً",
    selectServiceFirstDescription: "يرجى اختيار خدمة قبل إدخال رقم الهاتف.",
    duplicateTicketError:
      "يوجد تذكرة نشطة بالفعل لهذا الرقم في نفس الخدمة. يرجى اختيار خدمة أخرى أو طلب المساعدة من الاستقبال.",
    serviceUnavailableError:
      "هذه الخدمة غير متاحة حاليًا. يرجى اختيار خدمة أخرى أو طلب المساعدة من الاستقبال.",
    invalidRequestError: "البيانات المدخلة غير صحيحة. يرجى التحقق من رقم الهاتف والمحاولة مرة أخرى.",
    serviceTemporaryUnavailableError:
      "خدمة التذاكر غير متاحة مؤقتًا. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.",
    serverError:
      "حدث خطأ في الخادم أثناء إصدار التذكرة. يرجى المحاولة مرة أخرى أو طلب المساعدة من الاستقبال.",
    networkError:
      "اتصال الشبكة غير مستقر. يرجى المحاولة مرة أخرى أو طلب المساعدة من الاستقبال.",
    genericIssueError:
      "تعذر إصدار التذكرة الآن. يرجى المحاولة مرة أخرى أو طلب المساعدة من الاستقبال.",
    ticketLabel: "التذكرة",
    departmentSummaryLabel: "القسم",
    serviceSummaryLabel: "الخدمة",
    peopleAheadLabel: "عدد المنتظرين قبلك",
    estimatedWaitLabel: "الانتظار المتوقع",
    issuedAtLabel: "وقت الإصدار",
    whatsappLabel: "رابط واتساب",
    whatsappQrLabel: "رمز واتساب",
    whatsappQrHint: "امسح الرمز لفتح الاشتراك عبر واتساب.",
    minutesSuffix: "دقيقة",
    notAvailable: "غير متوفر",
    startOverHint:
      "إذا استمر فشل الطباعة، اضغط ابدأ من جديد واطلب من الاستقبال مساعدة المريض.",
  },
};

const normalizePhoneNumberInput = (value) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
};

const validatePhoneNumber = (value) => {
  const normalized = normalizePhoneNumberInput(value);

  if (!normalized) {
    return "required";
  }

  const isValidEgyptMobile = EGYPT_MOBILE_PATTERN.test(normalized);

  if (isValidEgyptMobile) {
    return null;
  }

  return "invalid";
};

const isRecord = (value) => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const createKioskDeviceId = () => {
  const uniquePart =
    typeof globalThis?.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  return `KIOSK-${uniquePart.toUpperCase()}`;
};

const getOrCreateKioskDeviceId = () => {
  const readStorage = (storage) => {
    try {
      const value = storage.getItem(KIOSK_DEVICE_ID_STORAGE_KEY);
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    } catch {
      return null;
    }

    return null;
  };

  const localDeviceId = readStorage(window.localStorage);
  if (localDeviceId) {
    return localDeviceId;
  }

  const sessionDeviceId = readStorage(window.sessionStorage);
  if (sessionDeviceId) {
    return sessionDeviceId;
  }

  const generatedId = createKioskDeviceId();

  try {
    window.localStorage.setItem(KIOSK_DEVICE_ID_STORAGE_KEY, generatedId);
    return generatedId;
  } catch {
    try {
      window.sessionStorage.setItem(KIOSK_DEVICE_ID_STORAGE_KEY, generatedId);
      return generatedId;
    } catch {
      return generatedId;
    }
  }
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
  const highContrast = value.highContrast;
  const printerName = value.printerName;

  const hasValidShape =
    typeof useMockApi === "boolean" &&
    typeof apiBaseUrl === "string" &&
    apiBaseUrl.trim().length > 0 &&
    (mode === "reception" || mode === "department-locked") &&
    typeof lockedDepartmentId === "string" &&
    lockedDepartmentId.trim().length > 0 &&
    (language === "en" || language === "ar") &&
    (typeof highContrast === "boolean" || typeof highContrast === "undefined") &&
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
    highContrast: typeof highContrast === "boolean" ? highContrast : false,
    printerName,
  };
};

const readStoredConfig = () => {
  const parseAndValidate = (raw) => {
    if (!raw) {
      return null;
    }

    try {
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

  let localRaw = null;
  let sessionRaw = null;

  try {
    localRaw = window.localStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
  } catch {
    localRaw = null;
  }

  const localValidated = parseAndValidate(localRaw);
  if (localValidated) {
    return localValidated;
  }

  try {
    sessionRaw = window.sessionStorage.getItem(KIOSK_CONFIG_STORAGE_KEY);
  } catch {
    sessionRaw = null;
  }

  return parseAndValidate(sessionRaw);
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

const readStoredUxMetrics = () => {
  const readStorage = (storage) => {
    try {
      const raw = storage.getItem(KIOSK_UX_METRICS_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const localMetrics = readStorage(window.localStorage);
  if (localMetrics) {
    return localMetrics;
  }

  return readStorage(window.sessionStorage) ?? [];
};

const appendUxMetric = (metricEvent) => {
  const current = readStoredUxMetrics();
  const next = [...current, metricEvent].slice(-KIOSK_UX_METRICS_MAX_EVENTS);

  try {
    window.localStorage.setItem(KIOSK_UX_METRICS_STORAGE_KEY, JSON.stringify(next));
    return;
  } catch {
    try {
      window.sessionStorage.setItem(KIOSK_UX_METRICS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  }
};

const calculateMedian = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middleIndex - 1] + sorted[middleIndex]) / 2);
  }

  return sorted[middleIndex];
};

const calculateUxMetricsSummary = (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      flowsCount: 0,
      issuedCount: 0,
      medianTimeToTicketMs: null,
      printFailureRate: null,
      duplicateErrorRate: null,
    };
  }

  const flowStarts = events.filter((eventRow) => eventRow?.eventName === "screen_start");
  const issuedRows = events.filter((eventRow) => eventRow?.eventName === "ticket_issued");
  const printRows = events.filter((eventRow) => eventRow?.eventName === "print_result");
  const issueFailedRows = events.filter(
    (eventRow) => eventRow?.eventName === "ticket_issue_failed"
  );

  const issuedDurations = issuedRows
    .map((eventRow) => Number(eventRow?.flowDurationMs ?? NaN))
    .filter((duration) => Number.isFinite(duration) && duration >= 0);

  const failedPrintCount = printRows.filter((eventRow) => eventRow?.ok === false).length;

  const duplicateErrorCount = issueFailedRows.filter((eventRow) => {
    const status = Number(eventRow?.status ?? 0);
    const code = String(eventRow?.code ?? "").toUpperCase();
    return (
      status === 409 ||
      code.includes("DUPLICATE") ||
      code.includes("ACTIVE_TICKET")
    );
  }).length;

  return {
    flowsCount: flowStarts.length,
    issuedCount: issuedRows.length,
    medianTimeToTicketMs: calculateMedian(issuedDurations),
    printFailureRate:
      printRows.length > 0 ? Number(((failedPrintCount / printRows.length) * 100).toFixed(1)) : null,
    duplicateErrorRate:
      issueFailedRows.length > 0
        ? Number(((duplicateErrorCount / issueFailedRows.length) * 100).toFixed(1))
        : null,
  };
};

export const App = () => {
  const [kioskConfig, setKioskConfig] = useState(null);
  const [previousKioskConfig, setPreviousKioskConfig] = useState(null);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [dataReloadKey, setDataReloadKey] = useState(0);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [wizardDepartments, setWizardDepartments] = useState([]);
  const [wizardPrinters, setWizardPrinters] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [currentStep, setCurrentStep] = useState("department");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneTouched, setIsPhoneTouched] = useState(false);
  const [isPhonePopupOpen, setIsPhonePopupOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);
  const [printablePayload, setPrintablePayload] = useState(null);
  const [configPersistenceMessage, setConfigPersistenceMessage] = useState(null);
  const [printerMessage, setPrinterMessage] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const [kioskDeviceId, setKioskDeviceId] = useState("");
  const [diagnostics, setDiagnostics] = useState({
    lastHealthStatus: "unknown",
    lastHealthCheckedAt: null,
    lastPrintStatus: "none",
    lastPrintCheckedAt: null,
  });
  const [uxMetricsSummary, setUxMetricsSummary] = useState(() =>
    calculateUxMetricsSummary(readStoredUxMetrics())
  );
  const flowSessionRef = useRef({
    flowId: "",
    startedAt: 0,
  });

  const mode = kioskConfig?.mode ?? "reception";
  const isDepartmentLocked = mode === "department-locked";
  const isArabic = kioskConfig?.language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";
  const uiText = PATIENT_UI_TEXT[isArabic ? "ar" : "en"];
  const toneIconByKey = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };
  const kioskDataProvider = useMemo(
    () => createKioskDataProvider(kioskConfig ?? getDefaultKioskConfig()),
    [kioskConfig]
  );
  const settingsAccessController = useMemo(
    () => createSettingsAccessController(kioskConfig ?? getDefaultKioskConfig()),
    [kioskConfig]
  );

  const printerStatusLabel = kioskConfig?.printerName
    ? uiText.printerReady
    : uiText.printerOffline;
  const languageToggleLabel = isArabic
    ? uiText.languageToggleToEnglish
    : uiText.languageToggleToArabic;

  const trackUxMetric = useCallback(
    (eventName, details = {}) => {
      const metricDepartmentId = isDepartmentLocked
        ? kioskConfig?.lockedDepartmentId || ""
        : selectedDepartmentId;
      const eventTimestamp = Date.now();
      const flowDurationMs = flowSessionRef.current.startedAt
        ? eventTimestamp - flowSessionRef.current.startedAt
        : null;

      const metricEvent = {
        eventName,
        occurredAt: new Date(eventTimestamp).toISOString(),
        flowId: flowSessionRef.current.flowId || null,
        flowDurationMs,
        mode,
        language: kioskConfig?.language ?? "en",
        departmentId: metricDepartmentId || null,
        serviceId: selectedServiceId || null,
        ...details,
      };

      appendUxMetric(metricEvent);
      setUxMetricsSummary(calculateUxMetricsSummary(readStoredUxMetrics()));
    },
    [
      isDepartmentLocked,
      kioskConfig?.language,
      kioskConfig?.lockedDepartmentId,
      mode,
      selectedDepartmentId,
      selectedServiceId,
    ]
  );

  const startFlowSession = useCallback(
    (reason) => {
      const now = Date.now();
      const flowId = `flow-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      flowSessionRef.current = {
        flowId,
        startedAt: now,
      };

      trackUxMetric("screen_start", {
        reason,
      });
    },
    [trackUxMetric]
  );

  useEffect(() => {
    const stored = readStoredConfig();
    setKioskDeviceId(getOrCreateKioskDeviceId());

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

  const hasDepartmentSelection = Boolean(effectiveDepartmentId);
  const hasServiceSelection = Boolean(selectedServiceId);

  const stepItems = useMemo(() => {
    const departmentCompleted = isDepartmentLocked || hasDepartmentSelection;
    const canNavigateToService = isDepartmentLocked || hasDepartmentSelection;
    const canNavigateToPhone = hasServiceSelection;

    return [
      {
        key: "department",
        label: uiText.stepDepartment,
        isCompleted: departmentCompleted,
        isActive: currentStep === "department",
        isClickable: !isDepartmentLocked,
      },
      {
        key: "service",
        label: uiText.stepService,
        isCompleted: hasServiceSelection,
        isActive: currentStep === "service",
        isClickable: canNavigateToService,
      },
      {
        key: "phone",
        label: uiText.stepPhone,
        isCompleted: Boolean(printablePayload),
        isActive: currentStep === "phone",
        isClickable: canNavigateToPhone,
      },
    ];
  }, [
    currentStep,
    hasDepartmentSelection,
    hasServiceSelection,
    isDepartmentLocked,
    printablePayload,
    uiText,
  ]);

  const phoneValidationCode = useMemo(() => {
    return validatePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  const phoneValidationMessage = useMemo(() => {
    if (!isPhoneTouched) {
      return null;
    }

    if (phoneValidationCode === "required") {
      return uiText.phoneRequired;
    }

    if (phoneValidationCode === "invalid") {
      return uiText.phoneInvalid;
    }

    return null;
  }, [isPhoneTouched, phoneValidationCode, uiText]);

  const canSubmitPhone = useMemo(() => {
    return !submitting && phoneValidationCode === null;
  }, [phoneValidationCode, submitting]);

  const formatDiagnosticsTime = useCallback(
    (timestamp) => {
      if (!timestamp) {
        return uiText.diagnosticsNever;
      }

      const parsed = new Date(timestamp);
      if (Number.isNaN(parsed.getTime())) {
        return uiText.diagnosticsNever;
      }

      return parsed.toLocaleString(locale);
    },
    [locale, uiText]
  );

  const formatDuration = useCallback(
    (durationMs) => {
      const asNumber = Number(durationMs ?? NaN);
      if (!Number.isFinite(asNumber) || asNumber < 0) {
        return uiText.diagnosticsNotEnoughData;
      }

      const totalSeconds = Math.round(asNumber / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    },
    [uiText]
  );

  const formatRate = useCallback(
    (rateValue) => {
      const asNumber = Number(rateValue ?? NaN);
      if (!Number.isFinite(asNumber) || asNumber < 0) {
        return uiText.diagnosticsNotEnoughData;
      }

      return `${asNumber.toFixed(1)}%`;
    },
    [uiText]
  );

  useEffect(() => {
    if (!kioskConfig || isConfigMode) {
      return;
    }

    const load = async () => {
      setIsLoadingDepartments(true);

      try {
        const departmentRows = await kioskDataProvider.listDepartments();
        const filtered = isDepartmentLocked
          ? departmentRows.filter(
              (department) => department.id === kioskConfig.lockedDepartmentId
            )
          : departmentRows;

        setDepartments(filtered);

        const initialDepartmentId = isDepartmentLocked
          ? kioskConfig.lockedDepartmentId || filtered[0]?.id || ""
          : "";
        setSelectedDepartmentId(initialDepartmentId);

        if (isDepartmentLocked) {
          setCurrentStep("service");
        } else {
          setCurrentStep("department");
        }
      } catch (error) {
        console.error("Failed to load departments", error);
        setDepartments([]);
        setSelectedDepartmentId("");
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    void load();
  }, [kioskConfig, isDepartmentLocked, isConfigMode, dataReloadKey]);

  useEffect(() => {
    if (!kioskConfig || !isConfigMode) {
      return;
    }

    let isDisposed = false;

    const loadWizardDepartments = async () => {
      try {
        const departmentRows = await kioskDataProvider.listDepartments();
        if (isDisposed) {
          return;
        }

        setWizardDepartments(departmentRows);

        if (kioskConfig.mode === "department-locked") {
          const hasExistingSelection = departmentRows.some(
            (department) => department.id === kioskConfig.lockedDepartmentId
          );
          const candidateId = departmentRows[0]?.id ?? "";

          if (
            !hasExistingSelection &&
            departmentRows.length > 0 &&
            candidateId !== kioskConfig.lockedDepartmentId
          ) {
            setKioskConfig((current) => {
              if (!current) {
                return current;
              }

              if (candidateId === current.lockedDepartmentId) {
                return current;
              }

              return {
                ...current,
                lockedDepartmentId: candidateId,
              };
            });
          }
        }
      } catch (error) {
        console.error("Failed to load wizard departments", error);
        if (!isDisposed) {
          setWizardDepartments([]);
        }
      }
    };

    void loadWizardDepartments();

    return () => {
      isDisposed = true;
    };
  }, [
    isConfigMode,
    kioskConfig?.mode,
    kioskConfig?.useMockApi,
    kioskConfig?.apiBaseUrl,
  ]);

  const loadWizardPrinters = async () => {
    if (typeof window.kioskRuntime?.listPrinters !== "function") {
      setWizardPrinters([]);
      setPrinterMessage(uiText.printerDiscoveryUnavailable);
      return;
    }

    setIsLoadingPrinters(true);

    try {
      const printers = await window.kioskRuntime.listPrinters();
      setWizardPrinters(printers);

      if (printers.length === 0) {
        setPrinterMessage(uiText.noPrintersDetected);
      } else {
        setPrinterMessage(null);
      }

      setKioskConfig((current) => {
        if (!current || printers.length === 0) {
          return current;
        }

        const hasCurrentSelection = printers.some(
          (printer) => printer.name === current.printerName
        );

        if (hasCurrentSelection) {
          return current;
        }

        const defaultPrinter =
          printers.find((printer) => printer.isDefault) ?? printers[0];

        return {
          ...current,
          printerName: defaultPrinter?.name ?? "",
        };
      });
    } catch (error) {
      console.error("Failed to load wizard printers", error);
      setWizardPrinters([]);
      setPrinterMessage(uiText.printerLoadFailed);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  useEffect(() => {
    if (!isConfigMode) {
      return;
    }

    void loadWizardPrinters();
  }, [isConfigMode]);

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
      setIsLoadingServices(true);

      try {
        const serviceRows = await kioskDataProvider.listServicesByDepartment(
          effectiveDepartmentId
        );
        setServices(serviceRows);
        setSelectedServiceId("");
      } catch (error) {
        console.error("Failed to load services", error);
        setServices([]);
        setSelectedServiceId("");
      } finally {
        setIsLoadingServices(false);
      }
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
        setDiagnostics((current) => ({
          ...current,
          lastHealthStatus: "unhealthy",
          lastHealthCheckedAt: new Date().toISOString(),
        }));
        return;
      }

      try {
        const health = await kioskDataProvider.health();
        setIsBackendHealthy(health.healthy);
        setDiagnostics((current) => ({
          ...current,
          lastHealthStatus: health.healthy ? "healthy" : "unhealthy",
          lastHealthCheckedAt: new Date().toISOString(),
        }));
      } catch {
        setIsBackendHealthy(false);
        setDiagnostics((current) => ({
          ...current,
          lastHealthStatus: "unhealthy",
          lastHealthCheckedAt: new Date().toISOString(),
        }));
      }
    };

    void checkHealth();

    const onOnline = () => {
      void checkHealth();
    };
    const onOffline = () => {
      setIsBackendHealthy(false);
      setDiagnostics((current) => ({
        ...current,
        lastHealthStatus: "unhealthy",
        lastHealthCheckedAt: new Date().toISOString(),
      }));
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
      setConfigPersistenceMessage(uiText.serverUrlRequiredWhenNoMock);
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
        setConfigPersistenceMessage(uiText.serverConnectionFailedHealth);
        return false;
      }

      setConfigPersistenceMessage(null);
      return true;
    } catch (error) {
      console.error("Failed to test kiosk server connection", error);
      setConfigPersistenceMessage(uiText.serverConnectionFailedNetwork);
      return false;
    } finally {
      window.clearTimeout(timeoutHandle);
    }
  };

  const onCopyDeviceId = async () => {
    if (!kioskDeviceId) {
      setConfigPersistenceMessage(uiText.copyDeviceIdFailed);
      return;
    }

    try {
      await navigator.clipboard.writeText(kioskDeviceId);
      setConfigPersistenceMessage(uiText.copyDeviceIdDone);
    } catch {
      setConfigPersistenceMessage(uiText.copyDeviceIdFailed);
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
      wizardDepartments.length === 0
    ) {
      setConfigPersistenceMessage(uiText.noDepartmentsForLocked);
      return;
    }

    if (
      kioskConfig.mode === "department-locked" &&
      kioskConfig.lockedDepartmentId.trim().length === 0
    ) {
      setConfigPersistenceMessage(uiText.lockedDepartmentRequired);
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
    setSettingsTab("general");
  };

  const onOpenSettings = async () => {
    if (!kioskConfig) {
      return;
    }

    const accessResult = await settingsAccessController.verifyAccess();

    if (!accessResult?.allowed) {
      setConfigPersistenceMessage(uiText.backendUnavailableDescription);
      return;
    }

    if (accessResult.deferred) {
      setConfigPersistenceMessage(uiText.settingsAuthDeferredNotice);
    }

    setPreviousKioskConfig({ ...kioskConfig });
    setSettingsTab("general");
    setIsConfigMode(true);
  };

  const resetKioskFlow = useCallback(
    (reason = "flow_reset") => {
      trackUxMetric("flow_reset", { reason });

    setIsPhonePopupOpen(false);
    setActiveMessage(null);
    setPrintablePayload(null);
    setPhoneNumber("");
    setIsPhoneTouched(false);

    if (!isDepartmentLocked) {
      setSelectedDepartmentId("");
      setCurrentStep("department");
    } else {
      setSelectedDepartmentId(departments[0]?.id ?? "");
      setCurrentStep("service");
    }

    setSelectedServiceId("");
    startFlowSession("flow_reset");
    },
    [departments, isDepartmentLocked, startFlowSession, trackUxMetric]
  );

  const onSelectDepartment = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setSelectedServiceId("");
    setIsPhonePopupOpen(false);
    setCurrentStep("service");
  };

  const onSelectService = (serviceId) => {
    if (!isBackendHealthy) {
      setActiveMessage({
        tone: "error",
        title: uiText.backendUnavailableTitle,
        description: uiText.backendUnavailableDescription,
        printState: null,
        allowRetryPrint: false,
        allowStartOver: false,
      });
      return;
    }

    setSelectedServiceId(serviceId);
    setCurrentStep("phone");
  };

  const onStepSelect = (stepKey) => {
    if (stepKey === "department") {
      if (isDepartmentLocked) {
        return;
      }

      setIsPhonePopupOpen(false);
      setCurrentStep("department");
      return;
    }

    if (stepKey === "service") {
      if (!isDepartmentLocked && !effectiveDepartmentId) {
        return;
      }

      setIsPhonePopupOpen(false);
      setCurrentStep("service");
      return;
    }

    if (stepKey === "phone") {
      if (!selectedServiceId) {
        return;
      }

      if (!isBackendHealthy) {
        setActiveMessage({
          tone: "error",
          title: uiText.backendUnavailableTitle,
          description: uiText.backendUnavailableDescription,
          printState: null,
          allowRetryPrint: false,
          allowStartOver: false,
        });
        return;
      }

      setCurrentStep("phone");
    }
  };

  const onDialPadInput = (key) => {
    if (submitting) {
      return;
    }

    if (key === "+") {
      setPhoneNumber((current) => {
        const value = String(current ?? "");
        if (value.startsWith("+")) {
          return value;
        }

        return `+${value}`;
      });
      return;
    }

    if (key === "clear") {
      setPhoneNumber("");
      return;
    }

    if (key === "backspace") {
      setPhoneNumber((current) => current.slice(0, -1));
      return;
    }

    setPhoneNumber((current) => normalizePhoneNumberInput(`${current}${key}`));
  };

  const closeMessagePopup = () => {
    if (activeMessage?.tone === "success") {
      resetKioskFlow("success_close");
      return;
    }

    setActiveMessage(null);
  };

  const showMessagePopup = ({
    tone = "info",
    title,
    description,
    printState = null,
    allowRetryPrint = false,
    allowStartOver = false,
  }) => {
    setActiveMessage({
      tone,
      title,
      description,
      printState,
      allowRetryPrint,
      allowStartOver,
    });
  };

  const formatIssuedAt = (isoDateString) => {
    if (!isoDateString) {
      return uiText.notAvailable;
    }

    const parsed = new Date(isoDateString);
    if (Number.isNaN(parsed.getTime())) {
      return uiText.notAvailable;
    }

    return parsed.toLocaleString(locale);
  };

  const getDepartmentNameById = (departmentId) => {
    const match = departments.find((department) => department.id === departmentId);
    return match?.name || departmentId || uiText.notAvailable;
  };

  const getServiceNameById = (serviceId) => {
    const match = services.find((service) => service.id === serviceId);
    return match?.name || serviceId || uiText.notAvailable;
  };

  const selectedServiceName = getServiceNameById(selectedServiceId);

  const mapIssueTicketErrorMessage = (error) => {
    const status = Number(error?.status ?? 0);
    const errorCode = String(error?.code ?? "").toUpperCase();
    const rawMessage = String(error?.message ?? "").toLowerCase();

    if (
      status === 409 ||
      errorCode.includes("DUPLICATE") ||
      errorCode.includes("ACTIVE_TICKET") ||
      rawMessage.includes("duplicate") ||
      rawMessage.includes("active ticket")
    ) {
      return uiText.duplicateTicketError;
    }

    if (
      status === 404 ||
      status === 410 ||
      errorCode.includes("SERVICE_NOT_FOUND") ||
      errorCode.includes("SERVICE_UNAVAILABLE") ||
      rawMessage.includes("service unavailable")
    ) {
      return uiText.serviceUnavailableError;
    }

    if (
      status === 400 ||
      status === 422 ||
      errorCode.includes("VALIDATION") ||
      errorCode.includes("INVALID_PHONE")
    ) {
      return uiText.invalidRequestError;
    }

    if (status === 503 || status === 504 || errorCode.includes("UNAVAILABLE")) {
      return uiText.serviceTemporaryUnavailableError;
    }

    if (status >= 500) {
      return uiText.serverError;
    }

    if (rawMessage.includes("network") || rawMessage.includes("failed to fetch")) {
      return uiText.networkError;
    }

    return uiText.genericIssueError;
  };

  const runPrintTicket = async (payload) => {
    if (typeof window.kioskRuntime?.printTicket !== "function") {
      return {
        ok: true,
        error: null,
      };
    }

    try {
      const printResult = await window.kioskRuntime.printTicket({
        printerName: kioskConfig.printerName,
        payload,
      });

      return {
        ok: Boolean(printResult?.ok),
        error: printResult?.error || uiText.printFailedDescription,
      };
    } catch (error) {
      console.error("Print invocation failed", error);
      return {
        ok: false,
        error: uiText.printFailedDescription,
      };
    }
  };

  const runPrintTicketWithDiagnostics = async (payload) => {
    const result = await runPrintTicket(payload);

    setDiagnostics((current) => ({
      ...current,
      lastPrintStatus: result.ok ? "success" : "failed",
      lastPrintCheckedAt: new Date().toISOString(),
    }));

    return result;
  };

  useEffect(() => {
    if (isConfigMode || isBackendHealthy) {
      return;
    }

    setIsPhonePopupOpen(false);
    setActiveMessage((current) => {
      if (current) {
        return current;
      }

      return {
        tone: "error",
        title: uiText.backendUnavailableTitle,
        description: uiText.backendUnavailableDescription,
        printState: null,
        allowRetryPrint: false,
        allowStartOver: false,
      };
    });
  }, [isBackendHealthy, isConfigMode, uiText]);

  useEffect(() => {
    if (isConfigMode || !kioskConfig || !isBackendHealthy) {
      return;
    }

    let timeoutId = window.setTimeout(() => {
      resetKioskFlow("idle_timeout");
    }, KIOSK_IDLE_TIMEOUT_MS);

    const restartTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        resetKioskFlow("idle_timeout");
      }, KIOSK_IDLE_TIMEOUT_MS);
    };

    const activityEvents = ["pointerdown", "keydown", "touchstart", "mousedown"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, restartTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, restartTimer);
      });
    };
  }, [
    departments,
    isBackendHealthy,
    isConfigMode,
    isDepartmentLocked,
    kioskConfig,
    resetKioskFlow,
  ]);

  useEffect(() => {
    if (!activeMessage || activeMessage.tone !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resetKioskFlow("success_timeout");
    }, SUCCESS_POPUP_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeMessage, resetKioskFlow]);

  useEffect(() => {
    if (!kioskConfig || isConfigMode) {
      return;
    }

    if (!flowSessionRef.current.flowId) {
      startFlowSession("kiosk_ready");
    }
  }, [isConfigMode, kioskConfig, startFlowSession]);

  useEffect(() => {
    if (!kioskConfig || isConfigMode) {
      return;
    }

    trackUxMetric("step_view", {
      step: currentStep,
    });
  }, [currentStep, isConfigMode, kioskConfig, trackUxMetric]);

  useEffect(() => {
    if (isConfigMode || currentStep !== "phone") {
      return;
    }

    if (!isBackendHealthy || isLoadingServices || !selectedServiceId || isPhonePopupOpen) {
      return;
    }

    setPhoneNumber("");
    setIsPhoneTouched(false);
    setIsPhonePopupOpen(true);
  }, [
    currentStep,
    isBackendHealthy,
    isConfigMode,
    isLoadingServices,
    isPhonePopupOpen,
    selectedServiceId,
  ]);

  if (!kioskConfig) {
    return null;
  }

  if (isConfigMode) {
    return (
      <main className="kiosk-shell" dir={isArabic ? "rtl" : "ltr"}>
        <header className="kiosk-header settings-header">
          <div>
            <h1>{uiText.setupTitle}</h1>
            <p>{uiText.setupSubtitle}</p>
          </div>
          {previousKioskConfig && (
            <div className="header-actions settings-header-actions">
              <button type="button" className="ghost-button" onClick={onCancelConfig}>
                {uiText.close}
              </button>
            </div>
          )}
        </header>

        <section className="card">
          {configPersistenceMessage && (
            <section className="banner banner--error" role="alert" aria-live="assertive">
              {configPersistenceMessage}
            </section>
          )}

          <form onSubmit={onConfigSubmit}>
            <section className="settings-tabs" role="tablist" aria-label={uiText.settings}>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === "general"}
                className={`settings-tab ${settingsTab === "general" ? "settings-tab--active" : ""}`}
                onClick={() => setSettingsTab("general")}
              >
                {uiText.settingsGeneralTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === "printer"}
                className={`settings-tab ${settingsTab === "printer" ? "settings-tab--active" : ""}`}
                onClick={() => setSettingsTab("printer")}
              >
                {uiText.settingsPrinterTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === "diagnostics"}
                className={`settings-tab ${settingsTab === "diagnostics" ? "settings-tab--active" : ""}`}
                onClick={() => setSettingsTab("diagnostics")}
              >
                {uiText.settingsDiagnosticsTab}
              </button>
            </section>

            {settingsTab === "general" && (
              <section className="settings-tab-panel" role="tabpanel">
                <label>
                  {uiText.kioskModeLabel}
                  <select
                    value={kioskConfig.mode}
                    onChange={(event) =>
                      setKioskConfig((current) => ({
                        ...current,
                        mode: event.target.value,
                      }))
                    }
                  >
                    <option value="reception">{uiText.modeReception}</option>
                    <option value="department-locked">{uiText.modeDepartmentLocked}</option>
                  </select>
                </label>

                {kioskConfig.mode === "department-locked" && (
                  <label>
                    {uiText.lockedDepartmentLabel}
                    <select
                      required
                      disabled={wizardDepartments.length === 0}
                      value={kioskConfig.lockedDepartmentId}
                      onChange={(event) =>
                        setKioskConfig((current) => ({
                          ...current,
                          lockedDepartmentId: event.target.value,
                        }))
                      }
                    >
                      {wizardDepartments.length === 0 && (
                        <option value="">{uiText.noDepartmentsAvailable}</option>
                      )}
                      {wizardDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  {uiText.serverUrlLabel}
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
                  {uiText.useMockApiLabel}
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(kioskConfig.highContrast)}
                    onChange={(event) =>
                      setKioskConfig((current) => ({
                        ...current,
                        highContrast: event.target.checked,
                      }))
                    }
                  />
                  {uiText.highContrastModeLabel}
                </label>

                {!kioskConfig.useMockApi && (
                  <button type="button" onClick={onTestConnection} disabled={isTestingConnection}>
                    {isTestingConnection ? uiText.testing : uiText.testConnection}
                  </button>
                )}
              </section>
            )}

            {settingsTab === "printer" && (
              <section className="settings-tab-panel" role="tabpanel">
                <label>
                  {uiText.defaultPrinterLabel}
                  <select
                    value={kioskConfig.printerName}
                    disabled={isLoadingPrinters || wizardPrinters.length === 0}
                    onChange={(event) =>
                      setKioskConfig((current) => ({
                        ...current,
                        printerName: event.target.value,
                      }))
                    }
                  >
                    {wizardPrinters.length === 0 && <option value="">{uiText.noPrintersAvailable}</option>}
                    {wizardPrinters.map((printer) => (
                      <option key={printer.name} value={printer.name}>
                        {printer.displayName}
                        {printer.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {printerMessage && (
                  <section className="banner banner--error" role="alert" aria-live="assertive">
                    {printerMessage}
                  </section>
                )}

                <button type="button" onClick={loadWizardPrinters} disabled={isLoadingPrinters}>
                  {isLoadingPrinters ? uiText.refreshingPrinters : uiText.refreshPrinters}
                </button>
              </section>
            )}

            {settingsTab === "diagnostics" && (
              <section className="settings-tab-panel" role="tabpanel">
                <section className="diagnostics-panel" aria-label={uiText.diagnosticsTitle}>
                  <h3>{uiText.diagnosticsTitle}</h3>
                  <div className="diagnostics-grid">
                    <div>
                      <strong>{uiText.diagnosticsBackendStatus}</strong>
                      <span>
                        {diagnostics.lastHealthStatus === "healthy"
                          ? uiText.diagnosticsBackendHealthy
                          : uiText.diagnosticsBackendUnhealthy}
                      </span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsLastHealthCheck}</strong>
                      <span>{formatDiagnosticsTime(diagnostics.lastHealthCheckedAt)}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsLastPrintResult}</strong>
                      <span>
                        {diagnostics.lastPrintStatus === "success"
                          ? uiText.diagnosticsPrintSuccess
                          : diagnostics.lastPrintStatus === "failed"
                            ? uiText.diagnosticsPrintFailed
                            : uiText.diagnosticsPrintNotRun}
                      </span>
                    </div>
                    <div>
                      <strong>{uiText.issuedAtLabel}</strong>
                      <span>{formatDiagnosticsTime(diagnostics.lastPrintCheckedAt)}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsDeviceId}</strong>
                      <span className="device-id-value">{kioskDeviceId || uiText.notAvailable}</span>
                    </div>
                  </div>
                  <button type="button" className="ghost-button diagnostics-copy-button" onClick={onCopyDeviceId}>
                    {uiText.copyDeviceId}
                  </button>
                  <p className="diagnostics-hint">{uiText.diagnosticsDeviceIdHint}</p>
                </section>

                <section className="diagnostics-panel" aria-label={uiText.diagnosticsUxSummaryTitle}>
                  <h3>{uiText.diagnosticsUxSummaryTitle}</h3>
                  <div className="diagnostics-grid">
                    <div>
                      <strong>{uiText.diagnosticsFlowsCount}</strong>
                      <span>{uxMetricsSummary.flowsCount}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsIssuedCount}</strong>
                      <span>{uxMetricsSummary.issuedCount}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsMedianTimeToTicket}</strong>
                      <span>{formatDuration(uxMetricsSummary.medianTimeToTicketMs)}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsPrintFailureRate}</strong>
                      <span>{formatRate(uxMetricsSummary.printFailureRate)}</span>
                    </div>
                    <div>
                      <strong>{uiText.diagnosticsDuplicateErrorRate}</strong>
                      <span>{formatRate(uxMetricsSummary.duplicateErrorRate)}</span>
                    </div>
                  </div>
                </section>
              </section>
            )}

            <section className="settings-footer-actions">
              <button type="submit" disabled={isTestingConnection}>
                {isTestingConnection ? uiText.testing : uiText.saveConfiguration}
              </button>
              {previousKioskConfig && (
                <button type="button" onClick={onCancelConfig}>
                  {uiText.cancel}
                </button>
              )}
            </section>
          </form>
        </section>
      </main>
    );
  }

  const onIssueTicket = async (event) => {
    event.preventDefault();

    setIsPhoneTouched(true);
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      return;
    }

    if (!isBackendHealthy || !phoneNumber.trim() || !selectedServiceId) {
      return;
    }

    trackUxMetric("issue_ticket_attempt", {
      isBackendHealthy,
    });

    try {
      setSubmitting(true);
      const issued = await kioskDataProvider.issueTicket({
        departmentId: effectiveDepartmentId,
        serviceId: selectedServiceId,
        phoneNumber: normalizePhoneNumberInput(phoneNumber),
      });

      const payload = {
        ticketNumber: issued.ticket.ticketNumber,
        phoneNumber: issued.ticket.phoneNumber,
        departmentId: issued.ticket.departmentId,
        serviceId: issued.ticket.serviceId,
        queueSnapshot: issued.queueSnapshot,
        whatsappOptInQrUrl: issued.whatsappOptInQrUrl,
        issuedAt: issued.issuedAt,
      };

      setPrintablePayload(payload);

      trackUxMetric("ticket_issued", {
        ticketNumber: payload.ticketNumber,
        peopleAhead: payload.queueSnapshot?.peopleAhead ?? null,
        estimatedWaitMinutes: payload.queueSnapshot?.estimatedWaitMinutes ?? null,
      });

      const printResult = await runPrintTicketWithDiagnostics(payload);

      trackUxMetric("print_result", {
        ok: printResult.ok,
      });

      setIsPhonePopupOpen(false);
      setPhoneNumber("");
      setIsPhoneTouched(false);

      if (!printResult.ok) {
        showMessagePopup({
          tone: "warning",
          title: uiText.ticketIssuedTitle(payload.ticketNumber),
          description: printResult.error,
          printState: uiText.printStateFailed,
          allowRetryPrint: true,
          allowStartOver: true,
        });
        return;
      }

      showMessagePopup({
        tone: "success",
        title: uiText.ticketPrintedTitle(payload.ticketNumber),
        description: uiText.takePrintedTicket,
        printState: uiText.printStateSuccess,
      });
    } catch (error) {
      console.error("Failed to issue ticket", error);
      trackUxMetric("ticket_issue_failed", {
        status: Number(error?.status ?? 0) || null,
        code: String(error?.code ?? "") || null,
      });
      showMessagePopup({
        tone: "error",
        title: uiText.issueTicketFailedTitle,
        description: mapIssueTicketErrorMessage(error),
        allowStartOver: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onRetryPrint = async () => {
    if (!printablePayload) {
      return;
    }

    trackUxMetric("print_retry_attempt");

    const printResult = await runPrintTicketWithDiagnostics(printablePayload);

    trackUxMetric("print_retry_result", {
      ok: printResult.ok,
    });

    if (!printResult.ok) {
      showMessagePopup({
        tone: "warning",
        title: uiText.ticketIssuedTitle(printablePayload.ticketNumber),
        description: printResult.error,
        printState: uiText.printStateFailed,
        allowRetryPrint: true,
        allowStartOver: true,
      });
      return;
    }

    showMessagePopup({
      tone: "success",
      title: uiText.ticketPrintedTitle(printablePayload.ticketNumber),
      description: uiText.takePrintedTicket,
      printState: uiText.printStateSuccess,
      allowRetryPrint: false,
    });
  };

  return (
    <main
      className={`kiosk-shell ${kioskConfig.highContrast ? "kiosk-shell--high-contrast" : ""}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="kiosk-header">
        <div>
          <h1>Smart Queue Kiosk</h1>
          <p>
            {uiText.modeLabel}: {isDepartmentLocked ? uiText.modeDepartmentLocked : uiText.modeReception}
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="lang-button"
            onClick={() =>
              setKioskConfig((current) => ({
                ...current,
                language: current?.language === "ar" ? "en" : "ar",
              }))
            }
            aria-label={uiText.languageToggleLabel}
          >
            <Languages size={16} aria-hidden="true" /> {languageToggleLabel}
          </button>
          <span className="status-chip" aria-live="polite">
            {isBackendHealthy ? <Wifi size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
            {isBackendHealthy ? uiText.online : uiText.offline}
          </span>
          <span className="status-chip" aria-live="polite">
            <Printer size={15} aria-hidden="true" />
            {printerStatusLabel}
          </span>
          <button type="button" className="ghost-button icon-only-button" onClick={onOpenSettings}>
            <Settings size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="step-indicator" aria-label={uiText.kioskProgress}>
        {stepItems.map((step, index) => (
          <button
            key={step.key}
            type="button"
            className={`step-item ${step.isCompleted ? "step-item--done" : ""} ${step.isActive ? "step-item--active" : ""}`}
            onClick={() => onStepSelect(step.key)}
            disabled={!step.isClickable}
            aria-current={step.isActive ? "step" : undefined}
          >
            <span className="step-index">{index + 1}</span>
            <span className="step-label">{step.label}</span>
          </button>
        ))}
      </section>

      {configPersistenceMessage && (
        <section className="banner banner--warning" role="status" aria-live="polite">
          {configPersistenceMessage}
        </section>
      )}

      {currentStep === "department" && !isDepartmentLocked && (
        <section className="kiosk-card">
          <h2>{uiText.selectDepartmentTitle}</h2>
          <p className="empty-state">{uiText.chooseDepartmentPrompt}</p>

          {isLoadingDepartments ? (
            <p className="loading-text">{uiText.loadingDepartments}</p>
          ) : departments.length === 0 ? (
            <p className="empty-state">{uiText.noDepartmentsAvailable}</p>
          ) : (
            <section className="service-grid" aria-label={uiText.departmentLabel}>
              {departments.map((department) => (
                <button
                  key={department.id}
                  type="button"
                  className={`service-card ${selectedDepartmentId === department.id ? "service-card--active" : ""}`}
                  onClick={() => onSelectDepartment(department.id)}
                  aria-pressed={selectedDepartmentId === department.id}
                >
                  {department.name}
                </button>
              ))}
            </section>
          )}
        </section>
      )}

      {currentStep === "service" && (
        <section className="kiosk-card">
          <h2>{uiText.selectServiceTitle}</h2>
          <p className="empty-state">{uiText.chooseServicePrompt}</p>

          {isLoadingServices ? (
            <p className="loading-text">{uiText.loadingServices}</p>
          ) : services.length === 0 ? (
            <p className="empty-state">{uiText.noServicesAvailable}</p>
          ) : (
            <section className="service-grid" aria-label={uiText.serviceList}>
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`service-card ${selectedServiceId === service.id ? "service-card--active" : ""}`}
                  onClick={() => onSelectService(service.id)}
                  aria-pressed={selectedServiceId === service.id}
                >
                  {service.name}
                </button>
              ))}
            </section>
          )}

          <div className="popup-actions">
            {!isDepartmentLocked && (
              <button type="button" className="ghost-button" onClick={() => setCurrentStep("department")}>
                {uiText.backButton}
              </button>
            )}
          </div>
        </section>
      )}

      {isPhonePopupOpen && (
        <section className="popup-overlay" role="presentation">
          <section
            className="popup phone-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-popup-title"
            aria-describedby="phone-popup-description"
          >
            <h3 id="phone-popup-title">{uiText.phonePopupTitle}</h3>
            <p id="phone-popup-description" className="phone-popup-service-line">
              {uiText.phoneServiceLabel}: {selectedServiceName}
            </p>

            <form onSubmit={onIssueTicket}>
              <label className="phone-popup-label">
                {uiText.phoneLabel}
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder={uiText.phonePlaceholder}
                  required
                  value={phoneNumber}
                  className="phone-popup-input"
                  onChange={(event) => {
                    setPhoneNumber(normalizePhoneNumberInput(event.target.value));
                  }}
                  onBlur={() => setIsPhoneTouched(true)}
                />
              </label>

              <p className="field-hint phone-popup-hint">{uiText.phonePopupDescription}</p>

              {phoneValidationMessage && <p className="field-error">{phoneValidationMessage}</p>}

              <section className="dial-pad" aria-label={uiText.phoneLabel}>
                {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["+", "0", "backspace"], ["clear"]]
                  .flat()
                  .map((padKey) => (
                    <button
                      key={padKey}
                      type="button"
                      className={`dial-key ${padKey === "clear" ? "dial-key--secondary dial-key--clear" : ""} ${padKey === "backspace" ? "dial-key--delete" : ""} ${padKey === "+" ? "dial-key--plus" : ""}`}
                      onClick={() => onDialPadInput(padKey)}
                      disabled={submitting}
                    >
                      {padKey === "clear" ? (
                        uiText.dialPadClear
                      ) : padKey === "backspace" ? (
                        <Delete size={20} aria-hidden="true" />
                      ) : (
                        padKey
                      )}
                    </button>
                  ))}
              </section>

              <div className="popup-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setIsPhonePopupOpen(false);
                    setIsPhoneTouched(false);
                    setCurrentStep("service");
                  }}
                  disabled={submitting}
                >
                  {uiText.cancel}
                </button>
                <button type="submit" className="primary-button" disabled={!canSubmitPhone}>
                  <Ticket size={16} aria-hidden="true" />
                  {submitting ? uiText.issuing : uiText.printTicket}
                </button>
              </div>
            </form>
          </section>
        </section>
      )}

      {activeMessage && (
        <section className="popup-overlay" role="presentation">
          <section
            className={`popup popup--${activeMessage.tone}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-popup-title"
            aria-describedby="message-popup-description"
            aria-live="assertive"
          >
            <h3 id="message-popup-title">{activeMessage.title}</h3>
            <p id="message-popup-description">{activeMessage.description}</p>

            {activeMessage.printState && (
              <div className={`print-state print-state--${activeMessage.tone}`}>
                {(() => {
                  const ToneIcon = toneIconByKey[activeMessage.tone] ?? toneIconByKey.info;
                  return <ToneIcon size={16} className="print-state-icon" aria-hidden="true" />;
                })()}
                <span>{activeMessage.printState}</span>
              </div>
            )}

            {printablePayload && (
              <section className="ticket-summary">
                <div>
                  <strong>{uiText.ticketLabel}</strong>
                  <span>{printablePayload.ticketNumber}</span>
                </div>
                <div>
                  <strong>{uiText.departmentSummaryLabel}</strong>
                  <span>{getDepartmentNameById(printablePayload.departmentId)}</span>
                </div>
                <div>
                  <strong>{uiText.serviceSummaryLabel}</strong>
                  <span>{getServiceNameById(printablePayload.serviceId)}</span>
                </div>
                <div>
                  <strong>{uiText.peopleAheadLabel}</strong>
                  <span>{printablePayload.queueSnapshot?.peopleAhead ?? uiText.notAvailable}</span>
                </div>
                <div>
                  <strong>{uiText.estimatedWaitLabel}</strong>
                  <span>
                    {printablePayload.queueSnapshot?.estimatedWaitMinutes ?? uiText.notAvailable} {uiText.minutesSuffix}
                  </span>
                </div>
                <div>
                  <strong>{uiText.issuedAtLabel}</strong>
                  <span>{formatIssuedAt(printablePayload.issuedAt)}</span>
                </div>
                <div>
                  <strong>{uiText.whatsappLabel}</strong>
                  <span>{printablePayload.whatsappOptInQrUrl || uiText.notAvailable}</span>
                </div>
                {printablePayload.whatsappOptInQrUrl && (
                  <div className="ticket-summary-qr-row">
                    <strong>{uiText.whatsappQrLabel}</strong>
                    <div className="qr-preview-wrap">
                      <img
                        className="qr-preview"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          printablePayload.whatsappOptInQrUrl
                        )}`}
                        alt={uiText.whatsappQrLabel}
                        loading="lazy"
                      />
                      <span className="qr-preview-hint">{uiText.whatsappQrHint}</span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeMessage.allowStartOver && (
              <p className="popup-helper-text">
                {uiText.startOverHint}
              </p>
            )}

            <div className="popup-actions">
              {activeMessage.allowRetryPrint && (
                <button type="button" className="ghost-button" onClick={onRetryPrint}>
                  {uiText.retryPrint}
                </button>
              )}
              {activeMessage.allowStartOver && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => resetKioskFlow("manual_start_over")}
                >
                  {uiText.startOver}
                </button>
              )}
              <button type="button" className="primary-button" onClick={closeMessagePopup}>
                {activeMessage.tone === "success" ? uiText.done : uiText.close}
              </button>
            </div>
          </section>
        </section>
      )}
    </main>
  );
};
