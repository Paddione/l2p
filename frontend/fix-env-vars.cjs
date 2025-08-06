const fs = require('fs');

// Fix apiService.ts environment variable access
const apiServicePath = 'frontend/src/services/apiService.ts';
let apiContent = fs.readFileSync(apiServicePath, 'utf8');

apiContent = apiContent.replace(
  "this.baseURL = (typeof import !== 'undefined' && import.meta??.env??.VITE_API_URL) || process.env.VITE_API_URL || 'http://localhost:3001/api'",
  "this.baseURL = import.meta?.env?.VITE_API_URL || 'http://localhost:3001/api'"
);

fs.writeFileSync(apiServicePath, apiContent);

// Fix socketService.ts environment variable access
const socketServicePath = 'frontend/src/services/socketService.ts';
let socketContent = fs.readFileSync(socketServicePath, 'utf8');

socketContent = socketContent.replace(
  "const serverUrl = url || (typeof import !== 'undefined' && import.meta??.env??.VITE_SOCKET_URL) || process.env.VITE_SOCKET_URL || 'http://localhost:3001'",
  "const serverUrl = url || import.meta?.env?.VITE_SOCKET_URL || 'http://localhost:3001'"
);

fs.writeFileSync(socketServicePath, socketContent);

console.log('Fixed environment variable access');
