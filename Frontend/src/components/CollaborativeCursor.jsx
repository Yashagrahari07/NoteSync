import React from 'react';

const CollaborativeCursor = ({ cursors, textareaRef }) => {
  if (!cursors || Object.keys(cursors).length === 0) return null;

  const getCursorPosition = (cursor) => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const text = textarea.value;
    const lines = text.split('\n');
    
    let charCount = 0;
    let lineCount = 0;
    
    // Calculate position based on line and character
    for (let i = 0; i < cursor.line && i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline
      lineCount++;
    }
    
    charCount += Math.min(cursor.ch, lines[cursor.line]?.length || 0);
    
    // Create a temporary element to measure text dimensions
    const temp = document.createElement('div');
    temp.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${textarea.offsetWidth}px;
      font-family: ${getComputedStyle(textarea).fontFamily};
      font-size: ${getComputedStyle(textarea).fontSize};
      line-height: ${getComputedStyle(textarea).lineHeight};
      white-space: pre-wrap;
      word-wrap: break-word;
      padding: ${getComputedStyle(textarea).padding};
      border: ${getComputedStyle(textarea).border};
      box-sizing: border-box;
    `;
    
    const textBeforeCursor = text.substring(0, charCount);
    temp.textContent = textBeforeCursor;
    document.body.appendChild(temp);
    
    const rect = temp.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    document.body.removeChild(temp);
    
    // Calculate cursor position
    const linesBeforeCursor = textBeforeCursor.split('\n');
    const currentLine = linesBeforeCursor[linesBeforeCursor.length - 1];
    
    const temp2 = document.createElement('div');
    temp2.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      font-family: ${getComputedStyle(textarea).fontFamily};
      font-size: ${getComputedStyle(textarea).fontSize};
      white-space: pre;
    `;
    temp2.textContent = currentLine;
    document.body.appendChild(temp2);
    
    const lineWidth = temp2.offsetWidth;
    document.body.removeChild(temp2);
    
    const top = textareaRect.top + (linesBeforeCursor.length - 1) * parseInt(getComputedStyle(textarea).lineHeight);
    const left = textareaRect.left + lineWidth + parseInt(getComputedStyle(textarea).paddingLeft);
    
    return { top, left };
  };

  return (
    <>
      {Object.entries(cursors).map(([userId, cursorData]) => {
        const position = getCursorPosition(cursorData.cursor);
        
        return (
          <div
            key={userId}
            className="absolute pointer-events-none z-10"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {/* Cursor line */}
            <div className="w-0.5 h-5 bg-blue-500 animate-pulse"></div>
            
            {/* User label */}
            <div className="absolute top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {cursorData.userFullname}
            </div>
            
            {/* User avatar */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {cursorData.userFullname.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default CollaborativeCursor;
