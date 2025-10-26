import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, Node, Edge, applyNodeChanges, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { forceSimulation, forceManyBody, forceLink, forceCollide, forceX, forceY } from 'd3-force';
import { useNavigate } from 'react-router-dom';
import TurboNode from './TurboNode';
import TurboEdge from './TurboEdge';
import QuoteIcon from './QuoteIcon';


const severityDict: { [key: number]: string } = {
  1: "#ffb700",
  2: "#ffa325",
  3: "#f77d19",
  4: "#f74919",
  5: "#ae1e0f"
};

interface FlowComponentProps {
  data: {
    nodes: number[];
    text: string[];
    dates: number[];
    edges: number[][];
  };
}

// Add node types configuration
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
    const text = jsonData.text?.[index] || 'Unknown';
    const date = jsonData.dates?.[index];
    
    // Format timestamp - handle both string format "30:41" and number format
    let subtitle = 'No timestamp';
    if (date !== undefined && date !== null) {
      if (typeof date === 'string' && date.length > 0) {
        // Backend sends string format like "30:41"
        subtitle = `Timestamp: ${date}`;
      } else if (typeof date === 'number' && !isNaN(date)) {
        // Fallback: handle numeric format (seconds)
        const minutes = Math.floor(date / 60);
        const seconds = Math.floor(date % 60);
        subtitle = `Timestamp: ${minutes}:${String(seconds).padStart(2, '0')}`;
      }
    }
    
    // Don't truncate - let the adaptive node handle sizing
    const title = text;
    
    return {
      id: nodeId.toString(),
      type: 'turbo',
      position: { x: 0, y: 0 },
      data: {
        icon: <QuoteIcon />,
        title: title,
        subtitle: subtitle
      }
    };
  });

  const links = (jsonData.edges || []).map(([source, target]) => ({
    source: source.toString(),
    target: target.toString()
  }));

  // Create force simulation
  forceSimulation(nodes as any)
    .force('charge', forceManyBody().strength(-1500)) //this is the level of repulsion between nodes
    .force('link', forceLink(links).id(d => (d as any).id).distance(300))
    .force('collide', forceCollide().radius(100).strength(1)) //this makes it so that each node acts as a body of mass to prevent intersections
    .force('x', forceX().strength(0.02))
    .force('y', forceY().strength(0.02))
    .stop()
    .tick(400);

  return nodes.map(node => ({
    ...node,
    position: { x: node.x || 0, y: node.y || 0 }
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

export default function NestedFlowComponent({ data }: FlowComponentProps) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);

  // Initialize nodes and fit view
  useEffect(() => {
    const initializedNodes = createNodes(data);
    setNodes(initializedNodes);
  }, [data]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    navigate(`subnode/${node.id}`);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const initialEdges = createEdges(data);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <ReactFlowProvider>
        <ReactFlow 
          nodes={nodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onInit={(instance) => instance.fitView()}
          fitView
          nodesDraggable={true}
        >
          <Background color="#404040" gap={44} size={4} />
          <Controls />
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
      </ReactFlowProvider>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
} 