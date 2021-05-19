const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const rootPath = path.resolve(__dirname, '..');
const dirDist = path.join(rootPath, 'dist');
const dirSrc = path.join(rootPath, 'src');
const dirSrcPug = path.resolve(dirSrc, 'pug');

const pugTemplates = [];
const srcll = fs.readdirSync(dirSrcPug);
srcll.forEach(s => s.endsWith('.pug') && pugTemplates.push(s));
const getEntries = () => {
    const entries = [
        '@babel/polyfill',
        './src/js/app.js',
        './src/scss/app.scss',
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
        new MiniCssExtractPlugin({
            filename: './css/[name].css',
          }),
        new CopyWebpackPlugin(
            {
                patterns: [
                    { from: __dirname + '/../src/assets/', to: __dirname + '/../dist/assets/',
                    noErrorOnMissing: true 
                    },
                ]
            }
        ),
        
    ];
    return plugins;
};

module.exports = {
    target: ['web', 'es5'],
    entry: getEntries(),
    output: {
        clean: true, 
        filename: './scripts/[name].js',
    },
    plugins: getPlugins(),
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: [
                { loader: 'raw-loader' },
                {
                    loader: 'pug-html-loader',
                    options: {
                    pretty: true
                    }
                }
                ]
            },
            {
                test: /\.(js)$/,
                use: ['babel-loader'],
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
                            const filePath = path.resolve(loaderContext.context, src)
                            loaderContext.dependency(filePath)
                            return fs.readFileSync(filePath, 'utf8')
                        }
                    ),
                },
            },
            {
                test: /\.(svg)$/i,
                type: 'asset/inline'
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                      loader: MiniCssExtractPlugin.loader
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
                            postcssOptions: { 
                                plugins: [
                                    require('tailwindcss'),
                                    require('autoprefixer'),
                                ]
                            },
                        }
                    }, {
                        loader: 'sass-loader'
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader'
            }
        ],
    },
    optimization: {
        minimizer: [
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                      'default',
                      {
                        discardComments: { removeAll: true },
                      },
                    ],
                  },
            }),
            new TerserPlugin({
                test: /\.js(\?.*)?$/i,
            }),
        ],
      },
    resolve: {
        extensions: ['.js', '.jpg', '.html', '.pug', '.scss', '.svg'],
    }
};
