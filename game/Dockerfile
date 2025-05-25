# game/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Create a .dockerignore file in the context directory (./game)
# to exclude unnecessary files from being copied into the image.
# Example .dockerignore contents:
# node_modules
# npm-debug.log
# .env
# .env.*
# .git
# .gitignore
# Dockerfile

# Copy package.json and package-lock.json (if available)
# This leverages Docker's layer caching. If these files haven't changed,
# Docker can reuse the layer from a previous build where dependencies were installed.
COPY package*.json ./

# Install app dependencies
# Using --omit=dev or --production flag is recommended for production builds
# to avoid installing development-only dependencies.
RUN npm install --production

# Copy the rest of your application's code into the container
# This should come after npm install so that code changes don't invalidate
# the dependency installation layer if package*.json hasn't changed.
COPY . .

# Your game server listens on port 3000 (as per your server.js setup)
EXPOSE 3000

# Define the command to run your app
# Use "npm start" for production, which should execute "node server.js"
# "npm run dev" (using nodemon) is for development only.
CMD [ "npm", "start" ]
