
const express = require('express');
const { randomUUID } = require('crypto');

const {
    checkCredentials,
    newUserRegistered
} = require('./inMemoryUserRepository');

const app = express();
const port = 3000;

app.use(express.json());

const authenticatedUsers = {};

function loggerMiddleware(req, res, next) {
    console.log('Nouvelle requête :', req.method, req.path);
    console.log('Headers :', req.headers);
    next();
}

function firewall(req, res, next) {
    const publicUrls = [
        '/hello',
        '/authenticate',
        '/register'
    ];

    if (publicUrls.includes(req.path)) {
        return next();
    }

    const token = req.headers.authorization;

    if (!token || !Object.hasOwn(authenticatedUsers, token)) {
        return res.status(403).json({
            message: 'Accès interdit'
        });
    }

    req.user = authenticatedUsers[token];

    next();
}

app.use(loggerMiddleware);
app.use(firewall);

app.get('/hello', (req, res) => {
    res.send('<h1>hello</h1>');
});

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== 'string' ||
            !email.trim() ||
            typeof password !== 'string' ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        const created = await newUserRegistered(
            email,
            password
        );

        if (!created) {
            return res.status(409).json({
                message: 'Utilisateur déjà inscrit'
            });
        }

        res.status(201).json({
            message: 'Inscription réussie'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erreur serveur'
        });
    }
});

app.post('/authenticate', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(403).json({
                message: 'Identifiants invalides'
            });
        }

        const valid = await checkCredentials(
            email,
            password
        );

        if (!valid) {
            return res.status(403).json({
                message: 'Identifiants invalides'
            });
        }

        const token = randomUUID();

        authenticatedUsers[token] = {
            email: email
        };

        res.json({
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erreur serveur'
        });
    }
});

app.get('/restricted1', (req, res) => {
    res.json({
        message: 'topsecret'
    });
});

app.get('/restricted2', (req, res) => {
    res.send('<h1>Admin space</h1>');
});

app.get('/profile', (req, res) => {
    res.json({
        email: req.user.email
    });
});

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});
