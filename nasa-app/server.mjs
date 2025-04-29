import express from 'express';
import axios from 'axios';
import path from 'path';
import promClient from 'prom-client';

const app = express();
const port = process.env.PORT || 3000;

// Set up Prometheus metrics
const register = new promClient.Registry();
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestDurationMicroseconds);

const requestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(requestCounter);

// NASA API endpoint for Astronomy Picture of the Day (APOD)
const NASA_API_KEY = 'DEMO_KEY'; // Use your own API key for production
const NASA_APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(path.resolve(), 'public')));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).send('Error gathering metrics');
  }
});

// Fetch random astronomy picture of the day (APOD)
app.get('/api/apod', async (req, res) => {
  const start = Date.now();
  try {
    const response = await axios.get(NASA_APOD_URL);
    res.json(response.data);
    // Measure duration
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route: req.route.path, status_code: res.statusCode },
      (Date.now() - start) / 1000
    );
    requestCounter.inc({ method: req.method, route: req.route.path, status_code: res.statusCode });
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
