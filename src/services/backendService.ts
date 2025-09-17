/**
 * Backend Service
 * Service functions for notifications, reporting, and general backend operations (port 3001)
 * Replaces BackendApiClient with simpler service function approach
 */

import { httpUtils } from "../lib/http-utils";
import { createBackendServiceError } from "../lib/base-error";
import { executeServiceCall } from "./serviceHelpers";

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
const backendApiClient = httpUtils.backendApi;

const callBackendApi = <T>(call: () => Promise<T>) =>
  executeServiceCall(call, { mapError: createBackendServiceError });

// Notification Operations

/**
 * Send Discord alert
 */
export const sendDiscordAlert = (
  alert: DiscordAlert
): Promise<{ success: boolean; messageId?: string }> =>
  callBackendApi(() =>
    backendApiClient.post<{ success: boolean; messageId?: string }>(
      `/notifications/discord`,
      alert
    )
  );

/**
 * Send email notification
 */
export const sendEmailNotification = (
  email: string,
  subject: string,
  content: string,
  template?: "portfolio_update" | "transaction_alert" | "price_alert"
): Promise<{ success: boolean; messageId?: string }> =>
  callBackendApi(() =>
    backendApiClient.post<{ success: boolean; messageId?: string }>(
      `/notifications/email`,
      {
        email,
        subject,
        content,
        template,
      }
    )
  );

/**
 * Get user notification settings
 */
export const getNotificationSettings = (
  userId: string
): Promise<NotificationSettings> =>
  callBackendApi(() =>
    backendApiClient.get<NotificationSettings>(
      `/notifications/settings/${userId}`
    )
  );

/**
 * Update user notification settings
 */
export const updateNotificationSettings = (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> =>
  callBackendApi(() =>
    backendApiClient.put<NotificationSettings>(
      `/notifications/settings/${userId}`,
      settings
    )
  );

// Reporting Operations

/**
 * Generate portfolio report
 */
export const generatePortfolioReport = (
  userId: string,
  reportType: "daily" | "weekly" | "monthly",
  startDate?: string,
  endDate?: string
): Promise<EmailReport> =>
  callBackendApi(() => {
    const params = new URLSearchParams({
      type: reportType,
    });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    return backendApiClient.post<EmailReport>(
      `/reports/portfolio/${userId}?${params}`,
      {}
    );
  });

/**
 * Get report history
 */
export const getReportHistory = (
  userId: string,
  limit = 50,
  offset = 0
): Promise<{
  reports: EmailReport[];
  total: number;
  hasMore: boolean;
}> =>
  callBackendApi(() => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return backendApiClient.get<{
      reports: EmailReport[];
      total: number;
      hasMore: boolean;
    }>(`/reports/history/${userId}?${params}`);
  });

// Data Export Operations

// System Operations

/**
 * Health check
 */
export const checkBackendServiceHealth = (): Promise<{
  status: string;
  timestamp: string;
  services: {
    discord: boolean;
    email: boolean;
    database: boolean;
  };
}> =>
  callBackendApi(() =>
    backendApiClient.get<{
      status: string;
      timestamp: string;
      services: {
        discord: boolean;
        email: boolean;
        database: boolean;
      };
    }>(`/health`)
  );
