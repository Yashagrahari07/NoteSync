import { useState, useCallback, useRef } from 'react';

/**
 * Hook for handling Operational Transformation on the client side
 */
export const useOperationalTransformation = (noteId, socketRef) => {
  const [operations, setOperations] = useState([]);
  const [version, setVersion] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const lastContentRef = useRef('');

  /**
   * Create operations from text change using improved diff algorithm
   */
  const createOperationsFromChange = useCallback((oldText, newText, userId) => {
    if (oldText === newText) {
      return [];
    }

    const operations = [];
    const oldChars = oldText.split('');
    const newChars = newText.split('');
    
    // Use a more efficient diff algorithm
    let i = 0;
    let j = 0;
    
    while (i < oldChars.length || j < newChars.length) {
      if (i < oldChars.length && j < newChars.length && oldChars[i] === newChars[j]) {
        i++;
        j++;
      } else if (j < newChars.length) {
        // Insert operation - batch consecutive inserts
        let insertContent = '';
        let insertPos = i;
        while (j < newChars.length && (i >= oldChars.length || oldChars[i] !== newChars[j])) {
          insertContent += newChars[j];
          j++;
        }
        operations.push({
          type: 'insert',
          position: insertPos,
          content: insertContent,
          userId,
          timestamp: Date.now()
        });
      } else if (i < oldChars.length) {
        // Delete operation - batch consecutive deletes
        let deleteContent = '';
        let deletePos = i;
        while (i < oldChars.length && (j >= newChars.length || oldChars[i] !== newChars[j])) {
          deleteContent += oldChars[i];
          i++;
        }
        operations.push({
          type: 'delete',
          position: deletePos,
          content: deleteContent,
          userId,
          timestamp: Date.now()
        });
      }
    }
    
    return operations;
  }, []);

  /**
   * Apply operation to content
   */
  const applyOperation = useCallback((content, operation) => {
    const chars = content.split('');
    
    switch (operation.type) {
      case 'insert':
        chars.splice(operation.position, 0, ...operation.content.split(''));
        break;
      case 'delete':
        chars.splice(operation.position, operation.content.length);
        break;
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
    
    return chars.join('');
  }, []);

  /**
   * Transform two operations - Simplified version that relies on backend
   */
  const transformOperations = useCallback((op1, op2) => {
    // For now, we'll rely on the backend for complex transformations
    // This is a simplified version for basic cases
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position + op1.content.length }];
      } else if (op1.position > op2.position) {
        return [{ ...op1, position: op1.position + op2.content.length }, op2];
      } else {
        // Same position - use timestamp as tiebreaker
        if (op1.timestamp < op2.timestamp) {
          return [op1, { ...op2, position: op2.position + op1.content.length }];
        } else {
          return [{ ...op1, position: op1.position + op2.content.length }, op2];
        }
      }
    }
    
    // For other cases, let the backend handle it
    throw new Error('Complex transformation - handled by backend');
  }, []);

  /**
   * Send operation to server
   */
  const sendOperation = useCallback((operation, userId) => {
    if (!socketRef.current) return;

    const op = {
      ...operation,
      version: version,
      timestamp: Date.now()
    };

    socketRef.current.emit('applyOperation', noteId, op);
    setVersion(prev => prev + 1);
  }, [noteId, version, socketRef]);

  /**
   * Handle content change and create operations
   */
  const handleContentChange = useCallback((oldContent, newContent, userId) => {
    if (oldContent === newContent) return;

    const newOperations = createOperationsFromChange(oldContent, newContent, userId);
    
    // Send each operation
    newOperations.forEach(operation => {
      sendOperation(operation, userId);
    });

    lastContentRef.current = newContent;
  }, [createOperationsFromChange, sendOperation]);

  /**
   * Handle remote operation
   */
  const handleRemoteOperation = useCallback((operation) => {
    try {
      // Apply the operation to local content
      const newContent = applyOperation(lastContentRef.current, operation);
      lastContentRef.current = newContent;
      
      return {
        success: true,
        newContent
      };
    } catch (error) {
      console.error('Error applying remote operation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [applyOperation]);

  /**
   * Handle conflict resolution
   */
  const handleConflictResolution = useCallback((conflicts, resolution) => {
    setIsResolving(true);
    setConflicts(conflicts);

    // Apply resolution based on type
    if (resolution.type === 'last-write-wins') {
      // Apply winning operations
      resolution.resolutions.forEach(({ winningOperation }) => {
        const result = handleRemoteOperation(winningOperation);
        if (result.success) {
          lastContentRef.current = result.newContent;
        }
      });
    }

    setIsResolving(false);
    setConflicts([]);
  }, [handleRemoteOperation]);

  /**
   * Manual conflict resolution
   */
  const resolveConflictManually = useCallback((conflict, choice) => {
    if (!socketRef.current) return;

    const resolution = {
      conflictId: conflict.id,
      choice, // 'local' or 'remote'
      timestamp: Date.now()
    };

    socketRef.current.emit('manualConflictResolution', noteId, resolution);
  }, [noteId, socketRef]);

  /**
   * Clear conflicts
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setIsResolving(false);
  }, []);

  return {
    operations,
    version,
    conflicts,
    isResolving,
    lastContent: lastContentRef.current,
    handleContentChange,
    handleRemoteOperation,
    handleConflictResolution,
    resolveConflictManually,
    clearConflicts,
    applyOperation,
    transformOperations
  };
};
