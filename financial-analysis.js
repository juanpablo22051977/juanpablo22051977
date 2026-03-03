/**
 * Financial Analysis Module
 * DuPont (5 components), Altman Z-Score, Break-Even, EVA, CCC, and more
 */
const FinancialAnalysis = {

    fc(amount) {
        const sign = amount < 0 ? '-' : '';
        return sign + '$' + Math.abs(amount).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    pct(value) {
        return (value * 100).toFixed(2) + '%';
    },

    /**
     * Calculate all financial metrics
     */
    calculate(balanceSheetTotals, incomeStatement, balanceSheet, accountBalances) {
        const t = incomeStatement.totals;
        const bs = balanceSheetTotals;

        // Helper sums from balance sheet
        const sumRubric = (section, rubric) => {
            for (const [sub, rubrics] of Object.entries(section)) {
                if (rubrics[rubric]) {
                    return rubrics[rubric].reduce((s, a) => s + (a.rawBalance || a.balance), 0);
                }
            }
            return 0;
        };

        const activoCorriente = (() => {
            let total = 0;
            for (const rubrics of Object.values(balanceSheet.activo['Activo Corriente'] || {})) {
                total += rubrics.reduce((s, a) => s + (a.rawBalance || a.balance), 0);
            }
            return total;
        })();

        const pasivoCorriente = (() => {
            let total = 0;
            for (const rubrics of Object.values(balanceSheet.pasivo['Pasivo Corriente'] || {})) {
                total += rubrics.reduce((s, a) => s + a.balance, 0);
            }
            return total;
        })();

        const pasivoNoCorriente = (() => {
            let total = 0;
            for (const rubrics of Object.values(balanceSheet.pasivo['Pasivo No Corriente'] || {})) {
                total += rubrics.reduce((s, a) => s + a.balance, 0);
            }
            return total;
        })();

        const disponibilidades = sumRubric(balanceSheet.activo, 'Disponibilidades');
        const inventarios = sumRubric(balanceSheet.activo, 'Bienes de Cambio');
        const cuentasPorCobrar = sumRubric(balanceSheet.activo, 'Créditos');
        const cuentasPorPagar = sumRubric(balanceSheet.pasivo, 'Proveedores');
        const deudasBancariasCP = sumRubric(balanceSheet.pasivo, 'Deudas Bancarias CP');
        const deudasBancariasLP = sumRubric(balanceSheet.pasivo, 'Deudas Bancarias LP');

        const totalActivo = bs.totalActivo;
        const totalPasivo = bs.totalPasivo;
        const totalPatrimonio = bs.totalPatrimonio;
        const ventas = t.ventasNetas;
        const utilidadNeta = t.resultadoEjercicio;
        const ebit = t.ebit;
        const ebitda = t.ebitda;
        const ebt = t.ebtImponible;
        const costoVentas = t.costoVentas;

        // Capital de Trabajo
        const capitalTrabajo = activoCorriente - pasivoCorriente;

        // ==============================
        // A) DUPONT - 5 Components
        // ==============================
        const taxBurden = ebt !== 0 ? utilidadNeta / ebt : 0;           // 1. Tax Burden (Carga Fiscal)
        const interestBurden = ebit !== 0 ? ebt / ebit : 0;             // 2. Interest Burden (Carga de Intereses)
        const operatingMargin = ventas !== 0 ? ebit / ventas : 0;        // 3. Operating Margin (Margen Operativo)
        const assetTurnover = totalActivo !== 0 ? ventas / totalActivo : 0; // 4. Asset Turnover (Rotación de Activos)
        const equityMultiplier = totalPatrimonio !== 0 ? totalActivo / totalPatrimonio : 0; // 5. Equity Multiplier (Apalancamiento)

        const roe = taxBurden * interestBurden * operatingMargin * assetTurnover * equityMultiplier;
        const roa = operatingMargin * assetTurnover; // or EBIT/Assets
        const roaNet = totalActivo !== 0 ? utilidadNeta / totalActivo : 0;

        const dupont = {
            taxBurden, interestBurden, operatingMargin, assetTurnover, equityMultiplier,
            roe, roa, roaNet,
            netMargin: ventas !== 0 ? utilidadNeta / ventas : 0,
            rotation: assetTurnover
        };

        // ==============================
        // B) ALTMAN Z-SCORE
        // ==============================
        const x1 = totalActivo !== 0 ? capitalTrabajo / totalActivo : 0;
        const x2 = totalActivo !== 0 ? (totalPatrimonio - 400000) / totalActivo : 0; // Retained earnings proxy
        const x3 = totalActivo !== 0 ? ebit / totalActivo : 0;
        const x4 = totalPasivo !== 0 ? totalPatrimonio / totalPasivo : 0;
        const x5 = totalActivo !== 0 ? ventas / totalActivo : 0;

        // Z' model for private companies (manufacturing/trade)
        const zScore = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5;

        let zZone, zColor;
        if (zScore > 2.9) { zZone = 'Zona Segura'; zColor = '#38a169'; }
        else if (zScore > 1.23) { zZone = 'Zona Gris (Precaución)'; zColor = '#d69e2e'; }
        else { zZone = 'Zona de Peligro'; zColor = '#e53e3e'; }

        const altman = { x1, x2, x3, x4, x5, zScore, zZone, zColor };

        // ==============================
        // C) BREAK-EVEN
        // ==============================
        const costosVariables = t.costoVentas + t.otrosCostosVar;
        const costosFijos = t.gastosEstructura + t.depreciaciones;
        const ratioVariable = ventas !== 0 ? costosVariables / ventas : 0;
        const margenContribucion = 1 - ratioVariable;

        // Economic Break-Even
        const puntoEquilibrioEco = margenContribucion !== 0 ? costosFijos / margenContribucion : 0;

        // Financial Break-Even (includes all cash outflows)
        const egresosCaja = costosFijos - t.depreciaciones + t.gastosFinancieros +
            t.participacionTrabajadores + t.impuestoRenta;
        const puntoEquilibrioFin = margenContribucion !== 0 ? egresosCaja / margenContribucion : 0;

        const breakeven = {
            costosVariables, costosFijos, ratioVariable, margenContribucion,
            puntoEquilibrioEco, puntoEquilibrioFin, egresosCaja
        };

        // ==============================
        // D) EVA - Economic Value Added
        // ==============================
        const deudaTotal = deudasBancariasCP + deudasBancariasLP;
        const costOfDebt = deudaTotal !== 0 ? t.gastosFinancieros / deudaTotal : 0.08;
        const taxRate = ebt !== 0 ? t.impuestoTotal / ebt : 0.3625; // Ecuador: 15% + 25%
        const costOfDebtAfterTax = costOfDebt * (1 - taxRate);

        // Cost of equity using CAPM simplified (Ecuador risk premium)
        const riskFreeRate = 0.045;  // Ecuador bonds
        const marketPremium = 0.08;  // Market risk premium
        const beta = 1.1;           // Import company beta
        const costOfEquity = riskFreeRate + beta * marketPremium;

        const capitalInvertido = deudaTotal + totalPatrimonio;
        const weightDebt = capitalInvertido !== 0 ? deudaTotal / capitalInvertido : 0;
        const weightEquity = capitalInvertido !== 0 ? totalPatrimonio / capitalInvertido : 0;
        const wacc = weightDebt * costOfDebtAfterTax + weightEquity * costOfEquity;

        const nopat = ebit * (1 - taxRate);
        const eva = nopat - (capitalInvertido * wacc);

        const evaData = {
            nopat, wacc, capitalInvertido, eva,
            costOfDebt, costOfDebtAfterTax, costOfEquity,
            weightDebt, weightEquity, deudaTotal, taxRate
        };

        // ==============================
        // F) CASH CONVERSION CYCLE
        // ==============================
        const daysInventory = costoVentas !== 0 ? (inventarios / costoVentas) * 365 : 0;
        const daysReceivable = ventas !== 0 ? (Math.abs(cuentasPorCobrar) / ventas) * 365 : 0;
        const daysPayable = costoVentas !== 0 ? (cuentasPorPagar / costoVentas) * 365 : 0;
        const ccc = daysInventory + daysReceivable - daysPayable;

        const cashCycle = { daysInventory, daysReceivable, daysPayable, ccc };

        // ==============================
        // ADDITIONAL INDICATORS
        // ==============================
        const liquidezCorriente = pasivoCorriente !== 0 ? activoCorriente / pasivoCorriente : 0;
        const pruebaAcida = pasivoCorriente !== 0 ? (activoCorriente - inventarios) / pasivoCorriente : 0;
        const liquidezAbsoluta = pasivoCorriente !== 0 ? disponibilidades / pasivoCorriente : 0;
        const endeudamiento = totalActivo !== 0 ? totalPasivo / totalActivo : 0;
        const apalancamiento = totalPatrimonio !== 0 ? totalPasivo / totalPatrimonio : 0;
        const coberturaIntereses = t.gastosFinancieros !== 0 ? ebit / t.gastosFinancieros : 0;
        const margenBruto = ventas !== 0 ? t.utilidadBruta / ventas : 0;
        const margenOperativo = ventas !== 0 ? ebit / ventas : 0;
        const margenNeto = ventas !== 0 ? utilidadNeta / ventas : 0;
        const margenEBITDA = ventas !== 0 ? ebitda / ventas : 0;
        const roic = capitalInvertido !== 0 ? nopat / capitalInvertido : 0;

        const indicators = {
            liquidezCorriente, pruebaAcida, liquidezAbsoluta,
            endeudamiento, apalancamiento, coberturaIntereses,
            margenBruto, margenOperativo, margenNeto, margenEBITDA,
            capitalTrabajo, roic, activoCorriente, pasivoCorriente,
            inventarios, cuentasPorCobrar, cuentasPorPagar
        };

        return { dupont, altman, breakeven, evaData, cashCycle, indicators, incomeStatement: t };
    },

    /**
     * Render DuPont Analysis
     */
    renderDupont(dupont) {
        const p = this.pct;

        document.getElementById('dupont-tree').innerHTML = `
            <!-- Level 1: ROE -->
            <div class="dupont-level">
                <div class="dupont-node roe">
                    <span class="node-label">RETURN ON EQUITY</span>
                    <span class="node-value">${p(dupont.roe)}</span>
                    <span class="node-formula">Rentabilidad del Patrimonio</span>
                </div>
            </div>
            <div class="dupont-connector">=</div>
            <!-- Level 2: ROA x Leverage -->
            <div class="dupont-level">
                <div class="dupont-node roa">
                    <span class="node-label">ROA (Return on Assets)</span>
                    <span class="node-value">${p(dupont.roaNet)}</span>
                    <span class="node-formula">Util. Neta / Activos</span>
                </div>
                <div style="display:flex;align-items:center;font-size:2rem;color:#718096;">×</div>
                <div class="dupont-node leverage">
                    <span class="node-label">5. MULTIPLICADOR DEL CAPITAL</span>
                    <span class="node-value">${dupont.equityMultiplier.toFixed(2)}x</span>
                    <span class="node-formula">Activo Total / Patrimonio</span>
                </div>
            </div>
            <div class="dupont-connector">↑ ROA = Margen × Rotación</div>
            <!-- Level 3: 5 Components -->
            <div class="dupont-level">
                <div class="dupont-node component">
                    <span class="node-label">1. CARGA FISCAL</span>
                    <span class="node-value">${p(dupont.taxBurden)}</span>
                    <span class="node-formula">Util. Neta / EBT</span>
                </div>
                <div style="display:flex;align-items:center;font-size:1.5rem;color:#718096;">×</div>
                <div class="dupont-node component">
                    <span class="node-label">2. CARGA FINANCIERA</span>
                    <span class="node-value">${p(dupont.interestBurden)}</span>
                    <span class="node-formula">EBT / EBIT</span>
                </div>
                <div style="display:flex;align-items:center;font-size:1.5rem;color:#718096;">×</div>
                <div class="dupont-node component">
                    <span class="node-label">3. MARGEN OPERATIVO</span>
                    <span class="node-value">${p(dupont.operatingMargin)}</span>
                    <span class="node-formula">EBIT / Ventas</span>
                </div>
                <div style="display:flex;align-items:center;font-size:1.5rem;color:#718096;">×</div>
                <div class="dupont-node component">
                    <span class="node-label">4. ROTACIÓN DE ACTIVOS</span>
                    <span class="node-value">${dupont.assetTurnover.toFixed(2)}x</span>
                    <span class="node-formula">Ventas / Activo Total</span>
                </div>
                <div style="display:flex;align-items:center;font-size:1.5rem;color:#718096;">×</div>
                <div class="dupont-node component" style="background: linear-gradient(135deg, #9b2c2c, #e53e3e);">
                    <span class="node-label">5. APALANCAMIENTO</span>
                    <span class="node-value">${dupont.equityMultiplier.toFixed(2)}x</span>
                    <span class="node-formula">Activo / Patrimonio</span>
                </div>
            </div>
        `;

        document.getElementById('dupont-explanation').innerHTML = `
            <h4>Interpretación del Análisis DuPont de 5 Componentes</h4>
            <ul>
                <li><strong>1. Carga Fiscal (Tax Burden):</strong> ${p(dupont.taxBurden)} — Mide qué porcentaje de las utilidades antes de impuestos la empresa retiene después de pagar impuestos. En Ecuador, la carga fiscal incluye 15% participación trabajadores + 25% impuesto a la renta. Cuanto más alto, más eficiente fiscalmente.</li>
                <li><strong>2. Carga Financiera (Interest Burden):</strong> ${p(dupont.interestBurden)} — Refleja el impacto de los gastos financieros sobre el resultado operativo. Un valor cercano a 1 indica bajo endeudamiento financiero. Cuanto menor, mayor peso de los intereses sobre las ganancias.</li>
                <li><strong>3. Margen Operativo (Operating Margin):</strong> ${p(dupont.operatingMargin)} — Indica la eficiencia operativa de la empresa: qué porcentaje de cada dólar de ventas se convierte en ganancia operativa (EBIT). Clave para evaluar la gestión del negocio.</li>
                <li><strong>4. Rotación de Activos (Asset Turnover):</strong> ${dupont.assetTurnover.toFixed(2)}x — Mide la eficiencia en el uso de los activos para generar ventas. Cuántos dólares de venta genera cada dólar invertido en activos. Para importadoras, valores entre 1.5-3x son saludables.</li>
                <li><strong>5. Multiplicador del Capital (Equity Multiplier):</strong> ${dupont.equityMultiplier.toFixed(2)}x — Representa el grado de apalancamiento financiero. Un valor de ${dupont.equityMultiplier.toFixed(2)}x significa que por cada dólar de patrimonio hay ${dupont.equityMultiplier.toFixed(2)} dólares de activos. Mayor apalancamiento amplifica tanto ganancias como pérdidas.</li>
            </ul>
            <p style="margin-top:15px"><strong>ROA (Margen × Rotación):</strong> ${p(dupont.roa)} — Combina eficiencia operativa con eficiencia en uso de activos.</p>
            <p><strong>ROE Final:</strong> ${p(dupont.roe)} — El retorno total sobre el patrimonio de los accionistas, resultado de multiplicar los 5 componentes.</p>
        `;
    },

    /**
     * Render Altman Z-Score
     */
    renderAltman(altman) {
        const bgGradient = altman.zScore > 2.9
            ? 'linear-gradient(135deg, #38a169, #276749)'
            : altman.zScore > 1.23
            ? 'linear-gradient(135deg, #d69e2e, #975a16)'
            : 'linear-gradient(135deg, #e53e3e, #9b2c2c)';

        document.getElementById('altman-container').innerHTML = `
            <div class="altman-gauge">
                <div class="gauge-display" style="background: ${bgGradient}">
                    <div class="gauge-value">
                        ${altman.zScore.toFixed(2)}
                        <span class="gauge-label">${altman.zZone}</span>
                    </div>
                </div>
                <div style="max-width:400px">
                    <p style="font-size:0.95rem; line-height:1.7">
                        El <strong>Índice Z de Altman</strong> es un modelo predictivo de quiebra empresarial desarrollado por Edward Altman.
                        Para empresas no cotizadas se utiliza el modelo Z' con los siguientes rangos:
                    </p>
                    <ul style="margin:10px 0; padding-left:20px; font-size:0.9rem">
                        <li style="color:#38a169"><strong>Z > 2.90:</strong> Zona Segura - Baja probabilidad de quiebra</li>
                        <li style="color:#d69e2e"><strong>1.23 < Z < 2.90:</strong> Zona Gris - Precaución</li>
                        <li style="color:#e53e3e"><strong>Z < 1.23:</strong> Zona de Peligro - Alta probabilidad de quiebra</li>
                    </ul>
                </div>
            </div>
            <div class="altman-components">
                <div class="altman-component">
                    <div class="comp-label">X1 = Capital de Trabajo / Activo Total</div>
                    <div class="comp-value">${altman.x1.toFixed(4)}</div>
                    <div class="comp-desc">Ponderación: 0.717 × ${altman.x1.toFixed(4)} = ${(0.717 * altman.x1).toFixed(4)}</div>
                    <div class="comp-desc">Mide la liquidez relativa al tamaño de la empresa</div>
                </div>
                <div class="altman-component">
                    <div class="comp-label">X2 = Utilidades Retenidas / Activo Total</div>
                    <div class="comp-value">${altman.x2.toFixed(4)}</div>
                    <div class="comp-desc">Ponderación: 0.847 × ${altman.x2.toFixed(4)} = ${(0.847 * altman.x2).toFixed(4)}</div>
                    <div class="comp-desc">Refleja la rentabilidad acumulada y la edad de la empresa</div>
                </div>
                <div class="altman-component">
                    <div class="comp-label">X3 = EBIT / Activo Total</div>
                    <div class="comp-value">${altman.x3.toFixed(4)}</div>
                    <div class="comp-desc">Ponderación: 3.107 × ${altman.x3.toFixed(4)} = ${(3.107 * altman.x3).toFixed(4)}</div>
                    <div class="comp-desc">Productividad de los activos (componente más significativo)</div>
                </div>
                <div class="altman-component">
                    <div class="comp-label">X4 = Patrimonio / Pasivo Total</div>
                    <div class="comp-value">${altman.x4.toFixed(4)}</div>
                    <div class="comp-desc">Ponderación: 0.420 × ${altman.x4.toFixed(4)} = ${(0.420 * altman.x4).toFixed(4)}</div>
                    <div class="comp-desc">Solvencia - Cuánto patrimonio respalda las deudas</div>
                </div>
                <div class="altman-component">
                    <div class="comp-label">X5 = Ventas / Activo Total</div>
                    <div class="comp-value">${altman.x5.toFixed(4)}</div>
                    <div class="comp-desc">Ponderación: 0.998 × ${altman.x5.toFixed(4)} = ${(0.998 * altman.x5).toFixed(4)}</div>
                    <div class="comp-desc">Eficiencia en generación de ventas con los activos</div>
                </div>
            </div>
            <div class="zone-indicator" style="background: ${altman.zColor}20; color: ${altman.zColor}; border: 2px solid ${altman.zColor}">
                Z' = 0.717(${altman.x1.toFixed(3)}) + 0.847(${altman.x2.toFixed(3)}) + 3.107(${altman.x3.toFixed(3)}) + 0.420(${altman.x4.toFixed(3)}) + 0.998(${altman.x5.toFixed(3)}) = <strong>${altman.zScore.toFixed(2)}</strong> → ${altman.zZone}
            </div>
        `;
    },

    /**
     * Render Break-Even Analysis
     */
    renderBreakeven(breakeven, ventas) {
        const fc = this.fc;
        const p = this.pct;

        document.getElementById('breakeven-container').innerHTML = `
            <div class="breakeven-grid">
                <div class="breakeven-box economic">
                    <h3>Punto de Equilibrio Económico</h3>
                    <div class="breakeven-value">${fc(breakeven.puntoEquilibrioEco)}</div>
                    <div class="breakeven-detail">
                        Nivel de ventas para cubrir todos los costos (fijos + variables).<br>
                        Incluye depreciaciones y amortizaciones.<br><br>
                        <strong>Costos Fijos:</strong> ${fc(breakeven.costosFijos)}<br>
                        <strong>Ratio Variable:</strong> ${p(breakeven.ratioVariable)}<br>
                        <strong>Margen de Contribución:</strong> ${p(breakeven.margenContribucion)}<br>
                        <strong>PE = CF / MC</strong> = ${fc(breakeven.costosFijos)} / ${p(breakeven.margenContribucion)}
                    </div>
                    <div class="breakeven-detail" style="margin-top:15px; font-weight:600; color: ${ventas > breakeven.puntoEquilibrioEco ? '#276749' : '#9b2c2c'}">
                        ${ventas > breakeven.puntoEquilibrioEco
                            ? `Las ventas actuales (${fc(ventas)}) SUPERAN el punto de equilibrio en ${fc(ventas - breakeven.puntoEquilibrioEco)} (${((ventas / breakeven.puntoEquilibrioEco - 1) * 100).toFixed(1)}% de margen de seguridad)`
                            : `Las ventas actuales (${fc(ventas)}) están POR DEBAJO del punto de equilibrio. Se necesitan ${fc(breakeven.puntoEquilibrioEco - ventas)} adicionales.`
                        }
                    </div>
                </div>
                <div class="breakeven-box financial">
                    <h3>Punto de Equilibrio Financiero</h3>
                    <div class="breakeven-value">${fc(breakeven.puntoEquilibrioFin)}</div>
                    <div class="breakeven-detail">
                        Nivel de ventas necesario para cubrir todos los <strong>egresos de fondos</strong>
                        (excluye depreciaciones que no son salida de caja, incluye servicio de deuda e impuestos).<br><br>
                        <strong>Egresos de Caja:</strong> ${fc(breakeven.egresosCaja)}<br>
                        <strong>Margen de Contribución:</strong> ${p(breakeven.margenContribucion)}<br>
                        <strong>PE Fin = Egresos / MC</strong>
                    </div>
                    <div class="breakeven-detail" style="margin-top:15px; font-weight:600; color: ${ventas > breakeven.puntoEquilibrioFin ? '#276749' : '#9b2c2c'}">
                        ${ventas > breakeven.puntoEquilibrioFin
                            ? `Las ventas actuales (${fc(ventas)}) SUPERAN el PE financiero en ${fc(ventas - breakeven.puntoEquilibrioFin)}`
                            : `Las ventas actuales (${fc(ventas)}) NO cubren los egresos financieros. Déficit: ${fc(breakeven.puntoEquilibrioFin - ventas)}`
                        }
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render EVA
     */
    renderEVA(evaData) {
        const fc = this.fc;
        const p = this.pct;
        const isPositive = evaData.eva >= 0;

        document.getElementById('eva-container').innerHTML = `
            <div class="eva-display">
                <div class="eva-big ${isPositive ? 'positive-eva' : 'negative-eva'}">
                    <div class="eva-amount" style="color: ${isPositive ? '#38a169' : '#e53e3e'}">
                        ${fc(evaData.eva)}
                    </div>
                    <div class="eva-label">
                        ${isPositive
                            ? 'La empresa GENERA valor por encima del costo de capital'
                            : 'La empresa DESTRUYE valor - no cubre el costo de capital'
                        }
                    </div>
                </div>
            </div>
            <div class="eva-components">
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">NOPAT</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#1a365d">${fc(evaData.nopat)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">EBIT × (1 - Tasa Impositiva)</div>
                </div>
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">WACC</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#1a365d">${p(evaData.wacc)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">Costo Promedio Ponderado del Capital</div>
                </div>
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">Capital Invertido</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#1a365d">${fc(evaData.capitalInvertido)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">Deuda Financiera + Patrimonio</div>
                </div>
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">Cargo por Capital</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#e53e3e">${fc(evaData.capitalInvertido * evaData.wacc)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">Capital × WACC</div>
                </div>
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">Costo Deuda (después imp.)</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#1a365d">${p(evaData.costOfDebtAfterTax)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">Kd × (1-t) | Peso: ${p(evaData.weightDebt)}</div>
                </div>
                <div class="eva-comp">
                    <div style="font-size:0.8rem;color:#718096">Costo del Patrimonio (Ke)</div>
                    <div style="font-size:1.3rem;font-weight:700;color:#1a365d">${p(evaData.costOfEquity)}</div>
                    <div style="font-size:0.75rem;color:#a0aec0">CAPM: Rf + β × (Rm-Rf) | Peso: ${p(evaData.weightEquity)}</div>
                </div>
            </div>
            <div style="margin-top:20px; padding:15px; background:#f7fafc; border-radius:8px; border-left:4px solid #1a365d">
                <strong>Fórmula:</strong> EVA = NOPAT - (Capital Invertido × WACC)<br>
                EVA = ${fc(evaData.nopat)} - (${fc(evaData.capitalInvertido)} × ${p(evaData.wacc)}) = <strong style="color:${isPositive ? '#38a169' : '#e53e3e'}">${fc(evaData.eva)}</strong>
            </div>
        `;
    },

    /**
     * Render Cash Conversion Cycle
     */
    renderCCC(cashCycle) {
        document.getElementById('ccc-container').innerHTML = `
            <div class="ccc-flow">
                <div class="ccc-block inventory">
                    <span class="ccc-label">Días de Inventario (DIO)</span>
                    <span class="ccc-value">${cashCycle.daysInventory.toFixed(0)}</span>
                    <span class="ccc-label">días</span>
                </div>
                <div class="ccc-operator">+</div>
                <div class="ccc-block receivables">
                    <span class="ccc-label">Días de Cobro (DSO)</span>
                    <span class="ccc-value">${cashCycle.daysReceivable.toFixed(0)}</span>
                    <span class="ccc-label">días</span>
                </div>
                <div class="ccc-operator">−</div>
                <div class="ccc-block payables">
                    <span class="ccc-label">Días de Pago (DPO)</span>
                    <span class="ccc-value">${cashCycle.daysPayable.toFixed(0)}</span>
                    <span class="ccc-label">días</span>
                </div>
                <div class="ccc-operator">=</div>
                <div class="ccc-block result">
                    <span class="ccc-label">Ciclo de Conversión</span>
                    <span class="ccc-value">${cashCycle.ccc.toFixed(0)}</span>
                    <span class="ccc-label">días</span>
                </div>
            </div>
            <div style="padding:20px; background:#f7fafc; border-radius:8px; max-width:700px; margin:0 auto">
                <p style="font-size:0.92rem; line-height:1.7">
                    <strong>Ciclo de Conversión de Efectivo (CCC):</strong> Indica el tiempo en días que la empresa
                    necesita para convertir su inversión en inventario y cuentas por cobrar en efectivo,
                    considerando el plazo de pago a proveedores.
                </p>
                <p style="font-size:0.9rem; margin-top:10px; color: ${cashCycle.ccc > 90 ? '#e53e3e' : cashCycle.ccc > 45 ? '#d69e2e' : '#38a169'}">
                    <strong>Interpretación:</strong>
                    ${cashCycle.ccc < 0
                        ? 'La empresa financia su operación con el crédito de proveedores (ciclo negativo = posición de caja favorable).'
                        : cashCycle.ccc < 45
                        ? 'Ciclo eficiente. La empresa convierte rápidamente sus inversiones en efectivo.'
                        : cashCycle.ccc < 90
                        ? 'Ciclo moderado. Hay oportunidad de optimizar el capital de trabajo.'
                        : 'Ciclo extenso. Se recomienda revisar políticas de inventario, cobranza y pago a proveedores.'
                    }
                </p>
            </div>
        `;
    },

    /**
     * Render Additional Indicators
     */
    renderIndicators(indicators) {
        const fc = this.fc;
        const p = this.pct;

        const cards = [
            {
                name: 'Liquidez Corriente', value: indicators.liquidezCorriente.toFixed(2) + 'x',
                bar: Math.min(indicators.liquidezCorriente / 3 * 100, 100),
                color: indicators.liquidezCorriente > 1.5 ? '#38a169' : indicators.liquidezCorriente > 1 ? '#d69e2e' : '#e53e3e',
                interp: `${indicators.liquidezCorriente > 1.5 ? 'Saludable' : indicators.liquidezCorriente > 1 ? 'Ajustada' : 'Riesgosa'} — Activo Corriente / Pasivo Corriente. Ideal > 1.5x`
            },
            {
                name: 'Prueba Ácida', value: indicators.pruebaAcida.toFixed(2) + 'x',
                bar: Math.min(indicators.pruebaAcida / 2 * 100, 100),
                color: indicators.pruebaAcida > 1 ? '#38a169' : indicators.pruebaAcida > 0.7 ? '#d69e2e' : '#e53e3e',
                interp: `${indicators.pruebaAcida > 1 ? 'Buena' : 'Ajustada'} — (AC - Inventarios) / PC. Mide liquidez sin depender de inventarios`
            },
            {
                name: 'Liquidez Absoluta', value: indicators.liquidezAbsoluta.toFixed(2) + 'x',
                bar: Math.min(indicators.liquidezAbsoluta / 0.5 * 100, 100),
                color: indicators.liquidezAbsoluta > 0.2 ? '#38a169' : '#e53e3e',
                interp: `Disponibilidades / PC. Capacidad de pago inmediato con efectivo`
            },
            {
                name: 'Endeudamiento', value: p(indicators.endeudamiento),
                bar: indicators.endeudamiento * 100,
                color: indicators.endeudamiento < 0.6 ? '#38a169' : indicators.endeudamiento < 0.75 ? '#d69e2e' : '#e53e3e',
                interp: `Pasivo / Activo. ${indicators.endeudamiento < 0.6 ? 'Nivel conservador' : 'Alto apalancamiento'}`
            },
            {
                name: 'Apalancamiento Financiero', value: indicators.apalancamiento.toFixed(2) + 'x',
                bar: Math.min(indicators.apalancamiento / 4 * 100, 100),
                color: indicators.apalancamiento < 2 ? '#38a169' : indicators.apalancamiento < 3 ? '#d69e2e' : '#e53e3e',
                interp: `Pasivo / Patrimonio. Cada dólar de patrimonio sostiene ${indicators.apalancamiento.toFixed(2)} de deuda`
            },
            {
                name: 'Cobertura de Intereses', value: indicators.coberturaIntereses.toFixed(2) + 'x',
                bar: Math.min(indicators.coberturaIntereses / 8 * 100, 100),
                color: indicators.coberturaIntereses > 3 ? '#38a169' : indicators.coberturaIntereses > 1.5 ? '#d69e2e' : '#e53e3e',
                interp: `EBIT / Gastos Financieros. ${indicators.coberturaIntereses > 3 ? 'Buena capacidad de pago' : 'Presión financiera'}`
            },
            {
                name: 'Margen Bruto', value: p(indicators.margenBruto),
                bar: indicators.margenBruto * 100,
                color: indicators.margenBruto > 0.3 ? '#38a169' : '#d69e2e',
                interp: `Utilidad Bruta / Ventas. Rentabilidad por cada dólar vendido antes de gastos operativos`
            },
            {
                name: 'Margen EBITDA', value: p(indicators.margenEBITDA),
                bar: indicators.margenEBITDA * 100,
                color: indicators.margenEBITDA > 0.15 ? '#38a169' : indicators.margenEBITDA > 0.08 ? '#d69e2e' : '#e53e3e',
                interp: `EBITDA / Ventas. Rentabilidad operativa antes de amortizaciones`
            },
            {
                name: 'Margen Neto', value: p(indicators.margenNeto),
                bar: Math.max(indicators.margenNeto * 100, 0),
                color: indicators.margenNeto > 0.05 ? '#38a169' : indicators.margenNeto > 0 ? '#d69e2e' : '#e53e3e',
                interp: `Utilidad Neta / Ventas. Rentabilidad final por cada dólar vendido`
            },
            {
                name: 'ROIC', value: p(indicators.roic),
                bar: Math.max(indicators.roic * 100 * 5, 0),
                color: indicators.roic > 0.1 ? '#38a169' : indicators.roic > 0.05 ? '#d69e2e' : '#e53e3e',
                interp: `NOPAT / Capital Invertido. Retorno sobre el capital total empleado`
            },
            {
                name: 'Capital de Trabajo Neto', value: fc(indicators.capitalTrabajo),
                bar: indicators.capitalTrabajo > 0 ? 70 : 30,
                color: indicators.capitalTrabajo > 0 ? '#38a169' : '#e53e3e',
                interp: `AC - PC = ${fc(indicators.capitalTrabajo)}. ${indicators.capitalTrabajo > 0 ? 'Positivo: puede cubrir obligaciones CP' : 'Negativo: riesgo de liquidez'}`
            },
            {
                name: 'Intensidad del Capital', value: (indicators.activoCorriente !== 0 ? indicators.inventarios / indicators.activoCorriente : 0).toFixed(2) + 'x',
                bar: Math.min((indicators.inventarios / (indicators.activoCorriente || 1)) * 100, 100),
                color: '#4299e1',
                interp: `Inventarios / AC. Peso del inventario en el activo corriente`
            }
        ];

        document.getElementById('additional-indicators').innerHTML = cards.map(c => `
            <div class="indicator-card">
                <div class="indicator-name">${c.name}</div>
                <div class="indicator-value" style="color:${c.color}">${c.value}</div>
                <div class="indicator-bar">
                    <div class="indicator-bar-fill" style="width:${c.bar}%; background:${c.color}"></div>
                </div>
                <div class="indicator-interpretation">${c.interp}</div>
            </div>
        `).join('');
    },

    /**
     * Render all analysis sections
     */
    renderAll(analysis) {
        this.renderDupont(analysis.dupont);
        this.renderAltman(analysis.altman);
        this.renderBreakeven(analysis.breakeven, analysis.incomeStatement.ventasNetas);
        this.renderEVA(analysis.evaData);
        this.renderCCC(analysis.cashCycle);
        this.renderIndicators(analysis.indicators);
    }
};
