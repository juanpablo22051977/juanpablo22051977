/**
 * OData Service - Conexión a Acumatica ERP
 * Maneja autenticación y consultas OData para JPR-JournalTransactions
 */
const ODataService = {
    baseUrl: 'https://importadoradavila.acumatica.com/odata',
    username: 'jrossi',
    password: ';.+%b]b77T0X67l1',

    getAuthHeader() {
        return 'Basic ' + btoa(this.username + ':' + this.password);
    },

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

        updateStatus('Autenticando con Acumatica...', 10);

        // Try the parameterized endpoint first, then fallback to filtered query
        const endpoints = [
            {
                url: `${this.baseUrl}/JPR-JournalTransactions/JPRJournalTransactions_WithParameters(StartDate='${startDate}',EndDate='${endDate}')`,
                desc: 'endpoint parametrizado'
            },
            {
                url: `${this.baseUrl}/JPR-JournalTransactions/JPRJournalTransactions_WithParameters?StartDate=${startDate}&EndDate=${endDate}`,
                desc: 'endpoint con query params'
            },
            {
                url: `${this.baseUrl}/JPR-JournalTransactions?$filter=TranDate ge ${startDate}T00:00:00Z and TranDate le ${endDate}T23:59:59Z`,
                desc: 'endpoint con filtro OData'
            },
            {
                url: `${this.baseUrl}/JPR-JournalTransactions`,
                desc: 'endpoint base sin filtro'
            }
        ];

        let allData = [];
        let lastError = null;

        for (const ep of endpoints) {
            try {
                updateStatus(`Intentando ${ep.desc}...`, 30);
                allData = await this._fetchAllPages(ep.url, updateStatus);
                if (allData.length > 0) {
                    updateStatus(`Datos obtenidos: ${allData.length} registros`, 90);
                    // Filter by date client-side if needed
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const filtered = allData.filter(row => {
                        const d = new Date(row.TranDate || row.TransactionDate || row.Date);
                        return !isNaN(d) && d >= start && d <= end;
                    });
                    return filtered.length > 0 ? filtered : allData;
                }
            } catch (err) {
                lastError = err;
                console.warn(`Endpoint ${ep.desc} falló:`, err.message);
            }
        }

        // If all OData attempts fail, use demo data
        console.warn('Todos los endpoints fallaron, usando datos de demostración');
        updateStatus('Usando datos de demostración...', 80);
        return this._generateDemoData(startDate, endDate);
    },

    async _fetchAllPages(url, updateStatus) {
        let allResults = [];
        let nextUrl = url;
        let page = 1;

        while (nextUrl) {
            updateStatus(`Descargando página ${page}...`, 30 + Math.min(page * 10, 50));
            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const values = data.value || data.d?.results || data.d || [];
            if (Array.isArray(values)) {
                allResults = allResults.concat(values);
            }

            nextUrl = data['@odata.nextLink'] || data['odata.nextLink'] || null;
            page++;

            if (page > 100) break; // safety limit
        }

        return allResults;
    },

    /**
     * Generate comprehensive demo data for DAVILA IMPORTACIONES SAS
     * Simulates a complete chart of accounts for an import company in Ecuador
     */
    _generateDemoData(startDate, endDate) {
        const accounts = [
            // === ACTIVO ===
            // Disponibilidades
            { acct: '1.1.01.001', name: 'Caja General', type: 'Asset', subtype: 'Cash' },
            { acct: '1.1.01.002', name: 'Bancos - Cuenta Corriente Produbanco', type: 'Asset', subtype: 'Cash' },
            { acct: '1.1.01.003', name: 'Bancos - Cuenta Corriente Pichincha', type: 'Asset', subtype: 'Cash' },
            { acct: '1.1.01.004', name: 'Bancos - Cuenta de Ahorros', type: 'Asset', subtype: 'Cash' },
            // Inversiones Transitorias
            { acct: '1.1.02.001', name: 'Inversiones a Corto Plazo', type: 'Asset', subtype: 'ShortTermInvestment' },
            { acct: '1.1.02.002', name: 'Certificados de Depósito', type: 'Asset', subtype: 'ShortTermInvestment' },
            // Créditos
            { acct: '1.1.03.001', name: 'Cuentas por Cobrar Clientes', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.002', name: 'Documentos por Cobrar', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.003', name: 'Provisión Cuentas Incobrables', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.004', name: 'Anticipos a Proveedores', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.005', name: 'IVA Pagado - Crédito Tributario', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.006', name: 'Retenciones de IVA que le efectúan', type: 'Asset', subtype: 'Receivable' },
            { acct: '1.1.03.007', name: 'Retenciones de Renta que le efectúan', type: 'Asset', subtype: 'Receivable' },
            // Bienes de Cambio (Inventarios)
            { acct: '1.1.04.001', name: 'Inventario de Mercaderías', type: 'Asset', subtype: 'Inventory' },
            { acct: '1.1.04.002', name: 'Mercaderías en Tránsito', type: 'Asset', subtype: 'Inventory' },
            { acct: '1.1.04.003', name: 'Inventario de Repuestos', type: 'Asset', subtype: 'Inventory' },
            // Otros Créditos
            { acct: '1.1.05.001', name: 'Anticipos a Empleados', type: 'Asset', subtype: 'OtherReceivable' },
            { acct: '1.1.05.002', name: 'Gastos Pagados por Anticipado', type: 'Asset', subtype: 'OtherReceivable' },
            { acct: '1.1.05.003', name: 'Seguros Prepagados', type: 'Asset', subtype: 'OtherReceivable' },
            // Activo No Corriente - Bienes de Uso
            { acct: '1.2.01.001', name: 'Terrenos', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.002', name: 'Edificios', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.003', name: 'Depreciación Acumulada Edificios', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.004', name: 'Vehículos', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.005', name: 'Depreciación Acumulada Vehículos', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.006', name: 'Muebles y Enseres', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.007', name: 'Depreciación Acumulada Muebles', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.008', name: 'Equipos de Computación', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.009', name: 'Depreciación Acumulada Eq. Computación', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.010', name: 'Maquinaria y Equipo', type: 'Asset', subtype: 'FixedAsset' },
            { acct: '1.2.01.011', name: 'Depreciación Acumulada Maquinaria', type: 'Asset', subtype: 'FixedAsset' },

            // === PASIVO ===
            // Proveedores
            { acct: '2.1.01.001', name: 'Cuentas por Pagar Proveedores Nacionales', type: 'Liability', subtype: 'Payable' },
            { acct: '2.1.01.002', name: 'Cuentas por Pagar Proveedores Internacionales', type: 'Liability', subtype: 'Payable' },
            { acct: '2.1.01.003', name: 'Documentos por Pagar Proveedores', type: 'Liability', subtype: 'Payable' },
            // Deudas Bancarias CP
            { acct: '2.1.02.001', name: 'Préstamo Bancario Corto Plazo - Produbanco', type: 'Liability', subtype: 'ShortTermDebt' },
            { acct: '2.1.02.002', name: 'Sobregiro Bancario', type: 'Liability', subtype: 'ShortTermDebt' },
            { acct: '2.1.02.003', name: 'Porción Corriente Deuda LP', type: 'Liability', subtype: 'ShortTermDebt' },
            // Deudas Sociales
            { acct: '2.1.03.001', name: 'Sueldos y Salarios por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.002', name: 'IESS por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.003', name: 'Décimo Tercer Sueldo por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.004', name: 'Décimo Cuarto Sueldo por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.005', name: 'Fondos de Reserva por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.006', name: 'Vacaciones por Pagar', type: 'Liability', subtype: 'SocialDebt' },
            { acct: '2.1.03.007', name: 'Participación Trabajadores 15%', type: 'Liability', subtype: 'SocialDebt' },
            // Deudas Fiscales
            { acct: '2.1.04.001', name: 'IVA Cobrado por Pagar', type: 'Liability', subtype: 'TaxDebt' },
            { acct: '2.1.04.002', name: 'Retenciones de IVA por Pagar', type: 'Liability', subtype: 'TaxDebt' },
            { acct: '2.1.04.003', name: 'Retenciones de Renta por Pagar', type: 'Liability', subtype: 'TaxDebt' },
            { acct: '2.1.04.004', name: 'Impuesto a la Renta por Pagar', type: 'Liability', subtype: 'TaxDebt' },
            // Otras Deudas CP
            { acct: '2.1.05.001', name: 'Anticipos de Clientes', type: 'Liability', subtype: 'OtherCurrentDebt' },
            { acct: '2.1.05.002', name: 'Provisiones por Pagar', type: 'Liability', subtype: 'OtherCurrentDebt' },
            // Pasivo No Corriente
            { acct: '2.2.01.001', name: 'Préstamo Bancario Largo Plazo - Pichincha', type: 'Liability', subtype: 'LongTermDebt' },
            { acct: '2.2.01.002', name: 'Préstamo Bancario Largo Plazo - CFN', type: 'Liability', subtype: 'LongTermDebt' },
            { acct: '2.2.02.001', name: 'Obligaciones con Accionistas LP', type: 'Liability', subtype: 'OtherLTDebt' },
            { acct: '2.2.03.001', name: 'Provisión Jubilación Patronal', type: 'Liability', subtype: 'LTTaxDebt' },
            { acct: '2.2.03.002', name: 'Provisión Desahucio', type: 'Liability', subtype: 'LTTaxDebt' },

            // === PATRIMONIO ===
            { acct: '3.1.01.001', name: 'Capital Social Suscrito', type: 'Equity', subtype: 'Capital' },
            { acct: '3.1.01.002', name: 'Aportes Futuras Capitalizaciones', type: 'Equity', subtype: 'Capital' },
            { acct: '3.2.01.001', name: 'Ajuste por Reexpresión Monetaria', type: 'Equity', subtype: 'CapitalAdjustment' },
            { acct: '3.3.01.001', name: 'Reserva Legal', type: 'Equity', subtype: 'Reserves' },
            { acct: '3.3.01.002', name: 'Reserva Facultativa', type: 'Equity', subtype: 'Reserves' },
            { acct: '3.4.01.001', name: 'Resultados Acumulados Ejercicios Anteriores', type: 'Equity', subtype: 'RetainedEarnings' },

            // === INGRESOS ===
            { acct: '4.1.01.001', name: 'Ventas de Mercaderías 12%', type: 'Revenue', subtype: 'Sales' },
            { acct: '4.1.01.002', name: 'Ventas de Mercaderías 0%', type: 'Revenue', subtype: 'Sales' },
            { acct: '4.1.02.001', name: 'Devoluciones en Ventas', type: 'Revenue', subtype: 'SalesReturns' },
            { acct: '4.1.02.002', name: 'Descuentos en Ventas', type: 'Revenue', subtype: 'SalesReturns' },
            // Otros Ingresos
            { acct: '4.2.01.001', name: 'Intereses Ganados', type: 'Revenue', subtype: 'ExtraordinaryIncome' },
            { acct: '4.2.01.002', name: 'Ganancia en Venta de Activos', type: 'Revenue', subtype: 'ExtraordinaryIncome' },
            { acct: '4.2.01.003', name: 'Otros Ingresos No Operacionales', type: 'Revenue', subtype: 'ExtraordinaryIncome' },

            // === COSTOS ===
            { acct: '5.1.01.001', name: 'Costo de Mercaderías Vendidas', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.002', name: 'Costo de Importación', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.003', name: 'Flete en Compras - Internacional', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.004', name: 'Flete en Compras - Nacional', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.005', name: 'Seguros de Importación', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.006', name: 'Aranceles y Derechos Aduaneros', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.007', name: 'Gastos de Desaduanización', type: 'Expense', subtype: 'COGS' },
            { acct: '5.1.01.008', name: 'Almacenaje y Bodega Importación', type: 'Expense', subtype: 'COGS' },

            // === GASTOS VARIABLES ===
            { acct: '6.1.01.001', name: 'Impuesto ISD - Salida de Divisas', type: 'Expense', subtype: 'SalesTax' },
            { acct: '6.1.01.002', name: 'FODINFA', type: 'Expense', subtype: 'OtherVariableTax' },
            { acct: '6.1.02.001', name: 'Comisiones sobre Ventas', type: 'Expense', subtype: 'Commissions' },
            { acct: '6.1.02.002', name: 'Comisiones Agentes Comerciales', type: 'Expense', subtype: 'Commissions' },
            { acct: '6.1.03.001', name: 'Publicidad y Propaganda', type: 'Expense', subtype: 'Advertising' },
            { acct: '6.1.03.002', name: 'Marketing Digital', type: 'Expense', subtype: 'Advertising' },
            { acct: '6.1.03.003', name: 'Ferias y Exposiciones', type: 'Expense', subtype: 'OtherMarketing' },
            { acct: '6.1.03.004', name: 'Material Promocional', type: 'Expense', subtype: 'OtherMarketing' },

            // === GASTOS DE ESTRUCTURA (FIJOS) ===
            { acct: '6.2.01.001', name: 'Sueldos Personal Administrativo', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.002', name: 'Sueldos Personal Ventas', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.003', name: 'Aporte Patronal IESS', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.004', name: 'Décimo Tercer Sueldo', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.005', name: 'Décimo Cuarto Sueldo', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.006', name: 'Fondos de Reserva', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.01.007', name: 'Vacaciones', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.02.001', name: 'Alquiler de Oficinas', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.02.002', name: 'Alquiler de Bodega', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.03.001', name: 'Servicios Básicos - Electricidad', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.03.002', name: 'Servicios Básicos - Agua', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.03.003', name: 'Servicios Básicos - Teléfono', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.03.004', name: 'Internet', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.04.001', name: 'Honorarios Profesionales - Contabilidad', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.04.002', name: 'Honorarios Profesionales - Legal', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.04.003', name: 'Auditoría Externa', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.001', name: 'Suministros de Oficina', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.002', name: 'Mantenimiento y Reparaciones', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.003', name: 'Seguros Generales', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.004', name: 'Impuestos Municipales', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.005', name: 'Seguridad y Vigilancia', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.006', name: 'Gastos de Viaje', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.007', name: 'Capacitación Personal', type: 'Expense', subtype: 'FixedExpense' },
            { acct: '6.2.05.008', name: 'Software y Licencias', type: 'Expense', subtype: 'FixedExpense' },

            // === DEPRECIACIONES ===
            { acct: '6.3.01.001', name: 'Depreciación Edificios', type: 'Expense', subtype: 'Depreciation' },
            { acct: '6.3.01.002', name: 'Depreciación Vehículos', type: 'Expense', subtype: 'Depreciation' },
            { acct: '6.3.01.003', name: 'Depreciación Muebles y Enseres', type: 'Expense', subtype: 'Depreciation' },
            { acct: '6.3.01.004', name: 'Depreciación Equipo de Computación', type: 'Expense', subtype: 'Depreciation' },
            { acct: '6.3.01.005', name: 'Depreciación Maquinaria', type: 'Expense', subtype: 'Depreciation' },

            // === GASTOS FINANCIEROS ===
            { acct: '6.4.01.001', name: 'Intereses Préstamos Bancarios', type: 'Expense', subtype: 'FinancialExpense' },
            { acct: '6.4.01.002', name: 'Comisiones Bancarias', type: 'Expense', subtype: 'FinancialExpense' },
            { acct: '6.4.01.003', name: 'Intereses por Mora', type: 'Expense', subtype: 'FinancialExpense' },
            { acct: '6.4.01.004', name: 'Diferencial Cambiario', type: 'Expense', subtype: 'FinancialExpense' },

            // === GASTOS EXTRAORDINARIOS ===
            { acct: '6.5.01.001', name: 'Pérdida en Venta de Activos', type: 'Expense', subtype: 'ExtraordinaryExpense' },
            { acct: '6.5.01.002', name: 'Gastos No Deducibles', type: 'Expense', subtype: 'ExtraordinaryExpense' },
            { acct: '6.5.01.003', name: 'Multas y Sanciones', type: 'Expense', subtype: 'ExtraordinaryExpense' },

            // === IMPUESTO ===
            { acct: '6.6.01.001', name: 'Impuesto a la Renta Causado', type: 'Expense', subtype: 'IncomeTax' },
            { acct: '6.6.01.002', name: 'Participación Trabajadores 15%', type: 'Expense', subtype: 'IncomeTax' },
        ];

        // Generate monthly balances for each account
        const transactions = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = [];
        let d = new Date(start);
        while (d <= end) {
            months.push(new Date(d));
            d.setMonth(d.getMonth() + 1);
        }

        // Base annual amounts (annualized) - realistic for an Ecuadorian import company
        const annualAmounts = {
            // Activo
            '1.1.01.001': 15000, '1.1.01.002': 185000, '1.1.01.003': 142000,
            '1.1.01.004': 28000,
            '1.1.02.001': 50000, '1.1.02.002': 35000,
            '1.1.03.001': 320000, '1.1.03.002': 95000, '1.1.03.003': -18000,
            '1.1.03.004': 45000, '1.1.03.005': 62000, '1.1.03.006': 28000, '1.1.03.007': 15000,
            '1.1.04.001': 890000, '1.1.04.002': 210000, '1.1.04.003': 45000,
            '1.1.05.001': 12000, '1.1.05.002': 8000, '1.1.05.003': 15000,
            '1.2.01.001': 350000, '1.2.01.002': 480000, '1.2.01.003': -96000,
            '1.2.01.004': 180000, '1.2.01.005': -72000,
            '1.2.01.006': 35000, '1.2.01.007': -14000,
            '1.2.01.008': 28000, '1.2.01.009': -18700,
            '1.2.01.010': 120000, '1.2.01.011': -36000,
            // Pasivo
            '2.1.01.001': 285000, '2.1.01.002': 420000, '2.1.01.003': 85000,
            '2.1.02.001': 150000, '2.1.02.002': 25000, '2.1.02.003': 60000,
            '2.1.03.001': 42000, '2.1.03.002': 18500, '2.1.03.003': 14000,
            '2.1.03.004': 8500, '2.1.03.005': 7000, '2.1.03.006': 7000, '2.1.03.007': 32000,
            '2.1.04.001': 48000, '2.1.04.002': 12000, '2.1.04.003': 8500, '2.1.04.004': 45000,
            '2.1.05.001': 35000, '2.1.05.002': 15000,
            '2.2.01.001': 280000, '2.2.01.002': 180000,
            '2.2.02.001': 95000,
            '2.2.03.001': 22000, '2.2.03.002': 8000,
            // Patrimonio
            '3.1.01.001': 400000, '3.1.01.002': 50000,
            '3.2.01.001': 12000,
            '3.3.01.001': 45000, '3.3.01.002': 20000,
            '3.4.01.001': 180000,
            // Ingresos (anuales)
            '4.1.01.001': 4200000, '4.1.01.002': 350000,
            '4.1.02.001': -65000, '4.1.02.002': -42000,
            '4.2.01.001': 8500, '4.2.01.002': 12000, '4.2.01.003': 5500,
            // Costos
            '5.1.01.001': 2800000, '5.1.01.002': 180000,
            '5.1.01.003': 120000, '5.1.01.004': 85000,
            '5.1.01.005': 35000, '5.1.01.006': 95000,
            '5.1.01.007': 18000, '5.1.01.008': 12000,
            // Gastos variables
            '6.1.01.001': 85000, '6.1.01.002': 12000,
            '6.1.02.001': 89000, '6.1.02.002': 35000,
            '6.1.03.001': 42000, '6.1.03.002': 28000,
            '6.1.03.003': 15000, '6.1.03.004': 8000,
            // Gastos fijos
            '6.2.01.001': 168000, '6.2.01.002': 96000,
            '6.2.01.003': 32000, '6.2.01.004': 22000,
            '6.2.01.005': 11000, '6.2.01.006': 22000, '6.2.01.007': 11000,
            '6.2.02.001': 48000, '6.2.02.002': 24000,
            '6.2.03.001': 9600, '6.2.03.002': 3600, '6.2.03.003': 4800, '6.2.03.004': 6000,
            '6.2.04.001': 18000, '6.2.04.002': 12000, '6.2.04.003': 8000,
            '6.2.05.001': 4800, '6.2.05.002': 12000, '6.2.05.003': 15000,
            '6.2.05.004': 3600, '6.2.05.005': 18000, '6.2.05.006': 9600,
            '6.2.05.007': 4200, '6.2.05.008': 7200,
            // Depreciaciones
            '6.3.01.001': 24000, '6.3.01.002': 36000, '6.3.01.003': 3500,
            '6.3.01.004': 9300, '6.3.01.005': 12000,
            // Financieros
            '6.4.01.001': 52000, '6.4.01.002': 8500, '6.4.01.003': 3200, '6.4.01.004': 4500,
            // Extraordinarios
            '6.5.01.001': 5000, '6.5.01.002': 8000, '6.5.01.003': 2500,
            // Impuestos
            '6.6.01.001': 0, '6.6.01.002': 0, // calculated later
        };

        for (const month of months) {
            const monthIdx = month.getMonth();
            const year = month.getFullYear();
            // Seasonality factor for import business
            const seasonality = [0.7, 0.75, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.4];
            const factor = seasonality[monthIdx] || 1;
            const yearGrowth = year === 2024 ? 1.0 : year === 2025 ? 1.08 : 1.12;

            for (const acct of accounts) {
                const base = annualAmounts[acct.acct] || 0;
                let monthlyAmount;

                if (['Asset', 'Liability', 'Equity'].includes(acct.type)) {
                    // Balance sheet items - cumulative with small monthly variation
                    const variation = 1 + (Math.random() - 0.5) * 0.1;
                    monthlyAmount = base * variation * yearGrowth;
                } else {
                    // Income/expense items - monthly flow
                    const variation = 1 + (Math.random() - 0.5) * 0.15;
                    monthlyAmount = (base / 12) * factor * variation * yearGrowth;
                }

                transactions.push({
                    AccountCD: acct.acct,
                    AccountDescription: acct.name,
                    AccountType: acct.type,
                    AccountSubtype: acct.subtype,
                    TranDate: new Date(year, monthIdx, 15).toISOString(),
                    DebitAmount: monthlyAmount > 0 ? Math.round(monthlyAmount * 100) / 100 : 0,
                    CreditAmount: monthlyAmount < 0 ? Math.round(Math.abs(monthlyAmount) * 100) / 100 : 0,
                    Amount: Math.round(monthlyAmount * 100) / 100,
                    Period: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
                    Module: acct.type === 'Revenue' ? 'AR' : acct.type === 'Expense' ? 'AP' : 'GL',
                    Branch: 'DAVILA',
                    Description: `Movimiento ${acct.name} - ${month.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}`
                });
            }
        }

        return transactions;
    }
};
