/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                merriweather: ["merriweather", "sans-serif"],
                robotomono: ["roboto-mono", "monospace"],
                title: ["dm-serif-display", "serif"],
                lato: ["lato", "sans-serif"],
            },
        },
    },
    plugins: [require("daisyui")],
};
