/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '375px'
      },
      colors: {
        // CPCB Official Category Colors (paired with accessible text contrast)
        aqi: {
          good: '#16a34a', // 0-50 Good (Green)
          satisfactory: '#65a30d', // 51-100 Satisfactory (Light Green)
          moderate: '#d97706', // 101-200 Moderate (Amber / Yellow)
          poor: '#ea580c', // 201-300 Poor (Orange)
          veryPoor: '#dc2626', // 301-400 Very Poor (Red)
          severe: '#7f1d1d' // 401-500 Severe (Maroon)
        }
      }
    }
  },
  plugins: []
};
