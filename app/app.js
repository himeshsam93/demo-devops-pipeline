const express = require('express');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 3000;

// collect node process metrics
client.collectDefaultMetrics({ timeout: 5000 });

app.get('/', (req, res) => {
  res.json({ message: 'Hello from demo-devops-app', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.toString());
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening at http://0.0.0.0:${port}`);
  });
}

module.exports = app;
