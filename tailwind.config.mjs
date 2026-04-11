/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
        mono:    ['Space Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // Sector accents (used as: text-h1b, bg-h1b/10 etc.)
        h1b:     '#10b981',
        private: '#f59e0b',
        vc:      '#8b5cf6',
        res:     '#3b82f6',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
