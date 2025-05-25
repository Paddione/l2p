# auth/Dockerfile

# Use an official Node.js runtime as a parent image
# Choose a version that matches your development environment or project requirements
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
# Using --omit=dev for a smaller production image, but for dev with nodemon, you might need devDependencies
# For simplicity here, installing all. Adjust if needed.
RUN npm install

# Copy the rest of your application's code into the container
COPY . .

# Your auth server listens on port 3001 (as per your setup)
EXPOSE 3001

# Define the command to run your app
# Use "npm run dev" for development with nodemon (if nodemon is a devDependency and script exists)
# Use "npm start" for production
CMD [ "npm", "run", "dev" ]
# Or for production: CMD [ "npm", "start" ]
