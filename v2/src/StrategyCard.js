const StrategyCard = {
  props: {
    strategy: {
      type: Object,
      required: true
    },
    chartColors: {
      type: Object,
      required: true
    },
    isRecommendation: {
      type: Boolean,
      default: false
    },
    formatCurrency: {
        type: Function,
        default: (val) => val
    },
    cardNumber: {
      type: Number,
      default: null
    },
    layout: {
      type: String,
      default: 'vertical' // can be 'vertical' or 'horizontal'
    }
  }, 
  data() {
    return {
      chartInstance: null,
      uniqueId: `pie-chart-${Math.random().toString(36).substr(2, 9)}`
    };
  },
  mounted() {
    this.drawPieChart();
  },
  watch: {
    'strategy.simplifiedAllocation': {
      handler() {
        this.drawPieChart();
      },
      deep: true
    }
  },
  methods: {
    drawPieChart() {
      this.$nextTick(() => {
        const ctx = document.getElementById(this.uniqueId)?.getContext('2d');
        if (!ctx) return;
        if (this.chartInstance) this.chartInstance.destroy();
        
        const labels = Object.keys(this.strategy.simplifiedAllocation);
        const data = Object.values(this.strategy.simplifiedAllocation);
        const backgroundColors = labels.map(label => this.chartColors[label] || '#888');

        this.chartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: backgroundColors, borderWidth: 2, borderColor: '#1A1A1A' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
      });
    }
  },
  template: ` 
    <div class="bg-surface pt-4 px-2 rounded-lg h-full flex flex-col">
      <div v-if="cardNumber" class="text-xl font-bold text-center text-white/80 mb-2">#{{ cardNumber }}</div>
      <div :class="{ 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-center': layout === 'horizontal' }">
        <!-- Left side (or top on mobile) -->
        <div>
          <h4 class="font-bold text-xl text-center mb-2">{{ strategy.name }}</h4>
          <p v-if="strategy.reason" class="text-sm text-gray-400 mb-3 text-center">{{ strategy.reason }}</p>
          
          <div class="grid grid-cols-3 gap-2 my-4 text-center text-xs">
            <div class="p-1">
              <div class="text-gray-400">風險等級</div>
              <div class="font-bold text-xl mt-1" :class="strategy.expectedReturn > 0.1 ? 'text-error' : strategy.expectedReturn > 0.07 ? 'text-warning' : 'text-success'">
                {{ strategy.expectedReturn > 0.1 ? '高' : strategy.expectedReturn > 0.07 ? '中' : '低' }}
              </div>
            </div>
            <div class="p-1 border-x border-gray-700">
              <div class="text-gray-400">年化波動度</div>
              <div class="font-bold text-xl text-error mt-1">{{ ((strategy.volatility || 0) * 100).toFixed(1) }}%</div>
            </div>
            <div class="p-1">
              <div class="text-gray-400">年化報酬率</div>
              <div class="font-bold text-xl text-primary mt-1">{{ ((strategy.expectedReturn || 0) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- Right side (or bottom on mobile) -->
        <div class="flex items-center justify-center gap-4 mb-4" :class="{ 'lg:mb-0': layout === 'horizontal' }">
          <div class="relative h-32 w-32 flex-shrink-0">
            <canvas :id="uniqueId"></canvas>
          </div>
          <div class="flex flex-col justify-center gap-y-2 text-xs text-gray-400">
            <div v-for="(percent, asset) in strategy.simplifiedAllocation" :key="asset" class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" :style="{ backgroundColor: chartColors[asset] || '#888' }"></div>
              <span>{{ asset }} {{ percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};