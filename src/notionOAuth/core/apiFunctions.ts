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
import { NotionConnectorType } from "../types";

/**
 * Create a Vectorize Notion OAuth Connector Source
 *
 * @param config - An object containing your organization ID and authorization token
 * @param connectorName - Name for the connector
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 *
 * @returns A Promise that resolves with the connector ID
 */
export async function createVectorizeNotionConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl: string = "https://api-dev.vectorize.io/v1",
): Promise<any> {
  try {
    console.log(`[Vectorize] Creating Notion connector: ${connectorName}`);
    console.log(`[Vectorize] Using platform URL: ${platformUrl}`);
    console.log(`[Vectorize] Config:`, JSON.stringify(config, null, 2));

    const connector: ConnectorConfig = {
      name: connectorName,
      type: NotionConnectorType.VECTORIZE
    };

    console.log(`[Vectorize] Connector configuration prepared:`, JSON.stringify(connector, null, 2));
    
    try {
      const result = await createSourceConnector(config, connector, platformUrl);
      console.log(`[Vectorize] Connector created successfully: ${connectorName}`);
      return result;
    } catch (error: unknown) {
      // Format the error data properly to avoid [object Object]
      const innerError = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');
      
      // Extract and format error details
      let errorDetails = "";
      try {
        // Try to parse the error message if it contains JSON-like structure
        const errorMatch = innerError.message.match(/Error:\s*(.*)/);
        if (errorMatch && errorMatch[1]) {
          try {
            // Attempt to parse if it looks like JSON
            if (errorMatch[1].includes('{') && errorMatch[1].includes('}')) {
              const jsonStr = errorMatch[1].replace(/\[object Object\]/g, '{}');
              const errorObj = JSON.parse(jsonStr);
              errorDetails = JSON.stringify(errorObj, null, 2);
            } else {
              errorDetails = errorMatch[1];
            }
          } catch {
            errorDetails = errorMatch[1];
          }
        }
      } catch {
        // If parsing fails, use the original message
        errorDetails = innerError.message;
      }
      
      console.error(`[Vectorize] Error in createSourceConnector: ${innerError.message}`);
      console.error(`[Vectorize] Error details (formatted):`, errorDetails);
      
      // Additional debug info about the error object
      if (error instanceof Object) {
        try {
          const errorKeys = Object.keys(error);
          console.error(`[Vectorize] Error object keys:`, errorKeys);
          
          // Log all properties of the error object
          errorKeys.forEach(key => {
            const value = (error as any)[key];
            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
            console.error(`[Vectorize] Error.${key}:`, displayValue);
          });
        } catch (err) {
          console.error(`[Vectorize] Could not enumerate error properties:`, err);
        }
      }
      
      console.error(`[Vectorize] Stack trace:`, innerError.stack);
      throw innerError;
    }
  } catch (error: unknown) {
    const outerError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error');
    
    console.error(`[Vectorize] Unexpected error in createVectorizeNotionConnector: ${outerError.message}`);
    console.error(`[Vectorize] Stack trace:`, outerError.stack);
    
    // Create a more informative error with properly formatted details
    let enhancedMessage = `Failed to create Vectorize Notion connector: ${outerError.message}`;
    
    // If we have a 500 error with [object Object], try to improve the message
    if (outerError.message.includes('[object Object]')) {
      enhancedMessage = `Failed to create Vectorize Notion connector (API returned 500 Internal Server Error). Check the server logs for more details.`;
    }
    
    throw new Error(enhancedMessage);
  }
}

/**
 * Create a White Label Notion OAuth Connector Source
 *
 * @param config - An object containing your organization ID and authorization token
 * @param connectorName - Name for the connector
 * @param clientId - Notion API client ID for the white label connector
 * @param clientSecret - Notion API client secret for the white label connector
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 *
 * @returns A Promise that resolves with the connector ID
 */
export async function createWhiteLabelNotionConnector(
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
    type: NotionConnectorType.WHITE_LABEL,
    config: {
      "client-id": clientId,
      "client-secret": clientSecret
    }
  };

  return createSourceConnector(config, connector, platformUrl);
}

/**
 * Manages a Notion user for a connector, allowing you to add, edit, or remove users.
 *
 * @param config VectorizeAPIConfig containing authorization and organizationId
 * @param connectorId ID of the connector
 * @param selectedPages Record of selected pages with their metadata
 * @param accessToken Notion OAuth access token
 * @param userId User ID to manage
 * @param action Action to perform ("add", "edit", or "remove")
 * @param platformUrl Optional URL of the Vectorize API (primarily used for testing)
 * @returns Promise that resolves with the API response
 */
export async function manageNotionUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedPages: Record<string, { title: string; pageId: string; parentType?: string }> | null,
  accessToken: string,
  userId: string,
  action: UserAction,
  platformUrl: string = "https://api.vectorize.io/v1",
): Promise<Response> {
  // Validate required parameters for add/edit actions
  if (action === "add" || action === "edit") {
    if (!selectedPages || Object.keys(selectedPages).length === 0) {
      throw new Error(`Selected pages are required for ${action} action`);
    }
    
    if (!accessToken) {
      throw new Error(`Access token is required for ${action} action`);
    }
  }

  // Create the Notion specific payload
  const payload: Record<string, any> = {};
  
  // Only include selectedPages and accessToken for add/edit, not for remove
  if (action !== "remove") {
    payload.selectedPages = selectedPages;
    payload.accessToken = accessToken;
  }

  return manageUser(config, connectorId, userId, action, payload, platformUrl);
}

/**
 * Gets a one-time authentication token for connector operations
 * This is a direct re-export of the base function for consistency
 */
export const getOneTimeConnectorToken = baseGetOneTimeConnectorToken;