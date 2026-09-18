export class ApiError<T = unknown> extends Error {
  readonly statusCode: number;
  readonly details?: T | undefined;

  constructor(
    statusCode: number,

    message: string = "Internal Server Error",
    details?: T,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest<T>(message: string = "Bad request", details?: T) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string = "Conflict") {
    return new ApiError(409, message);
  }

  static internal(
    message: string = "Something went wrong on our end. Please try again later.",
  ) {
    return new ApiError(500, message);
  }
}
