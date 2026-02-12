import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'footvolley-primary': '#1a2744',
        'footvolley-secondary': '#8b1a1a',
        'footvolley-accent': '#c4a35a',
        'footvolley-sand': '#f5e6c8',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
