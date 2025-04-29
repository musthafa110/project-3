import express from 'express';
import axios from 'axios';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// NASA API endpoint for Astronomy Picture of the Day (APOD)
const NASA_API_KEY = 'DEMO_KEY'; // Use your own API key for production
const NASA_APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(path.resolve(), 'public')));

// Fetch random astronomy picture of the day (APOD)
app.get('/api/apod', async (req, res) => {
  try {
    const response = await axios.get(NASA_APOD_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from NASA API:', error);
    res.status(500).send('Failed to fetch data');
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`NASA app is running on http://localhost:${port}`);
});

