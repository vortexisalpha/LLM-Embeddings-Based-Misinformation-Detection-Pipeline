import React, { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, Node } from 'reactflow';
import { FiAlertTriangle } from 'react-icons/fi';

export type TurboNodeData = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  severity?: number;
  truthiness?: number;
};

export default memo(({ data }: NodeProps<Node<TurboNodeData>>) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 80 });

  useEffect(() => {
    if (textRef.current) {
      const titleLength = data.title.length;
      const subtitleLength = data.subtitle?.length || 0;
      
      // Calculate width based on text length
      const estimatedWidth = Math.max(
        Math.min(titleLength * 8 + 60, 400), // Max 400px
        180 // Min 180px
      );
      
      // Calculate height based on text content
      const estimatedHeight = Math.max(
        subtitleLength > 0 ? 90 : 70, // Taller if has subtitle
        80 // Min height
      );
      
      setDimensions({ width: estimatedWidth, height: estimatedHeight });
    }
  }, [data.title, data.subtitle]);

  return (
    <>
      <div className="cloud gradient">
        <div>
          {data.icon || <FiAlertTriangle />}
        </div>
      </div>
      <div 
        className="wrapper gradient"
        style={{ 
          minWidth: `${dimensions.width}px`,
          minHeight: `${dimensions.height}px`
        }}
      >
        <div className="inner" ref={textRef}>
          <div className="body">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title" style={{ 
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.3'
              }}>
                {data.title}
              </div>
              {data.subtitle && (
                <div className="subtitle" style={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  marginTop: '4px'
                }}>
                  {data.subtitle}
                </div>
              )}
            </div>
          </div>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </>
  );
});

