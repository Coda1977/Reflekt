import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F5F0E8',
        'text-primary': '#1A1A1A',
        'text-secondary': '#4A4A4A',
        'accent-yellow': '#FFD60A',
        'accent-blue': '#003566',
      },
      spacing: {
        'xs': '8px',
        's': '16px',
        'm': '32px',
        'l': '64px',
        'xl': '128px',
      },
    },
  },
  plugins: [],
}

export default config
