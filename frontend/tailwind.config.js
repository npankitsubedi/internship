/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        dune: '#c57f18',
        mist: '#d9f4ef',
        shell: '#f8f4ea',
        sea: '#0b7285',
        ember: '#9f2d17',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Instrument Serif"', 'serif'],
      },
      boxShadow: {
        halo: '0 24px 80px rgba(15, 23, 42, 0.16)',
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at top left, rgba(197, 127, 24, 0.28), transparent 30%), radial-gradient(circle at top right, rgba(11, 114, 133, 0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(159, 45, 23, 0.16), transparent 24%)',
      },
    },
  },
  plugins: [],
}
