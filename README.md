# S4S Discovery Application Server

The S4S Discovery application consists of the following components:

1. The Discovery FHIR Demo Data Providers [<https://github.com/sync-for-science/discovery-FHIR-data>]
2. The Discovery Data Server (this package) [<https://github.com/sync-for-science/discovery-data-server>]
3. **The Discovery Application Server (this package)** [<https://github.com/sync-for-science/discovery>]

This package sets up the S4S Discovery Application Server.

All three packages can be installed on the same Linux instance, but the DNS/IP addresses for each component's instance must be known/determined before installation.

## Installation of the Discovery Application Server

Verify the target system is current:

    sudo apt update
    sudo apt upgrade

Clone this repository:

    cd ~
    git clone https://github.com/sync-for-science/discovery
    cd discovery

Run the **install.sh** script (you must have sudo privileges):

    ./install.sh

The install script will request the following:

- The DNS/IP address of the Discovery Data Server

The Procure application [<https://github.com/sync-for-science/procure-wip>] will also be installed.

## Adding support for postcss-import and postcss-insert

The package uses two postcss plugins not yet supported by Create React App:

- postcss-import [<https://github.com/postcss/postcss-import>]
- postcss-insert [<https://github.com/JoeCianflone/postcss-insert>]

This is (currently) accomplished by hand-editing **./node_modules/react-scripts/config/webpack.config.js** after running the install script. Note that upgrading react-scripts after installation will require reapplying this edit. Edit the file to add the two plugins as follows:

      .
      .
      .

      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
          require('postcss-import'),            <--- ADD THIS LINE
          require('postcss-insert')             <--- ADD THIS LINE
        ],
        sourceMap: isEnvProduction && shouldUseSourceMap,
      },

      .
      .
      .

## Checking Status

Use a web browser to access the Discovery and Procure applications at the DNS/IP address of this instance:

- Discovery: port 3000
- Procure: port 4000

