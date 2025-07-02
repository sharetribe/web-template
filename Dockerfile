FROM node:18.20.8

ARG COMMIT_SHA
ENV BUILD_SHA ${COMMIT_SHA}

WORKDIR /usr/src/app

COPY . .

ENV BASIC_AUTH_USERNAME=theluupe-dev
ENV BASIC_AUTH_PASSWORD=TheLuupe_123

ENV NODE_ENV=production
ENV PORT=8080

RUN yarn install
RUN yarn build
CMD ["yarn", "start"]
