import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: '#0f3b1b',
          light: '#1a5c2b',
          dark: '#09230f'
        },
        accent: '#f5d867',
        midnight: '#0b1b32'
      },
      boxShadow: {
        card: '0 8px 20px rgba(0, 0, 0, 0.4)'
      }
    }
  },
  plugins: []
};

export default config;
