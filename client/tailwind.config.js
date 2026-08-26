/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          50: '#fffdf5',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        primary: {
          DEFAULT: "#eab308", // Imperial Gold
          foreground: "#000000",
          50: '#fffdf0',
          100: '#fef9c3',
          200: '#fde047',
          300: '#eab308',
          400: '#ca8a04',
          500: '#eab308',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        dark: {
          bg: "#060709", // Deep obsidian void
          surface: "#0d0f14", // Onyx card surface
          card: "#11141c", // Elevated onyx glass
          border: "#232015", // Hairline dark gold border
          hover: "#1a1e28", // Hover charcoal
          sidebar: "#090a0f" // Deepest sidebar
        }
      },
      boxShadow: {
        'gold-sm': '0 0 15px -3px rgba(234, 179, 8, 0.15)',
        'gold': '0 0 25px -5px rgba(234, 179, 8, 0.25)',
        'gold-lg': '0 0 40px -5px rgba(234, 179, 8, 0.35)',
        'onyx': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gold-glow': 'gold-glow 3s ease-in-out infinite alternate',
      }
    },
  },
  plugins: [],
}
