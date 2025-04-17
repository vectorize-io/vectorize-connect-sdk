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
import { GoogleDriveConnectorType } from "../types";

/**
 * Create a Vectorize Google Drive OAuth Connector Source.
 *
 * @param config - An object containing your organization ID and authorization token
 * @param connectorName - Name for the connector
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 *
 * @returns A Promise that resolves with the connector ID
 */
export async function createVectorizeGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl: string = "https://api.vectorize.io/v1",
): Promise<string> {
  const connector: ConnectorConfig = {
    name: connectorName,
    type: GoogleDriveConnectorType.VECTORIZE
  };

  return createSourceConnector(config, connector, platformUrl);
}

/**
 * Create a White Label Google Drive OAuth Connector Source.
 *
 * @param config - An object containing your organization ID and authorization token
 * @param connectorName - Name for the connector
 * @param clientId - OAuth2 client ID for the white label connector
 * @param clientSecret - OAuth2 client secret for the white label connector
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 *
 * @returns A Promise that resolves with the connector ID
 */
export async function createWhiteLabelGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  clientId: string,
  clientSecret: string,
  platformUrl: string = "https://api.vectorize.io/v1",
): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error("Client ID and Client Secret are required for white label connectors");
  }

  const connector: ConnectorConfig = {
    name: connectorName,
    type: GoogleDriveConnectorType.WHITE_LABEL,
    config: {
      "oauth2-client-id": clientId,
      "oauth2-client-secret": clientSecret
    }
  };

  return createSourceConnector(config, connector, platformUrl);
}

/**
 * Manages a Google Drive user for a connector, allowing you to add, edit, or remove users.
 *
 * @param config VectorizeAPIConfig containing authorization and organizationId
 * @param connectorId ID of the connector
 * @param selectedFiles Record of selected files with their metadata
 * @param refreshToken Google OAuth refresh token
 * @param userId User ID to manage
 * @param action Action to perform ("add", "edit", or "remove")
 * @param platformUrl Optional URL of the Vectorize API (primarily used for testing)
 * @returns Promise that resolves with the API response
 */
export async function manageGDriveUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedFiles: Record<string, { name: string; mimeType: string }> | null,
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
  
  // Create the Google Drive specific payload
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