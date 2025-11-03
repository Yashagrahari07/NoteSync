import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ConflictIndicator = ({ 
  hasConflicts = false, 
  isResolving = false, 
  conflictCount = 0,
  onResolve,
  className = '' 
}) => {
  if (!hasConflicts && !isResolving) {
    return null;
  }

  const getStatusIcon = () => {
    if (isResolving) {
      return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    if (hasConflicts) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isResolving) {
      return 'Resolving conflicts...';
    }
    if (hasConflicts) {
      return `${conflictCount} conflict${conflictCount > 1 ? 's' : ''} detected`;
    }
    return 'All conflicts resolved';
  };

  const getStatusColor = () => {
    if (isResolving) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    if (hasConflicts) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    return 'bg-green-50 border-green-200 text-green-800';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {getStatusText()}
      </span>
      {hasConflicts && !isResolving && (
        <button
          onClick={onResolve}
          className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Resolve
        </button>
      )}
    </div>
  );
};

export default ConflictIndicator;
