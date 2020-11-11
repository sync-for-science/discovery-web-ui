FROM node:14

WORKDIR discovery-web-ui

COPY package.json \
     package-lock.json \
     ./

# use only package-lock.json:
RUN npm ci

COPY ./config/webpack.config.js ./config/webpack.config.js

# RUN shasum ./node_modules/react-scripts/config/webpack.config.js
# RUN checksum=$(shasum ./node_modules/react-scripts/config/webpack.config.js); echo $checksum

SHELL ["/bin/bash", "-c"]

RUN if [[ $(shasum ./node_modules/react-scripts/config/webpack.config.js) =~ '47a2680979bdc5b38f6db81fdb3ea2dd13771564' ]]; then echo "SAME FILE" ; else echo "DIFFERENT FILE"; fi

RUN if [[ $(shasum ./node_modules/react-scripts/config/webpack.config.js) =~ '47a2680979bdc5b38f6db81fdb3ea2dd13771564' ]]; \
    then cp ./config/webpack.config.js ./node_modules/react-scripts/config/webpack.config.js; \
    else echo "DIFFERENT FILE" && false; fi


COPY . ./
