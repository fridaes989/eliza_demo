 const { createApp, ref, computed, watch, nextTick } = Vue;
        const { createVuetify } = Vuetify;

        const vuetify = createVuetify();

        createApp({
            setup() {
                // --- 靜態資料 ---
                const inflationRate = 0.03;
                const goalTypes = {
                  retirement: { title: "退休規劃", ageLabel: "預計退休年齡", amountLabel: "每月期望退休被動收入(萬元)", withdrawRate: 0.04 },
                  house: { title: "購屋計劃", ageLabel: "預計購屋年齡", amountLabel: "目標房屋總價(萬元)", withdrawRate: 1.0 },
                  education: { title: "教育基金", ageLabel: "孩子預計入學年齡", amountLabel: "預估教育總費用(萬元)", withdrawRate: 1.0 },
                  emergency: { title: "緊急預備金", ageLabel: "預計完成年齡", amountLabel: "緊急預備金目標(萬元)", withdrawRate: 1.0 },
                  custom: { title: "自定義目標", ageLabel: "預計達成年齡", amountLabel: "目標金額(萬元)", withdrawRate: 1.0 }
                };
                const strategies = {
                  '全天候策略': { expectedReturn: 0.078, volatility: 0.092, allocation: { 'VTI (美國股市)': 30, 'TLT (長期國債)': 40, 'IEF (中期國債)': 15, 'VNQ (房地產)': 7.5, 'DJP (商品)': 7.5 } },
                  '三基金組合': { expectedReturn: 0.085, volatility: 0.12, allocation: { 'VTI (美國股市)': 60, 'VTIAX (國際股市)': 20, 'BND (債券)': 20 } },
                  '積極型股債組合': { expectedReturn: 0.092, volatility: 0.15, allocation: { 'VTI (美國股市)': 70, 'VTIAX (國際股市)': 10, 'BND (債券)': 20 } }
                };
                 const strategyReasons = {
                    '全天候策略': '此策略提供良好的風險分散，適合追求穩定報酬的投資者',
                    '三基金組合': '簡單而有效的配置，適合長期投資且希望降低管理複雜度的投資者',
                    '積極型股債組合': '較高的股票配置能帶來更好的長期報酬，適合年輕且風險承受度高的投資者'
                };


                // --- 響應式狀態 (Reactive State) ---
                const form = ref({
                    goalType: 'retirement',
                    currentAge: 25,
                    targetAge: 65,
                    targetValue: 8, // 可能是每月收入或總額，單位萬元
                    currentAssets: 100, // 萬元
                    monthlyInvestment: 2, // 萬元
                    strategyReturn: 0.07,
                });
                
                const results = ref({ show: false });
                const chartHTML = ref('');
                const recommendationResults = ref([]);
                const resultsSection = ref(null); // 用於滾動

                // --- Computed Properties ---
                const currentGoalConfig = computed(() => goalTypes[form.value.goalType]);
                const pageTitle = computed(() => `墨鏡姐複利樹 - ${currentGoalConfig.value.title}工具`);
                const targetAgeLabel = computed(() => currentGoalConfig.value.ageLabel);
                const targetAmountLabel = computed(() => currentGoalConfig.value.amountLabel);
                const resultsTitle = computed(() => `${currentGoalConfig.value.title}分析結果`);
                const chartTitle = computed(() => `${currentGoalConfig.value.title}資產累積預測`);
                const calculateButtonText = computed(() => `計算${currentGoalConfig.value.title}`);

                const goalOptions = Object.keys(goalTypes).map(key => ({ text: goalTypes[key].title, value: key }));
                const strategyOptions = [
                    { text: '極保守型 - 定存/貨幣基金 (3%)', value: 0.03 },
                    { text: '保守型 - ETF+債券為主 (5%)', value: 0.05 },
                    { text: '平衡型 - 60% ETF + 40% 成長股 (7%)', value: 0.07 },
                    { text: '成長型 - 全美股成長組合 (9%)', value: 0.09 },
                    { text: '積極型 - 美股+新興市場 (11%)', value: 0.11 },
                ];
                
                // --- 監聽目標變化，重置結果 ---
                watch(() => form.value.goalType, () => {
                    results.value.show = false;
                });

                // --- 核心計算邏輯 ---
                const getGoalAmount = (years) => {
                    const config = currentGoalConfig.value;
                    const targetValueInYuan = form.value.targetValue * 10000;
                    
                    let baseAmount;
                    if (config.withdrawRate === 0.04) { // 退休規劃
                        baseAmount = targetValueInYuan * 12 / config.withdrawRate;
                    } else { // 其他目標
                        baseAmount = targetValueInYuan;
                    }
                    // 考慮通膨
                    return Math.round(baseAmount * Math.pow(1 + inflationRate, years));
                };
                
                const projectAssets = (years, annualReturn, monthlyInvest) => {
                    const projection = [form.value.currentAssets * 10000];
                    for (let i = 1; i <= years; i++) {
                        let last = projection[i - 1];
                        last = last * (1 + annualReturn) + (monthlyInvest * 12);
                        projection.push(last);
                    }
                    return projection;
                };

                const calculate = () => {
                    if (form.value.targetAge <= form.value.currentAge) {
                        alert("目標年齡必須大於目前年齡");
                        return;
                    }
                    
                    const years = form.value.targetAge - form.value.currentAge;
                    const goalAmount = getGoalAmount(years);
                    const monthlyInvestYuan = form.value.monthlyInvestment * 10000;

                    // 1. 計算主要圖表數據
                    const assetsProjection = projectAssets(years, form.value.strategyReturn, monthlyInvestYuan);
                    const finalAsset = assetsProjection[assetsProjection.length - 1];
                    
                    // 2. 更新結果狀態
                    results.value = {
                        ...results.value,
                        show: true,
                        isGoalAchieved: finalAsset >= goalAmount,
                        finalAsset,
                        goalAmount,
                        years,
                    };

                    if (!results.value.isGoalAchieved) {
                        results.value.requiredReturn = calcRequiredReturn(goalAmount, years);
                        results.value.requiredInvestment = calcRequiredInvestment(goalAmount, years);
                    }
                    
                    // 3. 計算策略推薦 (Bug fix is here)
                    updateStrategyRecommendations(goalAmount, years);
                    
                    // 4. 渲染圖表
                    renderCustomChart(assetsProjection, goalAmount);

                    // 5. 滾動到結果
                    nextTick(() => {
                        resultsSection.value.scrollIntoView({ behavior: 'smooth' });
                    });
                };

                // --- 輔助計算函數 ---
                 const calcRequiredReturn = (target, years) => {
                    let low = 0, high = 0.5; // 50% max return
                    const startAssets = form.value.currentAssets * 10000;
                    const monthlyInvest = form.value.monthlyInvestment * 10000;
                    for (let i = 0; i < 100; i++) {
                        let mid = (low + high) / 2;
                        let value = startAssets;
                        for (let y = 0; y < years; y++) {
                            value = value * (1 + mid) + (monthlyInvest * 12);
                        }
                        if (value > target) high = mid; else low = mid;
                    }
                    return low * 100;
                };

                const calcRequiredInvestment = (target, years) => {
                    const currentReturn = form.value.strategyReturn;
                    const startAssets = form.value.currentAssets * 10000;
                    let low = 0, high = 500000; // 50萬/月
                    for (let i = 0; i < 100; i++) {
                        let mid = (low + high) / 2;
                        let value = startAssets;
                        for (let y = 0; y < years; y++) {
                            value = value * (1 + currentReturn) + (mid * 12);
                        }
                        if (value > target) high = mid; else low = mid;
                    }
                    return high / 10000; // 轉回萬元
                };

                // --- 策略推薦計算 ---
                const calculateRequiredMonthlyInvestmentForStrategy = (targetAmount, years, annualReturn) => {
                    const monthlyReturn = annualReturn / 12;
                    const totalMonths = years * 12;
                    const currentAssetsYuan = form.value.currentAssets * 10000;
                    
                    const futureValueOfCurrent = currentAssetsYuan * Math.pow(1 + annualReturn, years);
                    const remainingNeeded = targetAmount - futureValueOfCurrent;
                    
                    if (remainingNeeded <= 0) return 0;
                    
                    // PMT formula
                    return remainingNeeded * monthlyReturn / (Math.pow(1 + monthlyReturn, totalMonths) - 1);
                };

                const updateStrategyRecommendations = (goalAmount, years) => {
                    let bestStrategyName = null;
                    let lowestRequiredInvestment = Infinity;

                    const riskTolerance = form.value.strategyReturn * 150; // 簡易風險評分

                    const recommendations = Object.entries(strategies).map(([name, strategy]) => {
                         const requiredMonthly = calculateRequiredMonthlyInvestmentForStrategy(
                            goalAmount, years, strategy.expectedReturn
                        );
                        return { name, strategy, requiredMonthly };
                    });
                    
                    // 找到最佳策略 (綜合考慮所需金額和風險)
                    recommendations.forEach(rec => {
                        const riskPenalty = Math.abs(rec.strategy.volatility * 100 - riskTolerance) * 1000;
                        const totalScore = rec.requiredMonthly + riskPenalty;
                        if (totalScore < lowestRequiredInvestment) {
                            lowestRequiredInvestment = totalScore;
                            bestStrategyName = rec.name;
                        }
                    });

                    recommendationResults.value = recommendations.map(rec => ({
                        name: rec.name,
                        expectedReturn: rec.strategy.expectedReturn,
                        requiredMonthly: Math.round(rec.requiredMonthly),
                        reason: strategyReasons[rec.name],
                        isBest: rec.name === bestStrategyName,
                    }));
                };
                
                // --- 互動功能 ---
                const selectStrategy = (strategyName) => {
                    const selected = strategies[strategyName];
                    if (!selected) return;

                    // 1. 更新下拉選單的選擇
                    // 尋找最接近的預設選項
                    const closestOption = strategyOptions.reduce((prev, curr) => 
                        Math.abs(curr.value - selected.expectedReturn) < Math.abs(prev.value - selected.expectedReturn) ? curr : prev
                    );
                    form.value.strategyReturn = closestOption.value;

                    // 2. 重新計算並渲染圖表
                    const years = form.value.targetAge - form.value.currentAge;
                    const goalAmount = getGoalAmount(years);
                    const monthlyInvestYuan = form.value.monthlyInvestment * 10000;
                    const assetsProjection = projectAssets(years, form.value.strategyReturn, monthlyInvestYuan);
                    renderCustomChart(assetsProjection, goalAmount);
                    
                    // 3. 更新提示訊息
                    const finalAsset = assetsProjection[assetsProjection.length - 1];
                    results.value.isGoalAchieved = finalAsset >= goalAmount;
                    results.value.finalAsset = finalAsset;
                };

                // --- 圖表渲染 ---
                const renderCustomChart = (projection, goal) => {
                    const maxValue = Math.max(goal, ...projection);
                    const goalHeight = (goal / maxValue) * 300;
                    const years = projection.length - 1;

                    const keyYears = [];
                    const step = Math.max(1, Math.floor(years / 5));
                    for (let i = 0; i <= years; i += step) {
                        keyYears.push(i);
                    }
                    if (keyYears[keyYears.length - 1] !== years && years > 0) {
                        keyYears.push(years);
                    }

                    let barsHTML = '';
                    keyYears.forEach(year => {
                        const value = projection[year];
                        const height = (value / maxValue) * 300;
                        const displayValue = Math.round(value / 10000);
                        barsHTML += `<div class="bar" style="height: ${height}px;"><div class="bar-value">${displayValue}萬</div></div>`;
                    });

                    let labelsHTML = '';
                    keyYears.forEach(year => {
                        labelsHTML += `<div class="bar-label">${year}年後</div>`;
                    });

                    chartHTML.value = `
                        <div class="bar-chart">
                            <div class="bars-container">
                                <div class="goal-line" style="bottom: ${goalHeight}px;">
                                    <div class="goal-label">目標 ${Math.round(goal/10000)}萬</div>
                                </div>
                                ${barsHTML}
                            </div>
                            <div class="labels-container">${labelsHTML}</div>
                        </div>
                    `;
                };

                return {
                    form,
                    results,
                    chartHTML,
                    recommendationResults,
                    resultsSection,
                    pageTitle,
                    targetAgeLabel,
                    targetAmountLabel,
                    resultsTitle,
                    chartTitle,
                    calculateButtonText,
                    goalOptions,
                    strategyOptions,
                    strategies, // expose to template
                    calculate,
                    selectStrategy,
                };
            }
        }).use(vuetify).mount('#app');
