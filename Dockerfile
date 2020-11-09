FROM node:14

WORKDIR discovery-web-ui

COPY package.json \
     package-lock.json \
     ./

# use only package-lock.json:
RUN npm ci

COPY . ./
