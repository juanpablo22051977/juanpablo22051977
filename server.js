/**
 * Proxy Server for DAVILA IMPORTACIONES SAS
 * Resuelve el problema de CORS al hacer peticiones a Acumatica OData
 *
 * USO: node server.js
 * Luego abrir http://localhost:3000
 */
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 3000;

const ACUMATICA_HOST = 'importadoradavila.acumatica.com';
const ACUMATICA_BASE = '/odata';
const USERNAME = 'jrossi';
const PASSWORD = ';.+%b]b77T0X67l1';

const AUTH_HEADER = 'Basic ' + Buffer.from(USERNAME + ':' + PASSWORD).toString('base64');

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Proxy endpoint: /api/odata/* -> https://importadoradavila.acumatica.com/odata/*
app.use('/api/odata', (req, res) => {
    const odataPath = ACUMATICA_BASE + req.url;
    console.log(`[PROXY] ${req.method} ${odataPath}`);

    const options = {
        hostname: ACUMATICA_HOST,
        port: 443,
        path: odataPath,
        method: req.method,
        headers: {
            'Authorization': AUTH_HEADER,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // Skip SSL verification if needed (some Acumatica instances use self-signed certs)
        rejectUnauthorized: true
    };

    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`[PROXY] Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);

        // Forward status and headers
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
        });

        // Pipe response body
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[PROXY] Error: ${err.message}`);
        res.status(502).json({
            error: 'Error connecting to Acumatica',
            message: err.message,
            hint: 'Verifique que la URL de Acumatica es accesible y las credenciales son correctas'
        });
    });

    // If there's a request body, forward it
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
});

app.listen(PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log(' DAVILA IMPORTACIONES SAS');
    console.log(' Servidor de Análisis Financiero');
    console.log('===========================================');
    console.log('');
    console.log(`  Abrir en navegador: http://localhost:${PORT}`);
    console.log('');
    console.log('  Proxy OData activo:');
    console.log(`  /api/odata/* -> https://${ACUMATICA_HOST}${ACUMATICA_BASE}/*`);
    console.log('');
    console.log('  Presione Ctrl+C para detener');
    console.log('');
});
