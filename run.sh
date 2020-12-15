#!/bin/bash

echo "DATA_HOST: $DATA_HOST"


sed -e s@DATA_HOST@$DATA_HOST@g config/config.js.template > src/config.js

# echo 'src/config.js:\n' && cat src/config.js


SKIP_PREFLIGHT_CHECK=true /usr/local/bin/npm start
