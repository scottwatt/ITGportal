// src/components/admin/CalendarConfiguration.jsx
// Admin component to configure and test Google Calendar integration

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, X, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { 
  initializeCalendarAPI,
  isCalendarAPIReady,
  getGraceCalendarInfo,
  getGraceEventsForDate
} from '../../services/googleCalendar/calendarService';
import { getPSTDate } from '../../utils/dateUtils';

const CalendarConfiguration = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'ready', 'error', 'not-configured'
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [testEvents, setTestEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      // Check if environment variables are set
      const hasApiKey = !!process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;
      const hasCalendarId = !!process.env.REACT_APP_GRACE_CALENDAR_ID;
      
      if (!hasApiKey || !hasCalendarId) {
        setStatus('not-configured');
        setError('Missing environment variables. Check your .env file.');
        return;
      }
      
      // Try to initialize the API
      const initialized = await initializeCalendarAPI();
      
      if (!initialized) {
        setStatus('error');
        setError('Failed to initialize Google Calendar API');
        return;
      }
      
      // Try to get calendar info
      const info = await getGraceCalendarInfo();
      if (info) {
        setCalendarInfo(info);
        setStatus('ready');
      } else {
        setStatus('error');
        setError('Could not access Grace calendar. Check calendar ID and permissions.');
      }
      
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const testCalendarAccess = async () => {
    setLoading(true);
    try {
      const today = getPSTDate();
      const events = await getGraceEventsForDate(today);
      setTestEvents(events);
      alert(`Successfully retrieved ${events.length} events for today!`);
    } catch (err) {
      alert(`Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'not-configured': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready': return <CheckCircle className="text-green-600" size={20} />;
      case 'error': return <X className="text-red-600" size={20} />;
      case 'not-configured': return <AlertTriangle className="text-yellow-600" size={20} />;
      default: return <RefreshCw className="text-gray-600 animate-spin" size={20} />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'ready': return 'Google Calendar integration is working correctly';
      case 'error': return 'Google Calendar integration has errors';
      case 'not-configured': return 'Google Calendar integration needs configuration';
      case 'checking': return 'Checking Google Calendar configuration...';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
          <Calendar className="mr-2 text-[#5A4E69]" size={20} />
          Grace Calendar Configuration
        </h3>

        {/* Status Display */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-3 mb-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          </div>
          
          {error && (
            <div className="text-sm text-red-700 bg-red-50 p-2 rounded mt-2">
              {error}
            </div>
          )}
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <h4 className="font-medium text-[#292929]">Environment Variables</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center space-x-2">
                {process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY ? 
                  <CheckCircle className="text-green-600" size={16} /> : 
                  <X className="text-red-600" size={16} />
                }
                <span>REACT_APP_GOOGLE_CALENDAR_API_KEY</span>
              </div>
              <div className="flex items-center space-x-2">
                {process.env.REACT_APP_GRACE_CALENDAR_ID ? 
                  <CheckCircle className="text-green-600" size={16} /> : 
                  <X className="text-red-600" size={16} />
                }
                <span>REACT_APP_GRACE_CALENDAR_ID</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-[#292929]">API Status</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center space-x-2">
                {isCalendarAPIReady() ? 
                  <CheckCircle className="text-green-600" size={16} /> : 
                  <X className="text-red-600" size={16} />
                }
                <span>Google Calendar API</span>
              </div>
              <div className="flex items-center space-x-2">
                {status === 'ready' ? 
                  <CheckCircle className="text-green-600" size={16} /> : 
                  <X className="text-red-600" size={16} />
                }
                <span>Calendar Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Information */}
        {calendarInfo && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Calendar Information</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><strong>Name:</strong> {calendarInfo.summary}</div>
              <div><strong>ID:</strong> <code className="bg-blue-100 px-1 rounded">{calendarInfo.id}</code></div>
              {calendarInfo.description && (
                <div><strong>Description:</strong> {calendarInfo.description}</div>
              )}
              <div><strong>Timezone:</strong> {calendarInfo.timeZone}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={checkConfiguration}
            disabled={status === 'checking'}
            className="bg-[#5A4E69] text-white px-4 py-2 rounded hover:bg-[#292929] disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw size={16} className={status === 'checking' ? 'animate-spin' : ''} />
            <span>Recheck Configuration</span>
          </button>

          {status === 'ready' && (
            <button
              onClick={testCalendarAccess}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Calendar size={16} />
              <span>{loading ? 'Testing...' : 'Test Calendar Access'}</span>
            </button>
          )}

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <ExternalLink size={16} />
            <span>Open Google Calendar</span>
          </a>
        </div>

        {/* Test Results */}
        {testEvents.length > 0 && (
          <div className="mt-4 bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Test Results (Today's Events)</h4>
            <div className="space-y-2">
              {testEvents.map(event => (
                <div key={event.id} className="text-sm text-green-700 bg-green-100 p-2 rounded">
                  <strong>{event.title}</strong>
                  {event.startTime && <span className="ml-2">at {event.startTime}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {status === 'not-configured' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>To enable Grace calendar integration:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Get a Google Calendar API key from Google Cloud Console</li>
                <li>Create or find your Grace calendar ID</li>
                <li>Add environment variables to your .env file</li>
                <li>Restart your application</li>
              </ol>
              <p className="mt-2">
                See the setup documentation for detailed instructions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarConfiguration;