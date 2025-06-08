// src/components/shared/GoogleDriveConfigStatus.jsx
// Shows Google Drive configuration status and setup instructions

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const GoogleDriveConfigStatus = ({ configStatus, error, onRetry }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!configStatus) return null;

  const { isValid, hasCredentials, errors, warnings } = configStatus;

  // If everything is working, don't show anything
  if (isValid && hasCredentials) return null;

  return (
    <div className="mb-6 p-4 border rounded-lg">
      {/* Status Header */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {hasCredentials ? (
            <CheckCircle className="h-5 w-5 text-yellow-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            Google Drive Configuration
          </h3>
          <div className="mt-1">
            {!hasCredentials ? (
              <p className="text-red-700">
                Google Drive is not configured. File upload/management features are disabled.
              </p>
            ) : !isValid ? (
              <p className="text-yellow-700">
                Google Drive configuration has issues. Some features may not work properly.
              </p>
            ) : (
              <p className="text-green-700">
                Google Drive is configured and ready to use.
              </p>
            )}
          </div>
          
          {/* Error Details */}
          {errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800">Issues found:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Warning Details */}
          {warnings.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-yellow-800">Warnings:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Error Info */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
              <strong>Error details:</strong> {error}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center space-x-3">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Settings className="h-4 w-4 mr-1" />
          Setup Instructions
          {showInstructions ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        )}
      </div>

      {/* Setup Instructions */}
      {showInstructions && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Google Drive Setup Instructions
          </h4>
          
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800">Step 1: Google Cloud Console Setup</h5>
              <ol className="mt-1 list-decimal list-inside text-gray-600 space-y-1">
                <li>
                  Go to{' '}
                  <a 
                    href="https://console.cloud.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    Google Cloud Console
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Create a new project: "ITG Coach Portal"</li>
                <li>Enable the <strong>Google Drive API</strong></li>
                <li>Create credentials:</li>
                <ul className="ml-6 list-disc list-inside">
                  <li><strong>API Key</strong> (restrict to HTTP referrers and Drive API)</li>
                  <li><strong>OAuth 2.0 Client ID</strong> (web application)</li>
                </ul>
                <li>Set up OAuth consent screen</li>
              </ol>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">Step 2: Environment Configuration</h5>
              <p className="text-gray-600 mb-2">
                Add these variables to your <code className="bg-gray-200 px-1 rounded">.env</code> file:
              </p>
              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs">
                <div>REACT_APP_GOOGLE_DRIVE_API_KEY=your_api_key_here</div>
                <div>REACT_APP_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here</div>
                <div>REACT_APP_USE_SHARED_DRIVE=false</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">Step 3: Restart Application</h5>
              <p className="text-gray-600">
                After adding the environment variables, restart your development server:
              </p>
              <div className="bg-gray-800 text-green-400 p-2 rounded font-mono text-xs mt-1">
                npm start
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded">
              <h5 className="font-medium text-blue-800">Optional: Google Workspace</h5>
              <p className="text-blue-700 text-xs">
                If you have Google Workspace, you can create a Shared Drive named "ITG Client Files" 
                and set <code>REACT_APP_USE_SHARED_DRIVE=true</code> for enhanced collaboration features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveConfigStatus;