// dropboxOAuth/core/selection.ts

import { OAuthError, TokenError } from '../../baseOAuth/types';
import { BaseSelection } from '../../baseOAuth/core/selection';
import { validateConfig } from '../../baseOAuth/utils/validation';
import { refreshDropboxToken } from '../utils/token';
import { DropboxPicker } from '../ui/picker';
import { DropboxOAuthConfig } from '../types';

/**
 * Dropbox implementation of file selection functionality
 */
export class DropboxSelection extends BaseSelection {
  /**
   * Creates a popup for Dropbox file selection using an existing refresh token
   * 
   * @param config The Dropbox OAuth configuration
   * @param refreshToken An existing refresh token to use
   * @param selectedFiles Optional map of files to initialize as selected
   * @param targetWindow Optional window to use instead of creating a new popup
   * @returns The popup window instance or null if creation failed
   */
  async startFileSelection(
    config: DropboxOAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string; path?: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    try {
      validateConfig(config);

      // Set up handler for callbacks
      DropboxSelection.setupOAuthHandler(config);

      try {
        // Refresh the token first
        const tokens = await refreshDropboxToken(refreshToken, config.appKey, config.appSecret);
        
        // Use provided window or create a new popup
        const popup = targetWindow || DropboxSelection.createPopupWindow(1200, 800, 'Dropbox File Selection');
        
        if (!popup) {
          throw new OAuthError('Failed to create popup window', 'POPUP_CREATION_FAILED');
        }
        
        // Generate the Dropbox file picker content
        const content = DropboxPicker.createPickerHTML(
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
        DropboxSelection.writeToPopup(popup, content);

        // Monitor the popup
        DropboxSelection.monitorPopup(popup);

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