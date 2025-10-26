import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

const scaleTextToFit = (element: HTMLElement) => {
  // For adaptive sizing, we keep font size consistent
  // The node will grow to fit the content
  const container = element.parentElement;
  if (!container) return;

  // Set a reasonable base font size
  const textLength = element.textContent?.length || 0;
  let fontSize = 14;
  
  if (textLength < 30) {
    fontSize = 16;
  } else if (textLength < 60) {
    fontSize = 14;
  } else if (textLength < 100) {
    fontSize = 13;
  } else {
    fontSize = 12;
  }
  
  element.style.fontSize = `${fontSize}px`;
};

export default memo(({ data }: NodeProps) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        textRef.current!.style.fontSize = ''; // Reset before recalculating
        scaleTextToFit(textRef.current!);
      });
      
      resizeObserver.observe(textRef.current);
      scaleTextToFit(textRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, [data.label]);

  return (
    <div className="node-glow-container">
      <div className="node-glow"></div>
      <div className="node-content" style={{ 
        ...data.style,
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Roboto, sans-serif',
        padding: '16px 20px',
        boxSizing: 'border-box',
        width: 'auto',
        height: 'auto'
      }}>
        <div 
          ref={textRef}
          className="node-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4',
            transition: 'font-size 0.3s ease'
          }}
        >
          {data.label}
        </div>
        
        <Handle
          type="source"
          position={Position.Top}
          id="center"
          style={{ 
            background: 'transparent',
            width: 10,
            height: 10,
            border: '2px solid #fff',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="center"
          style={{ 
            background: 'transparent',
            width: 10,
            height: 10,
            border: '2px solid #fff',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
          }}
        />
      </div>
    </div>
  );
});

