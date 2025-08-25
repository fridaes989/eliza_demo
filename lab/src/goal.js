let goalAmount = 0;
let retireYears = 0;
let assetsProjection = [];
const inflationRate = 0.03;

// Strategy data - 3種推薦策略組合
const strategies = {
  '全天候策略': {
    expectedReturn: 0.078,
    volatility: 0.092,
    allocation: {
      'VTI (美國股市)': 30,
      'TLT (長期國債)': 40,
      'IEF (中期國債)': 15,
      'VNQ (房地產)': 7.5,
      'DJP (商品)': 7.5
    }
  },
  '三基金組合': {
    expectedReturn: 0.085,
    volatility: 0.12,
    allocation: {
      'VTI (美國股市)': 60,
      'VTIAX (國際股市)': 20,
      'BND (債券)': 20
    }
  },
  '積極型股債組合': {
    expectedReturn: 0.092,
    volatility: 0.15,
    allocation: {
      'VTI (美國股市)': 70,
      'VTIAX (國際股市)': 10,
      'BND (債券)': 20
    }
  }
};

// 不同目標的設定
const goalTypes = {
  retirement: {
    title: "退休規劃工具",
    resultsTitle: "退休規劃分析結果",
    chartTitle: "退休資產變化預測",
    ageLabel: "預計退休年齡：",
    amountLabel: "每月期望退休被動收入(萬元)：",
    agePlaceholder: "請輸入預計退休年齡",
    amountPlaceholder: "例如：10（每月被動收入）",
    withdrawRate: 0.04,
    buttonText: "計算退休規劃"
  },
  house: {
    title: "購屋計劃工具",
    resultsTitle: "購屋計劃分析結果", 
    chartTitle: "購屋資產累積預測",
    ageLabel: "預計購屋年齡：",
    amountLabel: "目標房屋總價(萬元)：",
    agePlaceholder: "請輸入預計購屋年齡",
    amountPlaceholder: "例如：1500（房屋總價）",
    withdrawRate: 1.0,
    buttonText: "計算購屋計劃"
  },
  education: {
    title: "教育基金工具",
    resultsTitle: "教育基金分析結果",
    chartTitle: "教育基金累積預測", 
    ageLabel: "孩子預計入學年齡：",
    amountLabel: "預估教育總費用(萬元)：",
    agePlaceholder: "請輸入孩子入學年齡",
    amountPlaceholder: "例如：300（教育總費用）",
    withdrawRate: 1.0,
    buttonText: "計算教育基金"
  },
  emergency: {
    title: "緊急預備金工具",
    resultsTitle: "緊急預備金分析結果",
    chartTitle: "緊急預備金累積預測",
    ageLabel: "預計完成年齡：",
    amountLabel: "緊急預備金目標(萬元)：", 
    agePlaceholder: "請輸入預計完成年齡",
    amountPlaceholder: "例如：60（6個月生活費）",
    withdrawRate: 1.0,
    buttonText: "計算緊急預備金"
  },
  custom: {
    title: "自定義財務目標工具",
    resultsTitle: "財務目標分析結果",
    chartTitle: "財務目標累積預測",
    ageLabel: "預計達成年齡：",
    amountLabel: "目標金額(萬元)：",
    agePlaceholder: "請輸入目標年齡",
    amountPlaceholder: "例如：200（自定義金額）",
    withdrawRate: 1.0,
    buttonText: "計算財務目標"
  }
};

// 策略計算函數
function calculateRequiredMonthlyInvestment(targetAmount, currentAssets, years, annualReturn) {
  const monthlyReturn = annualReturn / 12;
  const totalMonths = years * 12;
  const futureValueOfCurrent = currentAssets * Math.pow(1 + annualReturn, years);
  const remainingNeeded = targetAmount - futureValueOfCurrent;
  
  if (remainingNeeded <= 0) return 0;
  
  // PMT formula for annuity
  const monthlyPayment = remainingNeeded * monthlyReturn / (Math.pow(1 + monthlyReturn, totalMonths) - 1);
  return monthlyPayment;
}

function findBestStrategy(targetAmount, currentAssets, years, riskTolerance) {
  let bestStrategy = null;
  let lowestRequiredInvestment = Infinity;
  const results = {};
  
  for (const [name, strategy] of Object.entries(strategies)) {
    const requiredMonthly = calculateRequiredMonthlyInvestment(
      targetAmount, currentAssets, years, strategy.expectedReturn
    );
    
    results[name] = {
      requiredMonthly: requiredMonthly,
      expectedReturn: strategy.expectedReturn,
      volatility: strategy.volatility,
      riskScore: strategy.volatility * 100
    };
    
    // Consider both required investment and risk tolerance
    const riskPenalty = Math.abs(strategy.volatility * 100 - riskTolerance) * 1000;
    const totalScore = requiredMonthly + riskPenalty;
    
    if (totalScore < lowestRequiredInvestment) {
      lowestRequiredInvestment = totalScore;
      bestStrategy = name;
    }
  }
  
  return { bestStrategy, results };
}

function getReason(strategy, result, riskTolerance) {
  const reasons = {
    '全天候策略': '此策略提供良好的風險分散，適合追求穩定報酬的投資者',
    '三基金組合': '簡單而有效的配置，適合長期投資且希望降低管理複雜度的投資者',
    '積極型股債組合': '較高的股票配置能帶來更好的長期報酬，適合年輕且風險承受度高的投資者'
  };
  
  return reasons[strategy] || '根據您的風險承受度和投資期間，此策略最適合您的需求';
}

function updateStrategyRecommendations() {
  const currentAge = parseFloat(document.getElementById('currentAge').value) || 30;
  const retireAge = parseFloat(document.getElementById('retireAge').value) || 65;
  const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 10;
  const currentAssets = parseFloat(document.getElementById('currentAssets').value) || 50;
  const selectedStrategy = parseInt(document.getElementById('strategy').value) || 7;
  
  const years = retireAge - currentAge;
  let targetAmount;
  
  // 根據目標類型計算目標金額
  const selectedGoal = document.getElementById('goalType').value;
  const config = goalTypes[selectedGoal];
  
  if (config.withdrawRate === 0.04) {
    // 退休規劃：使用25倍法則
    targetAmount = monthlyIncome * 12 * 25;
  } else {
    // 其他目標：直接使用目標金額
    targetAmount = monthlyIncome;
  }
  
  const riskTolerance = selectedStrategy * 10; // Convert to 0-100 scale
  
  const { bestStrategy, results } = findBestStrategy(
    targetAmount * 10000, // Convert to actual currency
    currentAssets * 10000,
    years,
    riskTolerance
  );
  
  // Update recommendation section
  const recommendedStrategyElement = document.getElementById('recommendedStrategy');
  const recommendedAmountElement = document.getElementById('recommendedAmount');
  const strategyReasonElement = document.getElementById('strategyReason');
  
  if (recommendedStrategyElement) {
    recommendedStrategyElement.textContent = `推薦策略：${bestStrategy}`;
  }
  if (recommendedAmountElement) {
    recommendedAmountElement.textContent = 
      `建議每月投資：NT${Math.round(results[bestStrategy].requiredMonthly).toLocaleString()}`;
  }
  
  // Update reason
  const reason = getReason(bestStrategy, results[bestStrategy], riskTolerance);
  if (strategyReasonElement) {
    strategyReasonElement.textContent = reason;
  }
  
  // Update all strategy cards
  for (const [strategyName, result] of Object.entries(results)) {
    const card = document.querySelector(`[data-strategy="${strategyName}"]`);
    if (card) {
      const amountElement = card.querySelector('.strategy-investment');
      if (amountElement) {
        amountElement.textContent = `每月投資：NT${Math.round(result.requiredMonthly).toLocaleString()}`;
      }
      
      // Mark best strategy
      if (strategyName === bestStrategy) {
        card.classList.add('best-match');
      } else {
        card.classList.remove('best-match');
      }
    }
  }
}

// 監聽目標類型變更
document.getElementById('goalType').addEventListener('change', function() {
  const selectedGoal = this.value;
  const config = goalTypes[selectedGoal];
  
  // 更新標題
  document.querySelector('h1').textContent = `墨鏡姐美股 ${config.title}`;
  document.getElementById('targetAgeLabel').textContent = config.ageLabel;
  document.getElementById('targetAmountLabel').textContent = config.amountLabel;
  document.getElementById('calculateBtn').textContent = config.buttonText;
  
  // 更新 placeholder
  document.getElementById('retireAge').placeholder = config.agePlaceholder;
  document.getElementById('monthlyIncome').placeholder = config.amountPlaceholder;
  
  // 隱藏結果區域
  document.getElementById('results').classList.add('hidden');
});

document.getElementById('calculateBtn').addEventListener('click', () => {
  const selectedGoal = document.getElementById('goalType').value;
  const config = goalTypes[selectedGoal];
  
  const currentAge = parseInt(document.getElementById('currentAge').value);
  const retireAge = parseInt(document.getElementById('retireAge').value);
  const monthlyIncomeOrAmount = parseFloat(document.getElementById('monthlyIncome').value) * 10000;
  const currentAssets = parseFloat(document.getElementById('currentAssets').value) * 10000;
  const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value) * 10000;
  const strategyReturn = parseFloat(document.getElementById('strategy').value) / 100;

  if (!currentAge || !retireAge || !monthlyIncomeOrAmount || !currentAssets || !monthlyInvestment) {
    alert("請完整填寫資料");
    return;
  }

  if (retireAge <= currentAge) {
    alert("目標年齡必須大於目前年齡");
    return;
  }

  retireYears = retireAge - currentAge;
  
  // 根據不同目標計算目標金額
  if (config.withdrawRate === 0.04) {
    // 退休規劃：使用4%法則
    goalAmount = Math.round((monthlyIncomeOrAmount * 12 / config.withdrawRate) * Math.pow(1 + inflationRate, retireYears));
  } else {
    // 其他目標：直接使用目標金額，考慮通膨
    goalAmount = Math.round(monthlyIncomeOrAmount * Math.pow(1 + inflationRate, retireYears));
  }

  // 預測每年資產
  assetsProjection = [currentAssets];
  for (let i = 1; i <= retireYears; i++) {
    let last = assetsProjection[i - 1];
    last = last * (1 + strategyReturn) + (monthlyInvestment * 12);
    assetsProjection.push(last);
  }

  // 更新結果區域標題
  document.getElementById('resultsTitle').textContent = config.resultsTitle;
  document.getElementById('chartTitle').textContent = config.chartTitle;

  renderCustomChart();
  
  // 更新策略推薦
  updateStrategyRecommendations();
  
  document.getElementById('results').classList.remove('hidden');
  
  // 平滑滾動到結果區域
  document.getElementById('results').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start' 
  });
});

function renderCustomChart() {
  const chartContainer = document.getElementById('customChart');
  const maxValue = Math.max(goalAmount, ...assetsProjection);
  const goalHeight = (goalAmount / maxValue) * 300;

  // 選擇關鍵年份顯示
  const keyYears = [];
  const step = Math.max(1, Math.floor(retireYears / 5));
  for (let i = 0; i <= retireYears; i += step) {
    keyYears.push(i);
  }
  if (keyYears[keyYears.length - 1] !== retireYears) {
    keyYears.push(retireYears);
  }

  let chartHTML = '<div class="bar-chart">';
  
  // 長條圖容器
  chartHTML += '<div class="bars-container">';
  
  // 目標線
  chartHTML += `
    <div class="goal-line" style="bottom: ${goalHeight}px;">
      <div class="goal-label" style="top: -25px;">目標 ${Math.round(goalAmount/10000)}萬</div>
    </div>
  `;

  keyYears.forEach(year => {
    const value = assetsProjection[year];
    const height = (value / maxValue) * 300;
    const displayValue = Math.round(value / 10000);
    
    chartHTML += `
      <div class="bar" style="height: ${height}px;">
        <div class="bar-value">${displayValue}萬</div>
      </div>
    `;
  });

  chartHTML += '</div>'; // 結束 bars-container

  // 標籤容器
  chartHTML += '<div class="labels-container">';
  keyYears.forEach(year => {
    chartHTML += `<div class="bar-label">${year}年後</div>`;
  });
  chartHTML += '</div>'; // 結束 labels-container

  chartHTML += '</div>'; // 結束 bar-chart
  chartContainer.innerHTML = chartHTML;

  // 顯示建議
  const finalAsset = assetsProjection[assetsProjection.length - 1];
  const adviceElement = document.getElementById('advice');
  const currentInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
  
  if (finalAsset >= goalAmount) {
    adviceElement.innerHTML = `
      <div class="advice success">
        ✅ 目前策略可達成目標！<br>
        預計達成時資產：${Math.round(finalAsset/10000)} 萬元
      </div>
    `;
  } else {
    const requiredReturn = calcRequiredReturn(assetsProjection[0], goalAmount, retireYears);
    const requiredInvestment = calcRequiredInvestment(assetsProjection[0], goalAmount, retireYears);
    
    adviceElement.innerHTML = `
      <div class="advice warning">
        ⚠ 目前策略無法達成目標<br>
        預計達成時資產：${Math.round(finalAsset/10000)} 萬元<br>
        缺口：${Math.round((goalAmount - finalAsset)/10000)} 萬元
        <div class="additional-info">
          <strong>解決方案：</strong><br>
          1. 提高年化報酬率至 ${requiredReturn.toFixed(1)}%<br>
          2. 或每月增加投資 ${(requiredInvestment - currentInvestment).toFixed(1)} 萬元<br>
          &nbsp;&nbsp;&nbsp;(總投資額變為 ${requiredInvestment.toFixed(1)} 萬元/月)
        </div>
      </div>
      ${renderStrategyComparison(requiredReturn)}
    `;
  }
}

function calcRequiredReturn(startAssets, target, years) {
  let low = 0, high = 0.3;
  const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value) * 10000;
  
  for (let iter = 0; iter < 100; iter++) {
    let mid = (low + high) / 2;
    let value = startAssets;
    for (let i = 0; i < years; i++) {
      value = value * (1 + mid) + (monthlyInvestment * 12);
    }
    if (value > target) high = mid; else low = mid;
  }
  return low * 100;
}

function calcRequiredInvestment(startAssets, target, years) {
  const currentReturn = parseFloat(document.getElementById('strategy').value) / 100;
  let low = 0, high = 50; // 萬元
  
  for (let iter = 0; iter < 100; iter++) {
    let mid = (low + high) / 2;
    let value = startAssets;
    for (let i = 0; i < years; i++) {
      value = value * (1 + currentReturn) + (mid * 10000 * 12);
    }
    if (value > target) high = mid; else low = mid;
  }
  return low;
}

// 新的策略比較渲染函數 - 使用3種策略組合
function renderStrategyComparison(requiredReturn) {
  const currentAge = parseFloat(document.getElementById('currentAge').value) || 30;
  const retireAge = parseFloat(document.getElementById('retireAge').value) || 65;
  const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 10;
  const currentAssets = parseFloat(document.getElementById('currentAssets').value) || 50;
  
  const years = retireAge - currentAge;
  const selectedGoal = document.getElementById('goalType').value;
  const config = goalTypes[selectedGoal];
  
  let targetAmount;
  if (config.withdrawRate === 0.04) {
    targetAmount = monthlyIncome * 12 * 25;
  } else {
    targetAmount = monthlyIncome;
  }
  
  const { bestStrategy, results } = findBestStrategy(
    targetAmount * 10000,
    currentAssets * 10000,
    years,
    70 // 預設風險承受度
  );

  let html = `
    <div class="investment-recommendations">
      <div class="recommendation-title">
        💡 策略投資組合建議 (需要年化報酬率: ${requiredReturn.toFixed(1)}% | 投資期間: ${retireYears}年)
      </div>
      <div class="strategy-comparison">
  `;
  
  // 渲染三種策略
  for (const [strategyName, result] of Object.entries(results)) {
    const strategy = strategies[strategyName];
    const isRecommended = strategyName === bestStrategy;
    
    html += `
      <div class="strategy-card ${isRecommended ? 'best-match recommended' : ''}" data-strategy="${strategyName}">
        <div class="strategy-header">
          <div class="strategy-name">${strategyName}</div>
          <div class="strategy-return">${(strategy.expectedReturn * 100).toFixed(1)}%</div>
        </div>
        <div class="strategy-investment">每月投資：NT${Math.round(result.requiredMonthly).toLocaleString()}</div>
        <div class="strategy-description">
          ${getReason(strategyName, result, 70)}
        </div>
        <div class="strategy-description">
          <br><strong>資產配置：</strong><br>
          ${Object.entries(strategy.allocation).map(([asset, percent]) => 
            `${asset}: ${percent}%`
          ).join('<br>')}
        </div>
        <div class="strategy-description">
          風險等級: <span class="risk-level ${result.riskScore < 10 ? 'risk-low' : result.riskScore < 13 ? 'risk-medium' : 'risk-high'}">
            ${result.riskScore < 10 ? '低' : result.riskScore < 13 ? '中' : '高'}
          </span>
        </div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}
