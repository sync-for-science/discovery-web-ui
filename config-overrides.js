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

// The following works, on its own:  (but without react-app-rewire-postcss / postcss-nested)
// module.exports = override(
//   // useBabelRc(),
//   addBabelPlugins(
//     '@babel/plugin-proposal-nullish-coalescing-operator',
//     '@babel/plugin-proposal-optional-chaining',
//   ),
// );
// ^ replace react-app-rewire-postcss with: addPostcssPlugins([postCssNested]) ?

module.exports = (config, env) => {
  override(
    // useBabelRc(),
    addBabelPlugins(
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
    ),
    // addPostcssPlugins([postCssNested]),
  )(config);

  rewirePostCSS(config, true);

  return config;
};
