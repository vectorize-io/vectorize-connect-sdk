import { OAuthResponse, OAuthConfig } from '../types';

/**
 * Base Picker class providing common file selection functionality
 * Can be extended by specific connector implementations
 */
export abstract class BasePicker {
  /**
   * Abstract method to create HTML template for the picker page
   * Must be implemented by subclasses for connector-specific picker UI
   * 
   * @param tokens OAuth tokens for API access
   * @param config Configuration with necessary credentials
   * @param refreshToken Refresh token to include in selection data
   * @param preSelectedFiles Optional map of files to initialize as selected
   * @returns HTML string for the picker interface
   */
  abstract createPickerHTML(
    tokens: OAuthResponse, 
    config: OAuthConfig, 
    refreshToken: string, 
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>
  ): string;

  /**
   * Generates common UI elements for the picker
   * This can be used by subclass implementations to maintain a consistent look
   * 
   * @returns Object containing HTML template strings
   */
  protected getCommonUIElements(): { 
    header: string; 
    warning: string; 
    fileListContainer: string; 
    submitButtonContainer: string; 
    scripts: {
      basePickerScript: (tokens: any, config: any, refreshToken: string, preSelectedFiles: any) => string;
    }
  } {
    return {
      header: `
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Selected Files and Folders</h1>
          <button 
            onclick="handleSelectMore()"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Select Files/Folders
          </button>
        </div>
      `,
      warning: `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                <span class="font-medium">Important:</span> Some files might have limitations when accessed through the API. Please check the file compatibility with this connector.
              </p>
            </div>
          </div>
        </div>
      `,
      fileListContainer: `
        <div id="fileList" class="space-y-4">
          <p>No files selected</p>
        </div>
      `,
      submitButtonContainer: `
        <div id="submitButton" class="flex justify-end mt-6" style="display: none;">
          <button
            onclick="finishSelection()"
            class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Finish Selection
          </button>
        </div>
      `,
      scripts: {
        basePickerScript: (tokens, config, refreshToken, preSelectedFiles) => `
          const tokens = ${JSON.stringify(tokens)};
          const config = ${JSON.stringify(config)};
          const refreshToken = ${JSON.stringify(refreshToken)};
          const preSelectedFiles = ${JSON.stringify(preSelectedFiles || {})};
          let selectedFiles = [];
          
          // Initialize selected files from pre-selected ones if provided
          if (preSelectedFiles && Object.keys(preSelectedFiles).length > 0) {
            selectedFiles = Object.entries(preSelectedFiles).map(([id, details]) => ({
              id,
              name: details.name,
              mimeType: details.mimeType
            }));
          }
  
          function handleError(error) {
            const errorObj = new (window.opener.OAuthError || Error)(
              error.message || 'An error occurred in the picker',
              error.code || 'PICKER_ERROR',
              error.details
            );
            window.opener.__oauthHandler.onError(errorObj);
            window.close();
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
  
          async function finishSelection() {
            try {
              if (!selectedFiles.length) {
                throw new Error('No files selected');
              }

              // Create a map of fileId -> {name, mimeType}
              const fileMap = {};
              selectedFiles.forEach(file => {
                fileMap[file.id] = {
                  name: file.name,
                  mimeType: file.mimeType
                };
              });

              const bodyData = {
                selectedFiles: fileMap,
                refreshToken: refreshToken
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
  
          // Initialize file list with pre-selected files if any
          if (selectedFiles.length > 0) {
            updateFileList();
          }
        `
      }
    };
  }

  /**
   * Utility method to generate the base HTML structure
   * 
   * @param title Page title
   * @param styles Additional CSS styles to include
   * @param head Additional head content (scripts, meta tags)
   * @param body Body content
   * @param scripts JavaScript to include at the end of body
   * @returns Complete HTML string
   */
  protected generateHTMLTemplate(
    title: string,
    styles: string = '',
    head: string = '',
    body: string,
    scripts: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        ${styles}
        ${head}
      </head>
      <body>
        <div class="p-6">
          <div class="space-y-6">
            ${body}
          </div>
        </div>
        <script>
          ${scripts}
        </script>
      </body>
      </html>
    `;
  }
}