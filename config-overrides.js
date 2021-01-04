module.exports = config => {
    require('react-app-rewire-postcss')(config, true /* any truthy value will do */);

    return config;
};