/** @typedef { import('tailwindcss/defaultConfig') } DefaultConfig */
/** @typedef { import('tailwindcss/defaultTheme') } DefaultTheme */
/** @typedef { DefaultConfig & { theme: { extend: DefaultTheme } } } TailwindConfig */

const defaultTheme = require('tailwindcss/defaultTheme')
const polished = require('polished')

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
      8: '100px',
    },
    space: {
      0: '0px',
      '1px': "1px",
      '2px': "2px",
      '3px': "3px",
      '4px': "4px",
      1: '5px',
      2: '10px',
      3: '15px',
      4: '20px',
      5: '40px',
      6: '60px',
      7: '80px',
      8: '100px',
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
        gwBackground: '#F8F8F8',
        gwPink: '#DD96FF',
        gwPink50: polished.rgba('#DD96FF', 0.5),
        gwPinkLight: '#FFCAD9'  ,
        gwOrange: '#FF8038',
        gwOrange50: polished.rgba('#FF8038', 0.5),
        gwOrangeLight: '#FFC58E',
      },
      boxShadow: theme => ({
        'noglow': 'inset 0 0 0 0 #FF8038',
        'glow': 'inset 4px 4px 20px 6px #FF8038',
        'innerGwPink': `inset 0px 0px 10px 6px ${polished.rgba('#DD96FF', 0.5)}`,
        'gwPink': `0px 1px 10px 5px ${theme('colors.gwPink50')}`,
        'gwOrange': `0px 1px 10px 5px ${theme('colors.gwOrange50')}`
      }),
      maxWidth: {
        full: "100%"
      },
      typography: theme => ({
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
            p: {
              marginTop: theme('space.4'),
              marginBottom: theme('space.4')
            },
            blockquote: {
              marginTop: theme('space.5'),
              marginBottom: theme('space.5'),
              fontFamily: theme('fontFamily.identity').slice().reverse(),
              fontSize: theme('fontSize.3xl'),
              lineHeight: '1.25em',
              fontStyle: 'normal',
              border: 'none',
              margin: 'none',
              // background: `0% 0% url(/images/spaceinvader.png) no-repeat`,
              // backgroundSize: '32px 38px',
              paddingLeft: 40,
              ' p:first-of-type::before': {
                content: '"👾" !important',
                float: 'left',
                marginLeft: -40
              },
              ':after': { display: 'none' },
            }
          },
        },
      })
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
