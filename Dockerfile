FROM node:14 as builder_base

WORKDIR discovery-web-ui

COPY package.json \
     package-lock.json \
     ./

# use only package-lock.json:
RUN npm ci

COPY . ./

FROM builder_base as builder_production

ARG DATA_HOST
ENV DATA_HOST=${DATA_HOST}

RUN sed -e s@DATA_HOST@$DATA_HOST@g /discovery-web-ui/config/config.js.template > /discovery-web-ui/src/config.js

RUN SKIP_PREFLIGHT_CHECK=true NODE_ENV=production npm run-script build

# production environment
FROM nginx:1.15.7-alpine as production

COPY --from=builder_production /discovery-web-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder_production /discovery-web-ui/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

