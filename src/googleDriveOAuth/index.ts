/**
 * Google Drive OAuth and File Picker
 * Core functionality for OAuth authentication with Google and file selection
 */

// Export core functionality
export { startGDriveOAuth, createGDrivePickerCallbackResponse , redirectToVectorizeGoogleDriveConnect} from './core/oauth';
export { startGDriveFileSelection } from './core/selection';
export { createGDriveSourceConnector, manageGDriveUser, getOneTimeConnectorToken } from './core/apiFunctions';
// Export utility functions
export { refreshGDriveAccessToken, exchangeGDriveCodeForTokens } from './utils/token';

// Export UI components
export { GoogleDrivePicker } from './ui/picker';

// Export error classes and types
export {
  OAuthError,
  ConfigurationError,
  TokenError,
  PickerError,
  // Types
  type OAuthConfig,
  type OAuthResponse,
  type DriveSelection,
  type DriveFile
} from './types';
export type { VectorizeAPIConfig } from './types';

