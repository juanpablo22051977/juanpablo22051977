/**
 * Main Application Controller
 * DAVILA IMPORTACIONES SAS - Financial Analysis System
 */
const App = {

    currentYear: new Date().getFullYear(),
    rawData: null,
    processedData: null,

    async init() {
        console.log('Initializing DAVILA IMPORTACIONES SAS - Financial Analysis System');

        // Set initial year
        const yearSelect = document.getElementById('year-select');
        if (yearSelect) yearSelect.value = this.currentYear;

        await this.loadData();
    },

    async loadData() {
        const overlay = document.getElementById('loading-overlay');
        try {
            // Fetch data from OData
            this.rawData = await ODataService.fetchJournalTransactions('2024-01-01');

            this.updateStatus('Procesando transacciones...', 85);
            this.processAndRender();

            this.updateStatus('¡Listo!', 100);

            // Update connection status
            const statusEl = document.getElementById('connection-status');
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<span class="status-dot"></span><span>Conectado</span>';

            // Hide overlay
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 500);

        } catch (error) {
            console.error('Error loading data:', error);
            this.updateStatus('Error de conexión. Usando datos de demostración...', 80);

            // Generate demo data as fallback
            this.rawData = ODataService._generateDemoData('2024-01-01', new Date().toISOString().split('T')[0]);
            this.processAndRender();

            const statusEl = document.getElementById('connection-status');
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<span class="status-dot"></span><span>Demo</span>';

            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 800);
        }
    },

    updateStatus(msg, pct) {
        const el = document.getElementById('loading-status');
        const bar = document.getElementById('progress-fill');
        if (el) el.textContent = msg;
        if (bar) bar.style.width = pct + '%';
    },

    processAndRender() {
        if (!this.rawData || this.rawData.length === 0) {
            console.warn('No data available');
            return;
        }

        const year = this.currentYear;

        // Process transactions
        const { accountBalances, monthlyData } = AccountClassifier.processTransactions(this.rawData, year);

        // Build financial statements
        const balanceSheet = AccountClassifier.buildBalanceSheet(accountBalances, year);
        const incomeStatement = AccountClassifier.buildIncomeStatement(accountBalances, year);

        // Render Balance Sheet
        const bsTotals = FinancialStatements.renderBalanceSheet(balanceSheet, incomeStatement, year);

        // Render Income Statement
        FinancialStatements.renderIncomeStatement(incomeStatement, year);

        // Calculate analysis metrics
        const analysis = FinancialAnalysis.calculate(bsTotals, incomeStatement, balanceSheet, accountBalances);

        // Render all analysis sections
        FinancialAnalysis.renderAll(analysis);

        // Render dashboard charts
        Dashboard.renderAll(monthlyData, analysis, year);

        // Generate IA analysis
        IAAnalysis.generate(analysis, year);

        // Store for later use
        this.processedData = { accountBalances, monthlyData, balanceSheet, incomeStatement, bsTotals, analysis };
    },

    switchTab(tabId) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate selected tab
        document.querySelector(`.nav-tab[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Re-render charts if switching to dashboard (Chart.js needs visible canvas)
        if (tabId === 'dashboard' && this.processedData) {
            setTimeout(() => {
                Dashboard.renderAll(
                    this.processedData.monthlyData,
                    this.processedData.analysis,
                    this.currentYear
                );
            }, 50);
        }
    },

    changeYear(year) {
        this.currentYear = parseInt(year);
        if (this.rawData) {
            this.processAndRender();
        }
    },

    async refreshData() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('hidden');
        this.updateStatus('Actualizando datos...', 0);
        await this.loadData();
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
