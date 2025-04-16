// dropboxOAuth/core/apiFunctions.ts

import { 
    VectorizeAPIConfig, 
    ConnectorConfig,
    UserAction 
  } from "../../baseOAuth/types";
  import { 
    createSourceConnector, 
    manageUser, 
    getOneTimeConnectorToken as baseGetOneTimeConnectorToken 
  } from "../../baseOAuth/core/apiFunctions";
  import { DropboxConnectorType } from "../types";
  
  /**
   * Create a Vectorize Dropbox OAuth Connector Source
   *
   * @param config - An object containing your organization ID and authorization token
   * @param connectorName - Name for the connector
   * @param platformUrl - URL of the Vectorize API (primarily used for testing)
   *
   * @returns A Promise that resolves with the connector ID
   */
  export async function createVectorizeDropboxConnector(
    config: VectorizeAPIConfig,
    connectorName: string,
    platformUrl: string = "https://api.vectorize.io/v1",
  ): Promise<string> {
    const connector: ConnectorConfig = {
      name: connectorName,
      type: DropboxConnectorType.VECTORIZE
    };
  
    return createSourceConnector(config, connector, platformUrl);
  }
  
  /**
   * Create a White Label Dropbox OAuth Connector Source
   *
   * @param config - An object containing your organization ID and authorization token
   * @param connectorName - Name for the connector
   * @param appKey - Dropbox API app key for the white label connector
   * @param appSecret - Dropbox API app secret for the white label connector
   * @param platformUrl - URL of the Vectorize API (primarily used for testing)
   *
   * @returns A Promise that resolves with the connector ID
   */
  export async function createWhiteLabelDropboxConnector(
    config: VectorizeAPIConfig,
    connectorName: string,
    appKey: string,
    appSecret: string,
    platformUrl: string = "https://api.vectorize.io/v1",
  ): Promise<string> {
    if (!appKey || !appSecret) {
      throw new Error("App Key and App Secret are required for white label connectors");
    }
  
    const connector: ConnectorConfig = {
      name: connectorName,
      type: DropboxConnectorType.WHITE_LABEL,
      config: {
        "app-key": appKey,
        "app-secret": appSecret
      }
    };
  
    return createSourceConnector(config, connector, platformUrl);
  }
  
  /**
   * Manages a Dropbox user for a connector, allowing you to add, edit, or remove users.
   *
   * @param config VectorizeAPIConfig containing authorization and organizationId
   * @param connectorId ID of the connector
   * @param selectedFiles Record of selected files with their metadata
   * @param refreshToken Dropbox OAuth refresh token
   * @param userId User ID to manage
   * @param action Action to perform ("add", "edit", or "remove")
   * @param platformUrl Optional URL of the Vectorize API (primarily used for testing)
   * @returns Promise that resolves with the API response
   */
  export async function manageDropboxUser(
    config: VectorizeAPIConfig,
    connectorId: string,
    selectedFiles: Record<string, { name: string; mimeType: string; path?: string }> | null,
    refreshToken: string,
    userId: string,
    action: UserAction,
    platformUrl: string = "https://api.vectorize.io/v1",
  ): Promise<Response> {
    // Validate required parameters for add/edit actions
    if (action === "add" || action === "edit") {
      if (!selectedFiles || Object.keys(selectedFiles).length === 0) {
        throw new Error(`Selected files are required for ${action} action`);
      }
      
      if (!refreshToken) {
        throw new Error(`Refresh token is required for ${action} action`);
      }
    }
  
    // Create the Dropbox specific payload
    const payload: Record<string, any> = {};
    
    // Only include selectedFiles and refreshToken for add/edit, not for remove
    if (action !== "remove") {
      payload.selectedFiles = selectedFiles;
      payload.refreshToken = refreshToken;
    }
  
    return manageUser(config, connectorId, userId, action, payload, platformUrl);
  }
  
  /**
   * Gets a one-time authentication token for connector operations
   * This is a direct re-export of the base function for consistency
   */
  export const getOneTimeConnectorToken = baseGetOneTimeConnectorToken;