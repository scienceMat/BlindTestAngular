const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.ProvidePlugin({
      global: 'global',
      process: 'process/browser',
    })
  ]
};
