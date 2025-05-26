# Project Structure

```
Kommilitonen-quiz/
├── .git/
├── .gitignore
├── README.md
├── docker-compose.yml
├── rebuild.sh
├── auth/
│   ├── app.js
│   ├── firebaseAdmin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── service-account.json
│   ├── node_modules/ # Ignored
│   ├── public/
│   │   ├── auth_client.js
│   │   └── auth_style.css
│   └── routes/
│       └── hallOfFame.js
├── game/
│   ├── server.js
│   ├── config.js
│   ├── firebaseAdmin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── questions.json
│   ├── routes.js
│   ├── socketHandlers.js
│   ├── middleware.js
│   ├── database.js
│   ├── gameLogic.js
│   ├── gameManager.js
│   ├── lobbyManager.js
│   ├── favicon.png
│   ├── service-account.json
│   ├── node_modules/ # Ignored
│   └── public/
│       ├── index.html
│       ├── style.css
│       ├── sw.js
│       ├── main.js # Deprecated client entry point
│       └── js/ # Modular client code
│           ├── main.js # New client entry point
│           ├── state.js
│           ├── auth.js
│           ├── socket.js
│           ├── ui.js
│           ├── game.js
│           ├── sound.js
│           ├── api.js
│           ├── eventListeners.js
│           └── utils.js
├── scripts/ # Placeholder for utility scripts
├── letsencrypt/ # Placeholder for Let's Encrypt setup
└── tests/ # Placeholder for test files
    ├── auth/ # Placeholder for Auth server tests
    └── game/ # Placeholder for Game server tests
```

This document outlines the directory and file structure of the Kommilitonen-quiz project. The project is divided into `auth` and `game` services, each with its own backend and associated client-side code within the `public` directories. Common configurations and build-related files are located in the root directory. 