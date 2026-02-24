/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // DevFlow dark palette
                canvas: {
                    bg: '#0e1117',
                    surface: '#161b22',
                    border: '#21262d',
                    elevated: '#1c2128',
                },
                node: {
                    docker: '#2563eb',
                    git: '#16a34a',
                    script: '#7c3aed',
                    run: '#ea580c',
                },
                accent: {
                    blue: '#3b82f6',
                    green: '#22c55e',
                    red: '#ef4444',
                    yellow: '#f59e0b',
                    purple: '#a855f7',
                },
                status: {
                    idle: '#6b7280',
                    running: '#f59e0b',
                    success: '#22c55e',
                    error: '#ef4444',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-in': 'slideIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideIn: { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
            },
            boxShadow: {
                'node': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.4)',
                'node-selected': '0 0 0 2px #3b82f6, 0 4px 20px rgba(59,130,246,0.3)',
                'panel': '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            },
        },
    },
    plugins: [],
}
