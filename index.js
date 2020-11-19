const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var compression = require('compression');
var unitsapi = require('./api/units');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get('/', (req, res) => {
  // Main web app
  res.sendFile('public/index.html');
});

// API endpoints
app.get('/api', (req,res) => {
  // Redirect to docs so they can learn how to use the API
  return res.redirect('https://mutatio.readthedocs.io/en/latest/');
});
app.post('/api', (req,res) => {
  // Direct to docs so they can learn how to use the API
  return res.send('Hey there! It seems like you\'re trying to use the API, but you don\'t have any endpoints. If you\'re just trying to mess around with the API, take a look at the docs: https://mutatio.readthedocs.io/en/latest/ It\'s a pretty good place to learn what the API is capable of!');
});
app.post('/api/units/convert', (req,res) => {
  // Unit conversion
  return res.send(unitsapi.convert(req.body));
});

app.listen(3000, () => console.log('Server started! \\o/'));