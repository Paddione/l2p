#!/bin/bash

echo "Creating project structure for Real-Time Quiz Game..."

# --- Auth Server ---
echo "Setting up Auth Server directory: auth/"
mkdir -p auth/routes
touch auth/app.js
touch auth/routes/hallOfFame.js
touch auth/firebaseAdmin.js
touch auth/package.json
touch auth/.env.auth # Actual env file, not example for this script's purpose
touch auth/.env.auth.example # Still good to have example

# --- Game Server ---
echo "Setting up Game Server directory: game/"
mkdir -p game/public/assets/sounds
touch game/server.js
touch game/questions.json
touch game/firebaseAdmin.js
touch game/package.json
touch game/.env.game # Actual env file
touch game/.env.game.example # Still good to have example

# --- Game Client (inside game/public) ---
echo "Setting up Game Client files in game/public/"
touch game/public/index.html
touch game/public/style.css
touch game/public/main.js
# Placeholder for potential local sound assets, even if CDN is used in example
# touch game/public/assets/sounds/placeholder.txt

echo "Project structure created successfully!"
echo "Remember to populate the .env files and package.json files."
echo "You can then install dependencies using 'npm install' in 'auth' and 'game' directories."

