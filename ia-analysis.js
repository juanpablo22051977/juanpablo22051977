/**
 * IA Analysis Module
 * Intelligent analysis of financial health, liquidity, solvency, and profitability
 */
const IAAnalysis = {

    fc(amount) {
        const sign = amount < 0 ? '-' : '';
        return sign + '$' + Math.abs(amount).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    pct(value) {
        return (value * 100).toFixed(2) + '%';
    },

    /**
     * Generate comprehensive AI analysis
     */
    generate(analysis, year) {
        const d = analysis.dupont;
        const a = analysis.altman;
        const b = analysis.breakeven;
        const e = analysis.evaData;
        const cc = analysis.cashCycle;
        const ind = analysis.indicators;
        const t = analysis.incomeStatement;

        // Scoring system
        let overallScore = 0;
        let maxScore = 0;
        const scores = {};

        // Liquidity score
        const liqScore = this.scoreLiquidity(ind);
        scores.liquidity = liqScore;
        overallScore += liqScore.score;
        maxScore += liqScore.max;

        // Solvency score
        const solScore = this.scoreSolvency(ind, a);
        scores.solvency = solScore;
        overallScore += solScore.score;
        maxScore += solScore.max;

        // Profitability score
        const profScore = this.scoreProfitability(d, ind, e);
        scores.profitability = profScore;
        overallScore += profScore.score;
        maxScore += profScore.max;

        // Efficiency score
        const effScore = this.scoreEfficiency(cc, d, ind);
        scores.efficiency = effScore;
        overallScore += effScore.score;
        maxScore += effScore.max;

        const overallPct = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;
        let overallVerdict, verdictClass;
        if (overallPct >= 70) { overallVerdict = 'SITUACIÓN FAVORABLE'; verdictClass = 'good'; }
        else if (overallPct >= 45) { overallVerdict = 'SITUACIÓN CON OBSERVACIONES'; verdictClass = 'warning'; }
        else { overallVerdict = 'SITUACIÓN CRÍTICA - REQUIERE ACCIÓN INMEDIATA'; verdictClass = 'danger'; }

        let html = '';

        // Traffic Light Summary
        html += `
            <div class="ia-traffic-light">
                <div class="traffic-item ${this.trafficColor(scores.liquidity)}">
                    <span class="traffic-label">Liquidez</span>
                    <span class="traffic-value">${((scores.liquidity.score / scores.liquidity.max) * 100).toFixed(0)}%</span>
                </div>
                <div class="traffic-item ${this.trafficColor(scores.solvency)}">
                    <span class="traffic-label">Solvencia</span>
                    <span class="traffic-value">${((scores.solvency.score / scores.solvency.max) * 100).toFixed(0)}%</span>
                </div>
                <div class="traffic-item ${this.trafficColor(scores.profitability)}">
                    <span class="traffic-label">Rentabilidad</span>
                    <span class="traffic-value">${((scores.profitability.score / scores.profitability.max) * 100).toFixed(0)}%</span>
                </div>
                <div class="traffic-item ${this.trafficColor(scores.efficiency)}">
                    <span class="traffic-label">Eficiencia</span>
                    <span class="traffic-value">${((scores.efficiency.score / scores.efficiency.max) * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;

        // Executive Summary
        html += `
            <div class="ia-section">
                <h3>Resumen Ejecutivo</h3>
                <p>
                    <strong>DAVILA IMPORTACIONES SAS</strong> presenta al cierre del ejercicio ${year} una estructura
                    económico-financiera que se analiza a continuación desde las perspectivas patrimonial, económica,
                    financiera, de liquidez y solvencia, conforme a las Normas Internacionales de Información Financiera
                    (NIIF) adoptadas por la Superintendencia de Compañías del Ecuador.
                </p>
                <p style="margin-top:10px">
                    La empresa opera en el sector de importaciones con ventas netas de <strong>${this.fc(t.ventasNetas)}</strong>,
                    generando un EBITDA de <strong>${this.fc(t.ebitda)}</strong> (margen ${this.pct(ind.margenEBITDA)})
                    y un resultado neto del ejercicio de <strong>${this.fc(t.resultadoEjercicio)}</strong>
                    (margen neto ${this.pct(ind.margenNeto)}).
                </p>
            </div>
        `;

        // Patrimonial Analysis
        html += `
            <div class="ia-section">
                <h3>1. Análisis Patrimonial</h3>
                <ul>
                    <li><strong>Estructura del Activo:</strong> El activo corriente representa la principal masa patrimonial,
                    con los inventarios (Bienes de Cambio) como la partida más significativa con ${this.fc(ind.inventarios)}.
                    Esto es consistente con una empresa importadora que mantiene stock para su operación comercial.
                    ${ind.inventarios > ind.activoCorriente * 0.5
                        ? 'Sin embargo, la alta concentración en inventarios representa un riesgo de liquidez que debe monitorearse.'
                        : 'La proporción es razonable para el giro del negocio.'
                    }</li>
                    <li><strong>Capital de Trabajo:</strong> ${ind.capitalTrabajo > 0
                        ? `Positivo por ${this.fc(ind.capitalTrabajo)}, lo que indica capacidad para cubrir obligaciones a corto plazo con activos corrientes.`
                        : `Negativo por ${this.fc(ind.capitalTrabajo)}, señal de alerta sobre la capacidad de pago a corto plazo.`
                    }</li>
                    <li><strong>Endeudamiento:</strong> La relación Pasivo/Activo es de ${this.pct(ind.endeudamiento)},
                    ${ind.endeudamiento < 0.5
                        ? 'indicando una estructura conservadora con predominio de recursos propios.'
                        : ind.endeudamiento < 0.7
                        ? 'nivel moderado de endeudamiento, típico del sector importador que requiere financiamiento para operaciones de comercio exterior.'
                        : 'nivel elevado que podría comprometer la autonomía financiera de la empresa.'
                    }</li>
                    <li><strong>Apalancamiento:</strong> ${ind.apalancamiento.toFixed(2)}x — Por cada dólar de patrimonio,
                    la empresa tiene ${ind.apalancamiento.toFixed(2)} dólares de deuda.
                    ${ind.apalancamiento > 2.5 ? 'Este nivel es alto y amplifica tanto beneficios como pérdidas.' : 'Nivel dentro de parámetros aceptables.'}</li>
                </ul>
            </div>
        `;

        // Economic Analysis
        html += `
            <div class="ia-section">
                <h3>2. Análisis Económico (Rentabilidad)</h3>
                <ul>
                    <li><strong>Margen Bruto:</strong> ${this.pct(ind.margenBruto)} — ${ind.margenBruto > 0.25
                        ? 'Margen saludable que indica buen poder de negociación con proveedores y adecuada formación de precios.'
                        : 'Margen ajustado que sugiere presión competitiva o altos costos de importación.'
                    }</li>
                    <li><strong>Utilidad Marginal (Contribución):</strong> ${this.fc(t.utilidadMarginal)} — Después de deducir
                    costos variables (impuestos a las ventas, comisiones, publicidad), el margen de contribución para cubrir
                    costos fijos es ${t.utilidadMarginal > 0 ? 'positivo' : 'insuficiente'}.
                    El ratio de contribución es ${this.pct(b.margenContribucion)}.</li>
                    <li><strong>EBITDA:</strong> ${this.fc(t.ebitda)} (${this.pct(ind.margenEBITDA)} sobre ventas) —
                    ${ind.margenEBITDA > 0.15
                        ? 'La generación operativa de caja es robusta.'
                        : ind.margenEBITDA > 0.08
                        ? 'Generación operativa moderada, con espacio para mejora en eficiencia.'
                        : 'Generación operativa débil, se requiere revisión de la estructura de costos.'
                    }</li>
                    <li><strong>ROE (DuPont):</strong> ${this.pct(d.roe)} — Descompuesto en:
                        <ul>
                            <li>Carga Fiscal: ${this.pct(d.taxBurden)} (Ecuador: 15% participación + 25% IR)</li>
                            <li>Carga Financiera: ${this.pct(d.interestBurden)} ${d.interestBurden < 0.7 ? '(alto impacto de intereses)' : '(impacto moderado)'}</li>
                            <li>Margen Operativo: ${this.pct(d.operatingMargin)}</li>
                            <li>Rotación de Activos: ${d.assetTurnover.toFixed(2)}x</li>
                            <li>Apalancamiento: ${d.equityMultiplier.toFixed(2)}x</li>
                        </ul>
                    </li>
                    <li><strong>EVA:</strong> ${this.fc(e.eva)} — ${e.eva > 0
                        ? `La empresa GENERA valor económico por encima del WACC (${this.pct(e.wacc)}). El retorno sobre el capital invertido excede el costo de oportunidad.`
                        : `La empresa NO genera valor suficiente para compensar el WACC (${this.pct(e.wacc)}). Los accionistas obtendrían mejor retorno en inversiones alternativas de riesgo similar.`
                    }</li>
                </ul>
            </div>
        `;

        // Financial Analysis
        html += `
            <div class="ia-section">
                <h3>3. Análisis Financiero (Flujos y Capacidad de Pago)</h3>
                <ul>
                    <li><strong>Ciclo de Conversión de Efectivo:</strong> ${cc.ccc.toFixed(0)} días
                    <ul>
                        <li>Días de Inventario (DIO): ${cc.daysInventory.toFixed(0)} días ${cc.daysInventory > 120 ? '— Excesivo, capital inmovilizado en stock' : cc.daysInventory > 60 ? '— Moderado para importadora' : '— Eficiente'}</li>
                        <li>Días de Cobro (DSO): ${cc.daysReceivable.toFixed(0)} días ${cc.daysReceivable > 60 ? '— Extenso, revisar política de crédito' : '— Dentro de parámetros'}</li>
                        <li>Días de Pago (DPO): ${cc.daysPayable.toFixed(0)} días — Plazo de pago a proveedores</li>
                    </ul>
                    ${cc.ccc > 90
                        ? 'El ciclo es extenso, lo que significa alta necesidad de capital de trabajo y mayor dependencia de financiamiento externo.'
                        : cc.ccc > 45
                        ? 'Ciclo moderado, con oportunidades de optimización en gestión de inventarios y cobranzas.'
                        : 'Ciclo eficiente que minimiza la necesidad de financiamiento de capital de trabajo.'
                    }</li>
                    <li><strong>Punto de Equilibrio Económico:</strong> ${this.fc(b.puntoEquilibrioEco)} —
                    ${t.ventasNetas > b.puntoEquilibrioEco
                        ? `Las ventas superan el PE en ${this.fc(t.ventasNetas - b.puntoEquilibrioEco)}, con un margen de seguridad del ${((t.ventasNetas / b.puntoEquilibrioEco - 1) * 100).toFixed(1)}%.`
                        : 'Las ventas NO alcanzan el punto de equilibrio, la empresa opera a pérdida.'
                    }</li>
                    <li><strong>Punto de Equilibrio Financiero:</strong> ${this.fc(b.puntoEquilibrioFin)} —
                    ${t.ventasNetas > b.puntoEquilibrioFin
                        ? 'La empresa genera suficiente efectivo para cubrir todos los egresos de caja.'
                        : 'ALERTA: La empresa no genera suficiente efectivo para cubrir sus compromisos de pago.'
                    }</li>
                    <li><strong>Cobertura de Intereses:</strong> ${ind.coberturaIntereses.toFixed(2)}x —
                    ${ind.coberturaIntereses > 3
                        ? 'Holgada capacidad para servir la deuda financiera.'
                        : ind.coberturaIntereses > 1.5
                        ? 'Capacidad aceptable pero con poco margen de maniobra.'
                        : 'RIESGO: Capacidad insuficiente para cubrir el servicio de deuda.'
                    }</li>
                </ul>
            </div>
        `;

        // Liquidity Analysis
        html += `
            <div class="ia-section">
                <h3>4. Análisis de Liquidez</h3>
                <ul>
                    <li><strong>Ratio de Liquidez Corriente:</strong> ${ind.liquidezCorriente.toFixed(2)}x —
                    ${ind.liquidezCorriente > 2
                        ? 'Amplia capacidad de pago a corto plazo. Podría indicar activos ociosos.'
                        : ind.liquidezCorriente > 1.5
                        ? 'Buena posición de liquidez, dentro de niveles óptimos.'
                        : ind.liquidezCorriente > 1
                        ? 'Liquidez ajustada, se cubre el pasivo corriente pero con poco margen.'
                        : 'CRÍTICO: No se cubren las obligaciones a corto plazo con activos corrientes.'
                    }</li>
                    <li><strong>Prueba Ácida:</strong> ${ind.pruebaAcida.toFixed(2)}x —
                    ${ind.pruebaAcida > 1
                        ? 'Puede cubrir obligaciones sin necesidad de liquidar inventarios.'
                        : 'Depende de la venta de inventarios para cubrir deudas a corto plazo.'
                    } Para una importadora, la diferencia entre liquidez corriente y prueba ácida refleja
                    el peso del inventario en el capital de trabajo.</li>
                    <li><strong>Liquidez Absoluta:</strong> ${ind.liquidezAbsoluta.toFixed(2)}x —
                    ${ind.liquidezAbsoluta > 0.3
                        ? 'Buen nivel de efectivo disponible para contingencias.'
                        : ind.liquidezAbsoluta > 0.1
                        ? 'Nivel aceptable de efectivo.'
                        : 'Bajo nivel de efectivo inmediato, dependencia de cobros para operaciones diarias.'
                    }</li>
                </ul>
            </div>
        `;

        // Solvency Analysis
        html += `
            <div class="ia-section">
                <h3>5. Análisis de Solvencia</h3>
                <ul>
                    <li><strong>Índice Z de Altman:</strong> ${a.zScore.toFixed(2)} — <span style="color:${a.zColor};font-weight:700">${a.zZone}</span>
                    <br>${a.zScore > 2.9
                        ? 'El modelo predictivo indica baja probabilidad de dificultades financieras en los próximos 2 años.'
                        : a.zScore > 1.23
                        ? 'Se encuentra en zona de incertidumbre. Se recomienda monitoreo cercano y planes de contingencia.'
                        : 'ALERTA MÁXIMA: Alta probabilidad de estrés financiero. Se requieren medidas correctivas urgentes.'
                    }</li>
                    <li><strong>Ratio de Endeudamiento:</strong> ${this.pct(ind.endeudamiento)} —
                    Del total de activos, el ${this.pct(ind.endeudamiento)} está financiado con deuda de terceros.
                    ${ind.endeudamiento < 0.6
                        ? 'Estructura conservadora que brinda resiliencia ante shocks.'
                        : 'Nivel que requiere atención, especialmente en un entorno de tasas crecientes.'
                    }</li>
                    <li><strong>Autonomía Financiera:</strong> ${this.pct(1 - ind.endeudamiento)} del activo está financiado con recursos propios.
                    ${(1 - ind.endeudamiento) > 0.4
                        ? 'Adecuado nivel de independencia financiera.'
                        : 'Baja autonomía, alta dependencia de acreedores.'
                    }</li>
                </ul>
            </div>
        `;

        // Recommendations
        html += `
            <div class="ia-section">
                <h3>6. Recomendaciones Estratégicas</h3>
                <ul>
                    ${this.generateRecommendations(analysis, ind, d, a, b, e, cc, t)}
                </ul>
            </div>
        `;

        // Overall Verdict
        html += `
            <div class="ia-verdict ${verdictClass}">
                <div style="font-size:1.3rem;margin-bottom:5px">${overallVerdict}</div>
                <div style="font-size:0.9rem;opacity:0.8">Puntuación integral: ${overallScore.toFixed(0)} / ${maxScore} (${overallPct.toFixed(0)}%)</div>
            </div>
        `;

        document.getElementById('ia-analysis').innerHTML = html;
    },

    scoreLiquidity(ind) {
        let score = 0;
        const max = 25;
        if (ind.liquidezCorriente > 2) score += 8; else if (ind.liquidezCorriente > 1.5) score += 6; else if (ind.liquidezCorriente > 1) score += 3;
        if (ind.pruebaAcida > 1) score += 8; else if (ind.pruebaAcida > 0.7) score += 5; else if (ind.pruebaAcida > 0.5) score += 2;
        if (ind.liquidezAbsoluta > 0.3) score += 5; else if (ind.liquidezAbsoluta > 0.1) score += 3;
        if (ind.capitalTrabajo > 0) score += 4; else score += 0;
        return { score, max };
    },

    scoreSolvency(ind, altman) {
        let score = 0;
        const max = 25;
        if (altman.zScore > 2.9) score += 10; else if (altman.zScore > 1.23) score += 5;
        if (ind.endeudamiento < 0.5) score += 8; else if (ind.endeudamiento < 0.7) score += 5; else if (ind.endeudamiento < 0.85) score += 2;
        if (ind.coberturaIntereses > 3) score += 7; else if (ind.coberturaIntereses > 1.5) score += 4; else if (ind.coberturaIntereses > 1) score += 1;
        return { score, max };
    },

    scoreProfitability(dupont, ind, eva) {
        let score = 0;
        const max = 25;
        if (dupont.roe > 0.15) score += 6; else if (dupont.roe > 0.08) score += 4; else if (dupont.roe > 0) score += 2;
        if (ind.margenNeto > 0.05) score += 5; else if (ind.margenNeto > 0.02) score += 3; else if (ind.margenNeto > 0) score += 1;
        if (ind.margenEBITDA > 0.15) score += 5; else if (ind.margenEBITDA > 0.08) score += 3;
        if (eva.eva > 0) score += 5; else score += 0;
        if (ind.roic > 0.1) score += 4; else if (ind.roic > 0.05) score += 2;
        return { score, max };
    },

    scoreEfficiency(cashCycle, dupont, ind) {
        let score = 0;
        const max = 25;
        if (cashCycle.ccc < 30) score += 8; else if (cashCycle.ccc < 60) score += 6; else if (cashCycle.ccc < 90) score += 3;
        if (dupont.assetTurnover > 2) score += 7; else if (dupont.assetTurnover > 1.5) score += 5; else if (dupont.assetTurnover > 1) score += 3;
        if (cashCycle.daysReceivable < 30) score += 5; else if (cashCycle.daysReceivable < 60) score += 3;
        if (cashCycle.daysInventory < 60) score += 5; else if (cashCycle.daysInventory < 90) score += 3;
        return { score, max };
    },

    trafficColor(scoreObj) {
        const pct = scoreObj.score / scoreObj.max;
        if (pct >= 0.7) return 'green';
        if (pct >= 0.45) return 'yellow';
        return 'red';
    },

    generateRecommendations(analysis, ind, d, a, b, e, cc, t) {
        const recs = [];

        // Liquidity recommendations
        if (ind.liquidezCorriente < 1.5) {
            recs.push('Mejorar la liquidez corriente mediante la negociación de mejores plazos con proveedores o la reducción del ciclo de inventario.');
        }
        if (ind.pruebaAcida < 1) {
            recs.push('Reducir la dependencia del inventario para la liquidez. Considerar implementar sistema JIT (Just In Time) adaptado al negocio de importación.');
        }

        // Inventory management
        if (cc.daysInventory > 90) {
            recs.push(`Optimizar la gestión de inventarios (actualmente ${cc.daysInventory.toFixed(0)} días). Implementar análisis ABC para priorizar productos de alta rotación y reducir stock de baja demanda.`);
        }

        // Receivables
        if (cc.daysReceivable > 45) {
            recs.push(`Revisar la política de crédito a clientes (${cc.daysReceivable.toFixed(0)} días de cobro). Considerar descuentos por pronto pago y seguimiento más agresivo de cartera vencida.`);
        }

        // Profitability
        if (ind.margenNeto < 0.05) {
            recs.push('Implementar programa de reducción de costos operativos. Revisar la estructura de gastos fijos y evaluar posibilidades de tercerización o automatización.');
        }

        // EVA
        if (e.eva < 0) {
            recs.push(`El EVA negativo (${this.fc(e.eva)}) indica destrucción de valor. Priorizar proyectos con retorno superior al WACC (${this.pct(e.wacc)}) y desinvertir en activos de bajo rendimiento.`);
        }

        // Solvency
        if (a.zScore < 2.9) {
            recs.push(`Fortalecer la solvencia (Z-Score: ${a.zScore.toFixed(2)}). Considerar capitalización, reducción de pasivos o mejora de la rentabilidad operativa.`);
        }

        // Financial leverage
        if (ind.endeudamiento > 0.7) {
            recs.push('Reducir el nivel de endeudamiento. Priorizar la amortización de deuda de alto costo y evitar nuevo endeudamiento no productivo.');
        }

        // Coverage
        if (ind.coberturaIntereses < 3) {
            recs.push('Mejorar la cobertura de intereses. Evaluar refinanciamiento de deuda a menores tasas o extensión de plazos para reducir el servicio de deuda anual.');
        }

        // Break-even
        const margenSeguridad = t.ventasNetas > 0 ? (t.ventasNetas - b.puntoEquilibrioEco) / t.ventasNetas : 0;
        if (margenSeguridad < 0.2) {
            recs.push(`El margen de seguridad sobre el punto de equilibrio es bajo (${this.pct(margenSeguridad)}). Diversificar fuentes de ingreso y trabajar en la eficiencia de costos variables.`);
        }

        // General strategic
        recs.push('Implementar presupuesto financiero mensual con seguimiento de indicadores clave (KPIs) para anticipar desviaciones.');
        recs.push('Evaluar la conveniencia de forward contracts o cobertura cambiaria para proteger los márgenes ante fluctuaciones del tipo de cambio, dado el componente importador.');

        return recs.map(r => `<li>${r}</li>`).join('');
    }
};
