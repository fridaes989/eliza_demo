const ResultsSummary = {
  props: {
    results: {
      type: Object,
      required: true
    },
    formatCurrency: {
      type: Function,
      default: (val) => val
    }
  },
  template: `
    <div>
      <!-- 模擬摘要 -->
      <div class="p-4 rounded-lg border border-gray-700 bg-surface mb-6">
        <div class="flex items-center mb-2">
          <i class="mdi mdi-piggy-bank mr-2 text-white text-3xl"></i>
          <h3 class="text-lg font-bold">模擬摘要</h3>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed">
          根據此策略與您的設定來計算，預估 <span class="font-bold text-lg">{{ results.years }}</span> 年後，
          您的資產預計將成長至 <span class="font-bold text-primary text-lg">{{ formatCurrency(results.finalAsset) }}</span>。<br>
          累積投資成本約為 <span class="font-bold text-primary text-lg">{{ formatCurrency(results.totalInvestment) }}</span>，
          累積資產為成本的 <span class="font-bold text-primary text-lg">{{ results.growthMultiple.toFixed(1) }} 倍</span>。
        </p>
      </div>

      <!-- 能否達成 如何達成 -->
      <div class="p-4 rounded-lg border mb-6" :class="results.isGoalAchieved ? 'bg-primary/20 border-success/30' : 'bg-error/20 border-warning/30'">
        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
          <i v-if="results.isGoalAchieved" class="mdi mdi-party-popper text-white text-2xl"></i>
          <i v-else class="mdi mdi-emoticon-cry text-white text-2xl"></i>
          {{ results.isGoalAchieved ? '可達成目標！' : '目前策略無法達成目標' }}
        </h3>
        <p class="text-sm">目標金額：<span class="font-bold text-lg">{{ formatCurrency(results.goalAmount) }}</span></p>
        <p class="text-sm">最終資產：<span class="font-bold text-lg">{{ formatCurrency(results.finalAsset) }}</span></p>
        <p v-if="!results.isGoalAchieved" class="text-sm text-error">
          資金缺口：<span class="font-bold text-error text-lg">{{ formatCurrency(results.goalAmount - results.finalAsset) }}</span>
        </p>
        <p v-if="results.goalAmount > 0" class="text-sm mt-2 pt-2 border-t border-gray-700/50">
            目前資產約為目標的 <span class="font-bold text-lg text-tone">{{ (results.currentAssets / results.goalAmount * 100).toFixed(1) }}%</span>
        </p>
      </div>
    </div>
  `
};