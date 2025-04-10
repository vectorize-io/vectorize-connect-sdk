// dropboxOAuth/types/index.ts

import { 
    OAuthConfig, 
    OAuthError, 
    OAuthResponse, 
    GenericFile, 
    GenericSelection,
    TokenError
  } from '../../baseOAuth/types';
  
  /**
   * Dropbox specific configuration options 
   */
  export interface DropboxOAuthConfig extends OAuthConfig {
    appKey: string;      // Dropbox API app key
    appSecret: string;   // Dropbox API app secret
  }
  
  /**
   * Error thrown from the Dropbox picker
   */
  export class PickerError extends OAuthError {
    constructor(message: string, details?: any) {
      super(message, 'PICKER_ERROR', details);
      this.name = 'PickerError';
    }
  }
  
  /**
   * Represents a file in Dropbox
   */
  export interface DropboxFile extends GenericFile {
    // Add Dropbox specific properties if needed
    path?: string;
  }
  
  /**
   * Selection result from the Dropbox picker
   */
  export interface DropboxFileSelection extends GenericSelection {
    files: DropboxFile[];
  }
  
  /**
   * Dropbox connector types
   */
  export enum DropboxConnectorType {
    VECTORIZE = "DROPBOX_OAUTH_MULTI",
    WHITE_LABEL = "DROPBOX_OAUTH_MULTI_CUSTOM"
  }