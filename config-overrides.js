module.exports = (config) => {
  require('react-app-rewire-postcss')(config, true); // eslint-disable-line global-require
  return config;
};
