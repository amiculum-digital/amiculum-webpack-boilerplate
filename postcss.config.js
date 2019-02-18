const purgecss = require('@fullhuman/postcss-purgecss');
const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.js'),
    require('autoprefixer'),
    require('cssnano')({
        preset: 'default',
    }),
    purgecss({
      content: [
        './**/*.html',
        './**/*.pug'
      ],
      keyframes: true,
    })
  ],
}