import React, { useState, useRef, useEffect } from 'react';
import { hierarchy } from '@visx/hierarchy';
import { Tree } from '@visx/hierarchy';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Backdrop
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { formatROIChange, snakeToTitle, formatNumber } from '../utils/helpers';

const DecisionTreeVisualization = ({ treeData, analysisType, fullScreen, onFullScreenToggle }) => {
  const [zoom, setZoom] = useState(1.2);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const svgRef = useRef(null);
  
  // Transform tree data to custom format - NO VISX DEPENDENCY
  const createTreeData = () => {
    if (!treeData || !Array.isArray(treeData) || treeData.length === 0) return null;
    
    const rootNode = treeData[0]; // Backend now returns proper root node structure
    
    const buildNode = (node, isRoot = false, nodeId = 'root', x = 200, y = 300) => {
      const roiBps = node.metrics?.roiChangeBps || 0;
      // Backend now properly calculates basis points (multiply by 10000), so we convert to percentage for display
      const roiPercent = roiBps / 100; // Convert basis points to percentage for display
      const amount = node.metrics?.currentAmount || node.metrics?.previousAmount || 0;
      
      const nodeData = {
        name: isRoot ? "Portfolio ROI" : `${snakeToTitle(node.factor)}: ${node.value}`,
        isRoot,
        nodeId,
        roiChange: roiPercent,
        roiChangeBps: roiBps, // Store original basis points for reference
        loanAmount: amount,
        previousAmount: node.metrics?.previousAmount || 0,
        hasChildren: node.children && node.children.length > 0,
        originalData: node,
        x,
        y,
        children: []
      };
      
      // Root node expansion handled in useEffect
      
      // Add children if this node is expanded
      if (node.children && expandedNodes.has(nodeId)) {
        const childSpacing = 120;
        const totalChildHeight = (node.children.length - 1) * childSpacing;
        const startY = y - totalChildHeight / 2;
        
        nodeData.children = node.children.map((child, index) => 
          buildNode(child, false, `${nodeId}-${index}`, x + 350, startY + (index * childSpacing))
        );
      }
      
      return nodeData;
    };
    
    return buildNode(rootNode, true, 'root');
  };

  const treeData_custom = createTreeData();

  // Handle node click to expand/collapse - CUSTOM DATA STRUCTURE
  const handleNodeClick = (nodeData) => {
    const nodeId = nodeData.nodeId;
    if (nodeData.hasChildren) {
      const newExpanded = new Set(expandedNodes);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      setExpandedNodes(newExpanded);
    }
  };

  // Custom node component - DIRECT POSITIONING
  const CustomTreeNode = ({ nodeData }) => {
    const roiChange = nodeData.roiChange || 0;
    const loanAmount = nodeData.loanAmount || 0;
    const hasChildren = nodeData.hasChildren || false;
    
    const roiColor = roiChange > 0 ? '#16a34a' : roiChange < 0 ? '#dc2626' : '#6b7280';
    const roiSign = roiChange > 0 ? '+' : roiChange < 0 ? '-' : '';
    const roiValue = `${roiSign}${Math.abs(roiChange).toFixed(2)}%`;
    
    const formatRs = (amount) => {
      if (amount >= 10000000) return `Rs ${(amount / 10000000).toFixed(1)} Cr`;
      if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(1)} L`;
      return `Rs ${amount.toFixed(0)}`;
    };
    
    // Much larger node dimensions
    const nodeWidth = 260;
    const nodeHeight = 80;
    
    return (
      <g transform={`translate(${nodeData.x}, ${nodeData.y})`}>
        {/* Node background - larger */}
        <rect
          x={-nodeWidth / 2}
          y={-nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          fill="white"
          stroke="#999"
          strokeWidth="2"
          rx="6"
          onClick={() => handleNodeClick(nodeData)}
          style={{ cursor: hasChildren ? 'pointer' : 'default' }}
        />
        
        {/* Node title - larger font */}
        <text
          x="0"
          y="-15"
          textAnchor="middle"
          className="tree-node-title"
          style={{
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fill: '#333'
          }}
        >
          {nodeData.name}
        </text>
        
        {/* ROI percentage - larger font */}
        <text
          x="0"
          y="2"
          textAnchor="middle"
          className="tree-node-roi"
          style={{
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fill: roiColor
          }}
        >
          {roiValue}
        </text>
        
        {/* Loan amount - larger font */}
        <text
          x="0"
          y="20"
          textAnchor="middle"
          className="tree-node-amount"
          style={{
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fill: '#666'
          }}
        >
          {formatRs(loanAmount)}
        </text>
        
        {/* Expand indicator - larger */}
        {hasChildren && (
          <text
            x={nodeWidth / 2 - 15}
            y={-nodeHeight / 2 + 15}
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'normal',
              fill: '#999'
            }}
          >
            {expandedNodes.has(nodeData.nodeId) ? '−' : '+'}
          </text>
        )}
      </g>
    );
  };

  // Render tree recursively
  const renderTree = (node) => {
    const elements = [<CustomTreeNode key={node.nodeId} nodeData={node} />];
    
    // Add children and their connections
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        // Add connection line from right edge of parent to left edge of child
        const nodeWidth = 260;
        const parentRightEdge = node.x + nodeWidth / 2;
        const childLeftEdge = child.x - nodeWidth / 2;
        
        elements.push(
          <line
            key={`line-${node.nodeId}-${child.nodeId}`}
            x1={parentRightEdge}
            y1={node.y}
            x2={childLeftEdge}
            y2={child.y}
            stroke="#999"
            strokeWidth="2"
          />
        );
        
        // Recursively render child
        elements.push(...renderTree(child));
      });
    }
    
    return elements;
  };

  // Custom link component
  const TreeLink = ({ link }) => {
    return (
      <LinePath
        stroke="#999"
        strokeWidth="1"
        fill="none"
        data={link}
        x={(d) => d.x}
        y={(d) => d.y}
      />
    );
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.1));
  const handleCenter = () => setZoom(0.8);

  const handleDownload = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `roi-analysis-tree-${analysisType}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (!treeData || !Array.isArray(treeData) || treeData.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          No tree data available. Run an analysis to generate decision tree visualization.
        </Typography>
      </Alert>
    );
  }

  if (!treeData_custom) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          Error processing tree data.
        </Typography>
      </Alert>
    );
  }

  // Get actual container dimensions
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: fullScreen ? window.innerWidth : Math.max(rect.width, 800),
          height: fullScreen ? window.innerHeight : Math.max(rect.height, 400)
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [fullScreen]);

  const { width, height } = dimensions;

  // Full-screen mode
  if (fullScreen) {
    return (
      <>
        <Backdrop 
          open={fullScreen} 
          sx={{ 
            color: '#fff', 
            zIndex: 9999, 
            bgcolor: '#f8fafc',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: 0
          }}
        >
          <Box sx={{ 
            width: '100vw', 
            height: '100vh', 
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'hidden',
            margin: 0,
            padding: 0
          }}>
            {/* Full-screen controls */}
            <Box sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              zIndex: 10000, 
              display: 'flex', 
              gap: 1,
              bgcolor: 'rgba(255,255,255,0.95)',
              p: 1,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <Tooltip title="Exit Full Screen">
                <IconButton onClick={onFullScreenToggle} size="small" color="primary">
                  <FullscreenExitIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom In">
                <IconButton onClick={handleZoomIn} size="small">
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton onClick={handleZoomOut} size="small">
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Center & Reset">
                <IconButton onClick={handleCenter} size="small">
                  <CenterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton onClick={handleDownload} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* SVG Tree - CUSTOM DIRECT RENDERING - Full viewport coverage */}
            <svg
              ref={svgRef}
              width="100vw"
              height="100vh"
              style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0
              }}
            >
              <g transform={`scale(${zoom})`}>
                {treeData_custom && renderTree(treeData_custom)}
              </g>
            </svg>
          </Box>
        </Backdrop>
      </>
    );
  }

  // Regular mode
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: 'calc(100vh - 300px)', position: 'relative', overflow: 'visible' }}>
      {/* Controls */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000, 
        display: 'flex', 
        gap: 0.5,
        bgcolor: 'rgba(255,255,255,0.9)',
        borderRadius: 1,
        p: 0.5
      }}>
        <Tooltip title="Full Screen">
          <IconButton onClick={onFullScreenToggle} size="small" color="primary">
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Center">
          <IconButton onClick={handleCenter} size="small">
            <CenterIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton onClick={handleDownload} size="small">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Legend */}
      <Box sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        p: 1,
        borderRadius: 1,
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="caption" fontSize="10px">+</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
            <Typography variant="caption" fontSize="10px">−</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#757575' }} />
            <Typography variant="caption" fontSize="10px">○</Typography>
          </Box>
        </Box>
      </Box>

      {/* SVG Tree - CUSTOM DIRECT RENDERING */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}
      >
        <g transform={`scale(${zoom})`}>
          {treeData_custom && renderTree(treeData_custom)}
        </g>
      </svg>
      
      {/* CSS for font consistency */}
      <style jsx>{`
        .tree-node-title,
        .tree-node-roi,
        .tree-node-amount {
          font-family: Arial, sans-serif !important;
          font-weight: normal !important;
        }
      `}</style>
    </Box>
  );
};

export default DecisionTreeVisualization;
