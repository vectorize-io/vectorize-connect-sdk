import { OAuthResponse } from '../../baseOAuth/types';
import { GoogleDriveOAuthConfig } from '../types';
import { BasePicker } from '../../baseOAuth/ui/picker';

/**
 * Google Drive implementation of the file picker
 */
export class GoogleDrivePicker extends BasePicker {
  /**
   * Creates an HTML template specifically for the Google Drive picker
   * 
   * @param tokens OAuth tokens for API access
   * @param config Google Drive specific configuration
   * @param refreshToken Refresh token to include in selection data
   * @param preSelectedFiles Optional map of files to initialize as selected
   * @returns HTML string for the Google Drive picker interface
   */
  createPickerHTML(
    tokens: OAuthResponse,
    config: GoogleDriveOAuthConfig,
    refreshToken: string,
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>,
    nonce?: string
  ): string {
    const ui = this.getCommonUIElements();
    
    // Google Drive specific warning
    const googleDriveWarning = `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <span class="font-medium">Important:</span> Google Workspace documents like presentations and Google Docs cannot be exported if they are larger than 10MB. Please convert such files to a compatible format (e.g., PDF) before selection if you need to process them.
            </p>
          </div>
        </div>
      </div>
    `;

    // Google Drive specific scripts
    const googleDriveScripts = `
      ${ui.scripts.basePickerScript(tokens, {
        clientId: config.clientId,
        apiKey: config.apiKey,
        refreshToken
      }, refreshToken, preSelectedFiles)}

      function loadPicker() {
        try {
          window.gapi.load('picker', initPicker);
        } catch (error) {
          handleError({
            message: 'Failed to load Google Picker API',
            code: 'PICKER_LOAD_ERROR',
            details: error
          });
        }
      }

      function initPicker() {
        createPicker(tokens.access_token);
      }

      function createPicker(token) {
        if (!token) {
          handleError({
            message: 'No access token available',
            code: 'TOKEN_MISSING'
          });
          return;
        }

        try {
          // Extract app ID from client ID
          const appId = config.clientId.split('-')[0];
          
          const myDriveView = new google.picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setParent('root')
            .setLabel('My Drive');

          const sharedDriveView = new google.picker.DocsView(google.picker.ViewId.DOCS)
            .setEnableTeamDrives(true)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setLabel('Shared Drives');

          const sharedWithMeView = new google.picker.DocsView(google.picker.ViewId.SHARED_WITH_ME)
            .setIncludeFolders(true)
            .setOwnedByMe(false)
            .setSelectFolderEnabled(true)
            .setLabel('Shared with me');

          const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .addView(myDriveView)
            .addView(sharedDriveView)
            .addView(sharedWithMeView)
            .setOAuthToken(token)
            .setDeveloperKey(config.apiKey)
            .setAppId(appId)
            .setCallback(handlePickerCallback)
            .build();

          picker.setVisible(true);
        } catch (error) {
          handleError({
            message: 'Failed to create picker',
            code: 'PICKER_CREATE_ERROR',
            details: error
          });
        }
      }

      function handlePickerCallback(data) {
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
          const newDocs = data[google.picker.Response.DOCUMENTS];
          const existingIds = new Set(selectedFiles.map(file => file.id));
          const uniqueNewFiles = newDocs.filter(file => !existingIds.has(file.id));
          selectedFiles = [...selectedFiles, ...uniqueNewFiles];
          updateFileList();
        }
      }

      function handleSelectMore() {
        loadPicker();
      }

      // Attach event listener for Select More button
      document.getElementById('selectMoreButton')?.addEventListener('click', handleSelectMore);

      // Initialize picker
      // loadPicker();
    `;

    // Google-specific head includes
    const googleHead = `
      <script src="https://apis.google.com/js/api.js"${nonce ? ` nonce="${nonce}"` : ''}></script>
      <script src="https://apis.google.com/js/platform.js"${nonce ? ` nonce="${nonce}"` : ''}></script>
    `;

    // Assemble the complete HTML
    return this.generateHTMLTemplate(
      'Google Drive File Selector',
      '', // No additional styles
      googleHead,
      `
        ${ui.header}
        ${googleDriveWarning}
        ${ui.fileListContainer}
        ${ui.submitButtonContainer}
      `,
      googleDriveScripts,
      nonce
    );
  }

  /**
   * Create a static instance for backward compatibility
   */
  static createPickerHTML(
    tokens: OAuthResponse,
    config: GoogleDriveOAuthConfig,
    refreshToken: string,
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>,
    nonce?: string
  ): string {
    const picker = new GoogleDrivePicker();
    return picker.createPickerHTML(tokens, config, refreshToken, preSelectedFiles, nonce);
  }
}