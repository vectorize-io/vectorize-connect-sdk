import { VectorizeAPIConfig } from "../types";

/**
 * Create a Google Drive OAuth Connector Source via the Vectorize API.
 *
 * @param config - An object containing your organization ID and authorization token
 * @param payload - The payload you want to POST (e.g., JSON body for creating a source)
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

    console.log("url", url);

    let payload;

    if (whiteLabel){
        if (!clientId || !clientSecret) {
            throw new Error("Client ID and Client Secret are required for whitelabel");
        }

        payload = [{
            "name": connectorName,
            "type": "GOOGLE_DRIVE_OAUTH_MULTI_CUSTOM",
            "oauth2-client-id" : clientId,
            "oauth2-client-secret": clientSecret
        }]
    }

    else {
        payload = [{
            "name": connectorName,
            "type": "GOOGLE_DRIVE_OAUTH_MULTI"
        }]
    }

    console.log("payload", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include Authorization header using Bearer scheme
        // "Authorization": `Bearer ${config.authorization}`
        "x-lambda-api-key" : "09d8f382930bd4dd419bb9206d9f28f8e1a8939ca92b7d3b9a09704c1aa3b369"
      },
      body: JSON.stringify(payload),
    });

    console.log("response from vectorize api", response);
    

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


export async function manageGDriveUser(
    config: VectorizeAPIConfig,
    connectorId: string,
    fileIds: string[],
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

    const payload = {
        "fileIds": fileIds,
        "refreshToken": refreshToken,
        "userId": userId
    }

    const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header using Bearer scheme
          // "Authorization": `Bearer ${config.authorization}`
          "x-lambda-api-key" : "09d8f382930bd4dd419bb9206d9f28f8e1a8939ca92b7d3b9a09704c1aa3b369"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // You can handle or throw an error as you see fit
        throw new Error(`Failed to manage user. Status: ${response.status}`);
      }

        return response;
}