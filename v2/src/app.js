// app.js (修正後 for Tailwind CSS)

// Loading management
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const app = document.getElementById('app');
        loadingOverlay.style.opacity = '0';
        app.style.opacity = '1';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }, 1500);
});

const { createApp, ref, watch, onMounted, nextTick, computed } = Vue;

createApp({
    setup() {
        // Add this inside your Vue app's setup() function

        const isMenuOpen = ref(false);

        const toggleMenu = () => {
            isMenuOpen.value = !isMenuOpen.value;
        };

        // Make sure to return them so the template can use them
        if (typeof portfolioConfig === 'undefined') {
            console.error("portfolio_config.js 檔案未載入或格式錯誤！");
            return;
        }
        
        const portfolio = portfolioConfig.portfolio; 
        const csvData = portfolioConfig.csvData;
        const volatilityData = portfolioConfig.volatilityByMonth;

        const activeTab = ref('backtest'); 
        const backtestData = ref([]);
        const backtestYears = ref(3);
        const performanceYears = ref(3);
        const pieColors = ['#208065', '#40A080', '#60C0A0', '#80E0C0', '#A0FFA0', '#806420'];
        const charts = {};

        const parseCSV = (csv) => { const lines = csv.trim().split('\n'); const headers = lines.shift().split(','); return lines.map(line => { const values = line.split(','); const entry = {}; headers.forEach((h, i) => { entry[h.trim()] = isNaN(Number(values[i])) ? values[i] : Number(values[i]); }); return entry; }); };
        // NEW, FIXED FUNCTION
        const createOrUpdateChart = (id, config) => {
            // If a chart instance for this ID already exists, destroy it completely.
            // This is crucial for cleaning up the old chart when v-if removes the canvas.
            if (charts[id]) {
                charts[id].destroy();
            }

            // Get the canvas element, which may have just been re-created by Vue.
            const ctx = document.getElementById(id)?.getContext('2d');

            // If the canvas exists, create a brand-new chart instance.
            if (ctx) {
                charts[id] = new Chart(ctx, config);
            }
        };        
        const drawPieChart = () => createOrUpdateChart('pie-chart', { type: 'doughnut', data: { labels: Object.keys(portfolio.data.allocations), datasets: [{ data: Object.values(portfolio.data.allocations), backgroundColor: pieColors, borderWidth: 2, borderColor: '#0D0D0D' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        
        const drawBacktestChart = () => { 
            const slicedData = backtestData.value.slice(-(backtestYears.value * 12)); 
            createOrUpdateChart('backtest-chart', { 
                type: 'line', 
                data: { 
                    labels: slicedData.map(d => d.date), 
                    datasets: [
                        { label: portfolio.name, data: slicedData.map(d => d.portfolio_value), borderColor: '#208065', tension: 0.1, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#208065', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 }, 
                        { label: 'S&P 500', data: slicedData.map(d => d.sp500_value), borderColor: '#806420', tension: 0.1, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#806420', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 }
                    ] 
                }, 
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    interaction: { mode: 'index', intersect: false, }, 
                    hover: { mode: 'index', intersect: false, }, 
                    scales: { x: { ticks: { color: '#FFF' } }, y: { ticks: { color: '#FFF', callback: v => formatK(v) } } }, 
                    plugins: { 
                        legend: { labels: { color: '#FFF' } }, 
                        tooltip: { 
                            backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                            titleColor: '#208065', bodyColor: '#ffffff', borderColor: '#208065', borderWidth: 1, cornerRadius: 8, displayColors: true, 
                            callbacks: { 
                                title: context => `日期: ${slicedData[context[0].dataIndex].date}`, 
                                label: context => { const dp = slicedData[context.dataIndex]; return context.dataset.label === portfolio.name ? [`投資組合價值: $${dp.portfolio_value.toLocaleString()}`, `月報酬率: ${(dp.portfolio_monthly_return * 100).toFixed(2)}%`] : `S&P 500價值: $${dp.sp500_value.toLocaleString()}`; }, 
                                afterBody: context => `\n相對表現: ${((slicedData[context[0].dataIndex].portfolio_value - slicedData[context[0].dataIndex].sp500_value) / slicedData[context[0].dataIndex].sp500_value * 100).toFixed(2)}%`
                            } 
                        } 
                    } 
                } 
            }); 
        };

        const drawVolatilityChart = () => {
            if (!volatilityData) return;
            createOrUpdateChart('volatility-chart', {
                type: 'line',
                data: {
                    labels: volatilityData.map(d => d.date),
                    datasets: [
                        { label: portfolio.name, data: volatilityData.map(d => d.portfolio_vol), backgroundColor: '#208065', borderColor: '#208065', tension: 0.1, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#208065', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 },
                        { label: 'S&P 500', data: volatilityData.map(d => d.sp500_vol), backgroundColor: '#806420', borderColor: '#806420', tension: 0.1, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#806420', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, hover: { mode: 'index', intersect: false },
                    scales: { x: { ticks: { color: '#FFF' } }, y: { ticks: { color: '#FFF', callback: value => (value * 100).toFixed(0) + '%' } } },
                    plugins: { legend: { labels: { color: '#FFF' } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.95)', titleColor: '#208065', bodyColor: '#ffffff', borderColor: '#208065', borderWidth: 1, cornerRadius: 8, displayColors: true, callbacks: { title: ctx => `日期: ${volatilityData[ctx[0].dataIndex].date}`, label: ctx => { const dp = volatilityData[ctx.dataIndex]; return ctx.dataset.label === portfolio.name ? `${portfolio.name}年化波動率: ${(dp.portfolio_vol * 100).toFixed(1)}%` : `S&P 500年化波動率: ${(dp.sp500_vol * 100).toFixed(1)}%`; }, afterBody: ctx => { const dp = volatilityData[ctx[0].dataIndex]; const diff = ((dp.portfolio_vol - dp.sp500_vol) * 100).toFixed(1); return `\n波動率差異: ${diff > 0 ? '+' : ''}${diff}%`; } } } }
                }
            });
        };

        const performanceMetrics = computed(() => {
            const slicedData = backtestData.value.slice(-(performanceYears.value * 12));
            if (slicedData.length === 0) return { portfolioCAGR: 0, sp500CAGR: 0, portfolioVol: 0, sp500Vol: 0, returnDiff: 0, volDiff: 0 };
            const firstData = slicedData[0], lastData = slicedData[slicedData.length - 1], years = performanceYears.value;
            const portfolioCAGR = Math.pow(lastData.portfolio_value / firstData.portfolio_value, 1 / years) - 1;
            const sp500CAGR = Math.pow(lastData.sp500_value / firstData.sp500_value, 1 / years) - 1;
            const portfolioReturns = slicedData.slice(1).map(d => d.portfolio_monthly_return);
            const sp500Returns = slicedData.slice(1).map((d, i) => (d.sp500_value - slicedData[i].sp500_value) / slicedData[i].sp500_value);
            const portfolioVol = calculateVolatility(portfolioReturns), sp500Vol = calculateVolatility(sp500Returns);
            return { portfolioCAGR, sp500CAGR, portfolioVol, sp500Vol, returnDiff: portfolioCAGR - sp500CAGR, volDiff: portfolioVol - sp500Vol };
        });

        const calculateVolatility = (returns) => {
            if (returns.length === 0) return 0;
            const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
            const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
            return Math.sqrt(variance * 12);
        };
        
        const formatK = (num) => { if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M'; if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K'; return num.toLocaleString(); };
        const pct = (n) => (n * 100).toFixed(1) + '%';
        
        watch(backtestYears, drawBacktestChart);
        
       // NEW, FIXED CODE
        watch(activeTab, (newTab) => {
            // Wait for Vue to render the correct canvas element before drawing the chart
            nextTick(() => {
                if (newTab === 'backtest') {
                    drawBacktestChart();
                } else if (newTab === 'volatility') {
                    drawVolatilityChart();
                }
            });
        });
        
        onMounted(() => { 
            backtestData.value = parseCSV(csvData); 
            nextTick(() => { drawPieChart(); drawBacktestChart(); }); 
            document.title = `${portfolio.name} - 墨鏡姐複利樹`;
        });

        return { portfolio, backtestYears, performanceYears, performanceMetrics, pieColors, formatK, pct, activeTab, isMenuOpen, toggleMenu};
    }
}).mount('#app');