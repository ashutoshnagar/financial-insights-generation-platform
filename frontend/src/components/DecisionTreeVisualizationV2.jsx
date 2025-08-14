import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Backdrop,
  ToggleButton,
  ToggleButtonGroup,
  Paper
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  GetApp as DownloadIcon,
  OpenWith as DragIcon,
  FitScreen as FitIcon
} from '@mui/icons-material';
import { formatROIChange, snakeToTitle, formatIndianCurrency } from '../utils/helpers';

const DecisionTreeVisualizationV2 = ({ treeData, analysisType, fullScreen, onFullScreenToggle }) => {
  const [zoom, setZoom] = useState(0.8);
  const [translateX, setTranslateX] = useState(100);
  const [translateY, setTranslateY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Enhanced spacing configuration
  const nodeConfig = {
    width: 280,
    height: 90,
    horizontalSpacing: 400, // Increased from 350
    verticalSpacing: 150,   // Increased from 120
    minVerticalGap: 20      // Minimum gap between nodes
  };

  // Transform tree data with better positioning
  const createTreeData = () => {
    if (!treeData || !Array.isArray(treeData) || treeData.length === 0) return null;
    
    const rootNode = treeData[0];
    
    // Calculate optimal positions to avoid overlap
    const calculateNodePositions = (node, x, y, level = 0, parentY = null) => {
      const children = node.children || [];
      const expandedChildren = expandedNodes.has(node.nodeId || 'root') ? children : [];
      
      // Calculate total height needed for all children
      const childrenHeight = expandedChildren.length > 0 
        ? (expandedChildren.length - 1) * nodeConfig.verticalSpacing + nodeConfig.height
        : 0;
      
      // Position children centered around parent
      const startY = y - childrenHeight / 2;
      
      const positionedChildren = expandedChildren.map((child, index) => {
        const childY = startY + (index * nodeConfig.verticalSpacing) + nodeConfig.height / 2;
        return calculateNodePositions(
          child,
          x + nodeConfig.horizontalSpacing,
          childY,
          level + 1,
          y
        );
      });
      
      return {
        ...node,
        x,
        y,
        level,
        children: positionedChildren
      };
    };
    
    const buildNode = (node, isRoot = false, nodeId = 'root', x = 200, y = 300, level = 0) => {
      const roiBps = node.metrics?.roiChangeBps || 0;
      const roiPercent = roiBps / 100;
      const amount = node.metrics?.currentAmount || node.metrics?.previousAmount || 0;
      
      const nodeData = {
        name: isRoot ? "Portfolio ROI" : `${snakeToTitle(node.factor)}: ${node.value}`,
        isRoot,
        nodeId,
        roiChange: roiPercent,
        roiChangeBps: roiBps,
        loanAmount: amount,
        previousAmount: node.metrics?.previousAmount || 0,
        hasChildren: node.children && node.children.length > 0,
        originalData: node,
        x,
        y,
        level,
        children: []
      };
      
      if (node.children && expandedNodes.has(nodeId)) {
        // Enhanced spacing calculation
        const childCount = node.children.length;
        const totalHeight = childCount * nodeConfig.verticalSpacing;
        const startY = y - totalHeight / 2 + nodeConfig.verticalSpacing / 2;
        
        nodeData.children = node.children.map((child, index) => {
          const childX = x + nodeConfig.horizontalSpacing;
          const childY = startY + (index * nodeConfig.verticalSpacing);
          return buildNode(
            child, 
            false, 
            `${nodeId}-${index}`, 
            childX, 
            childY,
            level + 1
          );
        });
      }
      
      return nodeData;
    };
    
    return buildNode(rootNode, true, 'root', 200, 400);
  };

  const treeData_custom = createTreeData();

  // Handle node click to expand/collapse
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

  // Enhanced custom node component with impact decomposition
  const CustomTreeNode = ({ nodeData }) => {
    const roiChange = nodeData.roiChange || 0;
    const loanAmount = nodeData.loanAmount || 0;
    const hasChildren = nodeData.hasChildren || false;
    const isExpanded = expandedNodes.has(nodeData.nodeId);
    
    // Impact decomposition metrics
    const metrics = {
      yieldImpact: nodeData.originalData?.metrics?.yieldImpactBps || 0,
      distributionImpact: nodeData.originalData?.metrics?.distributionImpactBps || 0,
      totalImpact: nodeData.originalData?.metrics?.totalImpactBps || 0,
      percentOnParent: nodeData.originalData?.metrics?.percentOnParent || 0,
      percentOnRoot: nodeData.originalData?.metrics?.percentOnRoot || 0
    };
    
    // Color for total impact
    const impactValue = metrics.totalImpact;
    const impactColor = impactValue > 0 ? '#16a34a' : impactValue < 0 ? '#dc2626' : '#6b7280';
    const impactSign = impactValue > 0 ? '+' : impactValue < 0 ? '' : '';
    
    return (
      <g transform={`translate(${nodeData.x}, ${nodeData.y})`}>
        {/* Enhanced node background with shadow effect */}
        <defs>
          <filter id={`shadow-${nodeData.nodeId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        <rect
          x={-nodeConfig.width / 2}
          y={-nodeConfig.height / 2}
          width={nodeConfig.width}
          height={nodeConfig.height}
          fill={nodeData.isRoot ? '#f0f9ff' : 'white'}
          stroke={nodeData.isRoot ? '#0ea5e9' : '#d1d5db'}
          strokeWidth="2"
          rx="8"
          filter={`url(#shadow-${nodeData.nodeId})`}
          onClick={() => handleNodeClick(nodeData)}
          style={{ 
            cursor: hasChildren ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (hasChildren) {
              e.target.setAttribute('stroke-width', '3');
            }
          }}
          onMouseLeave={(e) => {
            e.target.setAttribute('stroke-width', '2');
          }}
        />
        
        {/* Node title */}
        <text
          x="0"
          y="-22"
          textAnchor="middle"
          style={{
            fontSize: '14px',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
            fontWeight: '600',
            fill: '#1e293b'
          }}
        >
          {nodeData.name}
        </text>
        
        {/* Impact decomposition layout */}
        
        {/* Total Impact (no label, just value with color) */}
        <text
          x="0"
          y="0"
          textAnchor="middle"
          style={{
            fontSize: '16px',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
            fontWeight: '700',
            fill: impactColor
          }}
        >
          {`${impactSign}${metrics.totalImpact.toFixed(1)} bps`}
        </text>
        
        {/* Yield and Distribution Impact: Y: XX | D: XX */}
        <g transform="translate(0, 18)">
          {/* Y: label and value */}
          <text
            x="-45"
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontWeight: '500'
            }}
          >
            <tspan fill="#64748b">Y:</tspan>
            <tspan fill="#3b82f6" dx="3">
              {metrics.yieldImpact >= 0 ? '+' : ''}{metrics.yieldImpact.toFixed(1)}
            </tspan>
          </text>
          
          {/* Separator */}
          <text
            x="0"
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fill: '#cbd5e1'
            }}
          >
            |
          </text>
          
          {/* D: label and value */}
          <text
            x="45"
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontWeight: '500'
            }}
          >
            <tspan fill="#64748b">D:</tspan>
            <tspan fill="#f97316" dx="3">
              {metrics.distributionImpact >= 0 ? '+' : ''}{metrics.distributionImpact.toFixed(1)}
            </tspan>
          </text>
        </g>
        
        {/* Parent and Root percentages: P: XX% | R: XX% (skip for root node) */}
        {!nodeData.isRoot ? (
          <g transform="translate(0, 34)">
            {/* P: label and value */}
            <text
              x="-45"
              textAnchor="middle"
              style={{
                fontSize: '11px',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fill: '#64748b'
              }}
            >
              P: {metrics.percentOnParent.toFixed(2)}%
            </text>
            
            {/* Separator */}
            <text
              x="0"
              textAnchor="middle"
              style={{
                fontSize: '11px',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fill: '#cbd5e1'
              }}
            >
              |
            </text>
            
            {/* R: label and value */}
            <text
              x="45"
              textAnchor="middle"
              style={{
                fontSize: '11px',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fill: '#64748b'
              }}
            >
              R: {metrics.percentOnRoot.toFixed(2)}%
            </text>
          </g>
        ) : (
          /* For root node, show loan amount instead */
          <text
            x="0"
            y="34"
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontWeight: '400',
              fill: '#64748b'
            }}
          >
            {formatIndianCurrency(loanAmount)}
          </text>
        )}
        
        {/* Enhanced expand/collapse indicator */}
        {hasChildren && (
          <g transform={`translate(${nodeConfig.width / 2 - 20}, ${-nodeConfig.height / 2 + 20})`}>
            <circle
              r="10"
              fill={isExpanded ? '#e0f2fe' : '#f1f5f9'}
              stroke={isExpanded ? '#0284c7' : '#94a3b8'}
              strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              style={{
                fontSize: '14px',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fontWeight: '600',
                fill: isExpanded ? '#0284c7' : '#64748b',
                pointerEvents: 'none'
              }}
            >
              {isExpanded ? '−' : '+'}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Enhanced connection lines with curves
  const renderConnections = (node) => {
    const connections = [];
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        const startX = node.x + nodeConfig.width / 2;
        const startY = node.y;
        const endX = child.x - nodeConfig.width / 2;
        const endY = child.y;
        const midX = (startX + endX) / 2;
        
        // Create curved path
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
        
        connections.push(
          <path
            key={`path-${node.nodeId}-${child.nodeId}`}
            d={path}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeDasharray={child.hasChildren && !expandedNodes.has(child.nodeId) ? "5,5" : "0"}
            opacity="0.6"
          />
        );
        
        // Recursively render child connections
        connections.push(...renderConnections(child));
      });
    }
    
    return connections;
  };

  // Render tree with connections first, then nodes
  const renderTree = (node) => {
    const nodes = [];
    
    // Render node
    nodes.push(<CustomTreeNode key={node.nodeId} nodeData={node} />);
    
    // Render children
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        nodes.push(...renderTree(child));
      });
    }
    
    return nodes;
  };

  // Pan and drag handlers
  const handleMouseDown = (e) => {
    if (e.shiftKey || e.button === 1) { // Shift+click or middle mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - translateX,
        y: e.clientY - translateY
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTranslateX(e.clientX - dragStart.x);
      setTranslateY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
    }
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - translateX,
        y: touch.clientY - translateY
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setTranslateX(touch.clientX - dragStart.x);
      setTranslateY(touch.clientY - dragStart.y);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Control handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.1));
  const handleReset = () => {
    setZoom(0.8);
    setTranslateX(100);
    setTranslateY(50);
  };
  
  const handleFitToScreen = () => {
    if (!containerRef.current || !treeData_custom) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const treeWidth = 1200; // Approximate tree width
    const treeHeight = 800; // Approximate tree height
    
    const scaleX = container.width / treeWidth;
    const scaleY = container.height / treeHeight;
    const scale = Math.min(scaleX, scaleY, 1) * 0.8;
    
    setZoom(scale);
    setTranslateX(container.width / 2 - treeWidth * scale / 2);
    setTranslateY(container.height / 2 - treeHeight * scale / 2);
  };

  const handleDownload = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `roi-analysis-tree-enhanced-${analysisType}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  // Initialize expanded nodes on mount
  useEffect(() => {
    setExpandedNodes(new Set(['root']));
  }, [treeData]);

  // Get container dimensions
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: fullScreen ? window.innerWidth : Math.max(rect.width, 800),
          height: fullScreen ? window.innerHeight - 80 : Math.max(rect.height, 400)
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [fullScreen]);

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

  const { width, height } = dimensions;

  // Full-screen mode
  if (fullScreen) {
    return (
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
          bottom: 0
        }}
      >
        <Box sx={{ 
          width: '100vw', 
          height: '100vh', 
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden'
        }}>
          {/* Full-screen controls */}
          <Paper sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 10000, 
            display: 'flex', 
            gap: 1,
            p: 1,
            borderRadius: 2
          }}>
            <Tooltip title="Exit Full Screen">
              <IconButton onClick={onFullScreenToggle} size="small" color="primary">
                <FullscreenExitIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom In (Ctrl+Scroll)">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out (Ctrl+Scroll)">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit to Screen">
              <IconButton onClick={handleFitToScreen} size="small">
                <FitIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset View">
              <IconButton onClick={handleReset} size="small">
                <CenterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Instructions */}
          <Paper sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.95)'
          }}>
            <Typography variant="caption" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <span><DragIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> Shift+Drag to pan</span>
              <span>• Ctrl+Scroll to zoom</span>
              <span>• Click nodes to expand/collapse</span>
            </Typography>
          </Paper>

          {/* SVG Tree */}
          <svg
            ref={svgRef}
            width="100vw"
            height="100vh"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              cursor: isDragging ? 'grabbing' : (event?.shiftKey ? 'grab' : 'default')
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <g transform={`translate(${translateX}, ${translateY}) scale(${zoom})`}>
              {/* Render connections first (behind nodes) */}
              {treeData_custom && renderConnections(treeData_custom)}
              {/* Then render nodes */}
              {treeData_custom && renderTree(treeData_custom)}
            </g>
          </svg>
        </Box>
      </Backdrop>
    );
  }

  // Regular mode
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: 'calc(100vh - 300px)', position: 'relative', overflow: 'hidden' }}>
      {/* Controls */}
      <Paper sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000, 
        display: 'flex', 
        gap: 0.5,
        p: 0.5
      }}>
        <Tooltip title="Full Screen">
          <IconButton onClick={onFullScreenToggle} size="small" color="primary">
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In (Ctrl+Scroll)">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out (Ctrl+Scroll)">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit to Screen">
          <IconButton onClick={handleFitToScreen} size="small">
            <FitIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View">
          <IconButton onClick={handleReset} size="small">
            <CenterIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton onClick={handleDownload} size="small">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Legend and Instructions */}
      <Paper sx={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        p: 1,
        px: 2,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.95)'
      }}>
        <Typography variant="caption" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <span><DragIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> Shift+Drag to pan</span>
          <span>• Ctrl+Scroll to zoom</span>
          <span>• Click nodes to expand/collapse</span>
        </Typography>
      </Paper>

      {/* SVG Tree */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <g transform={`translate(${translateX}, ${translateY}) scale(${zoom})`}>
          {/* Render connections first (behind nodes) */}
          {treeData_custom && renderConnections(treeData_custom)}
          {/* Then render nodes */}
          {treeData_custom && renderTree(treeData_custom)}
        </g>
      </svg>
    </Box>
  );
};

export default DecisionTreeVisualizationV2;
