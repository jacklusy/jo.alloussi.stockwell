export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly userMessage: string,
    readonly recovery: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage = message) {
    super(message, 'VALIDATION', userMessage, 'Fix input');
  }
}

export class AuthError extends AppError {
  constructor(message = 'Session expired') {
    super(message, 'AUTH', 'Session expired', 'Re-login. Queue preserved');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', "You don't have permission", 'None');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 'No longer available', 'Refresh list');
  }
}

export class ConflictError extends AppError {
  constructor(
    message = 'Conflict',
    readonly serverState?: unknown,
  ) {
    super(message, 'CONFLICT', 'Someone else changed this', 'Conflict resolution flow');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limited', readonly retryAfterMs?: number) {
    super(message, 'RATE_LIMIT', 'Too many requests', 'Auto-retry');
  }
}

export class ServerError extends AppError {
  constructor(message = 'Server error') {
    super(message, 'SERVER', 'Something went wrong', 'Auto-retry');
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Timeout') {
    super(message, 'TIMEOUT', 'Taking too long', 'Manual retry');
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error') {
    super(message, 'NETWORK', 'Something went wrong', 'Auto-retry');
  }
}

export class OfflineError extends AppError {
  constructor(message = 'Offline') {
    super(message, 'OFFLINE', 'Saved — will sync when online', 'Automatic');
  }
}

export class SyncError extends AppError {
  constructor(message: string, userMessage: string) {
    super(message, 'SYNC', userMessage, 'Sync centre');
  }
}
