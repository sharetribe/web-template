# Use an official Node runtime as a parent image
FROM node:16.18.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock into the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Build the application
RUN yarn build-web && yarn build-server

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the server when the container launches
CMD ["node", "--icu-data-dir=node_modules/full-icu", "server/index.js"]
