const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var compression = require('compression')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

app.listen(3000, () => console.log('Server started! \\o/'));