// game/public/sw.js
// Minimal service worker to prevent 404 errors

const CACHE_NAME = 'quiz-game-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Let all requests pass through for now
    event.respondWith(fetch(event.request));
});