/**
 * OData Service - Conexión a Acumatica ERP
 * Maneja consultas OData para JPR-JournalTransactions
 *
 * Las peticiones van al proxy local (server.js) que reenvía a Acumatica,
 * evitando problemas de CORS del navegador.
 */
const ODataService = {

    // Proxy local — el server.js redirige /api/odata/* a Acumatica
    proxyBaseUrl: '/api/odata',

    /**
     * Fetch journal transactions with date filter using WithParameters endpoint
     */
    async fetchJournalTransactions(startDate = '2024-01-01', endDate = null) {
        if (!endDate) {
            endDate = new Date().toISOString().split('T')[0];
        }

        const updateStatus = (msg, pct) => {
            const el = document.getElementById('loading-status');
            const bar = document.getElementById('progress-fill');
            if (el) el.textContent = msg;
            if (bar) bar.style.width = pct + '%';
        };

        updateStatus('Conectando con Acumatica vía proxy...', 10);

        // Endpoints to try in order (via proxy, so no CORS issues)
        // Uses actual field name TransactionDate from the OData Generic Inquiry
        const endpoints = [
            {
                url: `${this.proxyBaseUrl}/JPR-JournalTransactions?$filter=TransactionDate ge datetimeoffset'${startDate}T00:00:00Z' and TransactionDate le datetimeoffset'${endDate}T23:59:59Z'`,
                desc: 'filtro OData v4 (datetimeoffset)'
            },
            {
                url: `${this.proxyBaseUrl}/JPR-JournalTransactions?$filter=TransactionDate ge ${startDate}T00:00:00Z and TransactionDate le ${endDate}T23:59:59Z`,
                desc: 'filtro OData v4 (ISO directo)'
            },
            {
                url: `${this.proxyBaseUrl}/JPR-JournalTransactions?$filter=TransactionDate ge datetime'${startDate}T00:00:00' and TransactionDate le datetime'${endDate}T23:59:59'`,
                desc: 'filtro OData v3 (datetime)'
            },
            {
                url: `${this.proxyBaseUrl}/JPR-JournalTransactions`,
                desc: 'endpoint base (todos los datos, filtro local)'
            }
        ];

        let allData = [];
        let lastError = null;

        for (const ep of endpoints) {
            try {
                updateStatus(`Intentando ${ep.desc}...`, 30);
                console.log(`[OData] Probando: ${ep.url}`);
                allData = await this._fetchAllPages(ep.url, updateStatus);

                if (allData.length > 0) {
                    updateStatus(`Datos obtenidos: ${allData.length} registros de Acumatica`, 90);
                    console.log(`[OData] Éxito con ${ep.desc}: ${allData.length} registros`);

                    // Filter by date client-side if needed
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    const filtered = allData.filter(row => {
                        const d = new Date(row.TranDate || row.TransactionDate || row.Date);
                        return !isNaN(d) && d >= start && d <= end;
                    });
                    return filtered.length > 0 ? filtered : allData;
                }

                console.warn(`[OData] ${ep.desc}: respuesta vacía, probando siguiente...`);
            } catch (err) {
                lastError = err;
                console.warn(`[OData] ${ep.desc} falló:`, err.message);
            }
        }

        // All endpoints failed — show error, DO NOT fall back to demo data
        const errorMsg = lastError ? lastError.message : 'No se obtuvo respuesta';
        updateStatus(`Error: ${errorMsg}`, 100);
        throw new Error(
            `No se pudo obtener datos de Acumatica. Último error: ${errorMsg}. ` +
            `Verifique que el servidor proxy está corriendo (node server.js) y que ` +
            `las credenciales y la URL de OData son correctas.`
        );
    },

    /**
     * Fetch all pages of an OData response (handles @odata.nextLink pagination)
     */
    async _fetchAllPages(url, updateStatus) {
        let allResults = [];
        let nextUrl = url;
        let page = 1;

        while (nextUrl) {
            updateStatus(`Descargando página ${page}...`, 30 + Math.min(page * 10, 50));

            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
                // No auth header needed — the proxy adds it server-side
            });

            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${response.statusText} — ${body.substring(0, 200)}`);
            }

            const data = await response.json();

            // OData v4 uses "value", OData v3 uses "d.results" or "d"
            const values = data.value || data.d?.results || data.d || [];
            if (Array.isArray(values)) {
                allResults = allResults.concat(values);
            } else if (typeof values === 'object') {
                // Single entity response
                allResults.push(values);
            }

            // Handle pagination
            let rawNext = data['@odata.nextLink'] || data['odata.nextLink'] || null;
            if (rawNext) {
                // If the nextLink is an absolute URL to Acumatica, rewrite it through the proxy
                if (rawNext.startsWith('http')) {
                    const urlObj = new URL(rawNext);
                    rawNext = '/api' + urlObj.pathname + urlObj.search;
                }
                nextUrl = rawNext;
            } else {
                nextUrl = null;
            }

            page++;
            if (page > 500) {
                console.warn('[OData] Se alcanzó el límite de 500 páginas');
                break;
            }
        }

        return allResults;
    },

    /**
     * Test the connection to Acumatica via the proxy
     * Can be called from the browser console: ODataService.testConnection()
     */
    async testConnection() {
        console.log('[OData] Probando conexión al proxy...');
        try {
            const res = await fetch('/api/odata', {
                headers: { 'Accept': 'application/json' }
            });
            console.log(`[OData] Status: ${res.status}`);
            const data = await res.json().catch(() => res.text());
            console.log('[OData] Respuesta:', data);
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            console.error('[OData] Error:', err.message);
            return { ok: false, error: err.message };
        }
    },

    /**
     * List available OData entities (tables) — useful for debugging
     * Call from console: ODataService.listEntities()
     */
    async listEntities() {
        try {
            const res = await fetch('/api/odata', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            const entities = data.value || [];
            console.table(entities.map(e => ({ name: e.name, url: e.url })));
            return entities;
        } catch (err) {
            console.error('[OData] Error listando entidades:', err.message);
            return [];
        }
    },

    /**
     * Diagnostic tool: fetch a few records and display field names, types and sample values.
     * Call from console: ODataService.diagnose()
     */
    async diagnose() {
        console.log('=== DIAGNÓSTICO OData ===');
        try {
            const res = await fetch(`${this.proxyBaseUrl}/JPR-JournalTransactions?$top=3`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) {
                console.error(`HTTP ${res.status}: ${res.statusText}`);
                return;
            }
            const data = await res.json();
            const values = data.value || data.d?.results || data.d || [];
            const records = Array.isArray(values) ? values : [values];

            if (records.length === 0) {
                console.warn('No se recibieron registros');
                return;
            }

            console.log(`Registros recibidos: ${records.length}`);
            console.log('--- Campos y tipos del primer registro ---');
            const sample = records[0];
            const fieldInfo = Object.entries(sample).map(([key, val]) => ({
                Campo: key,
                Tipo: typeof val,
                Valor: val === null ? 'null' : String(val).substring(0, 80)
            }));
            console.table(fieldInfo);

            // Highlight numeric-looking fields
            const numericFields = Object.entries(sample)
                .filter(([, v]) => v != null && !isNaN(parseFloat(v)))
                .map(([k, v]) => `${k} = ${v}`);
            console.log('--- Campos numéricos detectados ---');
            console.log(numericFields.join('\n'));

            return { fields: Object.keys(sample), sample, records };
        } catch (err) {
            console.error('Error en diagnóstico:', err.message);
        }
    }
};
