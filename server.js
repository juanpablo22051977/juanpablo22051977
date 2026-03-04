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

// Debug endpoint: fetch 1 raw record and show field names + values
app.get('/api/debug', (req, res) => {
    const debugPath = ACUMATICA_BASE + '/JPR-JournalTransactions?$top=3';
    console.log(`[DEBUG] Fetching ${debugPath}`);

    const options = {
        hostname: ACUMATICA_HOST, port: 443, path: debugPath, method: 'GET',
        headers: { 'Authorization': AUTH_HEADER, 'Accept': 'application/json' },
        rejectUnauthorized: true
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
            try {
                const data = JSON.parse(body);
                const records = data.value || data.d?.results || data.d || [];
                const arr = Array.isArray(records) ? records : [records];

                if (arr.length === 0) {
                    res.json({ error: 'No records returned', rawKeys: Object.keys(data) });
                    return;
                }

                const sample = arr[0];
                const fields = Object.entries(sample).map(([k, v]) => ({
                    field: k,
                    type: typeof v,
                    value: v,
                    isNumeric: v != null && !isNaN(parseFloat(v)) && typeof v !== 'boolean'
                }));

                console.log('[DEBUG] === CAMPOS ODATA ===');
                fields.forEach(f => {
                    console.log(`  ${f.field} (${f.type}) = ${JSON.stringify(f.value)}${f.isNumeric ? ' [NUMERIC]' : ''}`);
                });

                res.setHeader('Content-Type', 'text/html');
                res.send(`
                    <html><head><title>Debug OData</title>
                    <style>body{font-family:monospace;padding:20px;background:#1a1a2e;color:#e0e0e0}
                    table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:8px;text-align:left}
                    th{background:#16213e;color:#0f0}.num{color:#0f0;font-weight:bold}.str{color:#ff9800}</style></head>
                    <body>
                    <h2>OData Debug - Campos de JPR-JournalTransactions</h2>
                    <p>Registros: ${arr.length}</p>
                    <table>
                    <tr><th>Campo</th><th>Tipo</th><th>Valor</th><th>Numerico?</th></tr>
                    ${fields.map(f => `<tr>
                        <td>${f.field}</td>
                        <td>${f.type}</td>
                        <td class="${f.isNumeric ? 'num' : 'str'}">${JSON.stringify(f.value)}</td>
                        <td>${f.isNumeric ? '✅' : ''}</td>
                    </tr>`).join('')}
                    </table>
                    <h3>Registros crudos (JSON):</h3>
                    <pre>${JSON.stringify(arr, null, 2)}</pre>
                    </body></html>
                `);
            } catch (e) {
                res.json({ error: 'Parse error', message: e.message, rawBody: body.substring(0, 2000) });
            }
        });
    });

    proxyReq.on('error', err => res.status(502).json({ error: err.message }));
    proxyReq.end();
});

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
