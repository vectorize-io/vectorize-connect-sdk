import { VectorizeAPIConfig, ConnectorConfig, UserAction } from "../types";

/**
 * Create a connector source via the Vectorize API.
 *
 * @param config - An object containing your organization ID and authorization token
 * @param connector - Connector configuration including name, type, and optional config
 * @param platformUrl - URL of the Vectorize API (primarily used for testing)
 *
 * @returns A Promise that resolves with the connector ID that is created
 */
export async function createSourceConnector(
  config: VectorizeAPIConfig,
  connector: ConnectorConfig,
  platformUrl: string = "https://api.vectorize.io/v1",
): Promise<string> {
  const url = `${platformUrl}/org/${config.organizationId}/connectors/sources`;

  const payload = [connector];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.authorization}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create connector. Status: ${response.status}, Message: ${response.statusText || 'No error message provided'}`);
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
 * Manages a user for a connector, allowing you to add, edit, or remove users.
 *
 * @param config VectorizeAPIConfig containing authorization and organizationId
 * @param connectorId ID of the connector
 * @param userId User ID to manage
 * @param action Action to perform ("add", "edit", or "remove")
 * @param payload Additional payload for the request (varies by connector type)
 * @param platformUrl Optional URL of the Vectorize API (primarily used for testing)
 * @returns Promise that resolves with the API response
 */
export async function manageUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  userId: string,
  action: UserAction,
  payload: Record<string, any> = {},
  platformUrl: string = "https://api.vectorize.io/v1",
): Promise<Response> {
  const url = `${platformUrl}/org/${config.organizationId}/connectors/sources/${connectorId}/users/`;

  let method: string;
  
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

  // Create the base payload with userId
  const requestPayload = { 
    userId,
    ...payload
  };

  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.authorization}`
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`Failed to manage user. Status: ${response.status}`);
  }

  return response;
}

/**
 * Gets a one-time authentication token for connector operations
 *
 * @param config VectorizeAPIConfig containing authorization and organizationId
 * @param userId User ID to include in the token
 * @param connectorId Connector ID to include in the token
 * @param platformUrl Optional URL of the Vectorize API (primarily used for testing)
 * @returns Promise that resolves with the token response
 */
export async function getOneTimeConnectorToken(
  config: VectorizeAPIConfig,
  userId: string,
  connectorId: string,
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<{ token: string; expires_at: number; ttl: number }> {
  const url = `${platformUrl}/org/${config.organizationId}/generateOneTimeConnectorToken`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.authorization}`
    },
    body: JSON.stringify({
      user_id: userId,
      connector_id: connectorId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate one-time token. Status: ${response.status}`);
  }

  return await response.json();
}