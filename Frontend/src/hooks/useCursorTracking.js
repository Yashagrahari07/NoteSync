import { useEffect, useRef, useCallback } from 'react';

export const useCursorTracking = (socketRef, noteId, enabled = true) => {
  const textareaRef = useRef(null);
  const cursorTimeoutRef = useRef(null);
  const lastCursorPosition = useRef(null);

  const getCursorPosition = useCallback(() => {
    if (!textareaRef.current) return null;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    const lines = text.split('\n');
    
    let charCount = 0;
    let line = 0;
    let ch = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (charCount + lineLength > cursorPos) {
        ch = cursorPos - charCount;
        break;
      }
      charCount += lineLength;
      line++;
    }
    
    return { line, ch };
  }, []);

  const sendCursorPosition = useCallback((position) => {
    if (!socketRef.current || !noteId || !enabled) return;
    
    // Only send if position has changed
    if (!lastCursorPosition.current || 
        lastCursorPosition.current.line !== position.line || 
        lastCursorPosition.current.ch !== position.ch) {
      
      socketRef.current.emit('cursorMove', noteId, position);
      lastCursorPosition.current = position;
    }
  }, [socketRef, noteId, enabled]);

  const handleCursorMove = useCallback(() => {
    if (!enabled) return;

    const position = getCursorPosition();
    if (!position) return;

    // Debounce cursor position updates
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }

    cursorTimeoutRef.current = setTimeout(() => {
      sendCursorPosition(position);
    }, 100); // 100ms debounce
  }, [enabled, getCursorPosition, sendCursorPosition]);

  const handleSelectionChange = useCallback(() => {
    if (!enabled || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) return; // No selection

    const text = textarea.value;
    const lines = text.split('\n');
    
    // Calculate start position
    let startCharCount = 0;
    let startLine = 0;
    let startCh = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (startCharCount + lineLength > start) {
        startCh = start - startCharCount;
        break;
      }
      startCharCount += lineLength;
      startLine++;
    }
    
    // Calculate end position
    let endCharCount = 0;
    let endLine = 0;
    let endCh = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (endCharCount + lineLength > end) {
        endCh = end - endCharCount;
        break;
      }
      endCharCount += lineLength;
      endLine++;
    }

    const selection = {
      start: { line: startLine, ch: startCh },
      end: { line: endLine, ch: endCh }
    };

    if (socketRef.current && noteId) {
      socketRef.current.emit('selectionChange', noteId, selection);
    }
  }, [enabled, socketRef, noteId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !enabled) return;

    const events = ['click', 'keyup', 'keydown', 'input', 'select', 'mouseup'];
    
    events.forEach(event => {
      textarea.addEventListener(event, handleCursorMove);
    });

    // Add selection change listener
    textarea.addEventListener('select', handleSelectionChange);
    textarea.addEventListener('mouseup', handleSelectionChange);

    return () => {
      events.forEach(event => {
        textarea.removeEventListener(event, handleCursorMove);
      });
      textarea.removeEventListener('select', handleSelectionChange);
      textarea.removeEventListener('mouseup', handleSelectionChange);
      
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [handleCursorMove, handleSelectionChange, enabled]);

  return { textareaRef };
};
