import { VectorizeAPIConfig } from "../types";

/**
 * Create a Google Drive OAuth Connector Source via the Vectorize API.
 *
 * @param config - An object containing your organization ID and authorization token
 * @param whiteLabel - Whether to create a white-label connector
 * @param connectorName - Name for the connector
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 * @param clientId - Required for white-label connectors
 * @param clientSecret - Required for white-label connectors
 *
 * @returns A Promise that resolves with the connector ID that is created response from the Vectorize API
 */
export async function createGDriveSourceConnector(
    config: VectorizeAPIConfig,
    whiteLabel : boolean,
    connectorName: string,
    platformUrl: string = "https://api.vectorize.io/v1",
    clientId?: string,
    clientSecret?: string,
  ): Promise<Response> {

    const url = `${platformUrl}/org/${config.organizationId}/connectors/sources`;

    let payload;

    if (whiteLabel){
        if (!clientId || !clientSecret) {
            throw new Error("Client ID and Client Secret are required for whitelabel");
        }

        payload = [{
            "name": connectorName,
            "type": "GOOGLE_DRIVE_OAUTH_MULTI_CUSTOM",
            "config": {
                "oauth2-client-id" : clientId,
                "oauth2-client-secret": clientSecret
            }
        }]
    }

    else {
        payload = [{
            "name": connectorName,
            "type": "GOOGLE_DRIVE_OAUTH_MULTI"
        }]
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include Authorization header using Bearer scheme
        "Authorization": `Bearer ${config.authorization}`
      },
      body: JSON.stringify(payload),
    });

    

    if (!response.ok) {
        // You can handle or throw an error as you see fit
        throw new Error(`Failed to create connector. Status: ${response.status}`);
    }

    // Parse response JSON
    const data = (await response.json());

    // Get the ID of the first connector
    const connectorId = data?.connectors?.[0]?.id;
    if (!connectorId) {
        throw new Error("No connector ID found in the response.");
    }

    return connectorId;
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
    action: "add" | "edit" | "remove",
    platformUrl: string = "https://api.vectorize.io/v1",
) : Promise<Response> {

    const url = `${platformUrl}/org/${config.organizationId}/connectors/sources/${connectorId}/users/`;

    let method = "POST";

    switch (action) {
        case "add":
            method = "POST";
            break;
        case "edit":
            method = "PATCH";
            break;
        case "remove":
            method = "DELETE";
            break;
        default:
            throw new Error("Invalid action");
    }

    // Create the appropriate payload based on the action
    let payload: any = { userId };
    
    // Only include selectedFiles and refreshToken for add/edit, not for remove
    if (action !== "remove") {
        if (selectedFiles) {
            payload.selectedFiles = selectedFiles;
        }
        if (refreshToken) {
            payload.refreshToken = refreshToken;
        }
    }

    const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header using Bearer scheme
          "Authorization": `Bearer ${config.authorization}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // You can handle or throw an error as you see fit
        throw new Error(`Failed to manage user. Status: ${response.status}`);
      }

      return response;
}
