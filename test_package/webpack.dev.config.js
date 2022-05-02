const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");

module.exports = {
    entry: "./src/index.js",
    mode: "development",
    devServer: {
        open: true,
        watchFiles: ["./src/**/*", "../app_package/lib/**/*"]
    },
    output: {
        path: path.resolve(__dirname, "../docs"),
        filename: "bundle.js"
    },
    plugins: [
        new DefinePlugin({
            DEV_BUILD: JSON.stringify(true)
        }),
        new HtmlWebpackPlugin({ title: "Space Pirates made with Babylon.js" })
    ],
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            }
        ],
    }
};
