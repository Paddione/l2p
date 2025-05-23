# game/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application's code into the container
COPY . .

# Your game server listens on port 3000 (as per your setup)
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "run", "dev" ]
# Or for production: CMD [ "npm", "start" ]
