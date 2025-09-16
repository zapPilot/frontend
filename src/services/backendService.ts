/**
 * Backend Service
 * Service functions for notifications, reporting, and general backend operations (port 3001)
 * Replaces BackendApiClient with simpler service function approach
 */

import { httpUtils } from "../lib/http-utils";
import { createBackendServiceError } from "../lib/base-error";

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
  data?: Record<string, unknown>;
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

// Get configured client
const getBackendApiClient = () => {
  return httpUtils.backendApi;
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
      `/notifications/discord`,
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
      `/notifications/email`,
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
      `/notifications/settings/${userId}`
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
      `/notifications/settings/${userId}`,
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
      `/reports/portfolio/${userId}?${params}`,
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
    }>(`/reports/history/${userId}?${params}`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};

// Data Export Operations

// System Operations

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
    }>(`/health`);
  } catch (error) {
    throw createBackendServiceError(error);
  }
};
