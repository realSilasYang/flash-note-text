const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MinimizerPlugin = require('minimizer-webpack-plugin')

const outputPath = path.join(__dirname, 'dist')

module.exports = (_, argv) => ({
  target: 'web',
  mode: argv.mode || 'production',
  entry: {
    index: './src/index.js'
  },
  output: {
    path: outputPath,
    filename: '[name].js',
    chunkFilename: 'chunks/[name].[contenthash:8].js',
    clean: true
  },
  optimization: {
    chunkIds: 'named',
    minimize: true,
    minimizer: [
      // preload 在 uTools 的 Node 上下文中直接执行，必须保留原始明文及行结构。
      // 同目录中的编码和图片处理依赖也由 preload 通过 require 加载，不能交给压缩器处理。
      new MinimizerPlugin({
        exclude: /^(?:preload\.js|node_modules\/(?:chardet|iconv-lite|safer-buffer)\/)/
      })
    ]
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [
      { from: 'public', to: '.' },
      { from: 'node_modules/iconv-lite/package.json', to: 'node_modules/iconv-lite/package.json' },
      {
        from: 'node_modules/iconv-lite/lib',
        to: 'node_modules/iconv-lite/lib',
        globOptions: { ignore: ['**/*.d.ts', '**/*.map'] }
      },
      { from: 'node_modules/iconv-lite/encodings', to: 'node_modules/iconv-lite/encodings' },
      {
        from: 'node_modules/chardet',
        to: 'node_modules/chardet',
        globOptions: { ignore: ['**/*.d.ts', '**/*.map', '**/README.md'] }
      },
      { from: 'node_modules/katex/dist/fonts', to: 'fonts' },
      { from: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', to: 'code-image/fonts/jetbrains-mono-latin-500-normal.woff2' },
      { from: 'node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2', to: 'code-image/fonts/geist-mono-latin-400-normal.woff2' },
      { from: 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', to: 'code-image/fonts/ibm-plex-mono-latin-500-normal.woff2' },
      { from: 'node_modules/@fontsource/fira-code/files/fira-code-latin-400-normal.woff2', to: 'code-image/fonts/fira-code-latin-400-normal.woff2' },
      { from: 'node_modules/@fontsource/jetbrains-mono/LICENSE', to: 'code-image/fonts/LICENSE-jetbrains-mono.txt' },
      { from: 'node_modules/@fontsource/geist-mono/LICENSE', to: 'code-image/fonts/LICENSE-geist-mono.txt' },
      { from: 'node_modules/@fontsource/ibm-plex-mono/LICENSE', to: 'code-image/fonts/LICENSE-ibm-plex-mono.txt' },
      { from: 'node_modules/@fontsource/fira-code/LICENSE', to: 'code-image/fonts/LICENSE-fira-code.txt' },
      { from: 'node_modules/safer-buffer/package.json', to: 'node_modules/safer-buffer/package.json' },
      { from: 'node_modules/safer-buffer/safer.js', to: 'node_modules/safer-buffer/safer.js' }
    ] })
  ],
  performance: {
    hints: false
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['@babel/preset-env', { targets: { chrome: '108' }, modules: false }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.(less|css)$/,
        sideEffects: true,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { url: false } },
          { loader: 'less-loader' }
        ]
      }
    ]
  }
})
