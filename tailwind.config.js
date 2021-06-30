/** @typedef { import('tailwindcss/defaultConfig') } DefaultConfig */
/** @typedef { import('tailwindcss/defaultTheme') } DefaultTheme */
/** @typedef { DefaultConfig & { theme: { extend: DefaultTheme } } } TailwindConfig */

const defaultTheme = require ('tailwindcss/defaultTheme')

/** @type {TailwindConfig} */
module.exports = {
  mode: "jit",
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
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
    space: {
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
      fontFamily: {
        identity: [
          'Parabole',
          ...defaultTheme.fontFamily.sans
        ]
      },
      colors: {
        transparent: 'transparent',
        inherit: 'inherit',
        gwYellow: '#EBFF00',
        gwBlue: '#3B97EC',
        gwBlueLight: '#E8EFF5',
        gwPink: '#DD96FF',
        gwPinkLight: '#FFCAD9'  ,
        gwOrange: '#FF8038',
        gwOrangeLight: '#FFC58E'      ,
      },
      boxShadow: {
        'noglow': 'inset 0 0 0 0 #FF8038',
        'glow': 'inset 4px 4px 20px 6px #FF8038'
      },
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
