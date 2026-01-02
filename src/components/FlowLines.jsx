import React, { useEffect, useRef, useState } from 'react';

const FlowLines = ({ classNodesRef, trainingNodeRef, previewNodeRef, monitoringNodeRef, classes, dragVersion, zoom = 1 }) => {
    const svgRef = useRef(null);
    const [paths, setPaths] = useState([]);

    const updatePaths = () => {
        if (!classNodesRef.current || !trainingNodeRef.current || !previewNodeRef.current || !svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const trainingRect = trainingNodeRef.current.getBoundingClientRect();
        const previewRect = previewNodeRef.current.getBoundingClientRect();

        const newPaths = [];

        // Helper to calculate relative coordinates adjusted for zoom
        const getRelX = (val) => (val - svgRect.left) / zoom;
        const getRelY = (val) => (val - svgRect.top) / zoom;

        // Calculate Training Node Input Point (Left Center)
        const trainingInputX = getRelX(trainingRect.left);
        const trainingInputY = getRelY(trainingRect.top + trainingRect.height / 2);

        // Calculate Training Node Output Point (Right Center)
        const trainingOutputX = getRelX(trainingRect.right);
        const trainingOutputY = getRelY(trainingRect.top + trainingRect.height / 2);

        // Calculate Training Node Bottom Point (for monitoring connection)
        const trainingBottomX = getRelX(trainingRect.left + trainingRect.width / 2);
        const trainingBottomY = getRelY(trainingRect.bottom);

        // Calculate Preview Node Input Point (Left Center)
        const previewInputX = getRelX(previewRect.left);
        const previewInputY = getRelY(previewRect.top + previewRect.height / 2);

        // 1. Draw lines from each Class Node to Training Node
        classes.forEach((c) => {
            const nodeEl = classNodesRef.current[c.id];
            if (nodeEl) {
                const rect = nodeEl.getBoundingClientRect();
                const startX = getRelX(rect.right);
                const startY = getRelY(rect.top + rect.height / 2);

                // Bezier Curve
                // Control points: halfway between start and end
                const cp1x = startX + (trainingInputX - startX) / 2;
                const cp1y = startY;
                const cp2x = trainingInputX - (trainingInputX - startX) / 2;
                const cp2y = trainingInputY;

                newPaths.push({
                    d: `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${trainingInputX} ${trainingInputY}`,
                    color: '#94a3b8', // Darker gray for better visibility
                    activeColor: '#ff3131' // Active color (could be based on state)
                });
            }
        });

        // 2. Draw line from Training Node to Preview Node
        const cp3x = trainingOutputX + (previewInputX - trainingOutputX) / 2;
        const cp3y = trainingOutputY;
        const cp4x = previewInputX - (previewInputX - trainingOutputX) / 2;
        const cp4y = previewInputY;

        newPaths.push({
            d: `M ${trainingOutputX} ${trainingOutputY} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${previewInputX} ${previewInputY}`,
            color: '#94a3b8',
            isMain: true
        });

        // 3. Draw line from Training Node to Monitoring Node (if exists)
        if (monitoringNodeRef && monitoringNodeRef.current) {
            const monitoringRect = monitoringNodeRef.current.getBoundingClientRect();
            const monitoringTopX = getRelX(monitoringRect.left + monitoringRect.width / 2);
            const monitoringTopY = getRelY(monitoringRect.top);

            // Curved line from training bottom to monitoring top (like other connections)
            const cp5x = trainingBottomX;
            const cp5y = trainingBottomY + (monitoringTopY - trainingBottomY) / 2;
            const cp6x = monitoringTopX;
            const cp6y = trainingBottomY + (monitoringTopY - trainingBottomY) / 2;

            newPaths.push({
                d: `M ${trainingBottomX} ${trainingBottomY} C ${cp5x} ${cp5y}, ${cp6x} ${cp6y}, ${monitoringTopX} ${monitoringTopY}`,
                color: '#94a3b8', // Same gray as other lines
                isMonitoring: true
            });
        }

        setPaths(newPaths);
    };

    useEffect(() => {
        updatePaths();
        window.addEventListener('resize', updatePaths);
        // Also update on DOM mutations if possible, or just interval check for simplicity
        const interval = setInterval(updatePaths, 100); // Faster update for smoother dragging
        return () => {
            window.removeEventListener('resize', updatePaths);
            clearInterval(interval);
        };
    }, [classes, classNodesRef, trainingNodeRef, previewNodeRef, monitoringNodeRef, dragVersion, zoom]);

    return (
        <svg
            ref={svgRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'visible' // Allow lines to be drawn outside the SVG bounds
            }}
        >
            {paths.map((p, i) => (
                <path
                    key={i}
                    d={p.d}
                    stroke={p.color}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={p.isMain ? "0" : "5,5"} // Dashed for inputs, solid for output
                />
            ))}
        </svg>
    );
};

export default FlowLines;
