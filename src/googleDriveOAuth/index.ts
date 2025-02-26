/**
 * Google Drive OAuth and File Picker
 * Core functionality for OAuth authentication with Google and file selection
 */

// Export core functionality
export { createOAuthPopup, createCallbackResponse } from './core/oauth';
export { createFileSelectionPopup } from './core/selection';

// Export utility functions
export { refreshAccessToken, exchangeCodeForTokens } from './utils/token';

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