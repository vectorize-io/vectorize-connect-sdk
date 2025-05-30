// core/selection.ts
import { OAuthConfig, OAuthError, TokenError } from '../../baseOAuth';
import { BaseSelection } from '../../baseOAuth/core/selection';
import { validateConfig } from '../../baseOAuth/utils/validation';
import { refreshGDriveToken } from '../utils/token';
import { GoogleDrivePicker } from '../ui/picker';
import { GoogleDriveOAuthConfig } from '../types';

/**
 * Google Drive implementation of file selection functionality
 */
export class GoogleDriveSelection extends BaseSelection {
  /**
   * Static method to start Google Drive file selection
   * This static method is what will be called from the React components
   */
  static async startFileSelection(
    config: GoogleDriveOAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    try {
      // Validate the provided configuration
      validateConfig(config);

      // Set up handler for OAuth callbacks
      BaseSelection.setupOAuthHandler(config);

      try {
        // Refresh the access token using the refresh token
        const tokens = await refreshGDriveToken(
          refreshToken, 
          config.clientId, 
          config.clientSecret,
        );
        
        // Use provided window or create a new popup
        const popup = targetWindow || BaseSelection.createPopupWindow(
          1200, 
          800, 
          'Google Drive File Selection'
        );
        
        if (!popup) {
          throw new OAuthError(
            'Failed to create popup window for file selection',
            'POPUP_CREATION_FAILED'
          );
        }
        
        // Generate the Google Drive file picker content
        const content = GoogleDrivePicker.createPickerHTML(
          { 
            access_token: tokens.access_token,
            refresh_token: refreshToken,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type
          }, 
          config, 
          refreshToken, 
          selectedFiles
        );
        
        // Write content to the popup
        BaseSelection.writeToPopup(popup, content);

        // Monitor the popup and clean up when closed
        BaseSelection.monitorPopup(popup);

        return popup;
      } catch (error) {
        if (error instanceof OAuthError) {
          throw error;
        }
        
        throw new TokenError(
          error instanceof Error ? error.message : 'Failed to refresh token or create selection popup',
          error
        );
      }
    } catch (error) {
      // Handle errors and call the error callback from the config
      if (error instanceof OAuthError) {
        config.onError?.(error);
      } else {
        config.onError?.(new OAuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'UNKNOWN_ERROR',
          error
        ));
      }
      return null;
    }
  }

  /**
   * Instance method implementation (fulfills abstract class requirement)
   * Delegates to the static method for actual implementation
   */
  async startFileSelection(
    config: GoogleDriveOAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    return GoogleDriveSelection.startFileSelection(
      config,
      refreshToken,
      selectedFiles,
      targetWindow
    );
  }
}