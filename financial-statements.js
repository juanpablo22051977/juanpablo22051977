/**
 * Financial Statements Renderer
 * Renders Balance Sheet and Income Statement in the UI
 */
const FinancialStatements = {

    formatCurrency(amount) {
        const sign = amount < 0 ? '-' : '';
        const abs = Math.abs(amount);
        return sign + '$' + abs.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /**
     * Render the Balance Sheet (Estado de Situación Patrimonial)
     */
    renderBalanceSheet(balanceSheet, incomeStatement, year) {
        document.getElementById('balance-date').textContent =
            `Al 31 de Diciembre de ${year}`;

        const resultadoEjercicio = incomeStatement.totals.resultadoEjercicio;

        // Render ACTIVO
        let activoHTML = '';
        let totalActivo = 0;

        for (const [subsection, rubrics] of Object.entries(balanceSheet.activo)) {
            activoHTML += `<div class="subsection-header">${subsection}</div>`;
            let subtotal = 0;
            for (const [rubric, accounts] of Object.entries(rubrics)) {
                if (accounts.length === 0) continue;
                activoHTML += `<div class="rubric-header">${rubric}</div>`;
                let rubricTotal = 0;
                for (const acct of accounts) {
                    const bal = acct.rawBalance;
                    rubricTotal += bal;
                    activoHTML += `<div class="account-row">
                        <span title="${acct.code}">${acct.name}</span>
                        <span>${this.formatCurrency(bal)}</span>
                    </div>`;
                }
                activoHTML += `<div class="subtotal-row">
                    <span>Total ${rubric}</span>
                    <span>${this.formatCurrency(rubricTotal)}</span>
                </div>`;
                subtotal += rubricTotal;
            }
            activoHTML += `<div class="subtotal-row" style="font-weight:700; border-top: 2px solid #2b6cb0;">
                <span>Total ${subsection}</span>
                <span>${this.formatCurrency(subtotal)}</span>
            </div>`;
            totalActivo += subtotal;
        }
        document.getElementById('activo-section').innerHTML = activoHTML;
        document.getElementById('total-activo').textContent = this.formatCurrency(totalActivo);

        // Render PASIVO
        let pasivoHTML = '';
        let totalPasivo = 0;

        for (const [subsection, rubrics] of Object.entries(balanceSheet.pasivo)) {
            pasivoHTML += `<div class="subsection-header">${subsection}</div>`;
            let subtotal = 0;
            for (const [rubric, accounts] of Object.entries(rubrics)) {
                if (accounts.length === 0) continue;
                pasivoHTML += `<div class="rubric-header">${rubric}</div>`;
                let rubricTotal = 0;
                for (const acct of accounts) {
                    rubricTotal += acct.balance;
                    pasivoHTML += `<div class="account-row">
                        <span title="${acct.code}">${acct.name}</span>
                        <span>${this.formatCurrency(acct.balance)}</span>
                    </div>`;
                }
                pasivoHTML += `<div class="subtotal-row">
                    <span>Total ${rubric}</span>
                    <span>${this.formatCurrency(rubricTotal)}</span>
                </div>`;
                subtotal += rubricTotal;
            }
            pasivoHTML += `<div class="subtotal-row" style="font-weight:700; border-top: 2px solid #c53030;">
                <span>Total ${subsection}</span>
                <span>${this.formatCurrency(subtotal)}</span>
            </div>`;
            totalPasivo += subtotal;
        }
        document.getElementById('pasivo-section').innerHTML = pasivoHTML;
        document.getElementById('total-pasivo').textContent = this.formatCurrency(totalPasivo);

        // Render PATRIMONIO
        let patrimonioHTML = '';
        let totalPatrimonio = 0;

        for (const [subsection, rubrics] of Object.entries(balanceSheet.patrimonio)) {
            for (const [rubric, accounts] of Object.entries(rubrics)) {
                if (rubric === 'Resultado del Ejercicio') {
                    patrimonioHTML += `<div class="rubric-header">${rubric}</div>`;
                    patrimonioHTML += `<div class="account-row" style="font-weight:600; color: ${resultadoEjercicio >= 0 ? '#38a169' : '#e53e3e'}">
                        <span>Resultado del Ejercicio ${year}</span>
                        <span>${this.formatCurrency(resultadoEjercicio)}</span>
                    </div>`;
                    totalPatrimonio += resultadoEjercicio;
                    continue;
                }
                if (accounts.length === 0) continue;
                patrimonioHTML += `<div class="rubric-header">${rubric}</div>`;
                let rubricTotal = 0;
                for (const acct of accounts) {
                    rubricTotal += acct.balance;
                    patrimonioHTML += `<div class="account-row">
                        <span title="${acct.code}">${acct.name}</span>
                        <span>${this.formatCurrency(acct.balance)}</span>
                    </div>`;
                }
                patrimonioHTML += `<div class="subtotal-row">
                    <span>Total ${rubric}</span>
                    <span>${this.formatCurrency(rubricTotal)}</span>
                </div>`;
                totalPatrimonio += rubricTotal;
            }
        }
        document.getElementById('patrimonio-section').innerHTML = patrimonioHTML;
        document.getElementById('total-patrimonio').textContent = this.formatCurrency(totalPatrimonio);

        const totalPasivoPatrimonio = totalPasivo + totalPatrimonio;
        document.getElementById('total-pasivo-patrimonio').textContent = this.formatCurrency(totalPasivoPatrimonio);

        // Balance check
        const diff = Math.abs(totalActivo - totalPasivoPatrimonio);
        const checkEl = document.getElementById('balance-check');
        if (diff < 1) {
            checkEl.className = 'balance-check balanced';
            checkEl.innerHTML = `&#10004; Partida doble verificada: Activo (${this.formatCurrency(totalActivo)}) = Pasivo + Patrimonio (${this.formatCurrency(totalPasivoPatrimonio)})`;
        } else {
            checkEl.className = 'balance-check unbalanced';
            checkEl.innerHTML = `&#9888; Diferencia detectada: Activo (${this.formatCurrency(totalActivo)}) vs Pasivo + Patrimonio (${this.formatCurrency(totalPasivoPatrimonio)}) — Diferencia: ${this.formatCurrency(diff)}`;
        }

        // Classification detail table
        this.renderClassificationDetail(balanceSheet);

        return { totalActivo, totalPasivo, totalPatrimonio, totalPasivoPatrimonio };
    },

    renderClassificationDetail(balanceSheet) {
        let rows = '';
        const processSection = (sectionData, sectionName) => {
            for (const [sub, rubrics] of Object.entries(sectionData)) {
                for (const [rubric, accounts] of Object.entries(rubrics)) {
                    for (const acct of accounts) {
                        rows += `<tr>
                            <td>${acct.code}</td>
                            <td>${acct.name}</td>
                            <td class="cat-cell">${sectionName}</td>
                            <td>${sub}</td>
                            <td>${rubric}</td>
                            <td style="text-align:right">${this.formatCurrency(acct.rawBalance || acct.balance)}</td>
                        </tr>`;
                    }
                }
            }
        };

        processSection(balanceSheet.activo, 'Activo');
        processSection(balanceSheet.pasivo, 'Pasivo');
        processSection(balanceSheet.patrimonio, 'Patrimonio');

        document.getElementById('classification-detail').innerHTML = `
            <table class="classification-table">
                <thead><tr>
                    <th>Código</th><th>Cuenta</th><th>Sección</th>
                    <th>Subsección</th><th>Rubro</th><th>Saldo</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    },

    /**
     * Render the Income Statement (Estado de Resultados)
     */
    renderIncomeStatement(incomeStatement, year) {
        document.getElementById('income-period').textContent =
            `Período: Enero - Diciembre ${year}`;

        const t = incomeStatement.totals;
        const g = incomeStatement.groups;
        const fc = this.formatCurrency;

        let html = '';

        const addRow = (label, amount, cls = '') => {
            const colorCls = amount >= 0 ? '' : 'negative';
            html += `<div class="income-row ${cls}">
                <span>${label}</span>
                <span class="${colorCls}">${fc(amount)}</span>
            </div>`;
        };
        const addDetail = (items) => {
            for (const item of items) {
                html += `<div class="income-row detail">
                    <span>${item.name}</span>
                    <span>${fc(item.amount)}</span>
                </div>`;
            }
        };

        // VENTAS
        addRow('VENTAS BRUTAS', t.ventasBrutas, 'header-row');
        addDetail(g.ventas);
        if (g.devolucionesVentas.length > 0) {
            addRow('(-) Devoluciones y Descuentos', -t.devoluciones);
            addDetail(g.devolucionesVentas);
        }
        html += '<hr class="income-separator">';
        addRow('VENTAS NETAS', t.ventasNetas, 'subtotal-row');

        // COSTO DE VENTAS
        html += '<br>';
        addRow('(-) COSTO DE VENTAS', -t.costoVentas, 'header-row');
        addDetail(g.costoVentas);
        html += '<hr class="income-double-line">';
        addRow('UTILIDAD BRUTA', t.utilidadBruta, 'subtotal-row');

        // OTROS COSTOS VARIABLES
        html += '<br>';
        addRow('(-) OTROS COSTOS VARIABLES', -t.otrosCostosVar, 'header-row');
        if (g.impuestoVentas.length > 0) {
            html += `<div class="income-row detail" style="font-style:italic; color:#744210">Impuesto a las Ventas</div>`;
            addDetail(g.impuestoVentas);
        }
        if (g.otrosImpuestosVar.length > 0) {
            html += `<div class="income-row detail" style="font-style:italic; color:#744210">Otros Impuestos Variables</div>`;
            addDetail(g.otrosImpuestosVar);
        }
        if (g.comisiones.length > 0) {
            html += `<div class="income-row detail" style="font-style:italic; color:#744210">Comisiones</div>`;
            addDetail(g.comisiones);
        }
        if (g.publicidad.length > 0) {
            html += `<div class="income-row detail" style="font-style:italic; color:#744210">Publicidad</div>`;
            addDetail(g.publicidad);
        }
        if (g.otrosMarketing.length > 0) {
            html += `<div class="income-row detail" style="font-style:italic; color:#744210">Otros Gastos de Marketing</div>`;
            addDetail(g.otrosMarketing);
        }
        html += '<hr class="income-double-line">';
        addRow('UTILIDAD MARGINAL (Margen de Contribución)', t.utilidadMarginal, 'subtotal-row');

        // GASTOS DE ESTRUCTURA
        html += '<br>';
        addRow('(-) GASTOS DE ESTRUCTURA (Costos Fijos)', -t.gastosEstructura, 'header-row');
        addDetail(g.gastosEstructura);
        html += '<hr class="income-double-line">';
        addRow('EBITDA', t.ebitda, 'subtotal-row');

        // DEPRECIACIONES
        html += '<br>';
        addRow('(-) Amortizaciones y Depreciaciones', -t.depreciaciones, 'header-row');
        addDetail(g.depreciaciones);
        html += '<hr class="income-separator">';
        addRow('EBIT (Resultado Operativo)', t.ebit, 'subtotal-row');

        // GASTOS FINANCIEROS
        html += '<br>';
        addRow('(-) Gastos Financieros', -t.gastosFinancieros, 'header-row');
        addDetail(g.gastosFinancieros);
        html += '<hr class="income-separator">';
        addRow('EBT (Resultado antes de Impuestos)', t.ebt, 'subtotal-row');

        // EXTRAORDINARIOS
        html += '<br>';
        if (g.ingresosExtraordinarios.length > 0) {
            addRow('(+) Ingresos Extraordinarios', t.ingresosExtra, 'header-row');
            addDetail(g.ingresosExtraordinarios);
        }
        if (g.gastosExtraordinarios.length > 0) {
            addRow('(-) Gastos Extraordinarios', -t.gastosExtra, 'header-row');
            addDetail(g.gastosExtraordinarios);
        }
        html += '<hr class="income-separator">';
        addRow('EBT IMPONIBLE', t.ebtImponible, 'subtotal-row');

        // IMPUESTOS
        html += '<br>';
        addRow('(-) Participación Trabajadores 15%', -t.participacionTrabajadores);
        addRow('(-) Impuesto a la Renta 25%', -t.impuestoRenta);
        html += '<hr class="income-double-line">';

        // RESULTADO FINAL
        addRow('RESULTADO DEL EJERCICIO (Utilidad Neta)', t.resultadoEjercicio, 'major-total');

        document.getElementById('income-statement').innerHTML = html;
    }
};
