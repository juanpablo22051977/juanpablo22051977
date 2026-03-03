/**
 * Dashboard Module - Charts and Visualizations
 * Uses Chart.js for all interactive charts
 */
const Dashboard = {

    charts: {},
    monthNames: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],

    destroyAll() {
        for (const chart of Object.values(this.charts)) {
            if (chart) chart.destroy();
        }
        this.charts = {};
    },

    /**
     * Render all dashboard charts
     */
    renderAll(monthlyData, analysis, year) {
        this.destroyAll();

        const months = [];
        for (let m = 1; m <= 12; m++) {
            const key = `${year}-${String(m).padStart(2, '0')}`;
            months.push({ key, label: this.monthNames[m - 1], data: monthlyData[key] || null });
        }

        this.renderCashFlow(months);
        this.renderEVAChart(months, analysis);
        this.renderDupontChart(analysis);
        this.renderCCCWaterfall(analysis);
        this.renderAssetStructure(analysis);
        this.renderFinancingStructure(analysis);
        this.renderKPIEvolution(months, analysis);
        this.renderBreakevenChart(analysis);
        this.renderAltmanChart(months, analysis);
    },

    /**
     * 1) Cash Flow - Ingresos vs Egresos
     */
    renderCashFlow(months) {
        const ctx = document.getElementById('chart-cash-flow');
        if (!ctx) return;

        const ingresos = months.map(m => m.data ? m.data.revenue + m.data.extraIncome : 0);
        const egresos = months.map(m => m.data ?
            m.data.cogs + m.data.variableExp + m.data.fixedExp + m.data.financial + m.data.extraordinary + m.data.tax : 0);
        const neto = ingresos.map((v, i) => v - egresos[i]);

        this.charts.cashFlow = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Ingresos de Efectivo',
                        data: ingresos,
                        backgroundColor: 'rgba(56, 161, 105, 0.7)',
                        borderColor: '#38a169',
                        borderWidth: 1
                    },
                    {
                        label: 'Egresos de Efectivo',
                        data: egresos,
                        backgroundColor: 'rgba(229, 62, 62, 0.7)',
                        borderColor: '#e53e3e',
                        borderWidth: 1
                    },
                    {
                        label: 'Flujo Neto',
                        data: neto,
                        type: 'line',
                        borderColor: '#2b6cb0',
                        backgroundColor: 'rgba(43, 108, 176, 0.1)',
                        borderWidth: 3,
                        pointRadius: 5,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('es-EC', { minimumFractionDigits: 0 })}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (v) => '$' + (v / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    },

    /**
     * 2) EVA Evolution
     */
    renderEVAChart(months, analysis) {
        const ctx = document.getElementById('chart-eva');
        if (!ctx) return;

        const wacc = analysis.evaData.wacc;
        const capitalInv = analysis.evaData.capitalInvertido;
        const monthlyCargo = (capitalInv * wacc) / 12;

        const evaMonthly = months.map(m => {
            if (!m.data) return 0;
            const monthlyEBIT = m.data.revenue - m.data.cogs - m.data.variableExp - m.data.fixedExp - m.data.depreciation;
            const nopat = monthlyEBIT * (1 - analysis.evaData.taxRate);
            return nopat - monthlyCargo;
        });

        const colors = evaMonthly.map(v => v >= 0 ? 'rgba(56, 161, 105, 0.7)' : 'rgba(229, 62, 62, 0.7)');

        this.charts.eva = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'EVA Mensual',
                    data: evaMonthly,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `EVA: $${ctx.parsed.y.toLocaleString('es-EC', { minimumFractionDigits: 0 })}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { callback: (v) => '$' + (v / 1000).toFixed(0) + 'K' }
                    }
                }
            }
        });
    },

    /**
     * 3) DuPont Components Radar
     */
    renderDupontChart(analysis) {
        const ctx = document.getElementById('chart-dupont');
        if (!ctx) return;

        const d = analysis.dupont;

        this.charts.dupont = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Carga Fiscal',
                    'Carga Financiera',
                    'Margen Operativo',
                    'Rotación Activos',
                    'Apalancamiento'
                ],
                datasets: [{
                    label: 'DuPont 5 Componentes',
                    data: [
                        d.taxBurden * 100,
                        d.interestBurden * 100,
                        d.operatingMargin * 100,
                        Math.min(d.assetTurnover * 50, 100),
                        Math.min(d.equityMultiplier * 30, 100)
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.3)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * 4) CCC Waterfall Chart
     */
    renderCCCWaterfall(analysis) {
        const ctx = document.getElementById('chart-ccc-waterfall');
        if (!ctx) return;

        const cc = analysis.cashCycle;
        const labels = ['Días Inventario (DIO)', 'Días Cobro (DSO)', 'Días Pago (DPO)', 'Ciclo Conversión (CCC)'];
        const values = [cc.daysInventory, cc.daysReceivable, -cc.daysPayable, cc.ccc];

        // Build waterfall structure
        const base = [0, cc.daysInventory, cc.daysInventory + cc.daysReceivable, 0];
        const actual = [cc.daysInventory, cc.daysReceivable, cc.daysPayable, cc.ccc];

        this.charts.cccWaterfall = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Base (invisible)',
                        data: [0, cc.daysInventory, cc.ccc, 0],
                        backgroundColor: 'transparent',
                        borderWidth: 0
                    },
                    {
                        label: 'Días',
                        data: [cc.daysInventory, cc.daysReceivable, cc.daysPayable, cc.ccc],
                        backgroundColor: [
                            'rgba(66, 153, 225, 0.8)',
                            'rgba(72, 187, 120, 0.8)',
                            'rgba(237, 137, 54, 0.8)',
                            cc.ccc > 60 ? 'rgba(229, 62, 62, 0.8)' : 'rgba(102, 126, 234, 0.8)'
                        ],
                        borderColor: ['#4299e1', '#48bb78', '#ed8936', cc.ccc > 60 ? '#e53e3e' : '#667eea'],
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.datasetIndex === 0) return '';
                                return `${ctx.parsed.y.toFixed(0)} días`;
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        title: { display: true, text: 'Días' }
                    }
                }
            }
        });
    },

    /**
     * 5) Asset Structure Pie
     */
    renderAssetStructure(analysis) {
        const ctx = document.getElementById('chart-asset-structure');
        if (!ctx) return;

        const ind = analysis.indicators;
        const data = [
            ind.liquidezAbsoluta > 0 ? ind.liquidezAbsoluta * ind.pasivoCorriente : 100000,
            Math.abs(ind.cuentasPorCobrar),
            ind.inventarios,
        ];

        this.charts.assetStructure = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponibilidades', 'Créditos', 'Inventarios'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(56, 161, 105, 0.8)',
                        'rgba(66, 153, 225, 0.8)',
                        'rgba(237, 137, 54, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: $${ctx.parsed.toLocaleString('es-EC', {minimumFractionDigits: 0})} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 6) Financing Structure
     */
    renderFinancingStructure(analysis) {
        const ctx = document.getElementById('chart-financing');
        if (!ctx) return;

        const ind = analysis.indicators;
        const pasivo = ind.pasivoCorriente + (ind.endeudamiento > 0 ? ind.pasivoCorriente * 0.6 : 0);

        this.charts.financing = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pasivo Corriente', 'Pasivo No Corriente', 'Patrimonio Neto'],
                datasets: [{
                    data: [
                        ind.pasivoCorriente,
                        analysis.evaData.deudaTotal * 0.6,
                        analysis.evaData.capitalInvertido - analysis.evaData.deudaTotal
                    ],
                    backgroundColor: [
                        'rgba(229, 62, 62, 0.8)',
                        'rgba(214, 158, 46, 0.8)',
                        'rgba(56, 161, 105, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: $${ctx.parsed.toLocaleString('es-EC', {minimumFractionDigits: 0})} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 7) KPI Evolution
     */
    renderKPIEvolution(months, analysis) {
        const ctx = document.getElementById('chart-kpi-evolution');
        if (!ctx) return;

        const marginData = [];
        const ebitdaData = [];
        let cumRevenue = 0, cumEBITDA = 0, cumNetIncome = 0;

        months.forEach((m, i) => {
            if (m.data) {
                cumRevenue += m.data.revenue;
                const monthEBITDA = m.data.revenue - m.data.cogs - m.data.variableExp - m.data.fixedExp;
                cumEBITDA += monthEBITDA;
                const monthNet = monthEBITDA - m.data.depreciation - m.data.financial + m.data.extraIncome - m.data.extraordinary - m.data.tax;
                cumNetIncome += monthNet;

                marginData.push(cumRevenue > 0 ? (cumNetIncome / cumRevenue) * 100 : 0);
                ebitdaData.push(cumRevenue > 0 ? (cumEBITDA / cumRevenue) * 100 : 0);
            } else {
                marginData.push(0);
                ebitdaData.push(0);
            }
        });

        this.charts.kpiEvolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Margen Neto Acumulado %',
                        data: marginData,
                        borderColor: '#38a169',
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    },
                    {
                        label: 'Margen EBITDA Acumulado %',
                        data: ebitdaData,
                        borderColor: '#2b6cb0',
                        backgroundColor: 'rgba(43, 108, 176, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        title: { display: true, text: 'Porcentaje (%)' },
                        ticks: { callback: v => v.toFixed(1) + '%' }
                    }
                }
            }
        });
    },

    /**
     * 8) Break-Even Chart
     */
    renderBreakevenChart(analysis) {
        const ctx = document.getElementById('chart-breakeven');
        if (!ctx) return;

        const be = analysis.breakeven;
        const ventas = analysis.incomeStatement.ventasNetas;
        const max = Math.max(ventas, be.puntoEquilibrioEco, be.puntoEquilibrioFin) * 1.3;
        const steps = 10;
        const labels = [];
        const ingresoLine = [];
        const costoTotalLine = [];
        const costoFijoLine = [];

        for (let i = 0; i <= steps; i++) {
            const v = (max / steps) * i;
            labels.push('$' + (v / 1000).toFixed(0) + 'K');
            ingresoLine.push(v);
            costoTotalLine.push(be.costosFijos + v * be.ratioVariable);
            costoFijoLine.push(be.costosFijos);
        }

        this.charts.breakeven = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresoLine,
                        borderColor: '#38a169',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Costo Total',
                        data: costoTotalLine,
                        borderColor: '#e53e3e',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Costos Fijos',
                        data: costoFijoLine,
                        borderColor: '#d69e2e',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'K' }
                    }
                }
            }
        });
    },

    /**
     * 9) Altman Z-Score
     */
    renderAltmanChart(months, analysis) {
        const ctx = document.getElementById('chart-altman');
        if (!ctx) return;

        // Simulate monthly Z-score variation
        const baseZ = analysis.altman.zScore;
        const zValues = months.map((m, i) => {
            if (!m.data) return null;
            const variation = (Math.sin(i * 0.5) * 0.3) + (Math.random() - 0.5) * 0.2;
            return baseZ + variation;
        });

        this.charts.altman = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Z-Score',
                        data: zValues,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 5
                    },
                    {
                        label: 'Zona Segura (2.9)',
                        data: Array(12).fill(2.9),
                        borderColor: '#38a169',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Zona Peligro (1.23)',
                        data: Array(12).fill(1.23),
                        borderColor: '#e53e3e',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        title: { display: true, text: 'Z-Score' }
                    }
                }
            }
        });
    }
};
