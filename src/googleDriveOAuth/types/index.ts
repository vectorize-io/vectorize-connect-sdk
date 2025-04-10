import { 
  OAuthConfig, 
  OAuthError, 
  OAuthResponse, 
  GenericFile, 
  GenericSelection 
} from '../../baseOAuth/types';

/**
 * Google Drive specific configuration options 
 */
export interface GoogleDriveOAuthConfig extends OAuthConfig {
  clientId: string;      // Google OAuth client ID
  clientSecret: string;  // Google OAuth client secret
  apiKey: string;        // Google API key for the Picker API
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
 * Represents a file in Google Drive
 */
export interface DriveFile extends GenericFile {
  // Add Google Drive specific properties if needed
}

/**
 * Selection result from the Google Drive picker
 */
export interface DriveSelection extends GenericSelection {
  files: DriveFile[];
}

/**
 * Google Drive connector types
 */
export enum GoogleDriveConnectorType {
  VECTORIZE = "Id ",
  WHITE_LABEL = "GOOGLE_DRIVE_OAUTH_MULTI_CUSTOM"
}