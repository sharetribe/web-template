FROM node:18.20.1

ARG COMMIT_SHA
ENV BUILD_SHA ${COMMIT_SHA}

WORKDIR /usr/src/app

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

RUN yarn install
RUN yarn build
CMD ["yarn", "start"]
