var path = require('path');
var source = path.join(__dirname, 'js', 'browser', 'app');
var destination = path.join(__dirname, 'js', 'browser', 'assets', 'bundle');

module.exports = {
  bail: true,
  devtool: 'source-map',
  entry: ['babel-polyfill', source],
  module: {
    loaders: [
      // fonts
      {
        test: /\.woff(2)?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot|svg)$/,
        loader: 'file-loader'
      },

      // style
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },

      // script
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: destination,
    publicPath: destination + '/'
  },
  resolve: {
    extensions: [
      '',
      '.css',
      '.eot',
      '.js',
      '.json',
      '.jsx',
      '.svg',
      '.ttf',
      '.woff',
      '.woff2'
    ]
  },
  target: 'electron'
}
