const PortfolioPage = {
    template: `
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h1><img class="w-48 h-auto" src="img/logo.svg" alt="墨鏡姐複利樹"></h1>
                    <nav class="relative z-20">
                        <div class="flex justify-end">
                            <button @click="toggleMenu" class="p-2 rounded-md hover:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary" aria-label="Open navigation menu">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                        </div>
                    
                        <transition
                            enter-active-class="transition-opacity ease-in-out duration-300"
                            enter-from-class="opacity-0"
                            enter-to-class="opacity-100"
                            leave-active-class="transition-opacity ease-in-out duration-300"
                            leave-from-class="opacity-100"
                            leave-to-class="opacity-0"
                        >
                            <div v-if="isMenuOpen" class="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
                                <button @click="toggleMenu" class="absolute top-5 right-5 p-2 text-gray-400 hover:text-white" aria-label="Close navigation menu">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div class="flex flex-col items-center gap-8">
                                    <a @click="toggleMenu" href="goal.html" class="text-2xl text-gray-300 hover:text-primary transition-colors">財務規劃</a>
                                    <a @click="toggleMenu" href="all_weather.html" :class="['text-2xl hover:text-primary transition-colors', { 'text-primary font-semibold': portfolio.name === '全天候策略' }]">全天候策略</a>
                                    <a @click="toggleMenu" href="classic3.html" :class="['text-2xl hover:text-primary transition-colors', { 'text-primary font-semibold': portfolio.name === '三基金組合' }]">三基金組合</a>
                                    <a @click="toggleMenu" href="aggressive.html" :class="['text-2xl hover:text-primary transition-colors', { 'text-primary font-semibold': portfolio.name === '積極型股債組合' }]">積極型股債組合</a>
                                    <a @click="toggleMenu" href="core4.html" :class="['text-2xl hover:text-primary transition-colors', { 'text-primary font-semibold': portfolio.name === '核心四基金' }]">核心四基金</a>
                                    <a @click="toggleMenu" href="voo.html" :class="['text-2xl hover:text-primary transition-colors', { 'text-primary font-semibold': portfolio.name === '巴菲特推薦' }]">巴菲特推薦</a>
                                </div>
                            </div>
                        </transition>
                    </nav>
                </header>

                <main>
                    <div class="bg-surface rounded-lg p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-3">{{ portfolio.name }}</h2>
                        <div class="overflow-hidden">
                            <div class="text-gray-300 leading-relaxed" ref="descriptionContainerEl" :class="{ 'truncate-list': !isDescriptionExpanded }" v-html="portfolio.description"></div>
                            <button v-if="showDescriptionToggle" @click="$emit('update:isDescriptionExpanded', !isDescriptionExpanded)" class="flex items-center justify-center w-full text-sm font-semibold p-2 mt-2 bg-background/50 hover:bg-background/80 transition-colors rounded-md">
                                <span>{{ isDescriptionExpanded ? '收合' : '展開全部' }}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1 transition-transform duration-300" :class="{ 'rotate-180': isDescriptionExpanded }" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="bg-surface rounded-lg p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">適用財務規劃屬性</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-background p-4 rounded-lg border border-gray-700">
                                <h3 class="font-bold text-lg mb-2 flex items-center"><i class="mdi mdi-account-clock mr-2 text-primary"></i>退休規劃</h3>
                                <p class="text-gray-400 text-sm">{{ portfolio.retirement }}</p>
                            </div>
                            <div class="bg-background p-4 rounded-lg border border-gray-700">
                                <h3 class="font-bold text-lg mb-2 flex items-center"><i class="mdi mdi-school mr-2 text-secondary"></i>教育基金</h3>
                                <p class="text-gray-400 text-sm">{{ portfolio.education }}</p>
                            </div>
                            <div class="bg-background p-4 rounded-lg border border-gray-700">
                                <h3 class="font-bold text-lg mb-2 flex items-center"><i class="mdi mdi-home mr-2 text-blue-400"></i>購屋基金</h3>
                                <p class="text-gray-400 text-sm">{{ portfolio.housing }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div class="lg:col-span-5 flex flex-col gap-6">
                            <div class="bg-surface rounded-lg p-6">
                                <h3 class="text-xl font-bold mb-4">組成標的與比例</h3>
                                <div class="flex flex-col md:flex-row items-center gap-6">
                                    <div class="pie-chart-container"><canvas id="pie-chart"></canvas></div>
                                    <div class="w-full space-y-3">
                                        <div v-for="(percent, asset) in portfolio.data.allocations" :key="asset">
                                            <a v-if="tickerUrls[asset]" :href="tickerUrls[asset]" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 bg-background/50 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                                                <div class="w-4 h-4 rounded" :style="{ backgroundColor: pieColors[Object.keys(portfolio.data.allocations).indexOf(asset)] }"></div>
                                                <span>{{ asset }}: {{ percent }}%</span>
                                            </a>
                                            <div v-else class="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                                                <div class="w-4 h-4 rounded" :style="{ backgroundColor: pieColors[Object.keys(portfolio.data.allocations).indexOf(asset)] }"></div>
                                                <span>{{ asset }}: {{ percent }}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-surface rounded-lg p-6">
                                 <h3 class="text-xl font-bold mb-4">績效表現</h3>
                                 <div class="grid grid-cols-2 gap-4">
                                     <div class="bg-background p-4 rounded-lg">
                                        <div class="flex items-center gap-1 text-sm text-gray-400">
                                            <span>年化報酬率</span>
                                            <i @click="openModal('cagr')" class="mdi mdi-information-outline cursor-pointer hover:text-primary transition-colors"></i>
                                        </div>
                                        <div class="text-2xl font-bold text-primary">{{ pct(portfolio.data.CAGR) }}</div>
                                     </div>
                                     <div class="bg-background p-4 rounded-lg">
                                        <div class="flex items-center gap-1 text-sm text-gray-400">
                                            <span>年化波動率</span>
                                            <i @click="openModal('volatility')" class="mdi mdi-information-outline cursor-pointer hover:text-primary transition-colors"></i>
                                        </div>
                                        <div class="text-2xl font-bold">{{ pct(portfolio.data.volatility) }}</div>
                                     </div>
                                     <div class="bg-background p-4 rounded-lg">
                                        <div class="flex items-center gap-1 text-sm text-gray-400">
                                            <span>最大回撤</span>
                                            <i @click="openModal('maxDrawdown')" class="mdi mdi-information-outline cursor-pointer hover:text-primary transition-colors"></i>
                                        </div>
                                        <div class="text-2xl font-bold text-error">{{ pct(portfolio.data.maxDrawdown) }}</div>
                                     </div>
                                     <div class="bg-background p-4 rounded-lg">
                                        <div class="flex items-center gap-1 text-sm text-gray-400">
                                            <span>年化報酬/年化波動比</span>
                                            <i @click="openModal('sharpe')" class="mdi mdi-information-outline cursor-pointer hover:text-primary transition-colors"></i>
                                        </div>
                                        <div class="text-2xl font-bold">{{ (portfolio.data.CAGR / portfolio.data.volatility).toFixed(2) }}</div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                        
                        <div class="lg:col-span-7 bg-surface rounded-lg">
                            <div class="border-b border-gray-700">
                                <nav class="-mb-px flex">
                                    <button @click="$emit('update:activeTab', 'backtest')" :class="['py-4 px-6 font-medium text-center', activeTab === 'backtest' ? 'border-b-2 border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-200']">投資回測</button>
                                    <button @click="$emit('update:activeTab', 'volatility')" :class="['py-4 px-6 font-medium text-center', activeTab === 'volatility' ? 'border-b-2 border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-200']">歷年年化波動</button>
                                </nav>
                            </div>
                            
                            <div class="p-6">
                                <div v-if="activeTab === 'backtest'">
                                    <div class="flex gap-2 mb-4">
                                        <button @click="$emit('update:selectedYears', 3)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 3 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 3 年</button>
                                        <button @click="$emit('update:selectedYears', 5)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 5 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 5 年</button>
                                        <button @click="$emit('update:selectedYears', 10)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 10 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 10 年</button>
                                    </div>
                                    <div class="h-96"><canvas id="backtest-chart"></canvas></div>
                                    <table class="w-full text-sm my-4">
                                        <thead class="bg-background/50">
                                            <tr>
                                                <th class="p-3 text-left font-semibold">指標</th>
                                                <th class="p-3 text-center font-semibold">{{ portfolio.name }}</th>
                                                <th class="p-3 text-center font-semibold">S&P 500</th>
                                                <th class="p-3 text-center font-semibold">差異</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td class="p-3 border-t border-gray-700 font-bold">年化報酬率</td>
                                                <td class="p-3 border-t border-gray-700 text-center font-bold text-primary">{{ pct(performanceMetrics.portfolioCAGR) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center">{{ pct(performanceMetrics.sp500CAGR) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center" :class="performanceMetrics.returnDiff >= 0 ? 'text-success' : 'text-error'">
                                                    {{ (performanceMetrics.returnDiff >= 0 ? '+' : '') + pct(performanceMetrics.returnDiff) }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div class="text-right text-xs text-gray-500 mt-2">
                                        以初始投入10000美元，每月定期投入100元來計算，資料截至 {{ latestDataDate }}
                                    </div>
                                </div>
                                <div v-if="activeTab === 'volatility'">
                                     <div class="flex gap-2 mb-4">
                                        <button @click="$emit('update:selectedYears', 3)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 3 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 3 年</button>
                                        <button @click="$emit('update:selectedYears', 5)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 5 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 5 年</button>
                                        <button @click="$emit('update:selectedYears', 10)" :class="['px-4 py-1 rounded-full text-sm', selectedYears === 10 ? 'bg-primary text-white' : 'bg-background hover:bg-background/70']">近 10 年</button>
                                    </div>
                                    <div class="h-96"><canvas id="volatility-chart"></canvas></div>
                                    <table class="w-full text-sm my-4">
                                        <thead class="bg-background/50">
                                            <tr>
                                                <th class="p-3 text-left font-semibold">指標</th>
                                                <th class="p-3 text-center font-semibold">{{ portfolio.name }}</th>
                                                <th class="p-3 text-center font-semibold">S&P 500</th>
                                                <th class="p-3 text-center font-semibold">差異</th>
                                            </tr>
                                        </thead>
                                        <tbody> 
                                            <tr>
                                                <td class="p-3 border-t border-gray-700 font-bold">年化波動率</td>
                                                <td class="p-3 border-t border-gray-700 text-center font-bold text-primary">{{ pct(performanceMetrics.portfolioVol) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center">{{ pct(performanceMetrics.sp500Vol) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center" :class="performanceMetrics.volDiff <= 0 ? 'text-success' : 'text-error'">
                                                    {{ (performanceMetrics.volDiff >= 0 ? '+' : '') + pct(performanceMetrics.volDiff) }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="p-3 border-t border-gray-700 font-bold">風險調整報酬</td>
                                                <td class="p-3 border-t border-gray-700 text-center font-bold text-primary">{{ (performanceMetrics.portfolioCAGR / performanceMetrics.portfolioVol).toFixed(2) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center">{{ (performanceMetrics.sp500CAGR / performanceMetrics.sp500Vol).toFixed(2) }}</td>
                                                <td class="p-3 border-t border-gray-700 text-center" :class="(performanceMetrics.portfolioCAGR / performanceMetrics.portfolioVol) >= (performanceMetrics.sp500CAGR / performanceMetrics.sp500Vol) ? 'text-success' : 'text-error'">
                                                    {{ ((performanceMetrics.portfolioCAGR / performanceMetrics.portfolioVol) - (performanceMetrics.sp500CAGR / performanceMetrics.sp500Vol) >= 0 ? '+' : '') + ((performanceMetrics.portfolioCAGR / performanceMetrics.portfolioVol) - (performanceMetrics.sp500CAGR / performanceMetrics.sp500Vol)).toFixed(2) }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div class="text-right text-xs text-gray-500 mt-2">
                                        資料截至 {{ latestDataDate }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div class="bg-surface rounded-lg p-6">
                            <h3 class="text-xl font-bold text-success mb-4 flex items-center"><i class="mdi mdi-check-circle mr-2"></i>優點</h3>
                            <div class="overflow-hidden">
                                <ul class="pros-list space-y-2" ref="prosContainerEl" :class="{ 'truncate-list': !isProsExpanded }">
                                    <li v-for="(pro, index) in portfolio.pros" :key="index">{{ pro }}</li>
                                </ul>
                                <button v-if="showProsToggle" @click="$emit('update:isProsExpanded', !isProsExpanded)" class="flex items-center justify-center w-full text-sm font-semibold p-2 mt-2 bg-background/50 hover:bg-background/80 transition-colors rounded-md">
                                    <span>{{ isProsExpanded ? '收合' : '展開全部' }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1 transition-transform duration-300" :class="{ 'rotate-180': isProsExpanded }" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="bg-surface rounded-lg p-6">
                            <h3 class="text-xl font-bold text-warning mb-4 flex items-center"><i class="mdi mdi-alert-circle mr-2"></i>缺點</h3>
                             <div class="overflow-hidden">
                                <ul class="cons-list space-y-2" ref="consContainerEl" :class="{ 'truncate-list': !isConsExpanded }">
                                    <li v-for="(con, index) in portfolio.cons" :key="index">{{ con }}</li>
                                </ul>
                                <button v-if="showConsToggle" @click="$emit('update:isConsExpanded', !isConsExpanded)" class="flex items-center justify-center w-full text-sm font-semibold p-2 mt-2 bg-background/50 hover:bg-background/80 transition-colors rounded-md">
                                    <span>{{ isConsExpanded ? '收合' : '展開全部' }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1 transition-transform duration-300" :class="{ 'rotate-180': isConsExpanded }" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <transition enter-active-class="transition-opacity ease-out duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
                        <div v-if="isModalOpen" @click="closeModal" class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" style="backdrop-filter: blur(4px);">
                            <div @click.stop class="bg-surface rounded-lg shadow-xl max-w-2xl w-full p-6 m-4 text-gray-200 border border-gray-700">
                                <div class="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                                    <h3 class="text-xl font-bold text-primary">{{ modalData.title }}</h3>
                                    <button @click="closeModal" class="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                                </div>
                                <div>
                                    <h4 class="font-semibold mb-2 text-gray-300">計算方式</h4>
                                    <p class="text-sm text-gray-400 bg-background/50 p-3 rounded-md mb-4">{{ modalData.calculation }}</p>
                                    <h4 class="font-semibold mb-2 text-gray-300">為何重要</h4>
                                    <p class="text-sm text-gray-400 leading-relaxed">{{ modalData.importance }}</p>
                                </div>
                            </div>
                        </div>
                    </transition>
                </main>
            </div>
        </div>
    `,
    props: {
        portfolio: Object,
        tickerUrls: Object,
        metricExplanations: Object,
        pieColors: Array,
        charts: Object,
        activeTab: String,
        selectedYears: Number,
        isMenuOpen: Boolean,
        isModalOpen: Boolean,
        modalData: Object,
        isDescriptionExpanded: Boolean,
        isProsExpanded: Boolean,
        isConsExpanded: Boolean,
        performanceMetrics: Object,
        latestDataDate: String
    }, // Closing bracket for props array
    emits: [
        'toggle-menu', 'open-modal', 'close-modal',
        'update:activeTab', 'update:selectedYears',
        'update:isDescriptionExpanded', 'update:isProsExpanded', 'update:isConsExpanded'
    ],
    methods: {
        toggleMenu() { this.$emit('toggle-menu'); },
        openModal(metric) { this.$emit('open-modal', metric); },
        closeModal() { this.$emit('close-modal'); },
        pct(n) { return (n * 100).toFixed(1) + '%'; }
    },    
    setup(props, { emit }) {
        const { ref, onMounted, nextTick, watch } = Vue;

        // Refs for the containers to check for overflow
        const descriptionContainerEl = ref(null);
        const prosContainerEl = ref(null);
        const consContainerEl = ref(null);

        // Props to be passed to parent
        const showDescriptionToggle = ref(false);
        const showProsToggle = ref(false);
        const showConsToggle = ref(false);

        const checkOverflow = () => {
            nextTick(() => {
                showDescriptionToggle.value = descriptionContainerEl.value && descriptionContainerEl.value.scrollHeight > descriptionContainerEl.value.clientHeight;
                showProsToggle.value = prosContainerEl.value && prosContainerEl.value.scrollHeight > prosContainerEl.value.clientHeight;
                showConsToggle.value = consContainerEl.value && consContainerEl.value.scrollHeight > consContainerEl.value.clientHeight;
            });
        };

        // --- LIFECYCLE HOOK ---
        onMounted(() => {
            checkOverflow();
        });

        // Watch for portfolio changes to re-check overflow
        watch(() => props.portfolio, checkOverflow, { deep: true });

        // Expose refs to the template
        return {
            descriptionContainerEl, prosContainerEl, consContainerEl,
            showDescriptionToggle, showProsToggle, showConsToggle
        };
    }
};












































































































































































































































































































    