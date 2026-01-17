/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                sidebar: {
                    DEFAULT: '#0f172a',
                    light: '#1e293b',
                },
                background: {
                    DEFAULT: '#f8fafc',
                    card: '#ffffff',
                },
            },
            borderRadius: {
                lg: '0.75rem',
                xl: '1rem',
                '2xl': '1.25rem',
            },
        },
    },
    plugins: [],
}
