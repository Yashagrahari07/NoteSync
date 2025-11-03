import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, User } from 'lucide-react';

const ConflictResolution = ({ 
  conflicts, 
  onResolve, 
  onDismiss, 
  isVisible = false 
}) => {
  const [selectedResolutions, setSelectedResolutions] = useState({});

  if (!isVisible || conflicts.length === 0) {
    return null;
  }

  const handleResolutionChoice = (conflictId, choice) => {
    setSelectedResolutions(prev => ({
      ...prev,
      [conflictId]: choice
    }));
  };

  const handleApplyResolutions = () => {
    Object.entries(selectedResolutions).forEach(([conflictId, choice]) => {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (conflict) {
        onResolve(conflict, choice);
      }
    });
    setSelectedResolutions({});
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConflictTypeIcon = (type) => {
    switch (type) {
      case 'CONFLICT: Insert position within delete range':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'CONFLICT: Overlapping delete operations':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConflictTypeLabel = (type) => {
    switch (type) {
      case 'CONFLICT: Insert position within delete range':
        return 'Insert/Delete Conflict';
      case 'CONFLICT: Overlapping delete operations':
        return 'Overlapping Deletes';
      default:
        return 'Edit Conflict';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Conflict Resolution Required
              </h2>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-gray-600">
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected. 
            Please choose how to resolve each conflict.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {conflicts.map((conflict, index) => {
            const conflictId = conflict.id || `conflict-${index}`;
            return (
            <div key={conflictId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getConflictTypeIcon(conflict.type)}
                  <span className="font-medium text-gray-900">
                    {getConflictTypeLabel(conflict.type)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(conflict.operation1?.timestamp || Date.now())}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Local Operation */}
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {conflict.operation1?.userFullname || 'Your Changes'}
                    </span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p><strong>Type:</strong> {conflict.operation1?.type}</p>
                    <p><strong>Position:</strong> {conflict.operation1?.position}</p>
                    <p><strong>Content:</strong> "{conflict.operation1?.content}"</p>
                  </div>
                </div>

                {/* Remote Operation */}
                <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">
                      {conflict.operation2?.userFullname || 'Other User'}
                    </span>
                  </div>
                  <div className="text-sm text-green-800">
                    <p><strong>Type:</strong> {conflict.operation2?.type}</p>
                    <p><strong>Position:</strong> {conflict.operation2?.position}</p>
                    <p><strong>Content:</strong> "{conflict.operation2?.content}"</p>
                  </div>
                </div>
              </div>

              {/* Resolution Options */}
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`conflict-${conflictId}`}
                    value="local"
                    checked={selectedResolutions[conflictId] === 'local'}
                    onChange={() => handleResolutionChoice(conflictId, 'local')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Keep my changes (Local)
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`conflict-${conflictId}`}
                    value="remote"
                    checked={selectedResolutions[conflictId] === 'remote'}
                    onChange={() => handleResolutionChoice(conflictId, 'remote')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Accept other changes (Remote)
                  </span>
                </label>
              </div>
            </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(selectedResolutions).length} of {conflicts.length} conflicts resolved
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyResolutions}
                disabled={Object.keys(selectedResolutions).length !== conflicts.length}
                className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Resolutions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolution;
