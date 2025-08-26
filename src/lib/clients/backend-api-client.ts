/**
 * Backend API Client
 * Handles notifications, reporting, and general backend operations (port 3001)
 */

import { BaseApiClient, APIError } from "./base-client";

export class BackendApiError extends APIError {
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message, status, code, details);
    this.name = "BackendApiError";
  }
}

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
 * Backend API Client for notifications and reporting
 */
export class BackendApiClient extends BaseApiClient {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: 12000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        "X-Service": "backend-api",
      },
    });
  }

  /**
   * Create backend-specific errors
   */
  protected override createServiceError(
    status: number,
    errorData: any
  ): BackendApiError {
    let message = errorData.message;

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

    return new BackendApiError(
      message,
      status,
      errorData.code,
      errorData.details
    );
  }

  // Notification Operations

  /**
   * Send Discord alert
   */
  async sendDiscordAlert(
    alert: DiscordAlert
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.post<{ success: boolean; messageId?: string }>(
      "/notifications/discord",
      alert
    );
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    email: string,
    subject: string,
    content: string,
    template?: "portfolio_update" | "transaction_alert" | "price_alert"
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.post<{ success: boolean; messageId?: string }>(
      "/notifications/email",
      {
        email,
        subject,
        content,
        template,
      }
    );
  }

  /**
   * Get user notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    return this.get<NotificationSettings>(`/notifications/settings/${userId}`);
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    return this.put<NotificationSettings>(
      `/notifications/settings/${userId}`,
      settings
    );
  }

  // Reporting Operations

  /**
   * Generate portfolio report
   */
  async generatePortfolioReport(
    userId: string,
    reportType: "daily" | "weekly" | "monthly",
    startDate?: string,
    endDate?: string
  ): Promise<EmailReport> {
    const params: Record<string, string> = {
      type: reportType,
    };
    if (startDate) params["startDate"] = startDate;
    if (endDate) params["endDate"] = endDate;

    return this.post<EmailReport>(
      `/reports/portfolio/${userId}`,
      {},
      { params }
    );
  }

  /**
   * Get report history
   */
  async getReportHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{
    reports: EmailReport[];
    total: number;
    hasMore: boolean;
  }> {
    return this.get<{
      reports: EmailReport[];
      total: number;
      hasMore: boolean;
    }>(`/reports/history/${userId}`, {
      limit: limit.toString(),
      offset: offset.toString(),
    });
  }

  /**
   * Schedule automatic reports
   */
  async scheduleReport(
    userId: string,
    reportType: "daily" | "weekly" | "monthly",
    enabled: boolean,
    time?: string // HH:MM format
  ): Promise<{ success: boolean; nextRun?: string }> {
    return this.post<{ success: boolean; nextRun?: string }>(
      `/reports/schedule/${userId}`,
      {
        reportType,
        enabled,
        time,
      }
    );
  }

  // Data Export Operations

  /**
   * Export portfolio data to CSV
   */
  async exportPortfolioCSV(
    userId: string,
    format: "positions" | "transactions" | "performance" = "positions"
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    return this.post<{ downloadUrl: string; expiresAt: string }>(
      `/export/portfolio/${userId}`,
      {
        format,
      }
    );
  }

  /**
   * Export transaction history
   */
  async exportTransactionHistory(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const params: Record<string, string> = {};
    if (startDate) params["startDate"] = startDate;
    if (endDate) params["endDate"] = endDate;

    return this.post<{ downloadUrl: string; expiresAt: string }>(
      `/export/transactions/${userId}`,
      {},
      { params }
    );
  }

  // System Operations

  /**
   * Log system event
   */
  async logSystemEvent(event: {
    level: "info" | "warn" | "error";
    category: "user" | "transaction" | "system" | "integration";
    message: string;
    data?: Record<string, any>;
    userId?: string;
  }): Promise<{ success: boolean; logId?: string }> {
    return this.post<{ success: boolean; logId?: string }>(
      "/logs/system",
      event
    );
  }

  /**
   * Get system logs (admin operation)
   */
  async getSystemLogs(
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
  }> {
    const params: Record<string, string> = {
      limit: limit.toString(),
      offset: offset.toString(),
    };
    if (level) params["level"] = level;
    if (category) params["category"] = category;

    return this.get<{
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
    }>("/logs/system", params);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    services: {
      discord: boolean;
      email: boolean;
      database: boolean;
    };
  }> {
    return this.get<{
      status: string;
      timestamp: string;
      services: {
        discord: boolean;
        email: boolean;
        database: boolean;
      };
    }>("/health");
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(
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
  }> {
    const params: Record<string, string> = { timeframe };
    if (userId) params["userId"] = userId;

    return this.get<{
      requests: number;
      errors: number;
      avgResponseTime: number;
      topEndpoints: Array<{
        endpoint: string;
        requests: number;
        avgResponseTime: number;
      }>;
    }>("/stats/usage", params);
  }
}

// Singleton instance
export const backendApiClient = new BackendApiClient(
  process.env["NEXT_PUBLIC_API_URL"] || "http://127.0.0.1:3001"
);
