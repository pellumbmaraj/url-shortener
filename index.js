require('dotenv').config();
const express = require('express');
const cors = require('cors');
const validUrl = require('valid-url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory storage for URL mappings
let urlDatabase = {};
let idCounter = 1;  // Simple counter for generating short URLs

// Middleware
app.use(cors());
app.use(express.json());  // Parse JSON request bodies
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the index page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// First API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to shorten URLs
app.post('/api/shorturl', function(req, res) {
  const { url } = req.body;

  // Validate the URL
  if (!validUrl.isUri(url)) {
    return res.status(400).json({ error: 'invalid url' });
  }

  // Generate a short URL ID (simple incremental counter)
  const shortUrl = idCounter++;

  // Store the URL in the database (in-memory)
  urlDatabase[shortUrl] = url;

  // Return the shortened URL in the response
  res.json({
    original_url: url,
    short_url: shortUrl
  });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short', function(req, res) {
  const { short } = req.params;
  const shortUrl = parseInt(short, 10);  // Convert to integer

  // Look up the short URL in the in-memory storage
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    // Redirect to the original URL
    res.redirect(originalUrl);
  } else {
    // If the short URL does not exist, return a 404 error
    res.status(404).json({ error: 'Short URL not found' });
  }
});

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
