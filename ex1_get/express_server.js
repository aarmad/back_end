const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/some-html', (req, res) => {
  res.send('<html><body><h1>bonjour html</h1></body></html>');
});

app.get('/some-json', (req, res) => {
  res.json({
    age: 22,
    nom: 'Jane'
  });
});

app.get('/transaction', (req, res) => {
  res.json([100, 2000, 3000]);
});
app.get('/request', (req, res) => {
  console.log(req.headers);
  console.log(req.body);
  res.send('Regarde le terminal');
});

app.get('/exo-query-string', (req, res) => {
  console.log(req.query);

  const age = req.query.age;
  res.send(`<h1>${age}</h1>`);
});

app.get('/get-user/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(userId);
  res.send(`ID utilisateur : ${userId}`);
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
