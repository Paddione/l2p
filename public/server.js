const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Serve index.html for all other routes (but not API routes)
app.get('/*path', (req, res) => {
  // Don't serve index.html for API routes - let them pass through to backend
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found on frontend server' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Learn2Play Frontend server started on port ${port}`);
  }
}); 