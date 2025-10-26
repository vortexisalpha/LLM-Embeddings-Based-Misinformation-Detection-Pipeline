import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, Node, Edge, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { forceSimulation, forceManyBody, forceLink, forceCollide, forceX, forceY } from 'd3-force';
import { useNavigate } from 'react-router-dom';
import TurboNode from './TurboNode';
import TurboEdge from './TurboEdge';
import ArticleIcon from './ArticleIcon';


const severityDict: { [key: number]: string } = {
  1: "#ffb700",
  2: "#ffa325",
  3: "#f77d19",
  4: "#f74919",
  5: "#ae1e0f"
};

interface DoubleNestedFlowComponentProps {
  data: {
    nodes: number[];
    nodename: string[];
    severities: number[];
    urls: string[];
    edge: number[][];
  };
}

// Add node types configuration
const nodeTypes = {
  turbo: TurboNode,
};

// Add edge types configuration
const edgeTypes = {
  turbo: TurboEdge,
};

const defaultEdgeOptions = {
  type: 'turbo',
  markerEnd: 'edge-circle',
};

const createNodes = (jsonData: DoubleNestedFlowComponentProps['data']): Node[] => {
  // Handle empty or invalid data
  if (!jsonData || !jsonData.nodes || !Array.isArray(jsonData.nodes)) {
    return [];
  }
  
  const nodes = jsonData.nodes.map((subnodeId, index) => {
    const nodename = jsonData.nodename?.[index] || 'Unknown';
    const severity = jsonData.severities?.[index] || 1;
    const url = jsonData.urls?.[index] || '';
    
    // Extract domain from URL for subtitle
    let domain = 'Click to view';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch (e) {
      // If URL parsing fails, use default
    }
    
    // Don't truncate - let the adaptive node handle sizing
    const title = nodename;
    const subtitle = `${domain} | Severity: ${severity.toFixed(1)}/5`;
    
    return {
      id: subnodeId.toString(),
      type: 'turbo',
      position: { x: 0, y: 0 },
      data: {
        icon: <ArticleIcon />,
        title: title,
        subtitle: subtitle,
        severity: severity
      }
    };
  });

  const links = (jsonData.edge || []).map(([source, target]) => ({
    source: source.toString(),
    target: target.toString()
  }));

  // Create force simulation
  forceSimulation(nodes as any)
    .force('charge', forceManyBody().strength(-3000)) //this is the level of repulsion between nodes
    .force('link', forceLink(links).id(d => (d as any).id).distance(180))
    .force('collide', forceCollide().radius(80).strength(1)) //this makes it so that each node acts as a body of mass to prevent intersections
    .force('x', forceX().strength(0.02))
    .force('y', forceY().strength(0.02))
    .stop()
    .tick(400);

  return nodes.map(node => ({
    ...node,
    position: { x: node.x || 0, y: node.y || 0 }
  }));
};

const createEdges = (jsonData: DoubleNestedFlowComponentProps['data']): Edge[] => {
  // Handle empty or invalid data
  if (!jsonData || !jsonData.edge || !Array.isArray(jsonData.edge)) {
    return [];
  }
  
  return jsonData.edge.map(([source, target], index) => ({
    id: `edge-${source}-${target}-${index}`,
    source: source.toString(),
    target: target.toString(),
    type: 'turbo',
    markerEnd: 'edge-circle'
  }));
};

export default function DoubleNestedFlowComponent({ data }: DoubleNestedFlowComponentProps) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
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
    // Get URL from node data using the node index
    const nodeIndex = data.nodes.indexOf(Number(node.id));
    if (nodeIndex !== -1 && data.urls?.[nodeIndex]) {
      window.open(data.urls[nodeIndex], '_blank');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <ReactFlow 
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        nodesDraggable={true}
        onNodeClick={handleNodeClick}
        fitView
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
    </div>
  );
} 