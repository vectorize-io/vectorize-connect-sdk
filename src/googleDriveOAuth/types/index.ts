// Interfaces for the OAuth package

/**
 * Base error class for OAuth related errors
 */
export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/**
 * Error thrown when there's a problem with configuration
 */
export class ConfigurationError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown during token exchange or refresh
 */
export class TokenError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'TOKEN_ERROR', details);
    this.name = 'TokenError';
  }
}

/**
 * Error thrown from the Google Drive picker
 */
export class PickerError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'PICKER_ERROR', details);
    this.name = 'PickerError';
  }
}

/**
 * Configuration options for OAuth authentication
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  redirectUri: string;
  scopes?: string[];
  onSuccess?: (selectedFields?: any) => void;
  onError?: (error: OAuthError) => void;
}

/**
 * Response from OAuth token exchange
 */
export interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Represents a file in Google Drive
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Selection result from the Google Drive picker
 */
export interface DriveSelection {
  files: DriveFile[];
}