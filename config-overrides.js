const rewirePostCSS = require('react-app-rewire-postcss');
const {
  // See:
  // https://github.com/arackaf/customize-cra/blob/master/api.md
  override,
  // adjustStyleLoaders,
  // addPostcssPlugins,
  addBabelPlugins,
  // addBabelPlugin,
  // addExternalBabelPlugins,
  // addExternalBabelPlugin,
  // addDecoratorsLegacy,
  // fixBabelImports,
  // useBabelRc,
} = require('customize-cra');
// const postCssNested = require('postcss-nested');

// Documentation for operators:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining

module.exports = (config, _env) => {
  override(
    // useBabelRc(), // < alternative to addBabelPlugins ?
    addBabelPlugins(
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
    ),
    // addPostcssPlugins([postCssNested]), // < use this, instead of react-app-rewire-postcss ?
  )(config);

  rewirePostCSS(config, true);

  return config;
};
