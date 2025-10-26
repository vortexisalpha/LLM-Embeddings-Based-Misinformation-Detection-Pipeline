import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, Node, Edge, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { forceSimulation, forceManyBody, forceLink, forceCollide, forceX, forceY } from 'd3-force';
import { useNavigate } from 'react-router-dom';
import TurboNode from './TurboNode';
import TurboEdge from './TurboEdge';
import BookIcon from './BookIcon';
import './App.css';

const severityDict: { [key: number]: string } = {
  1: "#cc8f00", // Darker yellow-orange
  2: "#cc6e00", // Darker orange
  3: "#b3540d", // Darker reddish-orange
  4: "#992e0d", // Darker red
  5: "#ae1e0f"  // Brighter red (original #7a1509 lightened by 20%)
};

interface FlowComponentProps {
  data: {
    nodes: number[];
    names: string[];
    severities: number[];
    truthiness: number[];
    edges: number[][];
  };
  title: {
    header: string;
    videoUrl: string;
  };
}

const nodeTypes = {
  turbo: TurboNode,
};

const edgeTypes = {
  turbo: TurboEdge,
};

const defaultEdgeOptions = {
  type: 'turbo',
  markerEnd: 'edge-circle',
};

const createNodes = (jsonData: FlowComponentProps['data']): Node[] => {
  // Handle empty or invalid data
  if (!jsonData || !jsonData.nodes || !Array.isArray(jsonData.nodes)) {
    return [];
  }
  
  const nodes = jsonData.nodes.map((nodeId, index) => {
    const truthiness = jsonData.truthiness?.[index] || 0;
    const severity = jsonData.severities?.[index] || 1;
    const name = jsonData.names?.[index] || 'Unknown';
    
    // Don't truncate - let the adaptive node handle sizing
    const title = name;
    const subtitle = `Truth: ${(truthiness * 100).toFixed(0)}% | Severity: ${severity.toFixed(1)}/5`;
    
    return {
      id: nodeId.toString(),
      type: 'turbo',
      position: { x: 0, y: 0 },
      data: {
        icon: <BookIcon />,
        title: title,
        subtitle: subtitle,
        severity: severity,
        truthiness: truthiness
      }
    };
  });

  const links = jsonData.edges.map(([source, target]) => ({
    source: source.toString(),
    target: target.toString()
  }));

  forceSimulation(nodes as any)
    .force('charge', forceManyBody().strength(-1200))
    .force('link', forceLink(links).id(d => (d as any).id).distance(300))
    .force('collide', forceCollide().radius(100).strength(1))
    .force('x', forceX().strength(0.02))
    .force('y', forceY().strength(0.02))
    .stop()
    .tick(400);

  return nodes.map(node => ({
    ...node,
    position: { x: node.x || 0, y: node.y || 0 } // IGNORE THIS ERROR ITS GOOD
  }));
};

const createEdges = (jsonData: FlowComponentProps['data']): Edge[] => {
  // Handle empty or invalid data
  if (!jsonData || !jsonData.edges || !Array.isArray(jsonData.edges)) {
    return [];
  }
  
  return jsonData.edges.map(([source, target], index) => ({
    id: `edge-${source}-${target}-${index}`,
    source: source.toString(),
    target: target.toString(),
    type: 'turbo',
    markerEnd: 'edge-circle'
  }));
};

export default function FlowComponent({ 
  data, 
  title
}: FlowComponentProps) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    if (data) {
      setNodes(createNodes(data));
      setEdges(createEdges(data));
    }
  }, [data]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    navigate(`/misinformation/${node.id}`);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#1a1a1a',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        borderBottom: '1px solid #404040'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: '1.5rem',
          color: 'white',
          cursor: 'pointer',
          textDecoration: 'underline'
        }} onClick={() => window.open(title.videoUrl, '_blank')}>
          {title.header}
        </h1>
        
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: '#404040',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.3s ease'
            }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            Analysis Info
          </button>
          
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              background: '#2a2a2a',
              border: '1px solid #404040',
              borderRadius: '4px',
              padding: '1rem',
              minWidth: '250px',
              marginTop: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <p style={{ 
                color: 'white', 
                margin: '0 0 1rem 0',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                This visualization shows the network of claims and their relationships.
                Node sizes represent severity levels, and connections show conceptual links.
              </p>
              <p style={{
                color: '#ccc',
                margin: 0,
                fontSize: '0.8rem'
              }}>
                Data updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <ReactFlow 
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        fitView
        style={{
          paddingTop: '80px', // Adjusted for fixed header
          paddingBottom: '20px'
        }}
        onNodesChange={onNodesChange}
        nodesDraggable={true}
      >
        <Background 
         color="#303030" gap={44} size={4} 
        />
        <Controls 
          style={{
            bottom: 'auto',
            top: '100px',
            right: '20px',
            left: 'auto'
          }}
        />
        <svg>
          <defs>
            <linearGradient id="edge-gradient">
              <stop offset="0%" stopColor="#ae53ba" />
              <stop offset="100%" stopColor="#2a8af6" />
            </linearGradient>
            <marker
              id="edge-circle"
              viewBox="-5 -5 10 10"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
} 