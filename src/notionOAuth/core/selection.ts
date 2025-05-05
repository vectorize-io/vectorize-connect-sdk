import { OAuthError, TokenError, OAuthConfig } from '../../baseOAuth/types';
import { BaseSelection } from '../../baseOAuth/core/selection';
import { validateConfig } from '../../baseOAuth/utils/validation';
import { refreshNotionToken } from '../utils/token';
import { NotionPicker } from '../ui/picker';
import { NotionOAuthConfig } from '../types';

/**
 * Converts generic file selection format to Notion page format
 */
function convertToNotionFormat(
  files?: Record<string, { name: string; mimeType: string }>
): Record<string, { title: string; pageId: string; parentType?: string }> | undefined {
  if (!files) return undefined;

  const result: Record<string, { title: string; pageId: string; parentType?: string }> = {};
  
  for (const [id, file] of Object.entries(files)) {
    result[id] = {
      title: file.name,
      pageId: id,
      parentType: file.mimeType === 'application/vnd.notion.database' ? 'database' : 'page'
    };
  }
  
  return result;
}

/**
 * Converts Notion page format to generic file selection format
 */
function convertToGenericFormat(
  pages?: Record<string, { title: string; pageId: string; parentType?: string }>
): Record<string, { name: string; mimeType: string }> | undefined {
  if (!pages) return undefined;

  const result: Record<string, { name: string; mimeType: string }> = {};
  
  for (const [id, page] of Object.entries(pages)) {
    result[id] = {
      name: page.title,
      mimeType: page.parentType === 'database' ? 'application/vnd.notion.database' : 'application/vnd.notion.page'
    };
  }
  
  return result;
}

/**
 * Notion implementation of page selection functionality
 */
export class NotionSelection extends BaseSelection {
  /**
   * Static method to start Notion page selection
   * This static method is what will be called from the React components
   */
  static async startPageSelection(
    config: NotionOAuthConfig,
    accessToken: string,
    selectedPages?: Record<string, { title: string; pageId: string; parentType?: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    try {
      // Validate the provided configuration
      validateConfig(config);

      // Set up handler for OAuth callbacks
      BaseSelection.setupOAuthHandler(config);

      try {
        // For Notion, we can use the access token directly since it doesn't expire as quickly as Dropbox
        // But we'll still have a refresh token utility for consistency
        const tokens = await refreshNotionToken(
          accessToken, 
          config.clientId, 
          config.clientSecret
        );
        
        // Use provided window or create a new popup
        const popup = targetWindow || BaseSelection.createPopupWindow(
          1200, 
          800, 
          'Notion Page Selection'
        );
        
        if (!popup) {
          throw new OAuthError(
            'Failed to create popup window for page selection',
            'POPUP_CREATION_FAILED'
          );
        }
        
        // Initialize the NotionPicker in the popup
        await NotionPicker.createPickerHTML(
          tokens, 
          config, 
          tokens.access_token, 
          selectedPages, 
        );


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
   * Delegates to the static method for actual implementation, with type conversion to match the base class signature
   */
  async startFileSelection(
    config: OAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string }>,
    targetWindow?: Window
  ): Promise<Window | null> {
    // Cast config to NotionOAuthConfig
    const notionConfig = config as NotionOAuthConfig;
    
    // Convert generic files format to Notion-specific format
    const notionSelectedPages = convertToNotionFormat(selectedFiles);
    
    // Call the static method with the converted parameters
    return NotionSelection.startPageSelection(
      notionConfig,
      refreshToken, // Access token (our "refreshToken" parameter is actually an access token for Notion)
      notionSelectedPages,
      targetWindow
    );
  }
}