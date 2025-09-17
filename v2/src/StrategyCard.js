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
    }
  },
  template: `
    <div class="bg-surface rounded-lg p-4 h-full flex flex-col">
      <h4 class="font-bold text-lg text-center mb-2">{{ strategy.name }}</h4>
      <p v-if="strategy.reason" class="text-xs text-gray-400 mb-3 text-center">{{ strategy.reason }}</p>
      
      <div class="grid grid-cols-3 gap-2 my-4 text-center text-xs">
        <div class="p-1">
          <div class="text-gray-400">風險等級</div>
          <div class="font-bold text-xl mt-1" :class="strategy.expectedReturn > 0.1 ? 'text-error' : strategy.expectedReturn > 0.07 ? 'text-warning' : 'text-success'">
            {{ strategy.expectedReturn > 0.1 ? '高' : strategy.expectedReturn > 0.07 ? '中' : '低' }}
          </div>
        </div>
        <div class="p-1 border-x border-gray-700">
          <div class="text-gray-400">年化波動度</div>
          <div class="font-bold text-xl text-error mt-1">{{ (strategy.volatility * 100).toFixed(1) }}%</div>
        </div>
        <div class="p-1">
          <div class="text-gray-400">年化報酬率</div>
          <div class="font-bold text-xl text-primary mt-1">{{ (strategy.expectedReturn * 100).toFixed(1) }}%</div>
        </div>
      </div>

      <div class="flex items-end gap-2 h-20 mb-4">
        <div v-for="(percent, asset) in strategy.simplifiedAllocation" :key="asset" class="flex-1 flex flex-col items-center justify-end" :title="asset + ': ' + percent + '%'">
          <span class="text-white text-xs font-semibold mb-1">{{ percent }}%</span>
          <div class="w-full rounded-t-md" :style="{ height: percent + '%', backgroundColor: chartColors[asset] || '#888' }"></div>
          <span class="text-gray-400 text-xs mt-1">{{ asset }}</span>
        </div>
      </div>

      <div v-if="isRecommendation" class="mt-auto">
        <div v-if="strategy.isMetByInitial" class="text-center font-bold text-success text-sm p-2 rounded-md bg-success/10">✔️ 現有月投金額足以達成目標</div>
        <div v-else class="text-center font-bold text-sm bg-primary-gradient text-white-hover p-2 rounded-md">建議月投：{{ formatCurrency(strategy.requiredMonthly) }}</div>
      </div>
    </div>
  `
};