import { OAuthResponse } from '../types';

/**
 * Module for Google Drive picker functionality
 */
export const GoogleDrivePicker = {
  /**
   * Creates an HTML template for the picker page
   * @param tokens OAuth tokens for API access
   * @param config Configuration with API key and client ID
   * @param refreshToken Refresh token to include in selection data
   * @returns HTML string for the picker interface
   */
  createPickerHTML(tokens: OAuthResponse, config: any, refreshToken: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://apis.google.com/js/api.js"></script>
        <script src="https://apis.google.com/js/platform.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div class="p-6">
          <div class="space-y-6">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold">Selected Files and Folders</h1>
              <button 
                onclick="handleSelectMore()"
                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Select Files/Folders
              </button>
            </div>
            
            <div id="fileList" class="space-y-4">
              <p>No files selected</p>
            </div>
  
            <div id="submitButton" class="flex justify-end mt-6" style="display: none;">
              <button
                onclick="finishSelection()"
                class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Finish Selection
              </button>
            </div>
          </div>
        </div>
  
        <script>
          const tokens = ${JSON.stringify(tokens)};
          const config = ${JSON.stringify({
            clientId: config.clientId,
            apiKey: config.apiKey,
            refreshToken
          })};
          let selectedFiles = [];
  
          function handleError(error) {
            const errorObj = new (window.opener.OAuthError || Error)(
              error.message || 'An error occurred in the picker',
              error.code || 'PICKER_ERROR',
              error.details
            );
            window.opener.__oauthHandler.onError(errorObj);
            window.close();
          }
  
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
  
          function updateFileList() {
            const fileList = document.getElementById('fileList');
            const submitButton = document.getElementById('submitButton');
  
            if (selectedFiles.length === 0) {
              fileList.innerHTML = '<p>No files selected</p>';
              submitButton.style.display = 'none';
              return;
            }
  
            fileList.innerHTML = selectedFiles.map(file => 
              \`<div class="group p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p class="font-medium text-gray-800">
                    \${file.name}
                  </p>
                  <p class="text-sm text-gray-500">
                    Type: \${file.mimeType}
                  </p>
                </div>
                <button
                  onclick="removeFile('\${file.id}')"
                  class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>\`
            ).join('');
  
            submitButton.style.display = 'flex';
          }
  
          function removeFile(fileId) {
            selectedFiles = selectedFiles.filter(file => file.id !== fileId);
            updateFileList();
          }
  
          function handleSelectMore() {
            loadPicker();
          }
  
          async function finishSelection() {
            try {
              if (!selectedFiles.length) {
                throw new Error('No files selected');
              }

              const bodyData = {
                fileIds: selectedFiles.map(file => file.id),
                refreshToken: config.refreshToken
              };

              window.opener.__oauthHandler.onSuccess(bodyData);
              window.close();
            } catch (error) {
              handleError({
                message: error.message || 'Failed to complete file selection',
                code: 'SELECTION_ERROR',
                details: error
              });
            }
          }
  
          // Initialize picker
          loadPicker();
        </script>
      </body>
      </html>
    `;
  }
};