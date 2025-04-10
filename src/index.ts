/**
 * Vectorize Connect
 * OAuth and File Picker functionality for various connectors
 */

// Export the base functionality
export * from './baseOAuth';

// Export Google Drive specific implementations
// Value exports
export {
  GoogleDriveOAuth,
  GoogleDriveSelection,
  GoogleDriveConnectorType,
  createVectorizeGDriveConnector,
  createWhiteLabelGDriveConnector,
  manageGDriveUser,
  refreshGDriveToken,
} from './googleDriveOAuth';

// Type exports
export type {
  GoogleDriveOAuthConfig,
  PickerError as GoogleDrivePickerError,
} from './googleDriveOAuth';

// Export Dropbox specific implementations
// Value exports
export {
  DropboxOAuth,
  DropboxSelection,
  DropboxConnectorType,
  createVectorizeDropboxConnector,
  createWhiteLabelDropboxConnector,
  manageDropboxUser,
  refreshDropboxToken,
} from './dropBoxOAuth';

// Type exports
export type {
  DropboxOAuthConfig,
  PickerError as DropboxPickerError,
} from './dropBoxOAuth';

// Re-export shared functionality with specific names
export { getOneTimeConnectorToken } from './baseOAuth/core/apiFunctions';

// Re-export shared types
export type {
  OAuthError,
  OAuthConfig,
  OAuthResponse,
  ConnectorConfig,
  VectorizeAPIConfig,
  UserAction,
} from './baseOAuth/types';