import { 
  OAuthConfig, 
  OAuthError, 
  OAuthResponse, 
  GenericFile, 
  GenericSelection,
  TokenError
} from '../../baseOAuth/types';

/**
 * Notion specific configuration options 
 */
export interface NotionOAuthConfig extends OAuthConfig {
  clientId: string;      // Notion OAuth client ID
  clientSecret: string;  // Notion OAuth client secret
  redirectUri: string;   // Redirect URI for the OAuth flow
  scopes?: string[];     // OAuth scopes to request
}

/**
 * Error thrown from the Notion picker
 */
export class PickerError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'PICKER_ERROR', details);
    this.name = 'PickerError';
  }
}

/**
 * Represents a page in Notion
 */
export interface NotionPage {
  id: string;            // Notion page ID
  title: string;         // Page title
  pageId: string;        // Alias for ID (for compatibility)
  parentType?: string;   // Type of parent (database or workspace)
  url?: string;          // URL to the page in Notion (optional)
}

/**
 * Selection result from the Notion picker
 */
export interface NotionPageSelection extends GenericSelection {
  pages: NotionPage[];
  workspaceId?: string;  // Workspace ID the pages belong to
  workspaceName?: string;// Name of the workspace
}

/**
 * Notion connector types
 */
export enum NotionConnectorType {
  VECTORIZE = "NOTION_OAUTH_MULTI",
  WHITE_LABEL = "notion-oauth-white-label"
}