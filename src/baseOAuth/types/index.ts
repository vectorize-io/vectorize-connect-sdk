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
   * Base configuration options for OAuth authentication
   */
  export interface OAuthConfig {
    redirectUri: string;
    scopes?: string[];
    nonce?: string;
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
   * Generic file interface that can be extended by specific connectors
   */
  export interface GenericFile {
    id: string;
    name: string;
    mimeType: string;
  }
  
  /**
   * Generic selection result that can be extended by specific connectors
   */
  export interface GenericSelection {
    files: GenericFile[];
  }
  
  /**
   * Configuration for Vectorize API
   */
  export interface VectorizeAPIConfig {
    authorization: string;
    organizationId: string;
  }
  
  /**
   * Generic connector configuration for Vectorize API
   */
  export interface ConnectorConfig {
    name: string;
    type: string;
    config?: Record<string, any>;
  }
  
  /**
   * Actions that can be performed when managing users
   */
  export type UserAction = "add" | "edit" | "remove";