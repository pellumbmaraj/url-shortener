require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve index.html
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlShortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
});

const Url = mongoose.model('Url', urlSchema);

// First API Endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to shorten URL
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Validate URL using dns.lookup
  const hostname = url.replace(/^https?:\/\//, '').split('/')[0];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    try {
      // Check if URL already exists
      let existingUrl = await Url.findOne({ originalUrl: url });
      if (existingUrl) {
        return res.json({
          original_url: existingUrl.originalUrl,
          short_url: existingUrl.shortUrl,
        });
      }

      // Create new short URL
      const shortUrl = shortid.generate();
      const newUrl = new Url({ originalUrl: url, shortUrl });
      await newUrl.save();

      res.json({
        original_url: newUrl.originalUrl,
        short_url: newUrl.shortUrl,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortUrl });

    if (!urlEntry) {
      return res.status(404).json({ error: 'No short URL found for the given input' });
    }

    res.redirect(urlEntry.originalUrl);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

