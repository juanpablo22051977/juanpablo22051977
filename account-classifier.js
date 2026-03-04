/**
 * Account Classifier - Clasificación Inteligente de Cuentas Contables
 * Basado en normas contables ecuatorianas (NIC/NIIF) y plan de cuentas SUPERCIAS
 */
const AccountClassifier = {

    // Classification rules based on Ecuadorian accounting standards
    rules: {
        // ============ ACTIVO ============
        'Disponibilidades': {
            section: 'Activo', subsection: 'Activo Corriente', rubric: 'Disponibilidades',
            keywords: ['caja', 'banco', 'efectivo', 'cash', 'disponible', 'cuenta corriente',
                       'cuenta de ahorro', 'fondos', 'caja chica', 'caja general'],
            accountPrefixes: ['1.1.01', '1.01.01', '101', '1101'],
            subtypes: ['Cash']
        },
        'Inversiones Transitorias': {
            section: 'Activo', subsection: 'Activo Corriente', rubric: 'Inversiones Transitorias',
            keywords: ['inversión corto', 'inversiones transitorias', 'certificado depósito',
                       'valores negociables', 'inversión temporal', 'short term investment',
                       'póliza acumulación'],
            accountPrefixes: ['1.1.02', '1.01.02', '102', '1102'],
            subtypes: ['ShortTermInvestment']
        },
        'Créditos': {
            section: 'Activo', subsection: 'Activo Corriente', rubric: 'Créditos',
            keywords: ['cuentas por cobrar', 'documentos por cobrar', 'clientes', 'deudores',
                       'provisión incobrables', 'anticipo proveedores', 'iva pagado',
                       'crédito tributario', 'retención iva', 'retención renta',
                       'receivable', 'impuesto anticipado'],
            accountPrefixes: ['1.1.03', '1.01.03', '103', '1103'],
            subtypes: ['Receivable']
        },
        'Bienes de Cambio': {
            section: 'Activo', subsection: 'Activo Corriente', rubric: 'Bienes de Cambio',
            keywords: ['inventario', 'mercadería', 'mercancía', 'existencia', 'stock',
                       'producto terminado', 'materia prima', 'producto en proceso',
                       'tránsito', 'repuesto', 'inventory'],
            accountPrefixes: ['1.1.04', '1.01.04', '104', '1104'],
            subtypes: ['Inventory']
        },
        'Otros Créditos': {
            section: 'Activo', subsection: 'Activo Corriente', rubric: 'Otros Créditos',
            keywords: ['anticipo empleado', 'gasto anticipado', 'gasto pagado',
                       'seguro prepagado', 'alquiler prepagado', 'otros créditos',
                       'préstamo empleado', 'deudores diversos'],
            accountPrefixes: ['1.1.05', '1.01.05', '105', '1105'],
            subtypes: ['OtherReceivable']
        },
        'Bienes de Uso': {
            section: 'Activo', subsection: 'Activo No Corriente', rubric: 'Bienes de Uso',
            keywords: ['terreno', 'edificio', 'vehículo', 'mueble', 'ensere', 'equipo',
                       'maquinaria', 'computación', 'depreciación acumulada', 'activo fijo',
                       'propiedad planta', 'fixed asset', 'instalación', 'herramienta',
                       'construcción en curso'],
            accountPrefixes: ['1.2.01', '1.02.01', '12', '1201'],
            subtypes: ['FixedAsset']
        },

        // ============ PASIVO ============
        'Proveedores': {
            section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Proveedores',
            keywords: ['cuentas por pagar proveedor', 'proveedores', 'documentos por pagar proveedor',
                       'proveedor nacional', 'proveedor internacional', 'proveedor extranjero',
                       'acreedor comercial'],
            accountPrefixes: ['2.1.01', '2.01.01', '201', '2101'],
            subtypes: ['Payable']
        },
        'Deudas Bancarias CP': {
            section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Deudas Bancarias CP',
            keywords: ['préstamo bancario corto', 'sobregiro', 'crédito bancario corto',
                       'porción corriente', 'línea de crédito', 'pagaré bancario',
                       'obligación bancaria corto'],
            accountPrefixes: ['2.1.02', '2.01.02', '202', '2102'],
            subtypes: ['ShortTermDebt']
        },
        'Deudas Sociales': {
            section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Deudas Sociales',
            keywords: ['sueldo por pagar', 'salario por pagar', 'iess', 'décimo tercer',
                       'décimo cuarto', 'fondo de reserva', 'vacacion', 'participación trabajador',
                       'beneficio social', 'liquidación', 'nómina'],
            accountPrefixes: ['2.1.03', '2.01.03', '203', '2103'],
            subtypes: ['SocialDebt']
        },
        'Deudas Fiscales CP': {
            section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Deudas Fiscales',
            keywords: ['iva cobrado', 'iva por pagar', 'retención iva por pagar',
                       'retención renta por pagar', 'impuesto renta por pagar',
                       'obligación tributaria', 'sri'],
            accountPrefixes: ['2.1.04', '2.01.04', '204', '2104'],
            subtypes: ['TaxDebt']
        },
        'Otras Deudas CP': {
            section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Otras Deudas CP',
            keywords: ['anticipo cliente', 'provisión por pagar', 'otras cuentas por pagar',
                       'acreedores diversos', 'dividendo por pagar', 'ingreso diferido'],
            accountPrefixes: ['2.1.05', '2.01.05', '205', '2105'],
            subtypes: ['OtherCurrentDebt']
        },
        'Deudas Bancarias LP': {
            section: 'Pasivo', subsection: 'Pasivo No Corriente', rubric: 'Deudas Bancarias LP',
            keywords: ['préstamo bancario largo', 'hipoteca', 'obligación largo plazo banco',
                       'cfn', 'crédito largo plazo', 'financiamiento largo'],
            accountPrefixes: ['2.2.01', '2.02.01', '211', '2201'],
            subtypes: ['LongTermDebt']
        },
        'Otras Deudas LP': {
            section: 'Pasivo', subsection: 'Pasivo No Corriente', rubric: 'Otras Deudas LP',
            keywords: ['obligación accionista', 'préstamo relacionado', 'deuda largo plazo otra',
                       'obligación largo plazo', 'bono por pagar'],
            accountPrefixes: ['2.2.02', '2.02.02', '212', '2202'],
            subtypes: ['OtherLTDebt']
        },
        'Deudas Fiscales LP': {
            section: 'Pasivo', subsection: 'Pasivo No Corriente', rubric: 'Deudas Fiscales LP',
            keywords: ['jubilación patronal', 'desahucio', 'provisión largo plazo',
                       'impuesto diferido', 'obligación beneficio definido'],
            accountPrefixes: ['2.2.03', '2.02.03', '213', '2203'],
            subtypes: ['LTTaxDebt']
        },

        // ============ PATRIMONIO ============
        'Capital': {
            section: 'Patrimonio Neto', subsection: 'Patrimonio Neto', rubric: 'Capital',
            keywords: ['capital social', 'capital suscrito', 'capital pagado', 'aporte',
                       'capitalización', 'futuras capitalizaciones'],
            accountPrefixes: ['3.1', '3.01', '301', '3101'],
            subtypes: ['Capital']
        },
        'Ajuste de Capital': {
            section: 'Patrimonio Neto', subsection: 'Patrimonio Neto', rubric: 'Ajuste de Capital',
            keywords: ['ajuste reexpresión', 'superávit revaluación', 'ajuste capital',
                       'otro resultado integral', 'reserva revaluación'],
            accountPrefixes: ['3.2', '3.02', '302', '3201'],
            subtypes: ['CapitalAdjustment']
        },
        'Reservas': {
            section: 'Patrimonio Neto', subsection: 'Patrimonio Neto', rubric: 'Reservas',
            keywords: ['reserva legal', 'reserva facultativa', 'reserva estatutaria',
                       'reserva especial'],
            accountPrefixes: ['3.3', '3.03', '303', '3301'],
            subtypes: ['Reserves']
        },
        'Resultados No Asignados': {
            section: 'Patrimonio Neto', subsection: 'Patrimonio Neto', rubric: 'Resultados No Asignados',
            keywords: ['resultado acumulado', 'utilidad acumulada', 'pérdida acumulada',
                       'resultado ejercicio anterior', 'utilidad retenida', 'retained earnings'],
            accountPrefixes: ['3.4', '3.04', '304', '3401'],
            subtypes: ['RetainedEarnings']
        },

        // ============ INGRESOS ============
        'Ventas': {
            section: 'Resultado', subsection: 'Ingresos', rubric: 'Ventas',
            keywords: ['venta', 'ingreso operacional', 'revenue', 'sales', 'ingreso ordinario'],
            accountPrefixes: ['4.1.01', '4.01.01', '401', '4101'],
            subtypes: ['Sales']
        },
        'Devoluciones Ventas': {
            section: 'Resultado', subsection: 'Ingresos', rubric: 'Devoluciones',
            keywords: ['devolución venta', 'descuento venta', 'rebaja', 'nota crédito venta'],
            accountPrefixes: ['4.1.02', '4.01.02', '402', '4102'],
            subtypes: ['SalesReturns']
        },
        'Ingresos Extraordinarios': {
            section: 'Resultado', subsection: 'Otros Ingresos', rubric: 'Ingresos Extraordinarios',
            keywords: ['interés ganado', 'ganancia venta activo', 'otro ingreso',
                       'ingreso no operacional', 'ingreso financiero', 'rendimiento'],
            accountPrefixes: ['4.2', '4.02', '420', '4201'],
            subtypes: ['ExtraordinaryIncome']
        },

        // ============ COSTOS ============
        'Costo de Ventas': {
            section: 'Resultado', subsection: 'Costos', rubric: 'Costo de Ventas',
            keywords: ['costo mercadería', 'costo venta', 'costo importación', 'flete compra',
                       'seguro importación', 'arancel', 'derecho aduanero', 'desaduanización',
                       'almacenaje importación', 'cogs', 'costo directo'],
            accountPrefixes: ['5.1', '5.01', '501', '5101'],
            subtypes: ['COGS']
        },

        // ============ GASTOS VARIABLES ============
        'Impuesto Ventas': {
            section: 'Resultado', subsection: 'Gastos Variables', rubric: 'Impuesto a las Ventas',
            keywords: ['isd', 'salida divisa', 'impuesto salida'],
            accountPrefixes: ['6.1.01.001'],
            subtypes: ['SalesTax']
        },
        'Otros Impuestos Variables': {
            section: 'Resultado', subsection: 'Gastos Variables', rubric: 'Otros Impuestos Variables',
            keywords: ['fodinfa', 'salvaguardia', 'tasa aduanera'],
            accountPrefixes: ['6.1.01.002'],
            subtypes: ['OtherVariableTax']
        },
        'Comisiones': {
            section: 'Resultado', subsection: 'Gastos Variables', rubric: 'Comisiones',
            keywords: ['comisión venta', 'comisión agente', 'commission'],
            accountPrefixes: ['6.1.02'],
            subtypes: ['Commissions']
        },
        'Publicidad': {
            section: 'Resultado', subsection: 'Gastos Variables', rubric: 'Publicidad',
            keywords: ['publicidad', 'propaganda', 'marketing digital', 'advertising'],
            accountPrefixes: ['6.1.03.001', '6.1.03.002'],
            subtypes: ['Advertising']
        },
        'Otros Gastos Marketing': {
            section: 'Resultado', subsection: 'Gastos Variables', rubric: 'Otros Gastos de Marketing',
            keywords: ['feria', 'exposición', 'material promocional', 'merchandising'],
            accountPrefixes: ['6.1.03.003', '6.1.03.004'],
            subtypes: ['OtherMarketing']
        },

        // ============ GASTOS FIJOS ============
        'Gastos de Estructura': {
            section: 'Resultado', subsection: 'Gastos Fijos', rubric: 'Gastos de Estructura',
            keywords: ['sueldo', 'salario', 'aporte patronal', 'décimo', 'fondo reserva',
                       'vacación', 'alquiler', 'arriendo', 'servicio básico', 'electricidad',
                       'agua', 'teléfono', 'internet', 'honorario', 'auditoría',
                       'suministro oficina', 'mantenimiento', 'reparación', 'seguro general',
                       'impuesto municipal', 'patente', 'seguridad', 'vigilancia',
                       'viaje', 'capacitación', 'software', 'licencia', 'gasto administrativo',
                       'gasto operativo'],
            accountPrefixes: ['6.2', '6.02'],
            subtypes: ['FixedExpense']
        },

        // ============ DEPRECIACIONES ============
        'Depreciaciones': {
            section: 'Resultado', subsection: 'Depreciaciones', rubric: 'Amortizaciones y Depreciaciones',
            keywords: ['depreciación', 'amortización', 'deterioro', 'depreciation'],
            accountPrefixes: ['6.3'],
            subtypes: ['Depreciation']
        },

        // ============ GASTOS FINANCIEROS ============
        'Gastos Financieros': {
            section: 'Resultado', subsection: 'Gastos Financieros', rubric: 'Gastos Financieros',
            keywords: ['interés préstamo', 'comisión bancaria', 'interés mora',
                       'diferencial cambiario', 'gasto financiero', 'costo financiero'],
            accountPrefixes: ['6.4'],
            subtypes: ['FinancialExpense']
        },

        // ============ GASTOS EXTRAORDINARIOS ============
        'Gastos Extraordinarios': {
            section: 'Resultado', subsection: 'Gastos Extraordinarios', rubric: 'Gastos Extraordinarios',
            keywords: ['pérdida venta activo', 'gasto no deducible', 'multa', 'sanción',
                       'gasto extraordinario', 'pérdida'],
            accountPrefixes: ['6.5'],
            subtypes: ['ExtraordinaryExpense']
        },

        // ============ IMPUESTO A LA RENTA ============
        'Impuesto Ganancias': {
            section: 'Resultado', subsection: 'Impuesto', rubric: 'Impuesto a las Ganancias',
            keywords: ['impuesto renta causado', 'participación trabajador 15%',
                       'income tax', 'impuesto ganancia'],
            accountPrefixes: ['6.6'],
            subtypes: ['IncomeTax']
        }
    },

    /**
     * Classify a single account based on rules
     */
    classifyAccount(accountCD, accountName, accountType, accountSubtype) {
        const nameLower = (accountName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cdNorm = (accountCD || '').replace(/[.-]/g, '').trim();

        // First try by subtype (most reliable from OData)
        if (accountSubtype) {
            for (const [category, rule] of Object.entries(this.rules)) {
                if (rule.subtypes && rule.subtypes.includes(accountSubtype)) {
                    return { category, ...rule };
                }
            }
        }

        // Then try by account prefix
        for (const [category, rule] of Object.entries(this.rules)) {
            if (rule.accountPrefixes) {
                for (const prefix of rule.accountPrefixes) {
                    const normPrefix = prefix.replace(/[.-]/g, '');
                    if (cdNorm.startsWith(normPrefix)) {
                        return { category, ...rule };
                    }
                }
            }
        }

        // Then try by keywords in account name
        let bestMatch = null;
        let bestScore = 0;
        for (const [category, rule] of Object.entries(this.rules)) {
            if (rule.keywords) {
                let score = 0;
                for (const kw of rule.keywords) {
                    const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (nameLower.includes(kwNorm)) {
                        score += kw.length; // longer keyword = more specific match
                    }
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { category, ...rule };
                }
            }
        }

        if (bestMatch) return bestMatch;

        // Fallback based on account type
        const typeMap = {
            'Asset': { category: 'Otros Créditos', section: 'Activo', subsection: 'Activo Corriente', rubric: 'Otros Créditos' },
            'Liability': { category: 'Otras Deudas CP', section: 'Pasivo', subsection: 'Pasivo Corriente', rubric: 'Otras Deudas CP' },
            'Equity': { category: 'Resultados No Asignados', section: 'Patrimonio Neto', subsection: 'Patrimonio Neto', rubric: 'Resultados No Asignados' },
            'Revenue': { category: 'Ingresos Extraordinarios', section: 'Resultado', subsection: 'Otros Ingresos', rubric: 'Ingresos Extraordinarios' },
            'Expense': { category: 'Gastos de Estructura', section: 'Resultado', subsection: 'Gastos Fijos', rubric: 'Gastos de Estructura' }
        };

        return typeMap[accountType] || { category: 'Sin Clasificar', section: 'Otros', subsection: 'Otros', rubric: 'Sin Clasificar' };
    },

    /**
     * Process all transactions and classify accounts
     * Returns organized data for financial statements
     */

    /** Safely parse a numeric value (handles strings from OData) */
    _num(value) {
        if (value == null) return 0;
        const n = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
        return isNaN(n) ? 0 : n;
    },

    /**
     * Auto-detect field mapping from the first OData record.
     * Uses case-insensitive substring matching to find the right fields.
     */
    _fieldMap: null,

    _detectFields(sample) {
        const keys = Object.keys(sample);
        const lower = keys.map(k => k.toLowerCase());

        const find = (...patterns) => {
            for (const p of patterns) {
                const idx = lower.findIndex(l => l === p.toLowerCase());
                if (idx !== -1) return keys[idx];
            }
            // Partial/substring match as fallback
            for (const p of patterns) {
                const pl = p.toLowerCase();
                const idx = lower.findIndex(l => l.includes(pl) || pl.includes(l));
                if (idx !== -1) return keys[idx];
            }
            return null;
        };

        this._fieldMap = {
            accountCD:   find('AccountCD', 'Account', 'AccountID', 'AccountCode', 'AcctCD', 'Acct'),
            accountName: find('AccountDescription', 'AccountName', 'AcctName', 'AccountDesc'),
            accountType: find('AccountType', 'AcctType', 'Type'),
            accountSubtype: find('AccountSubtype', 'Subtype', 'SubType', 'AcctSubtype'),
            date:        find('TranDate', 'TransactionDate', 'Date', 'TranPeriod', 'FinPeriodID'),
            description: find('Description', 'TranDesc', 'Memo', 'LineDescription'),
            debit:       find('DebitAmount', 'Debit', 'DebitTotal', 'DebitAmt', 'DrAmt',
                              'CuryDebitAmt', 'CuryDebitTotal'),
            credit:      find('CreditAmount', 'Credit', 'CreditTotal', 'CreditAmt', 'CrAmt',
                              'CuryCreditAmt', 'CuryCreditTotal'),
            balance:     find('Amount', 'Balance', 'EndBalance', 'EndBal', 'BegBalance',
                              'CuryEndBalance', 'SignedAmount', 'TranAmount'),
        };

        // Log the mapping for debugging
        console.log('=== MAPEO DE CAMPOS DETECTADO ===');
        console.log('Campos en OData:', keys);
        for (const [role, field] of Object.entries(this._fieldMap)) {
            const val = field ? sample[field] : undefined;
            console.log(`  ${role}: ${field || '⚠ NO ENCONTRADO'} ${field ? `= ${JSON.stringify(val)} (${typeof val})` : ''}`);
        }

        // If no debit/credit found, try to find ANY numeric fields and warn
        if (!this._fieldMap.debit && !this._fieldMap.credit && !this._fieldMap.balance) {
            console.warn('⚠ No se detectaron campos de monto. Campos numéricos disponibles:');
            keys.forEach(k => {
                const v = sample[k];
                if (v != null && !isNaN(parseFloat(v)) && typeof v !== 'boolean') {
                    console.warn(`  → ${k} = ${v} (${typeof v})`);
                }
            });
        }

        return this._fieldMap;
    },

    /** Get a field value from a transaction using the auto-detected mapping */
    _get(txn, role) {
        const fieldName = this._fieldMap[role];
        return fieldName ? txn[fieldName] : undefined;
    },

    processTransactions(transactions, year, month) {
        const accountBalances = {};
        const monthlyData = {};
        this._fieldMap = null; // reset

        if (!transactions || transactions.length === 0) {
            console.warn('[Classifier] No hay transacciones para procesar');
            return { accountBalances, monthlyData };
        }

        // Auto-detect fields from first record
        this._detectFields(transactions[0]);
        console.log(`[Classifier] Procesando ${transactions.length} transacciones...`);

        // Track stats for debugging
        let processed = 0, skippedDate = 0, nonZero = 0;

        for (const txn of transactions) {
            const acctCD = String(this._get(txn, 'accountCD') || '');
            const acctName = String(this._get(txn, 'accountName') || this._get(txn, 'description') || '');
            const acctType = String(this._get(txn, 'accountType') || '');
            const acctSubtype = String(this._get(txn, 'accountSubtype') || '');

            // Parse date
            const rawDate = this._get(txn, 'date');
            const txnDate = new Date(rawDate);

            if (isNaN(txnDate)) { skippedDate++; continue; }

            const txnYear = txnDate.getFullYear();
            const txnMonth = txnDate.getMonth() + 1;
            const period = `${txnYear}-${String(txnMonth).padStart(2, '0')}`;

            const classification = this.classifyAccount(acctCD, acctName, acctType, acctSubtype);
            const key = acctCD || acctName;
            if (!key) continue;

            if (!accountBalances[key]) {
                accountBalances[key] = {
                    accountCD: acctCD,
                    accountName: acctName,
                    accountType: acctType,
                    classification: classification,
                    balance: 0,
                    debit: 0,
                    credit: 0,
                    monthlyBalances: {}
                };
            }

            // Parse numeric values safely (parseFloat handles strings)
            const debitAmt = this._num(this._get(txn, 'debit'));
            const creditAmt = this._num(this._get(txn, 'credit'));

            // IMPORTE = Débito - Crédito (siempre calculado, nunca depende de campo "Amount")
            const amount = debitAmt - creditAmt;

            if (amount !== 0) nonZero++;

            accountBalances[key].balance += amount;
            accountBalances[key].debit += debitAmt;
            accountBalances[key].credit += creditAmt;

            processed++;

            if (!accountBalances[key].monthlyBalances[period]) {
                accountBalances[key].monthlyBalances[period] = 0;
            }
            if (['Revenue', 'Expense'].includes(acctType)) {
                accountBalances[key].monthlyBalances[period] += Math.abs(amount);
            } else {
                accountBalances[key].monthlyBalances[period] = amount;
            }

            // Monthly aggregation
            if (!monthlyData[period]) {
                monthlyData[period] = { revenue: 0, cogs: 0, variableExp: 0, fixedExp: 0,
                    depreciation: 0, financial: 0, extraordinary: 0, extraIncome: 0, tax: 0 };
            }
            const absAmount = Math.abs(amount);
            const sub = classification.subsection || '';
            if (classification.rubric === 'Ventas') monthlyData[period].revenue += absAmount;
            else if (classification.rubric === 'Devoluciones') monthlyData[period].revenue -= absAmount;
            else if (classification.rubric === 'Costo de Ventas') monthlyData[period].cogs += absAmount;
            else if (sub === 'Gastos Variables') monthlyData[period].variableExp += absAmount;
            else if (sub === 'Gastos Fijos') monthlyData[period].fixedExp += absAmount;
            else if (sub === 'Depreciaciones') monthlyData[period].depreciation += absAmount;
            else if (sub === 'Gastos Financieros') monthlyData[period].financial += absAmount;
            else if (sub === 'Gastos Extraordinarios') monthlyData[period].extraordinary += absAmount;
            else if (classification.rubric === 'Ingresos Extraordinarios') monthlyData[period].extraIncome += absAmount;
            else if (sub === 'Impuesto') monthlyData[period].tax += absAmount;
        }

        // Resumen de diagnóstico
        const totalAccounts = Object.keys(accountBalances).length;
        const accountsWithBalance = Object.values(accountBalances).filter(a => a.balance !== 0).length;
        console.log('=== RESUMEN PROCESAMIENTO ===');
        console.log(`  Transacciones procesadas: ${processed}`);
        console.log(`  Transacciones sin fecha válida: ${skippedDate}`);
        console.log(`  Transacciones con importe ≠ 0: ${nonZero}`);
        console.log(`  Cuentas únicas: ${totalAccounts}`);
        console.log(`  Cuentas con saldo ≠ 0: ${accountsWithBalance}`);

        if (nonZero === 0 && processed > 0) {
            console.error('⚠⚠⚠ TODAS las transacciones tienen importe 0.');
            console.error('Los campos de débito/crédito probablemente NO se están leyendo.');
            console.error('Ejecute ODataService.diagnose() en la consola para ver los campos reales.');
            // Log first 3 raw records for inspection
            console.error('Primeros 3 registros crudos:');
            transactions.slice(0, 3).forEach((t, i) => {
                console.error(`Registro ${i + 1}:`, JSON.stringify(t));
            });
        }

        // Log top 5 accounts by absolute balance
        const topAccounts = Object.values(accountBalances)
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
            .slice(0, 5);
        if (topAccounts.length > 0) {
            console.log('  Top 5 cuentas por saldo:');
            topAccounts.forEach(a => {
                console.log(`    ${a.accountCD} ${a.accountName}: Saldo=${a.balance.toFixed(2)} D=${a.debit.toFixed(2)} C=${a.credit.toFixed(2)}`);
            });
        }

        return { accountBalances, monthlyData };
    },

    /**
     * Build the complete balance sheet structure
     */
    buildBalanceSheet(accountBalances, year) {
        const structure = {
            activo: {
                'Activo Corriente': {
                    'Disponibilidades': [],
                    'Inversiones Transitorias': [],
                    'Créditos': [],
                    'Bienes de Cambio': [],
                    'Otros Créditos': []
                },
                'Activo No Corriente': {
                    'Bienes de Uso': []
                }
            },
            pasivo: {
                'Pasivo Corriente': {
                    'Proveedores': [],
                    'Deudas Bancarias CP': [],
                    'Deudas Sociales': [],
                    'Deudas Fiscales': [],
                    'Otras Deudas CP': []
                },
                'Pasivo No Corriente': {
                    'Deudas Bancarias LP': [],
                    'Otras Deudas LP': [],
                    'Deudas Fiscales LP': []
                }
            },
            patrimonio: {
                'Patrimonio Neto': {
                    'Capital': [],
                    'Ajuste de Capital': [],
                    'Resultados No Asignados': [],
                    'Reservas': [],
                    'Resultado del Ejercicio': []
                }
            }
        };

        for (const [key, acct] of Object.entries(accountBalances)) {
            const cls = acct.classification;
            if (!cls || cls.section === 'Resultado') continue;

            const entry = {
                code: acct.accountCD,
                name: acct.accountName,
                balance: Math.abs(acct.balance),
                rawBalance: acct.balance
            };

            if (cls.section === 'Activo') {
                const sub = cls.subsection === 'Activo No Corriente' ? 'Activo No Corriente' : 'Activo Corriente';
                const rubric = cls.rubric;
                if (structure.activo[sub] && structure.activo[sub][rubric]) {
                    structure.activo[sub][rubric].push(entry);
                }
            } else if (cls.section === 'Pasivo') {
                const sub = cls.subsection === 'Pasivo No Corriente' ? 'Pasivo No Corriente' : 'Pasivo Corriente';
                const rubric = cls.rubric;
                if (structure.pasivo[sub] && structure.pasivo[sub][rubric]) {
                    structure.pasivo[sub][rubric].push(entry);
                }
            } else if (cls.section === 'Patrimonio Neto') {
                const rubric = cls.rubric;
                if (structure.patrimonio['Patrimonio Neto'][rubric]) {
                    structure.patrimonio['Patrimonio Neto'][rubric].push(entry);
                }
            }
        }

        return structure;
    },

    /**
     * Build the income statement structure
     */
    buildIncomeStatement(accountBalances, year) {
        const groups = {
            ventas: [], devolucionesVentas: [],
            costoVentas: [],
            impuestoVentas: [], otrosImpuestosVar: [],
            comisiones: [], publicidad: [], otrosMarketing: [],
            gastosEstructura: [],
            depreciaciones: [],
            gastosFinancieros: [],
            ingresosExtraordinarios: [], gastosExtraordinarios: [],
            impuestoGanancias: []
        };

        for (const [key, acct] of Object.entries(accountBalances)) {
            const cls = acct.classification;
            if (cls.section !== 'Resultado') continue;

            // Accumulate year amounts
            let yearTotal = 0;
            for (const [period, amount] of Object.entries(acct.monthlyBalances)) {
                if (period.startsWith(String(year))) {
                    yearTotal += amount;
                }
            }

            const entry = {
                code: acct.accountCD,
                name: acct.accountName,
                amount: yearTotal || Math.abs(acct.balance)
            };

            switch (cls.rubric) {
                case 'Ventas': groups.ventas.push(entry); break;
                case 'Devoluciones': groups.devolucionesVentas.push(entry); break;
                case 'Costo de Ventas': groups.costoVentas.push(entry); break;
                case 'Impuesto a las Ventas': groups.impuestoVentas.push(entry); break;
                case 'Otros Impuestos Variables': groups.otrosImpuestosVar.push(entry); break;
                case 'Comisiones': groups.comisiones.push(entry); break;
                case 'Publicidad': groups.publicidad.push(entry); break;
                case 'Otros Gastos de Marketing': groups.otrosMarketing.push(entry); break;
                case 'Gastos de Estructura': groups.gastosEstructura.push(entry); break;
                case 'Amortizaciones y Depreciaciones': groups.depreciaciones.push(entry); break;
                case 'Gastos Financieros': groups.gastosFinancieros.push(entry); break;
                case 'Ingresos Extraordinarios': groups.ingresosExtraordinarios.push(entry); break;
                case 'Gastos Extraordinarios': groups.gastosExtraordinarios.push(entry); break;
                case 'Impuesto a las Ganancias': groups.impuestoGanancias.push(entry); break;
            }
        }

        const sum = arr => arr.reduce((s, a) => s + a.amount, 0);

        const ventasNetas = sum(groups.ventas) - sum(groups.devolucionesVentas);
        const costoVentas = sum(groups.costoVentas);
        const utilidadBruta = ventasNetas - costoVentas;

        const otrosCostosVar = sum(groups.impuestoVentas) + sum(groups.otrosImpuestosVar) +
            sum(groups.comisiones) + sum(groups.publicidad) + sum(groups.otrosMarketing);
        const utilidadMarginal = utilidadBruta - otrosCostosVar;

        const gastosEstructura = sum(groups.gastosEstructura);
        const ebitda = utilidadMarginal - gastosEstructura;

        const depreciaciones = sum(groups.depreciaciones);
        const ebit = ebitda - depreciaciones;

        const gastosFinancieros = sum(groups.gastosFinancieros);
        const ebt = ebit - gastosFinancieros;

        const ingresosExtra = sum(groups.ingresosExtraordinarios);
        const gastosExtra = sum(groups.gastosExtraordinarios);
        const ebtImponible = ebt + ingresosExtra - gastosExtra;

        // Ecuador: 15% workers participation + 25% income tax
        const participacionTrabajadores = Math.max(ebtImponible * 0.15, 0);
        const baseImponible = ebtImponible - participacionTrabajadores;
        const impuestoRenta = Math.max(baseImponible * 0.25, 0);
        const impuestoTotal = participacionTrabajadores + impuestoRenta;

        const resultadoEjercicio = ebtImponible - impuestoTotal;

        return {
            groups,
            totals: {
                ventasBrutas: sum(groups.ventas),
                devoluciones: sum(groups.devolucionesVentas),
                ventasNetas,
                costoVentas,
                utilidadBruta,
                impuestoVentas: sum(groups.impuestoVentas),
                otrosImpuestosVar: sum(groups.otrosImpuestosVar),
                comisiones: sum(groups.comisiones),
                publicidad: sum(groups.publicidad),
                otrosMarketing: sum(groups.otrosMarketing),
                otrosCostosVar,
                utilidadMarginal,
                gastosEstructura,
                ebitda,
                depreciaciones,
                ebit,
                gastosFinancieros,
                ebt,
                ingresosExtra,
                gastosExtra,
                ebtImponible,
                participacionTrabajadores,
                impuestoRenta,
                impuestoTotal,
                resultadoEjercicio
            }
        };
    }
};
