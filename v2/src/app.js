// app.js (Final, Corrected Version - 2025/09/16)

document.addEventListener('DOMContentLoaded', function() {
    if (typeof portfolioConfig === 'undefined') {
        console.error("No portfolio configuration object found! Make sure to load a specific config file before app.js.");
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = '<h3>設定檔載入失敗</h3><p>無法找到投資組合的設定資料。</p>';
        }
        return;
    }
    initializeApp(portfolioConfig);
});

const { createApp, ref, watch, onMounted, nextTick, computed } = Vue;

async function initializeApp(config) {
    const { dataUrl, sp500DataUrl } = config.googleSheet;

    if (!dataUrl || !sp500DataUrl) {
        console.error("The portfolio config object is missing required Google Sheet URLs.");
        return;
    }

    try {
        const [portfolioResponse, sp500Response] = await Promise.all([
            fetch(dataUrl),
            fetch(sp500DataUrl)
        ]);

        if (!portfolioResponse.ok || !sp500Response.ok) throw new Error(`Network response was not ok.`);

        const portfolioCsvText = await portfolioResponse.text();
        const sp500CsvText = await sp500Response.text();

        createApp({
            components: {
                'portfolio-page': PortfolioPage
            },
            setup() {
                // --- TICKER URLS DATA ---
                const tickerUrls = {
                    VTI: 'https://www.cmoney.tw/r/261/fq3m6k',
                    TLT: 'https://www.cmoney.tw/r/261/y8hmnd',
                    IEF: 'https://www.cmoney.tw/r/261/vzi8q5',
                    GLD: 'https://www.cmoney.tw/r/261/3cfs26',
                    GSG: 'https://www.cmoney.tw/r/261/pm6hif', // Mapped from DBC as it's a commodity ETF
                    DBC: 'https://www.cmoney.tw/r/261/pm6hif',
                    VXUS: 'https://www.cmoney.tw/r/261/27hhtr',
                    BND: 'https://www.cmoney.tw/r/261/mg8yzu',
                    VT: 'https://www.cmoney.tw/r/261/7penqj',
                    BNDW: 'https://www.cmoney.tw/r/261/8ao9a9',
                    VNQ: 'https://www.cmoney.tw/r/261/1w4dak',
                    VOO: 'https://www.cmoney.tw/r/261/h3fb92'
                };

                // --- METRIC EXPLANATIONS DATA ---
                const metricExplanations = {
                    cagr: {
                        title: '年化報酬率 (CAGR)',
                        calculation: '(期末價值 / 期初價值)^(1 / 年數) - 1',
                        importance: '它衡量的是在指定時期內，一項投資的年平均增長率。與簡單平均報酬率不同，CAGR考慮了複利效應，能更準確地反映長期的真實回報表現。'
                    },
                    volatility: {
                        title: '年化波動率 (Standard Deviation)',
                        calculation: '基於月報酬率計算標準差，再乘以 √12 將其年化。',
                        importance: '這是衡量投資風險最常用的指標。它代表了投資回報的不確定性；波動率越高，意味著資產價格的擺盪幅度越大，潛在的風險也越高。投資人可以此評估自己是否能承受這樣的價格波動。'
                    },
                    maxDrawdown: {
                        title: '最大回撤 (Max Drawdown)',
                        calculation: '在選定週期內，從任意一個高點回落到之後任意一個低點的最大跌幅百分比。',
                        importance: '這個指標衡量了在最壞情況下，投資可能面臨的最大虧損。它反映了投資組合的抗跌能力，對於風險趨避的投資人尤其重要，能幫助了解潛在的下行風險。'
                    },
                    sharpe: {
                        title: '夏普比率',
                        calculation: '(年化報酬率 - 無風險利率) / 年化波動率。在此我們簡化為 年化報酬率 / 年化波動率。',
                        importance: '這個比率（夏普比率的簡化版）衡量的是「每承受一單位風險，可以獲得多少超額報酬」。比率越高，代表投資組合在承受相同風險下，能創造出更佳的回報，投資效率也越高。'
                    }
                };

                // --- STATE REFS ---
                const portfolio = config.portfolio;
                const activeTab = ref('backtest');
                const portfolioRawData = ref([]);
                const sp500RawData = ref([]);
                const volatilityData = ref([]);
                const selectedYears = ref(10);
                const pieColors = ['#208065', '#40A080', '#60C0A0', '#80E0C0', '#A0FFA0', '#806420'];
                const charts = {};
                
                // Menu and Modal states
                const isMenuOpen = ref(false);
                const isModalOpen = ref(false);
                const modalData = ref({ title: '', calculation: '', importance: '' });

                // Expand/Collapse states
                const isDescriptionExpanded = ref(false); 
                const isProsExpanded = ref(false);
                const isConsExpanded = ref(false);

                // --- METHODS ---
                const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };
                // These methods are called by the child component's emits
                const updateActiveTab = (newTab) => { activeTab.value = newTab; };
                const updateSelectedYears = (newYears) => { selectedYears.value = newYears; };

                const openModal = (metricKey) => {
                    modalData.value = metricExplanations[metricKey];
                    isModalOpen.value = true;
                };
                const closeModal = () => { isModalOpen.value = false; };
                
                // Helper Functions
                const parseCSV = (csv) => {
                    const lines = csv.trim().split('\n');
                    if (lines.length < 2) return [];
                    const headers = lines.shift().split(',').map(h => h.trim());
                    return lines.map(line => {
                        const values = line.split(',');
                        const entry = {};
                        headers.forEach((header, i) => {
                            let value = values[i] ? values[i].trim() : '';
                            if (value === '') {
                                entry[header] = undefined; return;
                            }
                            if (value.includes('%')) {
                                const numericValue = parseFloat(value.replace(/["%]/g, '')) / 100; // 移除引號和 %
                                entry[header] = isNaN(numericValue) ? value : numericValue;
                            } else {
                                const numericValue = Number(value.replace(/[""]/g, '')); // 移除引號
                                entry[header] = isNaN(numericValue) ? value : numericValue;
                            }
                        });
                        return entry;
                    });
                };

                const normalizeDate = (dateInput) => {
                    if (!dateInput) return null;
                    const dateStr = String(dateInput);
                    if (dateStr.includes('/') || dateStr.includes('-')) {
                        const parts = dateStr.split(/[\/-]/);
                        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            return `${parseInt(parts[0], 10)}-${parseInt(parts[1], 10)}`;
                        }
                    } else if (dateStr.length === 6 && !isNaN(Number(dateStr))) {
                        const year = dateStr.substring(0, 4);
                        const month = dateStr.substring(4, 6);
                        return `${year}-${parseInt(month, 10)}`;
                    }
                    return dateStr;
                };

                const getCombinedBacktestData = (years) => {
                    if (portfolioRawData.value.length === 0 || sp500RawData.value.length === 0) return [];
                    
                    let portfolioColumn, sp500Column;
                    
                    // --- FIX START: 修正 S&P 500 回測資料的欄位名稱 ---
                    // 根據新檔案 `墨鏡姊網頁資料 - SPY.csv` 的欄位名稱進行修正
                    if (years === 5) {
                        portfolioColumn = 'pv5';
                        sp500Column = 'spy_pv5'; // 原本是 'spy_value_5'，新檔案中為 'pv5'
                    } else if (years === 3) {
                        portfolioColumn = 'pv3';
                        sp500Column = 'spy_pv3'; // 原本是 'spy_value_3'，新檔案中為 'pv3'
                    } else {
                        portfolioColumn = 'pv10';
                        sp500Column = 'spy_pv10'; // 10年期欄位名稱 'spy_value' 在新舊檔案中一致
                    }
                    // --- FIX END ---

                    const portfolioDates = new Set(portfolioRawData.value.map(d => normalizeDate(d.date)));
                    const sp500Dates = new Set(sp500RawData.value.map(d => normalizeDate(d.date)));
                    const commonDates = new Set([...portfolioDates].filter(date => sp500Dates.has(date)));

                    const sp500Map = new Map(sp500RawData.value.map(d => [normalizeDate(d.date), d]));
                    
                    return portfolioRawData.value.filter(portfolioRow => commonDates.has(normalizeDate(portfolioRow.date))).map(portfolioRow => {
                        const sp500Row = sp500Map.get(normalizeDate(portfolioRow.date)) || {};
                        return {
                            date: portfolioRow.date,
                            portfolio_value: portfolioRow[portfolioColumn],
                            spy_value: sp500Row[sp500Column]
                        };
                    }).filter(d => d.date && typeof d.portfolio_value === 'number' && typeof d.spy_value === 'number');
                };
                
                // Initial Data Parsing
                const allPortfolioData = parseCSV(portfolioCsvText);
                portfolioRawData.value = allPortfolioData;
                sp500RawData.value = parseCSV(sp500CsvText);
                
                // --- FIX START: 移除舊的 volatilityData 賦值 ---
                // volatilityData.value = allPortfolioData.filter(d => d['v-date'] && d.portfolio_vol !== undefined);
                // 舊的邏輯只從 portfolio data 拿資料，且會因 spy_vol 欄位缺失而失敗
                // 新的邏輯將在 drawVolatilityChart 函數中動態組合資料
                // --- FIX END ---
                
                const summaryData = allPortfolioData.find(d => d.CAGR10 !== undefined);
                if (summaryData) {
                    portfolio.data.CAGR = summaryData.CAGR10 || 0;
                    portfolio.data.volatility = summaryData.v10 || 0;
                    portfolio.data.maxDrawdown = summaryData.MDD || 0;
                }

                // Chart Drawing Functions
                const createOrUpdateChart = (id, config) => { if (charts[id]) { charts[id].destroy(); } const ctx = document.getElementById(id)?.getContext('2d'); if (ctx) { charts[id] = new Chart(ctx, config); } };
                const drawPieChart = () => createOrUpdateChart('pie-chart', { type: 'doughnut', data: { labels: Object.keys(portfolio.data.allocations), datasets: [{ data: Object.values(portfolio.data.allocations), backgroundColor: pieColors, borderWidth: 2, borderColor: '#0D0D0D' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });

                const drawBacktestChart = () => {
                    const chartData = getCombinedBacktestData(selectedYears.value);
                    if (!chartData || chartData.length === 0) return;
                    createOrUpdateChart('backtest-chart', {
                        type: 'line', data: { labels: chartData.map(d => d.date), datasets: [{ label: portfolio.name, data: chartData.map(d => d.portfolio_value), borderColor: '#208065', tension: 0.1, pointRadius: 0 }, { label: 'S&P 500', data: chartData.map(d => d.spy_value), borderColor: '#806420', tension: 0.1, pointRadius: 0 }] },
                        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { ticks: { color: '#FFF' } }, y: { ticks: { color: '#FFF', callback: v => formatK(v) } } },
                            plugins: { legend: { labels: { color: '#FFF' } }, tooltip: { 
                                    backgroundColor: 'rgba(0, 0, 0, 0.95)', titleColor: '#208065', bodyColor: '#ffffff', borderColor: '#208065', borderWidth: 1,
                                    padding: 16, bodySpacing: 8,
                                    callbacks: {
                                        title: context => `日期: ${chartData[context[0].dataIndex].date}`,
                                        label: (context) => {
                                            const dp = chartData[context.dataIndex];
                                            if (!dp) return '';
                                            const isPortfolio = context.dataset.label === portfolio.name;
                                            const value = isPortfolio ? dp.portfolio_value : dp.spy_value;
                                            const valueFormatted = typeof value === 'number' ? value.toLocaleString() : 'N/A';
                                            return `${context.dataset.label}價值: $${valueFormatted}`;
                                        },
                                        afterBody: (tooltipItems) => {
                                            if (!tooltipItems || tooltipItems.length < 2) return '';
                                            const dataIndex = tooltipItems[0].dataIndex;
                                            const dp = chartData[dataIndex];
                                            if (!dp || typeof dp.portfolio_value !== 'number' || typeof dp.spy_value !== 'number' || dp.spy_value === 0) return '';
                                            const diff = ((dp.portfolio_value - dp.spy_value) / dp.spy_value * 100).toFixed(2);
                                            return `\n相對表現: ${diff >= 0 ? '+' : ''}${diff}%`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                };
                
                // --- FIX START: 重構波動率圖表繪製邏輯 ---
                const drawVolatilityChart = () => {
                    // 1. 建立 S&P 500 的波動率資料對照表
                    const sp500VolMap = new Map(
                        sp500RawData.value
                            .filter(d => d['v-date'])
                            .map(d => [normalizeDate(d['v-date']), d])
                    );
                    
                    // 2. 組合圖表所需資料
                    const chartData = portfolioRawData.value
                        .filter(d => d['v-date'] && d.portfolio_vol !== undefined && sp500VolMap.has(normalizeDate(d['v-date'])))
                        .map(portfolioRow => {
                            const sp500Row = sp500VolMap.get(normalizeDate(portfolioRow['v-date'])) || {};
                            return { // Keep original v-date format for labels
                                date: portfolioRow['v-date'],
                                portfolio_vol: typeof portfolioRow.portfolio_vol === 'number' ? portfolioRow.portfolio_vol : parseFloat(String(portfolioRow.portfolio_vol).replace('%',''))/100,
                                // 優先讀取 spy_vol (舊格式)，若無則讀取 portfolio_vol (新格式)
                                spy_vol: sp500Row.spy_vol !== undefined ? sp500Row.spy_vol : sp500Row.portfolio_vol
                            };
                        })
                        .filter(d => d.date && !isNaN(d.portfolio_vol) && !isNaN(d.spy_vol));
                    
                    if (!chartData || chartData.length === 0) return;

                    // 3. 動態計算日期範圍，篩選出最近 N 年的資料
                    const latestDateEntry = chartData[chartData.length - 1];
                    if (!latestDateEntry || !latestDateEntry.date) return;

                    const [latestYear, latestMonth] = String(latestDateEntry.date).split(/[\/-]/).map(Number);
                    const startYear = latestYear - selectedYears.value;

                    const finalChartData = chartData.filter(d => {
                        const [year, month] = String(d.date).split(/[\/-]/).map(Number);
                        // 篩選出大於起始年份，或同年但月份大於等於的資料
                        return year > startYear || (year === startYear && month >= latestMonth);
                    });
                    createOrUpdateChart('volatility-chart', {
                        type: 'line', data: { labels: finalChartData.map(d => d.date), datasets: [{ label: portfolio.name, data: finalChartData.map(d => d.portfolio_vol), borderColor: '#208065', tension: 0.1, pointRadius: 3, pointHoverRadius: 6 }, { label: 'S&P 500', data: finalChartData.map(d => d.spy_vol), borderColor: '#806420', tension: 0.1, pointRadius: 3, pointHoverRadius: 6 }] },
                        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                            scales: { x: { ticks: { color: '#FFF' } }, y: { ticks: { color: '#FFF', callback: value => (value * 100).toFixed(0) + '%' } } },
                            plugins: { legend: { labels: { color: '#FFF' } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.95)', titleColor: '#208065', bodyColor: '#ffffff', borderColor: '#208065', borderWidth: 1,
                                    callbacks: {
                                        title: ctx => `日期: ${finalChartData[ctx[0].dataIndex].date}`,
                                        label: ctx => {
                                            const dp = finalChartData[ctx.dataIndex];
                                            if (ctx.dataset.label === portfolio.name) { return `${portfolio.name} 年化波動率: ${(dp.portfolio_vol * 100).toFixed(1)}%`; } else { return `S&P 500 年化波動率: ${(dp.spy_vol * 100).toFixed(1)}%`; }
                                        }
                                    }
                                }
                            }
                        }
                    });
                };
                // --- FIX END ---
                
                const performanceMetrics = computed(() => {
                    if (portfolioRawData.value.length === 0 || sp500RawData.value.length === 0) {
                        return { portfolioCAGR: 0, sp500CAGR: 0, portfolioVol: 0, sp500Vol: 0, returnDiff: 0, volDiff: 0 };
                    }
                    let cagrColumn, volColumn;
                    if (selectedYears.value === 5) {
                        cagrColumn = 'CAGR5'; volColumn = 'v5';
                    }  else if (selectedYears.value === 3) {
                        cagrColumn = 'CAGR3'; volColumn = 'v3';
                    } else {
                        cagrColumn = 'CAGR10'; volColumn = 'v10';
                    }

                    // --- FIX START: 修正指標計算，確保從各自的檔案讀取 ---
                    const portfolioRow = portfolioRawData.value.find(row => row[cagrColumn] !== undefined && row[volColumn] !== undefined);
                    const sp500Row = sp500RawData.value.find(row => row[cagrColumn] !== undefined && row[volColumn] !== undefined);
                    
                    const portfolioCAGR = portfolioRow ? portfolioRow[cagrColumn] : 0;
                    const sp500CAGR = sp500Row ? sp500Row[cagrColumn] : 0;

                    const portfolioVol = portfolioRow ? portfolioRow[volColumn] : 0;
                    const sp500Vol = sp500Row ? sp500Row[volColumn] : 0;
                    // --- FIX END ---

                    return { portfolioCAGR, sp500CAGR, portfolioVol, sp500Vol, returnDiff: portfolioCAGR - sp500CAGR, volDiff: portfolioVol - sp500Vol };
                });

                const latestDataDate = computed(() => {
                    const data = portfolioRawData.value;
                    if (!data || data.length === 0) return 'N/A';
                    const dateEntries = data.filter(d => d.date);
                    if (dateEntries.length === 0) return 'N/A';
                    // 返回 YYYYMM 格式
                    return String(dateEntries[dateEntries.length - 1].date);
                });

                // Utility Functions
                const formatK = (num) => { if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K'; return num.toLocaleString(); };
                const pct = (n) => (n * 100).toFixed(1) + '%';
                
                // --- WATCHERS ---
                watch(selectedYears, () => {
                    drawBacktestChart();
                    drawVolatilityChart();
                });
                watch(activeTab, (newTab) => { nextTick(() => { if (newTab === 'backtest') drawBacktestChart(); else if (newTab === 'volatility') drawVolatilityChart(); }); });
                
                const handleBodyScroll = (shouldLock) => {
                    if (shouldLock) {
                        document.body.classList.add('overflow-hidden');
                    } else {
                        document.body.classList.remove('overflow-hidden');
                    }
                };
                watch(isMenuOpen, handleBodyScroll);
                watch(isModalOpen, handleBodyScroll);

                // --- LIFECYCLE HOOK ---
                onMounted(() => {
                    nextTick(() => { drawPieChart(); drawBacktestChart(); drawVolatilityChart(); });
                    document.title = `${portfolio.name} - 墨鏡姐複利樹`;
                });

                // --- EXPOSE TO TEMPLATE ---
                return { 
                    portfolio, selectedYears, performanceMetrics, pieColors, formatK, pct, activeTab, isMenuOpen, toggleMenu,
                    isDescriptionExpanded, isProsExpanded, isConsExpanded, latestDataDate,
                    isModalOpen, modalData, openModal, closeModal,
                    tickerUrls,
                    metricExplanations, charts, updateActiveTab, updateSelectedYears
                };
            }
        }).mount('#app');

    } catch (error) {
        console.error('Failed to fetch or process portfolio data:', error);
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = '<h3>資料載入失敗</h3><p>請檢查網路連線或 Google Sheet 發布設定。</p>';
        }
    } finally {
        // This block ensures the loading screen is hidden, even if data fetching fails.
        const loadingOverlay = document.getElementById('loadingOverlay');
        const app = document.getElementById('app');
        if (loadingOverlay && app) {
            loadingOverlay.style.opacity = '0';
            app.style.opacity = '1';
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        }
    }
}