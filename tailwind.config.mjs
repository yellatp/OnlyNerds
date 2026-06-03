/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'monospace'],
      },

      // Override ALL rounded-* to 0 except rounded-full — brutalist zero-radius
      borderRadius: {
        'none': '0px',
        'sm':   '0px',
        DEFAULT: '0px',
        'md':   '0px',
        'lg':   '0px',
        'xl':   '0px',
        '2xl':  '0px',
        '3xl':  '0px',
        'full': '9999px',
      },

      // Warm neutral slate — replaces cool blue-gray with sand-tinted dark
      colors: {
        slate: {
          50:  '#F5F5F0',
          100: '#EDEDEA',
          200: '#DDDBD3',
          300: '#C8C6BE',
          400: '#A09E96',
          500: '#706E66',
          600: '#4A4844',
          700: '#323028',
          800: '#1C1C18',
          900: '#141410',
          950: '#0D0D0A',
        },
        // Sector accents — muted editorial versions
        h1b:     '#7AB87A',
        private: '#C49A3A',
        vc:      '#9B8EC4',
        res:     '#6B9AC4',
      },

      // Fluid type scale
      fontSize: {
        'fluid-xs':  ['clamp(0.65rem,  1.2vw, 0.75rem)',      { lineHeight: '1.6' }],
        'fluid-sm':  ['clamp(0.75rem,  1.5vw, 0.875rem)',     { lineHeight: '1.6' }],
        'fluid-base':['clamp(0.875rem, 2vw,   1rem)',         { lineHeight: '1.6' }],
        'fluid-lg':  ['clamp(1rem,     2.5vw, 1.25rem)',      { lineHeight: '1.4' }],
        'fluid-xl':  ['clamp(1.25rem,  3vw,   1.5rem)',       { lineHeight: '1.3' }],
        'fluid-2xl': ['clamp(1.5rem,   4vw,   2rem)',         { lineHeight: '1.2' }],
        'fluid-3xl': ['clamp(2rem,     5vw,   3rem)',         { lineHeight: '1.1' }],
        'fluid-4xl': ['clamp(2.5rem,   6vw,   4rem)',         { lineHeight: '1.0' }],
        'fluid-5xl': ['clamp(3rem,     8vw + 0.5rem, 5.5rem)',{ lineHeight: '0.92'}],
      },

      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
