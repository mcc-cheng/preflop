import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'slide-in-top': 'slide-in-top 200ms ease-out both',
      },
      colors: {
        // ── Monochrome base (unchanged) ──────────────────────────────────
        background:           '#000000',
        surface:              '#080808',
        'surface-raised':     '#111111',
        outline:              '#1F1F2E',
        'on-surface':         '#FFFFFF',
        'on-surface-variant': '#6B6B80',
        primary:              '#FFFFFF',
        'on-primary':         '#000000',
        warning:              '#F59E0B',

        // ── Semantic aliases → chip palette ──────────────────────────────
        success: '#2D5A3D',   // chip-green
        error:   '#8B2E2E',   // chip-red
        info:    '#4A3060',   // chip-purple

        // ── Poker chip base colors ────────────────────────────────────────
        'chip-white':  '#E8E8E0',
        'chip-red':    '#8B2E2E',
        'chip-green':  '#2D5A3D',
        'chip-black':  '#1A1A1A',
        'chip-purple': '#4A3060',

        // ── Readable text variants (lightened for dark backgrounds) ───────
        'chip-green-text':  '#4A8C63',
        'chip-red-text':    '#C45555',
        'chip-purple-text': '#7B5EA7',

        // ── Dim backgrounds (8–12% opacity) ──────────────────────────────
        'chip-green-dim':  'rgba(45, 90, 61, 0.12)',
        'chip-red-dim':    'rgba(139, 46, 46, 0.12)',
        'chip-purple-dim': 'rgba(74, 48, 96, 0.12)',

        // ── Glass surface ─────────────────────────────────────────────────
        'glass':        'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
}
export default config
