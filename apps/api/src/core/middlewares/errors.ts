import type { ErrorRequestHandler } from "express";
import { ApiError } from "../errors/api-error.js";

export type ValidationErrors = Record<string, string[]>;

export interface ErrorPayload {
  code: string;
  message: string;
  details?: ValidationErrors;
}

export interface ErrorResponse {
  status: string;
  message: string;
  details?: ErrorPayload;
  stack?: string;
}

const DEFAULT_INTERNAL_MESSAGE =
  "We couldn’t complete your request. Please try again in a moment.";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
): void => {
  void _next;
  const isProduction = process.env.NODE_ENV === "production";

  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  const message =
    err instanceof ApiError
      ? err.message
      : isProduction
        ? DEFAULT_INTERNAL_MESSAGE
        : err instanceof Error
          ? err.message
          : DEFAULT_INTERNAL_MESSAGE;

  const response: ErrorResponse = {
    status: "error",
    message: message,
  };

  if (err instanceof ApiError && err.details !== undefined) {
    response.details = err.details.errors;
  }

  if (!isProduction && err instanceof Error && err.stack) {
    response.stack = err.stack;
  }

  const stack = err instanceof Error && err.stack ? err.stack : undefined;
  console.error({
    error: err,
    stack,
  });

  res.status(statusCode).json(response);
};
