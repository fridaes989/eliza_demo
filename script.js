let goalAmount = 0;
    let retireYears = 0;
    let assetsProjection = [];
    const inflationRate = 0.03;

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
      travel: {
        title: "旅遊基金工具",
        resultsTitle: "旅遊基金分析結果",
        chartTitle: "旅遊基金累積預測",
        ageLabel: "預計旅遊年齡：", 
        amountLabel: "旅遊預算(萬元)：",
        agePlaceholder: "請輸入預計旅遊年齡",
        amountPlaceholder: "例如：50（旅遊總預算）",
        withdrawRate: 1.0,
        buttonText: "計算旅遊基金"
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
            預計退休時資產：${Math.round(finalAsset/10000)} 萬元
          </div>
        `;
      } else {
        const requiredReturn = calcRequiredReturn(assetsProjection[0], goalAmount, retireYears);
        const requiredInvestment = calcRequiredInvestment(assetsProjection[0], goalAmount, retireYears);
        
        adviceElement.innerHTML = `
          <div class="advice warning">
            ⚠ 目前策略無法達成目標<br>
            預計退休時資產：${Math.round(finalAsset/10000)} 萬元<br>
            缺口：${Math.round((goalAmount - finalAsset)/10000)} 萬元
            <div class="additional-info">
              <strong>解決方案：</strong><br>
              1. 提高年化報酬率至 ${requiredReturn.toFixed(1)}%<br>
              2. 或每月增加投資 ${(requiredInvestment - currentInvestment).toFixed(1)} 萬元<br>
              &nbsp;&nbsp;&nbsp;(總投資額變為 ${requiredInvestment.toFixed(1)} 萬元/月)
            </div>
          </div>
          ${renderPortfolioRecommendations(requiredReturn)}
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

    // 投資組合建議數據 - 根據時間長短調整
    const portfolioRecommendations = {
      short: [ // 5年以下短期目標
        {
          name: "極保守型",
          return: 3,
          composition: "100% 定存/貨幣基金",
          risk: "極低",
          riskClass: "risk-low",
          holdings: 5,
          details: "定存、貨幣基金、短期債券"
        },
        {
          name: "保守型",
          return: 5,
          composition: "80% 債券ETF + 20% 股票ETF",
          risk: "低",
          riskClass: "risk-low", 
          holdings: 10,
          details: "AGG、BND、VTI、VOO"
        }
      ],
      long: [ // 5年以上長期目標
        {
          name: "保守穩健型",
          return: 5,
          composition: "80% ETF + 20% 債券",
          risk: "低",
          riskClass: "risk-low",
          holdings: 15,
          details: "VTI、VOO、BND、VXUS"
        },
        {
          name: "平衡成長型",
          return: 7,
          composition: "60% ETF + 40% 美股成長股",
          risk: "中",
          riskClass: "risk-medium",
          holdings: 25,
          details: "QQQ、VGT、MSFT、GOOGL、AMZN"
        },
        {
          name: "積極成長型",
          return: 9,
          composition: "30% ETF + 70% 美股成長股",
          risk: "中高",
          riskClass: "risk-medium",
          holdings: 35,
          details: "ARKK、NVDA、TSLA、META、NFLX"
        },
        {
          name: "高風險高報酬型",
          return: 11,
          composition: "20% ETF + 80% 高成長股票",
          risk: "高",
          riskClass: "risk-high",
          holdings: 45,
          details: "小型股、新興市場、加密相關"
        },
        {
          name: "超積極型",
          return: 13,
          composition: "10% ETF + 90% 高波動標的",
          risk: "極高",
          riskClass: "risk-high",
          holdings: 50,
          details: "成長股、選擇權策略、槓桿ETF"
        }
      ]
    };

    function getRecommendedPortfolios(requiredReturn, timeHorizon) {
      // 根據時間長短選擇投資組合
      const portfolios = timeHorizon <= 5 ? portfolioRecommendations.short : portfolioRecommendations.long;
      
      // 找出符合需求的投資組合
      const suitable = portfolios.filter(p => p.return >= requiredReturn - 1);
      
      // 如果沒有適合的，顯示最高報酬的組合
      if (suitable.length === 0) {
        return [portfolios[portfolios.length - 1]];
      }
      
      // 標記推薦的組合（最接近需求的）
      const recommended = suitable.find(p => p.return >= requiredReturn) || suitable[suitable.length - 1];
      
      return suitable.map(p => ({
        ...p,
        isRecommended: p.name === recommended.name
      }));
    }

    function renderPortfolioRecommendations(requiredReturn) {
      const recommendations = getRecommendedPortfolios(requiredReturn, retireYears);
      
      let html = `
        <div class="investment-recommendations">
          <div class="recommendation-title">
            💡 投資組合建議 (需要年化報酬率: ${requiredReturn.toFixed(1)}% | 投資期間: ${retireYears}年)
          </div>
          <div class="portfolio-grid">
      `;
      
      recommendations.forEach(portfolio => {
        html += `
          <div class="portfolio-card ${portfolio.isRecommended ? 'recommended' : ''}">
            <div class="portfolio-header">
              <div class="portfolio-name">${portfolio.name}</div>
              <div class="portfolio-return">${portfolio.return}%</div>
            </div>
            <div class="portfolio-composition">${portfolio.composition}</div>
            <div class="portfolio-details">
              <div class="detail-item">
                <span class="detail-label">風險等級:</span>
                <span class="risk-level ${portfolio.riskClass}">${portfolio.risk}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">標的數量:</span> ${portfolio.holdings}檔
              </div>
              <div class="detail-item" style="grid-column: 1 / -1;">
                <span class="detail-label">主要標的:</span> ${portfolio.details}
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
      
      return html;
    }