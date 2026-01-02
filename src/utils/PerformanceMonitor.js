/**
 * Performance Monitor Utility
 * Tracks CPU, GPU, Memory usage during training
 */

class PerformanceMonitor {
    constructor() {
        this.isMonitoring = false;
        this.metrics = [];
        this.startTime = null;
        this.intervalId = null;
        this.gpuInfo = null;

        // Initialize GPU detection
        this.detectGPU();
    }

    /**
     * Detect GPU information
     */
    detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    this.gpuInfo = {
                        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                        isActive: true
                    };
                } else {
                    this.gpuInfo = {
                        vendor: 'Unknown',
                        renderer: gl.getParameter(gl.RENDERER),
                        isActive: true
                    };
                }
            } else {
                this.gpuInfo = {
                    vendor: 'None',
                    renderer: 'CPU Only',
                    isActive: false
                };
            }
        } catch (error) {
            console.error('GPU detection error:', error);
            this.gpuInfo = {
                vendor: 'Unknown',
                renderer: 'Unknown',
                isActive: false
            };
        }
    }

    /**
     * Estimate CPU usage based on event loop lag and execution speed
     */
    estimateCPUUsage() {
        try {
            // 1. Measure Event Loop Lag (drift from expected interval)
            // We expect this to be called every 500ms
            const now = Date.now();
            const expectedTime = this.lastMeasureTime ? this.lastMeasureTime + 500 : now;
            const lag = Math.max(0, now - expectedTime);
            this.lastMeasureTime = now;

            // 2. Measure Execution Speed (Heavy Loop)
            const startMeasure = performance.now();
            let sum = 0;
            // Increase to 5M iterations for measurable load on modern CPUs
            for (let i = 0; i < 5000000; i++) {
                sum += Math.sqrt(i);
            }
            const endMeasure = performance.now();
            const executionTime = endMeasure - startMeasure;

            // Calculate score
            // Lag score: 100ms lag = 100% load
            const lagScore = Math.min(100, (lag / 100) * 100);

            // Execution score: Baseline ~10ms for 5M ops
            // If it takes 50ms, CPU is busy
            const baselineTime = 10.0;
            const executionScore = Math.min(100, (executionTime / baselineTime) * 20);

            // Combine scores (weighted)
            const cpuUsage = (lagScore * 0.6) + (executionScore * 0.4);

            // Ensure we report at least some usage if we did work
            if (executionTime > 1 && cpuUsage < 1) {
                return 1.0;
            }

            return Math.round(cpuUsage * 10) / 10;
        } catch (error) {
            console.error('CPU estimation error:', error);
            return 0;
        }
    }

    /**
     * Get memory usage
     */
    getMemoryUsage() {
        try {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
                };
            }
            return { used: 0, total: 0, limit: 0 };
        } catch (error) {
            console.error('Memory usage error:', error);
            return { used: 0, total: 0, limit: 0 };
        }
    }

    /**
     * Start monitoring
     */
    startMonitoring(callback) {
        if (this.isMonitoring) {
            console.warn('Monitoring already started');
            return;
        }

        this.isMonitoring = true;
        this.startTime = Date.now();
        this.lastMeasureTime = Date.now();
        this.metrics = [];

        // Helper to collect a single metric
        const collectMetric = () => {
            const metric = {
                timestamp: Date.now(),
                elapsedTime: Math.round((Date.now() - this.startTime) / 1000), // seconds
                cpu: this.estimateCPUUsage(),
                memory: this.getMemoryUsage(),
                gpu: {
                    active: this.gpuInfo?.isActive || false,
                    model: this.gpuInfo?.renderer || 'Unknown'
                }
            };

            this.metrics.push(metric);

            // Call callback with current metrics
            if (callback) {
                callback(metric);
            }
        };

        // Collect initial metric immediately
        collectMetric();

        // Collect metrics every 500ms (0.5 seconds) for better resolution
        this.intervalId = setInterval(collectMetric, 500);
    }

    /**
     * Stop monitoring and return summary
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.warn('Monitoring not started');
            return null;
        }

        this.isMonitoring = false;
        clearInterval(this.intervalId);

        // Collect one final metric to ensure we capture the end state
        const finalMetric = {
            timestamp: Date.now(),
            elapsedTime: Math.round((Date.now() - this.startTime) / 1000),
            cpu: this.estimateCPUUsage(),
            memory: this.getMemoryUsage(),
            gpu: {
                active: this.gpuInfo?.isActive || false,
                model: this.gpuInfo?.renderer || 'Unknown'
            }
        };
        this.metrics.push(finalMetric);

        // Calculate summary statistics
        const summary = this.calculateSummary();
        this.lastSummary = summary;

        return summary;
    }

    /**
     * Get the last calculated summary
     */
    getLastSummary() {
        return this.lastSummary;
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary() {
        if (this.metrics.length === 0) {
            return null;
        }

        const cpuValues = this.metrics.map(m => m.cpu);
        const memoryValues = this.metrics.map(m => m.memory.used);

        return {
            duration: Math.round((Date.now() - this.startTime) / 1000), // seconds
            cpu: {
                avg: Math.round((cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 10) / 10,
                max: Math.max(...cpuValues),
                min: Math.min(...cpuValues)
            },
            memory: {
                avg: Math.round(memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length),
                max: Math.max(...memoryValues),
                min: Math.min(...memoryValues)
            },
            gpu: {
                used: this.gpuInfo?.isActive || false,
                model: this.gpuInfo?.renderer || 'Unknown'
            },
            timeline: this.metrics.map(m => ({
                time: m.elapsedTime,
                cpu: m.cpu,
                memory: m.memory.used
            }))
        };
    }

    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        return {
            cpu: this.estimateCPUUsage(),
            memory: this.getMemoryUsage(),
            gpu: this.gpuInfo,
            isMonitoring: this.isMonitoring,
            elapsedTime: this.startTime ? Math.round((Date.now() - this.startTime) / 1000) : 0
        };
    }

    /**
     * Reset monitor
     */
    reset() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        }
        this.metrics = [];
        this.startTime = null;
    }
}

export default PerformanceMonitor;
