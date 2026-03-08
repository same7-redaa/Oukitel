/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FF4E00',
                    light: '#FF7A00',
                }
            },
            fontFamily: {
                cairo: ['"Cairo"', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
