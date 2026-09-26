/**
 * SAKSHYA Node.js / Express Backend REST API
 * Handles authentication simulation, evidence anchoring,
 * static project serving and source-code inspection.
 */

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'juris-chain-super-secret-key-2026';

app.use(express.json());
app.use(express.static(__dirname));

const USERS_DB = {
    'officer.smith@policedept.gov': {
        id: 'usr_01',
        role: 'police',
        mfaEnabled: true
    },
    'auditor.judge@court.gov': {
        id: 'usr_02',
        role: 'auditor',
        mfaEnabled: true
    }
};

const SOURCE_FILES = [
    'index.html',
    'styles.css',
    'app.js',
    'server.js',
    'App.jsx',
    'package.json',
    'README.md'
];

app.post('/api/v1/auth/login', (req, res) => {
    const { email, role } = req.body;

    const user = USERS_DB[email] || {
        id: 'usr_gen_' + Date.now(),
        role: role || 'public',
        mfaEnabled: true
    };

    const challenge = crypto.randomBytes(32).toString('hex');

    return res.json({
        success: true,
        message: 'OIDC Step-1 verified. MFA Challenge Issued.',
        challenge,
        mfaRequired: true,
        userId: user.id
    });
});

app.post('/api/v1/auth/mfa-verify', (req, res) => {
    const { userId, role } = req.body;

    const token = jwt.sign(
        {
            userId,
            role,
            iss: 'SAKSHYA-KMS',
            nistLevel: 3
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        success: true,
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 28800
    });
});

app.post('/api/v1/evidence/anchor', (req, res) => {
    const { evidenceId, rawHash, metadata } = req.body;

    const anchorTx = {
        txId: '0x' + crypto.randomBytes(16).toString('hex'),
        evidenceId,
        merkleRoot: crypto
            .createHash('sha256')
            .update(String(rawHash || '') + Date.now())
            .digest('hex'),
        blockHeight: 1482910,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
    };

    res.status(201).json({
        success: true,
        anchor: anchorTx
    });
});

app.get('/api/source/:file', (req, res) => {
    const requestedFile = req.params.file;

    if (!SOURCE_FILES.includes(requestedFile)) {
        return res.status(404).send('Source file not found.');
    }

    const filePath = path.join(__dirname, requestedFile);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Source file not found.');
    }

    res.type('text/plain').sendFile(filePath);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'SAKSHYA API',
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`SAKSHYA running on http://localhost:${PORT}`);
});
