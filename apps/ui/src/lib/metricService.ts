export interface AppMetric {
    id: string;
    type: 'startup' | 'execution' | 'node_execution' | 'plugin_load';
    value: number; // duration in ms
    timestamp: string;
    metadata?: Record<string, any>;
}

const STORAGE_KEY = 'devflow_telemetry';

export const metricService = {
    /** Logs a performance metric */
    log: (type: AppMetric['type'], value: number, metadata?: Record<string, any>) => {
        try {
            const metric: AppMetric = {
                id: crypto.randomUUID(),
                type,
                value,
                timestamp: new Date().toISOString(),
                metadata
            };

            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AppMetric[];
            existing.push(metric);

            // Keep only the last 1000 metrics
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-1000)));
            console.log(`[Telemetry] Recorded ${type}: ${value}ms`);
        } catch (err) {
            console.error('Failed to log telemetry:', err);
        }
    },

    /** Retrieves all metrics */
    getHistory: (): AppMetric[] => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AppMetric[];
        } catch {
            return [];
        }
    },

    /** Clears all telemetry data */
    clearHistory: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    /** Aggregates metrics (e.g., average startup time) */
    getAverages: () => {
        const history = metricService.getHistory();
        const stats: Record<string, { total: number; count: number }> = Object.create(null);

        history.forEach(m => {
            if (!stats[m.type]) stats[m.type] = { total: 0, count: 0 };
            stats[m.type].total += m.value;
            stats[m.type].count++;
        });

        const averages: Record<string, number> = {};
        Object.entries(stats).forEach(([type, data]) => {
            averages[type] = data.total / data.count;
        });

        return averages;
    }
};
