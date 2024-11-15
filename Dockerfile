# syntax=docker/dockerfile:experimental

FROM node:18.20.1


# install ssh client and git
RUN apt-get update -y && apt-get install -y git openssh-client gcc g++ make

# download public key for github.com
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# Accept environment variables passed from Cloud Build
ARG ENV_VARS
ARG COMMIT_SHA
ENV BUILD_SHA ${COMMIT_SHA}
ENV REACT_APP_SECRET_TEST ${ENV_VARS}

WORKDIR /usr/src/app

COPY . .

ENV PORT=8080
ENV NODE_ENV=production

RUN --mount=type=ssh yarn install
RUN yarn build
CMD ["yarn", "start"]
