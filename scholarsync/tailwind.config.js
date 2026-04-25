/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        indigo: {
          300: "#A5B4FC",
          500: "#6366F1",
        },
        rose: {
          300: "#FDA4AF",
          500: "#F43F5E",
        },
        amber: {
          500: "#F59E0B",
        },
        violet: {
          500: "#8B5CF6",
        },
        cyan: {
          500: "#06B6D4",
        },
      },
    },
  },
  plugins: [],
};
