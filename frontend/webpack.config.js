const path = require("path");

module.exports = {
    entry: "./out/main.js",
    output: {
        filename: "script.js",
        path: path.resolve(__dirname, "www"),
    },
    mode: "development",
}