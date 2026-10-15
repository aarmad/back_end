const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());

function loggerMiddleware(req, res, next) {
    console.log("nouvelle requête entrante");
    console.log("Méthode :", req.method);
    console.log("URL :", req.url);
    console.log("Body :", req.body);
    next();
}

app.use(loggerMiddleware);

app.use(express.static('templates'));
app.use(express.static('public'));

app.get('/test', (req, res) => {
    res.send("Hello Test !");
});

app.post('/data', (req, res) => {
    res.json(req.body);
});

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});
