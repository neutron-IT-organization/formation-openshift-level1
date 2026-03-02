# Dockerfile
FROM node:14

# Create app directory
WORKDIR /app

# Copy application code
COPY index.js /app/index.js

# Install dependencies
RUN npm install express

# Expose port
EXPOSE 8080

# Run the application
CMD ["node", "index.js"]

[cloud-user@rhel9-azure-pelican-75 docusaurus]$ cat index.js 
const express = require('express');
const app = express();
let ready = true;
let live = true;

app.get('/healthz', (req, res) => {
  if (live) {
    res.status(200).send('Alive');
  } else {
    res.status(500).send('Not Alive');
  }
});

app.get('/readyz', (req, res) => {
  if (ready) {
    res.status(200).send('Ready');
  } else {
    res.status(500).send('Not Ready');
  }
});

app.get('/toggle-ready', (req, res) => {
  ready = !ready;
  res.send(`Readiness is now ${ready ? 'ON' : 'OFF'}`);
});

app.get('/toggle-live', (req, res) => {
  live = !live;
  res.send(`Liveness is now ${live ? 'ON' : 'OFF'}`);
});

app.listen(8080, () => {
  console.log('Application running on port 8080');
});