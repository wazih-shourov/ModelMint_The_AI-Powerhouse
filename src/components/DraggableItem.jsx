import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';

const DraggableItem = ({
    children,
    onDrag,
    style,
    id,
    setRef,
    scale,
    onPositionChange,
    onRemoteMove
}) => {
    const nodeRef = useRef(null);
    const [remoteUser, setRemoteUser] = useState(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Update external ref if provided
    useEffect(() => {
        if (setRef && nodeRef.current) {
            setRef(nodeRef.current);
        }
    }, [setRef]);

    // Listen for remote node movements
    useEffect(() => {
        const handleRemoteMove = (event) => {
            if (event.detail.nodeId === id) {
                setPosition(event.detail.position);
                setRemoteUser(event.detail.username);

                // Clear remote user indicator after 2 seconds
                setTimeout(() => setRemoteUser(null), 2000);

                // Notify parent if callback provided
                if (onRemoteMove) {
                    onRemoteMove(event.detail);
                }
            }
        };

        window.addEventListener('realtime-node-move', handleRemoteMove);
        return () => window.removeEventListener('realtime-node-move', handleRemoteMove);
    }, [id, onRemoteMove]);

    const handleDrag = (e, data) => {
        const newPosition = { x: data.x, y: data.y };
        setPosition(newPosition);

        // Call original onDrag
        if (onDrag) onDrag(e, data);

        // Broadcast position change
        if (onPositionChange) {
            onPositionChange(id, newPosition);
        }
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            onDrag={handleDrag}
            handle=".card-header"
            scale={scale}
            position={position}
        >
            <div ref={nodeRef} style={{
                ...style,
                outline: remoteUser ? '2px solid #3b82f6' : 'none',
                boxShadow: remoteUser ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : style?.boxShadow
            }}>
                {remoteUser && (
                    <div style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '0',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 1000
                    }}>
                        {remoteUser} is moving this
                    </div>
                )}
                {children}
            </div>
        </Draggable>
    );
};

export default DraggableItem;
