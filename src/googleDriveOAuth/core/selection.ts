import { OAuthError, TokenError } from '../../baseOAuth/types';
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
   * Creates a popup for Google Drive file selection using an existing refresh token
   * 
   * @param config The Google Drive OAuth configuration
   * @param refreshToken An existing refresh token to use
   * @param selectedFiles Optional map of files to initialize as selected
   * @param targetWindow Optional window to use instead of creating a new popup
   * @returns The popup window instance or null if creation failed
   */
  async startFileSelection(
    config: GoogleDriveOAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    try {
      validateConfig(config);

      // Set up handler for callbacks
      GoogleDriveSelection.setupOAuthHandler(config);

      try {
        // Refresh the token first
        const tokens = await refreshGDriveToken(refreshToken, config.clientId, config.clientSecret);
        
        // Use provided window or create a new popup
        const popup = targetWindow || GoogleDriveSelection.createPopupWindow(1200, 800, 'Google Drive File Selection');
        
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
        GoogleDriveSelection.writeToPopup(popup, content);

        // Monitor the popup
        GoogleDriveSelection.monitorPopup(popup);

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
}