// Theme color palette
export const theme = {
    background: {
        primary: '#0a0e27',
        secondary: '#0f1433',
        gradient: {
            start: '#0a0e27',
            end: '#1a1f4d',
        },
    },
    card: {
        bg: 'rgba(15, 23, 66, 0.4)',
        border: 'rgba(59, 130, 246, 0.15)',
        hover: 'rgba(15, 23, 66, 0.6)',
    },
    glass: {
        bg: 'rgba(20, 30, 80, 0.3)',
        border: 'rgba(96, 165, 250, 0.2)',
    },
    accent: {
        blue: '#3b82f6',
        cyan: '#06b6d4',
        violet: '#8b5cf6',
        amber: '#f59e0b',
        teal: '#14b8a6',
    },
    text: {
        primary: '#e2e8f0',
        secondary: '#94a3b8',
        muted: '#64748b',
    },
    border: {
        subtle: 'rgba(71, 85, 105, 0.3)',
        strong: 'rgba(100, 116, 139, 0.5)',
    },
    chart: {
        spent: '#ef4444',      // red
        saved: '#3b82f6',      // blue
        invested: '#8b5cf6',   // violet  
        earned: '#10b981',     // green/emerald
        // Category colors
        fixed: '#f59e0b',      // amber
        variable: '#06b6d4',   // cyan
        saving: '#3b82f6',     // blue
        investment: '#8b5cf6', // violet
        income: '#10b981',     // green
    },
} as const;

export type Theme = typeof theme;
