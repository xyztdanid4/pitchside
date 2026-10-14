import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  endOfLine: 'lf',
  // Sorts Tailwind classes in Tailwind's recommended order
  plugins: ['prettier-plugin-tailwindcss'],
  // The stylesheet that defines the theme, so custom utilities are sorted correctly
  tailwindStylesheet: './src/index.css',
}

export default config
