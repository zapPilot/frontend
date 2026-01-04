import { APIError } from "@/lib/http";
import { logger } from "@/utils/logger";

export function logQueryError(message: string, error: unknown) {
  logger.error(message, {
    error: error instanceof Error ? error.message : String(error),
    status: error instanceof APIError ? error.status : undefined,
  });
}
