FROM node:16
WORKDIR /home/node/app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
ENV PORT=4000
ENV NODE_ENV=production
EXPOSE 4000
RUN yarn run build
USER node
CMD ["yarn", "start"]
