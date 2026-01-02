import React, { useState } from 'react';
import { Plus, Play, Download, Settings, Trash2, Maximize2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const Dock = ({ onAddClass, onTrain, onExport, onReset, isTraining }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const dockItems = [
        {
            icon: <Plus size={24} />,
            label: 'Add Class',
            action: onAddClass,
            color: '#ff3131'
        },
        {
            icon: <Play size={24} />,
            label: isTraining ? 'Training...' : 'Train Model',
            action: onTrain,
            color: '#10b981'
        },
        {
            icon: <Download size={24} />,
            label: 'Export Model',
            action: onExport,
            color: '#3b82f6'
        },
        {
            icon: <RotateCcw size={24} />,
            label: 'Reset',
            action: onReset,
            color: '#f59e0b'
        }
    ];

    return (
        <div className="dock-container">
            <div className="dock-glass">
                {dockItems.map((item, index) => (
                    <motion.button
                        key={index}
                        className="dock-item"
                        onClick={item.action}
                        onHoverStart={() => setHoveredIndex(index)}
                        onHoverEnd={() => setHoveredIndex(null)}
                        whileHover={{ scale: 1.2, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ color: item.color }}
                    >
                        <div className="dock-icon-wrapper">
                            {item.icon}
                        </div>
                        {hoveredIndex === index && (
                            <motion.div
                                className="dock-tooltip"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: -45 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                {item.label}
                            </motion.div>
                        )}
                        {hoveredIndex === index && (
                            <motion.div
                                className="dock-dot"
                                layoutId="dock-dot"
                            />
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default Dock;
