/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                bg: {
                    DEFAULT: '#FAFAFA',
                    card: '#FFFFFF',
                    muted: '#F4F5F7',
                    hover: '#EEF0F2',
                    active: '#E2E5E9',
                },
                fg: {
                    DEFAULT: '#1A1D23',
                    secondary: '#5A6069',
                    muted: '#9298A3',
                },
                border: {
                    DEFAULT: '#E2E5E9',
                    light: '#F0F1F3',
                },
                primary: {
                    DEFAULT: '#1E293B',
                    hover: '#334155',
                    muted: '#EFF1F4',
                },
                accent: '#0F172A',
                success: '#16A34A',
                warning: '#D97706',
                error: '#DC2626',
                info: '#2563EB',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            borderRadius: {
                sm: '4px',
                DEFAULT: '6px',
                md: '8px',
                lg: '12px',
                xl: '16px',
            },
            boxShadow: {
                'xs': '0 1px 2px rgba(0,0,0,0.04)',
                'sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                'DEFAULT': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
                'md': '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)',
                'lg': '0 20px 25px rgba(0,0,0,0.06), 0 10px 10px rgba(0,0,0,0.02)',
            },
        },
    },
    plugins: [],
}
