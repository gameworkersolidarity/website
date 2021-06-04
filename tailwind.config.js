/** @typedef { import('tailwindcss/defaultConfig') } DefaultConfig */
/** @typedef { import('tailwindcss/defaultTheme') } DefaultTheme */
/** @typedef { DefaultConfig & { theme: { extend: DefaultTheme } } } TailwindConfig */

/** @type {TailwindConfig} */
module.exports = {
  mode: "jit",
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    spacing: {
      0: '0px',
      1: '5px',
      2: '10px',
      3: '15px',
      4: '20px',
      5: '40px',
      6: '60px',
      7: '80px',
    },
    extend: {
      maxWidth: {
        full: "100%"
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'inherit',
            h1: { color: 'inherit' },
            h2: { color: 'inherit' },
            h3: { color: 'inherit' },
            h4: { color: 'inherit' },
            h5: { color: 'inherit' },
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
          },
        },
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
