import express from 'express';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import LiveReloadPlugin from 'webpack-livereload-plugin';

const rootPath = path.resolve(__dirname, '..');
const dirDist = path.join(rootPath, 'public');
const dirSrc = path.join(rootPath, 'src');
const dirSrcPug = path.resolve(dirSrc, 'pug');

const pugTemplates = [];
const srcll = fs.readdirSync(dirSrcPug);
srcll.forEach(s => s.endsWith('.pug') && pugTemplates.push(s));

const getEntries = () => {
    const entries = [
        '@babel/polyfill',
        './src/js/app.js',
        './src/scss/app.scss'
    ];
    return entries;
};

const getPlugins = () => {
    const plugins = [
        ...pugTemplates.map(templateName => new HtmlWebpackPlugin({
            inject: true,
            template: `./src/pug/${templateName}`,
            filename: path.join(dirDist, templateName.replace('.pug', '.html')),
            minify: false,
            alwaysWriteToDisk: true
        })),
        new webpack.HotModuleReplacementPlugin(),
        new FriendlyErrorsWebpackPlugin({
            clearConsole: true,
        }),
        new LiveReloadPlugin({
            appendScriptTag: true
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        })
    ];

    return plugins;
};

module.exports = {
    target: ['web', 'es5'],
    entry: getEntries(),
    output: {
        path: dirDist,
        filename: 'bundle.js',
    },
    stats: {
        children: true
    },
    plugins: getPlugins(),
    devtool: 'eval',
    devServer: {
        before(app, server) {
            server._watch(dirSrcPug);
            app.use('/assets', express.static('./src/assets'));
            app.use('/img', express.static('./src/assets/img'));
            app.use('/pdf', express.static('./src/assets/pdf'));
        },
        contentBase: dirSrcPug,
        watchContentBase: true,
        inline: true,
        hot: false,
        historyApiFallback: true,
        open: true,
        //host: '0.0.0.0' // Allows external connections to localhost (browserstack)
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.pug$/,
                use: [
                    { loader: 'raw-loader' },
                    {
                        loader: 'pug-html-loader'
                    }
                ]
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
                options: {
                    emitWarning: true,
                }
            },
            {
                test: /\.html$/i,
                loader: 'html-loader',
                options: {
                    preprocessor: (content, loaderContext) => content.replace(
                        /\<include src=\"(.+)\"\/?\>(?:\<\/include\>)?/gi,
                        (m, src) => {
                            const filePath = path.resolve(loaderContext.context, src);
                            loaderContext.dependency(filePath);
                            return fs.readFileSync(filePath, 'utf8');
                        }
                    ),
                },
            },
            {
                test: /\.(sa|sc|c)ss$/,
                exclude: '/node_modules/',
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            url: false
                        }
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                            postcssOptions: {
                                plugins: [
                                    require('tailwindcss'),
                                    require('autoprefixer')
                                ]
                            },
                        }
                    }, {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader'
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.jpg', '.html', '.pug', '.scss'],
    }
};
