import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: 'var(--bg-app)',
          sidebar: 'var(--bg-sidebar)',
          panel: 'var(--bg-panel)',
          editor: 'var(--bg-editor)',
          overlay: 'var(--bg-overlay, rgba(0,0,0,0.5))',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse, #ffffff)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          muted: 'var(--primary-muted)',
          dark: '#00897B',
        },
        border: 'var(--border-color)',
        selection: 'var(--selection)',
        accent: 'var(--accent)',
      }
    },
  },
  plugins: [
    typography,
  ],
}
