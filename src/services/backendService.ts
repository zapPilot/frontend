/**
 * Backend Service
 * Service functions for notifications, reporting, and general backend operations (port 3001)
 * Replaces BackendApiClient with simpler service function approach
 */

import { apiClient } from "../lib/api-client";

// Configuration
const BACKEND_API_CONFIG = {
  baseURL: process.env["NEXT_PUBLIC_API_URL"] || "http://127.0.0.1:3001",
  timeout: 12000,
  retries: 3,
  headers: {
    "X-Service": "backend-api",
  },
};

/**
 * Backend interfaces
 */
export interface NotificationSettings {
  email: boolean;
  discord: boolean;
  push: boolean;
  priceAlerts: boolean;
  portfolioAlerts: boolean;
  transactionAlerts: boolean;
}

export interface DiscordAlert {
  type: "portfolio" | "transaction" | "price" | "system";
  severity: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface EmailReport {
  userId: string;
  reportType: "daily" | "weekly" | "monthly";
  period: {
    start: string;
    end: string;
  };
  data: {
    portfolioValue: number;
    performance: number;
    topPerformers: Array<{
      name: string;
      change: number;
    }>;
    transactions: number;
    gasSpent: string;
  };
}

/**
 * Backend Service Error
 */
export class BackendServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "BackendServiceError";
  }
}

/**
 * Create enhanced error messages for common backend errors
 */
const createBackendServiceError = (error: any): BackendServiceError => {
  const status = error.status || error.response?.status || 500;
  let message = error.message || "Backend service error";

  switch (status) {
    case 400:
      if (message?.includes("email")) {
        message = "Invalid email address format.";
      } else if (message?.includes("webhook")) {
        message = "Invalid Discord webhook configuration.";
      }
      break;
    case 429:
      message =
        "Too many notification requests. Please wait before sending more.";
      break;
    case 502:
      message = "External notification service is temporarily unavailable.";
      break;
  }

  return new BackendServiceError(
    message,
    status,
    error.code,
    error.details
  );
};

// Get configured client
const getBackendApiClient = () => {
  return apiClient;
};

// Notification Operations

/**
 * Send Discord alert
 */
export const sendDiscordAlert = async (
  alert: DiscordAlert
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const client = getBackendApiClient();
    return await client.post<{ success: boolean; messageId?: string }>(
      `${BACKEND_API_CONFIG.baseURL}/notifications/discord`,
      alert
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (
  email: string,
  subject: string,
  content: string,
  template?: "portfolio_update" | "transaction_alert" | "price_alert"
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const client = getBackendApiClient();
    return await client.post<{ success: boolean; messageId?: string }>(
      `${BACKEND_API_CONFIG.baseURL}/notifications/email`,
      {
        email,
        subject,
        content,
        template,
      }
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Get user notification settings
 */
export const getNotificationSettings = async (
  userId: string
): Promise<NotificationSettings> => {
  try {
    const client = getBackendApiClient();
    return await client.get<NotificationSettings>(
      `${BACKEND_API_CONFIG.baseURL}/notifications/settings/${userId}`
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Update user notification settings
 */
export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  try {
    const client = getBackendApiClient();
    return await client.put<NotificationSettings>(
      `${BACKEND_API_CONFIG.baseURL}/notifications/settings/${userId}`,
      settings
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

// Reporting Operations

/**
 * Generate portfolio report
 */
export const generatePortfolioReport = async (
  userId: string,
  reportType: "daily" | "weekly" | "monthly",
  startDate?: string,
  endDate?: string
): Promise<EmailReport> => {
  try {
    const client = getBackendApiClient();
    const params = new URLSearchParams({
      type: reportType,
    });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    return await client.post<EmailReport>(
      `${BACKEND_API_CONFIG.baseURL}/reports/portfolio/${userId}?${params}`,
      {}
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Get report history
 */
export const getReportHistory = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<{
  reports: EmailReport[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    const client = getBackendApiClient();
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return await client.get<{
      reports: EmailReport[];
      total: number;
      hasMore: boolean;
    }>(`${BACKEND_API_CONFIG.baseURL}/reports/history/${userId}?${params}`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Schedule automatic reports
 */
export const scheduleReport = async (
  userId: string,
  reportType: "daily" | "weekly" | "monthly",
  enabled: boolean,
  time?: string // HH:MM format
): Promise<{ success: boolean; nextRun?: string }> => {
  try {
    const client = getBackendApiClient();
    return await client.post<{ success: boolean; nextRun?: string }>(
      `${BACKEND_API_CONFIG.baseURL}/reports/schedule/${userId}`,
      {
        reportType,
        enabled,
        time,
      }
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

// Data Export Operations

/**
 * Export portfolio data to CSV
 */
export const exportPortfolioCSV = async (
  userId: string,
  format: "positions" | "transactions" | "performance" = "positions"
): Promise<{ downloadUrl: string; expiresAt: string }> => {
  try {
    const client = getBackendApiClient();
    return await client.post<{ downloadUrl: string; expiresAt: string }>(
      `${BACKEND_API_CONFIG.baseURL}/export/portfolio/${userId}`,
      {
        format,
      }
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Export transaction history
 */
export const exportTransactionHistory = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{ downloadUrl: string; expiresAt: string }> => {
  try {
    const client = getBackendApiClient();
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const url = params.toString() 
      ? `${BACKEND_API_CONFIG.baseURL}/export/transactions/${userId}?${params}`
      : `${BACKEND_API_CONFIG.baseURL}/export/transactions/${userId}`;

    return await client.post<{ downloadUrl: string; expiresAt: string }>(url, {});
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

// System Operations

/**
 * Log system event
 */
export const logSystemEvent = async (event: {
  level: "info" | "warn" | "error";
  category: "user" | "transaction" | "system" | "integration";
  message: string;
  data?: Record<string, any>;
  userId?: string;
}): Promise<{ success: boolean; logId?: string }> => {
  try {
    const client = getBackendApiClient();
    return await client.post<{ success: boolean; logId?: string }>(
      `${BACKEND_API_CONFIG.baseURL}/logs/system`,
      event
    );
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Get system logs (admin operation)
 */
export const getSystemLogs = async (
  level?: "info" | "warn" | "error",
  category?: string,
  limit = 100,
  offset = 0
): Promise<{
  logs: Array<{
    id: string;
    level: string;
    category: string;
    message: string;
    data?: Record<string, any>;
    timestamp: string;
    userId?: string;
  }>;
  total: number;
  hasMore: boolean;
}> => {
  try {
    const client = getBackendApiClient();
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (level) params.set("level", level);
    if (category) params.set("category", category);

    return await client.get<{
      logs: Array<{
        id: string;
        level: string;
        category: string;
        message: string;
        data?: Record<string, any>;
        timestamp: string;
        userId?: string;
      }>;
      total: number;
      hasMore: boolean;
    }>(`${BACKEND_API_CONFIG.baseURL}/logs/system?${params}`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Health check
 */
export const checkBackendServiceHealth = async (): Promise<{
  status: string;
  timestamp: string;
  services: {
    discord: boolean;
    email: boolean;
    database: boolean;
  };
}> => {
  try {
    const client = getBackendApiClient();
    return await client.get<{
      status: string;
      timestamp: string;
      services: {
        discord: boolean;
        email: boolean;
        database: boolean;
      };
    }>(`${BACKEND_API_CONFIG.baseURL}/health`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

/**
 * Get API usage statistics
 */
export const getUsageStats = async (
  userId?: string,
  timeframe: "1d" | "7d" | "30d" = "7d"
): Promise<{
  requests: number;
  errors: number;
  avgResponseTime: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
  }>;
}> => {
  try {
    const client = getBackendApiClient();
    const params = new URLSearchParams({ timeframe });
    if (userId) params.set("userId", userId);

    return await client.get<{
      requests: number;
      errors: number;
      avgResponseTime: number;
      topEndpoints: Array<{
        endpoint: string;
        requests: number;
        avgResponseTime: number;
      }>;
    }>(`${BACKEND_API_CONFIG.baseURL}/stats/usage?${params}`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};