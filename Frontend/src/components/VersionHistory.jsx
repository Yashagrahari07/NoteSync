import React, { useState, useEffect } from 'react';
import { History, Clock, User, RotateCcw, Eye, CheckCircle } from 'lucide-react';

const VersionHistory = ({ 
  noteId, 
  isVisible = false, 
  onClose, 
  onRestore,
  socketRef 
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (isVisible && noteId) {
      fetchVersionHistory();
    }
  }, [isVisible, noteId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      if (socketRef.current) {
        socketRef.current.emit('requestVersionHistory', noteId);
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const handleVersionHistory = (data) => {
      if (data.noteId === noteId) {
        setVersions(data.versions);
      }
    };

    socketRef.current.on('versionHistory', handleVersionHistory);

    return () => {
      socketRef.current.off('versionHistory', handleVersionHistory);
    };
  }, [noteId, socketRef]);

  const handleRestoreVersion = async (version) => {
    if (!socketRef.current) return;

    try {
      socketRef.current.emit('restoreVersion', noteId, version);
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVersionTypeIcon = (version) => {
    if (version.conflictResolved) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <History className="w-4 h-4 text-blue-500" />;
  };

  const getVersionTypeLabel = (version) => {
    if (version.conflictResolved) {
      return 'Conflict Resolution';
    }
    return 'Regular Edit';
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Version History
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading version history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No version history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getVersionTypeIcon(version)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Version {version.version}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getVersionTypeLabel(version)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(version.createdAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Created by</p>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {version.createdByFullname || 'Unknown User'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Title</p>
                      <p className="text-sm text-gray-600">{version.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Content Preview</p>
                      <p className="text-sm text-gray-600">
                        {truncateContent(version.content)}
                      </p>
                    </div>
                  </div>

                  {version.conflictResolved && version.conflictDetails && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Conflict Resolution Details
                      </p>
                      <div className="text-sm text-yellow-700">
                        <p><strong>Resolution:</strong> {version.conflictDetails.resolution}</p>
                        <p><strong>Resolved by:</strong> {version.conflictDetails.resolvedBy?.fullname || 'Unknown'}</p>
                        <p><strong>Operations:</strong> {version.conflictDetails.operations?.length || 0} conflicting operations</p>
                      </div>
                    </div>
                  )}

                  {version.changes && version.changes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Changes</p>
                      <div className="space-y-1">
                        {version.changes.map((change, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            <span className="font-medium">{change.type}:</span> {change.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedVersion(version)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(version.version)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Version</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Version Details Modal */}
        {selectedVersion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Version {selectedVersion.version} Details
                  </h3>
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                    <p className="text-gray-600">{selectedVersion.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedVersion.content}
                      </pre>
                    </div>
                  </div>
                  {selectedVersion.conflictDetails && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Conflict Details</h4>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-800">
                          {JSON.stringify(selectedVersion.conflictDetails, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
