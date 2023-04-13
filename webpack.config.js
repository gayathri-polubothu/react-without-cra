const path = require('path')
const htmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    entry: './client/src/main.js',
    output: {
        path: path.join(__dirname, '/dist'),
        filename: "bundle.min.js",
    },

    plugins: [
        new htmlWebpackPlugin({
            template: "./client/src/app.html"
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            src: path.resolve(__dirname, './client/src/')
        },
    },
    module: {
        rules: [
            {
                test: /.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            }
        ]
    }
}