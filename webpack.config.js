const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const url = require('url');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const isWsl = require('is-wsl');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const postcssSafeParser = require('postcss-safe-parser');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const REACT_APP = /^REACT_APP_/i;
const shouldInlineRuntimeChunk = true;

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const ensureSlash = (path) => path.endsWith('/') ? path : path + '/';
function getClientEnvironment(publicUrl) {
    const raw = Object.keys(process.env)
        .filter(key => REACT_APP.test(key))
        .reduce(
            (env, key) => {
                env[key] = process.env[key];
                return env;
            },
            {
                NODE_ENV: process.env.NODE_ENV || 'development',
                PUBLIC_URL: publicUrl,
            }
        );

    const stringified = {
        'process.env': Object.keys(raw).reduce((env, key) => {
            env[key] = JSON.stringify(raw[key]);
            return env;
        }, {}),
    };

    return { raw, stringified };
}

const publicFiles = fs.readdirSync(resolveApp('public'));
console.log(publicFiles);
module.exports = function (webpackEnv) {

    console.log(webpackEnv);
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";
    const homepage = require(resolveApp('package.json')).homepage;
    const publicPath = process.env.PUBLIC_URL
        || (homepage ? ensureSlash(url.parse(homepage).pathname) : "/");
    const publicUrl = isEnvProduction
        ? publicPath.slice(0, -1)
        : isEnvDevelopment && '';
    const env = getClientEnvironment(publicUrl);

    const loaders = [
        isEnvDevelopment && require.resolve('style-loader'),
        isEnvProduction && MiniCssExtractPlugin.loader,
        {
            loader: require.resolve('css-loader'),
            options: {
                importLoaders: 2,
                sourceMap: isEnvProduction,
            },
        },
        {
            loader: require.resolve("postcss-loader"),
            options: {
                ident: 'postcss',
                plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    require('postcss-preset-env')({
                        autoprefixer: {
                            grid: true,
                            flexbox: 'no-2009',
                        },
                        stage: 3
                    }),
                ]
            }
        },
        require.resolve('sass-loader'),
    ].filter(Boolean);

    return {
        mode: webpackEnv,
        devtool: isEnvProduction ? 'source-map' :
            isEnvDevelopment && 'cheap-source-map',

        plugins: [
            new CleanPlugin(),
            new HtmlWebpackPlugin({
                inject: true,
                template: resolveApp('public/index.html'),
                minify: isEnvProduction
            }),
            isEnvProduction &&
                shouldInlineRuntimeChunk &&
                    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
            new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
            new webpack.DefinePlugin(env.stringified),
            new ModuleNotFoundPlugin(resolveApp('.')),
            isEnvDevelopment && new WatchMissingNodeModulesPlugin(resolveApp('node_modules')),
            //isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
            isEnvProduction && new MiniCssExtractPlugin({
                chunkFilename: 'css/[name].[contenthash:8].css',
                filename: 'css/[name].[contenthash:8].css'
            }),
        ].filter(Boolean),

        output: {
            pathinfo: isEnvDevelopment,
            path: resolveApp('dist'),
            publicPath: publicPath,
            chunkFilename: isEnvProduction
                ? "js/[name].[contenthash:8].chunk.js"
                : isEnvDevelopment && '[name].chunk.js',
            filename: isEnvProduction
                ? "js/[name].[contenthash:8].js"
                : isEnvDevelopment && 'main.js',
        },

        devServer: {
            contentBase: resolveApp('dist'),
            hot: true,
            compress: true,
            openPage: '/',
        },

        module: {
            strictExportPresence: true,
            rules: [
                {
                    parser: {requireEnsure: false}
                },
                {
                    test: /\.(ts|tsx)$/,
                    include: resolveApp('src'),
                    loader: require.resolve('ts-loader'),
                    options: PnpWebpackPlugin.tsLoaderOptions(),
                },
                {
                    test: /\.(scss|css)$/,
                    use: loaders
                }
            ]
        },

        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        parse: {ecma: 8},
                        compress: {
                            ecma: 5,
                            warnings: false,
                            comparisons: false,
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            ascii_only: true,
                        }
                    },
                    parallel: !isWsl,
                    cache: true,
                    sourceMap: true,
                }),

                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        parser: postcssSafeParser,
                        map: {
                            inline: false,
                            annotation: true,
                        }
                    }
                })

            ],
            splitChunks: {
                chunks: "all",
                name: false
            },
            runtimeChunk: true,
        },

        resolve: {
            modules: ['node_modules', resolveApp('node_modules')],
            extensions: ['.ts', '.tsx', '.js'],
            plugins: [
                PnpWebpackPlugin,
                new ModuleScopePlugin(
                    resolveApp('src'),
                    [resolveApp('package.json')],
                )
            ]
        },
        resolveLoader: {
            plugins: [
                PnpWebpackPlugin.moduleLoader(module)
            ]
        },
        performance: false
    };
};
