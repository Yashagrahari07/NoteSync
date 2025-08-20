import React from 'react';

const SelectionHighlight = ({ selections, textareaRef }) => {
  if (!selections || Object.keys(selections).length === 0) return null;

  const getSelectionPosition = (selection) => {
    if (!textareaRef.current) return { top: 0, left: 0, width: 0, height: 0 };

    const textarea = textareaRef.current;
    const text = textarea.value;
    const lines = text.split('\n');
    
    // Calculate start position
    let startCharCount = 0;
    for (let i = 0; i < selection.start.line && i < lines.length; i++) {
      startCharCount += lines[i].length + 1;
    }
    startCharCount += Math.min(selection.start.ch, lines[selection.start.line]?.length || 0);
    
    // Calculate end position
    let endCharCount = 0;
    for (let i = 0; i < selection.end.line && i < lines.length; i++) {
      endCharCount += lines[i].length + 1;
    }
    endCharCount += Math.min(selection.end.ch, lines[selection.end.line]?.length || 0);
    
    // Create temporary element to measure text dimensions
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
    
    const textBeforeStart = text.substring(0, startCharCount);
    temp.textContent = textBeforeStart;
    document.body.appendChild(temp);
    
    const textareaRect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    
    document.body.removeChild(temp);
    
    // Calculate selection dimensions
    const startLine = textBeforeStart.split('\n').length - 1;
    const endLine = Math.max(startLine, selection.end.line);
    
    const top = textareaRect.top + startLine * lineHeight;
    const height = (endLine - startLine + 1) * lineHeight;
    
    // Calculate width for single line selection
    const selectedText = text.substring(startCharCount, endCharCount);
    const temp2 = document.createElement('div');
    temp2.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      font-family: ${getComputedStyle(textarea).fontFamily};
      font-size: ${getComputedStyle(textarea).fontSize};
      white-space: pre;
    `;
    temp2.textContent = selectedText;
    document.body.appendChild(temp2);
    
    const width = temp2.offsetWidth;
    document.body.removeChild(temp2);
    
    const left = textareaRect.left + parseInt(getComputedStyle(textarea).paddingLeft);
    
    return { top, left, width, height };
  };

  return (
    <>
      {Object.entries(selections).map(([userId, selectionData]) => {
        const position = getSelectionPosition(selectionData.selection);
        
        return (
          <div
            key={userId}
            className="absolute pointer-events-none z-5"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
            }}
          >
            {/* Selection highlight */}
            <div className="w-full h-full bg-yellow-300 opacity-30"></div>
            
            {/* User label */}
            <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
              {selectionData.userFullname} selecting
            </div>
          </div>
        );
      })}
    </>
  );
};

export default SelectionHighlight;
