/**
 * HTTP utility helper types shared across service layers.
 * Kept minimal so dead-code analysis stays quiet while preserving
 * the shapes consumed by `http-utils`.
 */

export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ResponseTransformer<T = unknown> = (data: unknown) => T;
