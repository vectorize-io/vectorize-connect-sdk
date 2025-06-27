// notionOAuth/utils/token.ts

import { OAuthError, TokenError } from '../../baseOAuth/types';

/**
 * Exchange an authorization code for Notion OAuth tokens
 * 
 * @param code The authorization code from Notion OAuth redirect
 * @param clientId The OAuth client ID
 * @param clientSecret The OAuth client secret
 * @param redirectUri The redirect URI used in the OAuth flow
 * @returns Promise resolving to the Notion OAuth tokens
 */
export async function exchangeNotionCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  access_token: string;
  token_type: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon?: string;
  bot_id: string;
}> {
  try {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OAuthError(
        errorData.error_description || `Failed to exchange code for tokens: ${response.status}`,
        'TOKEN_EXCHANGE_ERROR',
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof OAuthError) {
      throw error;
    }
    
    throw new OAuthError(
      error instanceof Error ? error.message : 'Failed to exchange code for tokens',
      'TOKEN_EXCHANGE_ERROR',
      error
    );
  }
}

/**
 * Refresh or validate a Notion access token
 * 
 * Note: Notion tokens are long-lived and don't typically need refreshing like Dropbox,
 * but we'll verify the token is valid by making a small API request.
 * If token is invalid, we'll throw an error that can be caught by the caller.
 * 
 * @param accessToken Current Notion access token
 * @param clientId The OAuth client ID (for potential future token refresh)
 * @param clientSecret The OAuth client secret (for potential future token refresh)
 * @returns Promise resolving to the validated token information
 */
export async function refreshNotionToken(
  accessToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon?: string;
  bot_id: string;
}> {
  try {
    // Verify the token by making a request to the Notion API
    const response = await fetch('https://api.notion.com/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new TokenError(
        `Token validation failed: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    const userData = await response.json();
    
    // Get basic workspace info
    const workspaceResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 1 // Just need to make a valid API call
      })
    });
    
    if (!workspaceResponse.ok) {
      throw new TokenError(
        `Failed to get workspace info: ${workspaceResponse.status}`,
        { status: workspaceResponse.status }
      );
    }
    
    const workspaceData = await workspaceResponse.json();
    
    // Return a format similar to the original OAuth response
    return {
      access_token: accessToken,
      workspace_id: userData.bot?.workspace_id || 'unknown',
      workspace_name: workspaceData.workspace_name || 'Notion Workspace',
      workspace_icon: workspaceData.workspace_icon,
      bot_id: userData.bot?.id || userData.id
    };
  } catch (error) {
    if (error instanceof TokenError || error instanceof OAuthError) {
      throw error;
    }
    
    throw new TokenError(
      error instanceof Error ? error.message : 'Failed to validate Notion token',
      error
    );
  }
}