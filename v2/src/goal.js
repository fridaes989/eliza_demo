// Loading management
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const app = document.getElementById('app');
        loadingOverlay.style.opacity = '0';
        app.style.opacity = '1';
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
    }, 1500);
});

const { createApp, ref, computed, watch, nextTick, onMounted } = Vue;

const app = createApp({
    setup() {
        const isMenuOpen = ref(false);
        const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

        const API_BASE_URL = 'https://49d22ce3-d235-4200-af2b-da55a826dee9.mock.pstmn.io/forms';
        const AUTH_TOKEN = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IldBRktTTVptVmN6YzVGckdqTlBOT090emZudmE5RDNvIiwidHlwIjoiSldUIn0.eyJzdWIiOiI0NzExMjIyIiwidXNlcl9ndWlkIjoiMDg4ZmIwOWMtNWE1Yy00MTQ6LWI2NjctODFlNmVmZjJhMzU5IiwidG9rZW5faWQiOiIxMSIsImFwcF9pZCI6IjIxIiwiaXNfZ3Vlc3QiOmZhbHNlLCJuYmYiOjE3NTc1NjgxODgsImV4cCI6MTc1NzY1ODE4OCwiaWF0IjoxNzU3NTcxNzg4LCJpc3MiOiJodHRwczovL3d3dy5jbW9uZXkudHciLCJhdWQiOiJjbW9uZXlhcGkifQ.mKdSX-Cff2itAIdK66eL4Tj5XVxNS66frMAjzVBFrjGJuI_ZHX6dg77kkX07PTjPBZ02FsBUbJanH0WjXN18KAI4VBV0BvV71GgQ4NSeNSG9gO6N7DxTifAxfrZ94xhjZuixs-x2xOl0kCoWHA3AODvA5D2uCyBPD599C9oHlYKSoqC9fW6-wHmN3oJOe6tXnNYDNYLSC6IbKPXppX2Jp2zQqjWsVdTRYh-JQcGoERBiX6ctyn7pK4ExXh8kBP3BuST2eEZEiTU70ED7AFa_FpOoDHoPfaCa0iSIEPVyX6riSezHqA_4yKaUu1ceb3fAX-lvnFeoD2L4MA2eWODHAw';

        const defaultGoalTypes = { 
            retirement: { key: 'retirement', title: "退休規劃", CurrentAge:"目前年齡", ageLabel: "預計退休年齡", amountLabel: "每月期望退休被動收入(美元)", withdrawRate: 0.04, formId: 3 }, 
            house: { key: 'house', title: "購屋計畫", CurrentAge:"目前年齡", ageLabel: "預計購屋年齡", amountLabel: "目標房屋總價(萬美元)", withdrawRate: 1.0,formId: 4 }, 
            education: { key: 'education', title: "教育基金", CurrentAge:"孩子目前年齡", ageLabel: "孩子預計入學年齡", amountLabel: "預估教育總費用(萬美元)", withdrawRate: 1.0, formId: 5 }, 
            emergency: { key: 'emergency', title: "緊急預備金", CurrentAge:"目前年齡", ageLabel: "預計完成年齡", amountLabel: "緊急預備金目標(萬美元)", withdrawRate: 1.0, formId: 6 }, 
            custom: { key: 'custom', title: "自定義目標", CurrentAge:"目前年齡", ageLabel: "預計達成年齡", amountLabel: "目標金額(萬美元)", withdrawRate: 1.0, formId: 7 } 
        };
        const goalTypes = ref({});

        const inflationRate = 0.03;
        
        const strategies = { 
            '全天候策略': { expectedReturn: 0.037, volatility: 0.09, url: 'all_weather.html', allocation: { 'VTI': 30, 'TLT': 40, 'IEF': 15, 'GLD': 7.5, 'DBC': 7.5 } }, 
            '三基金組合': { expectedReturn: 0.068, volatility: 0.1256, url: 'classic3.html', allocation: { 'VTI (美國股市)': 60, 'VTIAX (國際股市)': 20, 'BND (債券)': 20 } }, 
            '積極型股債組合': { expectedReturn: 0.075, volatility: 0.1263, url: 'aggressive.html', allocation: { 'VTI (美國股市)': 70, 'VTIAX (國際股市)': 10, 'BND (債券)': 20 } },
            '核心四基金': { expectedReturn: 0.069, volatility: 0.125, url: 'core4.html', allocation: { 'VTI (美國股市)': 50, 'VXUS': 20, 'VNQ':10,'BND (債券)': 20 } },
            '巴菲特推薦': { expectedReturn: 0.123, volatility: 0.152, url: 'voo.html', allocation: { 'VOO': 100} } 
        };

        const strategyReasons = { 
            '全天候策略': '此策略提供良好的風險分散，適合追求穩定報酬的投資者', 
            '三基金組合': '簡單而有效的配置，適合長期投資且希望降低管理複雜度的投資者', 
            '積極型股債組合': '較高的股票配置能帶來更好的長期報酬，適合年輕且風險承受度高的投資者',
            '核心四基金': '「三基金組合」的進階選項，增加房地產以對抗通膨。', 
            '巴菲特推薦': '完全相信並押注於美國最具代表性的 500 家頂級企業的長期增長。'  
        };

        const form = ref({ goalType: 'retirement', currentAge: 25, targetAge: 65, targetValue: 5000, currentAssets: 100, monthlyInvestment: 1000, strategyReturn: 0.05});
        const formErrors = ref({});
        const results = ref({ show: false });
        const chartHTML = ref('');
        const recommendationResults = ref([]);
        const savedGoals = ref([]);
        const isLoggedIn = ref(true); 
        const snackbar = ref({ show: false, message: '', color: 'success' });

        const showSnackbar = (message, color = 'success', duration = 3000) => {
            snackbar.value = { show: true, message, color };
            setTimeout(() => { snackbar.value.show = false; }, duration);
        };

        const loadFormDefinitions = async () => {
            try {
                const response = await fetch(API_BASE_URL, {
                    method: 'GET',
                    headers: { 'Authorization': AUTH_TOKEN, 'accept': 'application/json' }
                });
                if (!response.ok) throw new Error(`API 回應不正確: ${response.statusText}`);
                const formsArray = await response.json();
                if (!Array.isArray(formsArray) || formsArray.length === 0) throw new Error("API 回傳的資料格式不符或為空");
                const newGoalTypes = {};
                for (const formDef of formsArray) { newGoalTypes[formDef.key] = formDef; }
                goalTypes.value = newGoalTypes;
            } catch (error) {
                console.error('從 API 獲取表單定義失敗:', error);
                goalTypes.value = defaultGoalTypes;
            }
        };

        const loadGoalsFromAPI = async () => {
            if (Object.keys(goalTypes.value).length === 0) return;
            const formIds = Object.values(goalTypes.value).map(g => g.formId);
            const fetchPromises = formIds.map(async (formId) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/${formId}`, {
                        headers: { 'Authorization': AUTH_TOKEN, 'accept': 'application/json' }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.goalType) return data;
                    } else if (response.status !== 404) {
                        console.error(`Error fetching goal for formId ${formId}:`, response.statusText);
                    }
                    return null;
                } catch (error) {
                    console.error(`Network error fetching goal for formId ${formId}:`, error);
                    return null;
                }
            });
            try {
                const results = await Promise.all(fetchPromises);
                savedGoals.value = results.filter(goal => goal !== null);
            } catch (error) {
                showSnackbar('讀取已存目標失敗', 'error');
                console.error('Error loading all goals:', error);
            }
        };

        onMounted(async () => {
            await loadFormDefinitions();
            loadGoalsFromAPI();
        });

        const currentGoalConfig = computed(() => goalTypes.value[form.value.goalType] || {});
        const pageTitle = computed(() => `${currentGoalConfig.value.title || '財務規劃'}工具`);
        const targetCurrentAge = computed(() => currentGoalConfig.value.CurrentAge || '目前年齡');
        const targetAgeLabel = computed(() => currentGoalConfig.value.ageLabel || '目標年齡');
        const targetAmountLabel = computed(() => currentGoalConfig.value.amountLabel || '目標金額');
        const resultsTitle = computed(() => `${currentGoalConfig.value.title || ''}分析結果`);
        const calculateButtonText = computed(() => `計算${currentGoalConfig.value.title || ''}`);
        const goalOptions = computed(() => {
            return Object.keys(goalTypes.value).map(key => ({ 
                text: goalTypes.value[key].title, 
                value: key 
            }));
        });
        
        const monthlyInvestmentLabel = computed(() => {
            const unit = form.value.goalType === 'retirement' ? '美元' : '萬美元';
            return `每月投資金額 (${unit})`;
        });

        const strategyOptions = [ 
            { text: '極保守型 (年化波動 9%)', value: 0.037 }, 
            { text: '穩健型(年化波動 12.5%)', value: 0.068 }, 
            { text: '積極型(年化波動 12.6%)', value: 0.075 }, 
            { text: '增長型(年化波動 12.5%)', value: 0.069 }, 
            { text: '高風險型(年化波動 > 15%)', value: 0.123 } 
        ];
        
        watch(() => form.value.goalType, (newType) => { 
            results.value.show = false; 
            if (newType === 'retirement') {
                form.value.targetValue = 5000;
                form.value.monthlyInvestment = 1000;
            } else {
                form.value.targetValue = 500;
                form.value.monthlyInvestment = 1;
            }
        });
        watch(() => form.value.currentAge, (val) => {
            if (val > 120) formErrors.value.currentAge = '年齡不能超過120歲';
            else if (val < 0) formErrors.value.currentAge = '年齡不能是負數';
            else delete formErrors.value.currentAge;
        });
        watch(() => form.value.targetAge, (val) => {
            if (val > 120) formErrors.value.targetAge = '年齡不能超過120歲';
            else if (val < 0) formErrors.value.targetAge = '年齡不能是負數';
            else delete formErrors.value.targetAge;
        });
        
        const showTooltip = (event, content) => { 
            const el = document.getElementById('chartTooltip'); 
            if (el) { 
                el.innerHTML = content; 
                el.classList.add('visible'); 
                moveTooltip(event); 
            } 
        };
        const moveTooltip = (event) => { 
            const el = document.getElementById('chartTooltip'); 
            if (el) { 
                const rect = el.getBoundingClientRect(); 
                el.style.left = `${event.pageX - (rect.width / 2)}px`; 
                el.style.top = `${event.pageY - rect.height - 15}px`; 
            } 
        };
        const hideTooltip = () => { 
            const el = document.getElementById('chartTooltip'); 
            if (el) el.classList.remove('visible'); 
        };
        
        const saveGoal = async () => {
            if (!isLoggedIn.value) { showSnackbar('請先登入才能儲存目標', 'warning'); return; }
            const formId = goalTypes.value[form.value.goalType]?.formId;
            if (!formId) { showSnackbar('無效的目標類型', 'error'); return; }
            const answersArray = Object.entries(form.value).map(([key, value]) => ({ questionId: key, answers: [{ value: String(value) }] }));
            const requestBody = { answers: answersArray };
            const apiUrl = `${API_BASE_URL}/${formId}/responses`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) { throw new Error(`API 請求失敗: ${response.statusText}`); }
                const goalData = { ...form.value, savedAt: new Date().toISOString() };
                const existingIndex = savedGoals.value.findIndex(g => g.goalType === goalData.goalType);
                if (existingIndex !== -1) { savedGoals.value[existingIndex] = goalData; } 
                else { savedGoals.value.push(goalData); }
                showSnackbar('目標已儲存！', 'success');
            } catch (error) {
                console.error('儲存目標失敗:', error);
                showSnackbar('儲存目標失敗，請稍後再試', 'error');
            }
        };

        const loadSavedGoal = (goal) => {
            form.value = { ...goal };
            nextTick(() => { calculate(); showSnackbar('已載入目標並重新計算', 'info'); });
        };

        const deleteSavedGoal = async (index) => {
            const goalToDelete = savedGoals.value[index];
            const formId = goalTypes.value[goalToDelete.goalType]?.formId;
            if (!formId) { showSnackbar('無法刪除：無效的目標類型', 'error'); return; }
            const apiUrl = `${API_BASE_URL}/${formId}?mock_server_example_key=form_found_result`;
            try {
                const response = await fetch(apiUrl, { method: 'DELETE' });
                if (!response.ok) { throw new Error(`API 刪除失敗: ${response.statusText}`); }
                savedGoals.value.splice(index, 1);
                showSnackbar('目標已刪除', 'success');
            } catch (error) {
                console.error('刪除目標時發生錯誤:', error);
                showSnackbar('刪除失敗，請稍後再試', 'error');
            }
        };
        
        const formatCurrency = (value) => {
            const num = Math.round(value);
            let formattedValue;

            if (num >= 1000000) {
                formattedValue = (num / 1000000).toFixed(2) + 'M';
            } else if (num >= 1000) {
                formattedValue = (num / 1000).toFixed(1) + 'K';
            } else {
                formattedValue = num.toString();
            }
            return `${formattedValue} 美元`;
        };
        
        const getCalculatedTargetAmount = (goal) => { 
            const config = goalTypes.value[goal.goalType];
            if (!config) return 0;
            const years = goal.targetAge - goal.currentAge; 
            if (years <= 0) return goal.goalType === 'retirement' ? goal.targetValue : goal.targetValue * 10000; 
            const targetValueUSD = goal.goalType === 'retirement' ? goal.targetValue : goal.targetValue * 10000; 
            if (config.withdrawRate === 0.04) { 
                let base = (targetValueUSD * 12 / config.withdrawRate); 
                return Math.round(base * Math.pow(1 + inflationRate, years)); 
            } 
            return targetValueUSD; 
        };

        const calculateGoalProgress = (goal) => { 
            const targetAmount = getCalculatedTargetAmount(goal); 
            if (targetAmount <= 0) return 0; 
            const currentAssetsUSD = goal.currentAssets * 10000; 
            return Math.min((currentAssetsUSD / targetAmount) * 100, 100); 
        };

        const projectAssets = (years, annualReturn, monthlyInvestUSD, currentAssetsUSD) => { 
            const projection = [currentAssetsUSD]; 
            for (let year = 1; year <= years; year++) { 
                let totalAssets = currentAssetsUSD * Math.pow(1 + annualReturn, year); 
                if (annualReturn > 0) { 
                    totalAssets += (monthlyInvestUSD * 12) * ((Math.pow(1 + annualReturn, year) - 1) / annualReturn); 
                } else { 
                    totalAssets += (monthlyInvestUSD * 12 * year); 
                } 
                projection.push(totalAssets); 
            } 
            return projection; 
        };

        const calculateAccumulatedInvestment = (years, monthlyInvestUSD, currentAssetsUSD) => { 
            const accumulated = [currentAssetsUSD]; 
            for (let i = 1; i <= years; i++) { 
                accumulated.push(currentAssetsUSD + (monthlyInvestUSD * 12 * i)); 
            } 
            return accumulated; 
        };

        const calculate = () => { 
            if (Object.keys(formErrors.value).length > 0) { showSnackbar('請修正表單中的錯誤', 'error'); return; } 
            if (form.value.targetAge <= form.value.currentAge) { showSnackbar('目標年齡必須大於目前年齡', 'error'); return; } 
            
            const years = form.value.targetAge - form.value.currentAge; 
            const goalAmount = getCalculatedTargetAmount(form.value); 
            const monthlyInvestUSD = form.value.goalType === 'retirement' ? form.value.monthlyInvestment : form.value.monthlyInvestment * 10000; 
            const currentAssetsUSD = form.value.currentAssets * 10000; 
            
            const assetsProjection = projectAssets(years, form.value.strategyReturn, monthlyInvestUSD, currentAssetsUSD); 
            const investmentProjection = calculateAccumulatedInvestment(years, monthlyInvestUSD, currentAssetsUSD); 
            
            const finalAsset = assetsProjection[assetsProjection.length - 1]; 
            results.value = { show: true, isGoalAchieved: finalAsset >= goalAmount, finalAsset, goalAmount, years }; 
            
            if (!results.value.isGoalAchieved) { 
                results.value.requiredReturn = calcRequiredReturn(goalAmount, years, monthlyInvestUSD, currentAssetsUSD); 
                results.value.requiredInvestment = calcRequiredInvestment(goalAmount, years, form.value.strategyReturn, currentAssetsUSD); 
            } 
            updateStrategyRecommendations(goalAmount, years, currentAssetsUSD); 
            renderCustomChart(assetsProjection, investmentProjection, goalAmount, years); 
        };

        const calcRequiredReturn = (target, years, monthlyInvestUSD, startAssetsUSD) => { 
            let low = 0, high = 0.5; 
            for (let i = 0; i < 100; i++) { 
                const mid = (low + high) / 2; 
                let val = startAssetsUSD * Math.pow(1 + mid, years); 
                if (mid > 0) val += (monthlyInvestUSD * 12) * ((Math.pow(1 + mid, years) - 1) / mid); 
                else val += (monthlyInvestUSD * 12 * years); 
                if (val > target) high = mid; 
                else low = mid; 
            } 
            return low * 100; 
        };

        const calcRequiredInvestment = (target, years, annualReturn, startAssetsUSD) => { 
            const fvCurrent = startAssetsUSD * Math.pow(1 + annualReturn, years); 
            const needed = target - fvCurrent; 
            if (needed <= 0) return 0; 
            let requiredMonthlyUSD; 
            if (annualReturn > 0) {
                requiredMonthlyUSD = needed / (((Math.pow(1 + annualReturn, years) - 1) / annualReturn) * 12);
            } else {
                requiredMonthlyUSD = needed / (years * 12);
            }
            return requiredMonthlyUSD;
        };

        const calculateRequiredMonthlyInvestmentForStrategy = (targetAmount, years, annualReturn, startAssetsUSD) => { 
            const fvCurrent = startAssetsUSD * Math.pow(1 + annualReturn, years); 
            const remainingNeeded = targetAmount - fvCurrent; 
            if (remainingNeeded <= 0) return { amount: 0, isMetByInitial: true }; 
            let requiredMonthlyUSD = 0; 
            if (annualReturn > 0) {
                requiredMonthlyUSD = remainingNeeded / (((Math.pow(1 + annualReturn, years) - 1) / annualReturn) * 12);
            } else {
                requiredMonthlyUSD = remainingNeeded / (years * 12);
            }
            return { amount: requiredMonthlyUSD, isMetByInitial: false }; 
        };
        
        const updateStrategyRecommendations = (goalAmount, years, currentAssetsUSD) => { 
            const recommendations = Object.entries(strategies).map(([name, strategy]) => { 
                const calcResult = calculateRequiredMonthlyInvestmentForStrategy(goalAmount, years, strategy.expectedReturn, currentAssetsUSD); 
                return { name, strategy, requiredMonthly: calcResult.amount, isMetByInitial: calcResult.isMetByInitial }; 
            }); 
            const bestStrategy = recommendations.reduce((best, current) => { 
                return current.requiredMonthly < best.requiredMonthly ? current : best; 
            }, recommendations[0]); 
            recommendationResults.value = recommendations.map(rec => ({ 
                name: rec.name, 
                expectedReturn: rec.strategy.expectedReturn, 
                requiredMonthly: rec.requiredMonthly, 
                reason: strategyReasons[rec.name], 
                isBest: rec.name === bestStrategy.name, 
                isMetByInitial: rec.isMetByInitial,
                url: rec.strategy.url
            })); 
        };

        const renderCustomChart = (assetsProjection, investmentProjection, goal, totalYears) => {
            const width = 800;
            const height = 400;
            const padding = { top: 20, right: 80, bottom: 50, left: 80 };
            const allValues = [...assetsProjection, goal];
            const maxValue = Math.max(...allValues);
            const xScale = (i) => padding.left + (i / totalYears) * (width - padding.left - padding.right);
            const yScale = (value) => height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
            const dataPoints = Array.from({ length: totalYears + 1 }, (_, i) => ({
                year: i,
                currentAge: form.value.currentAge + i,
                totalAsset: assetsProjection[i] || 0,
                totalInvestment: investmentProjection[i] || 0,
                growth: Math.max(0, (assetsProjection[i] || 0) - (investmentProjection[i] || 0))
            }));
            const toPath = (points) => {
                let path = `M ${points[0].x} ${points[0].y}`;
                points.slice(1).forEach(p => path += ` L ${p.x} ${p.y}`);
                return path;
            };
            const investmentPoints = dataPoints.map(d => ({ x: xScale(d.year), y: yScale(d.totalInvestment) }));
            const investmentAreaPath = toPath(investmentPoints) + ` L ${xScale(totalYears)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
            const totalAssetPoints = dataPoints.map(d => ({ x: xScale(d.year), y: yScale(d.totalAsset) }));
            const growthAreaPath = toPath(totalAssetPoints) + ` L ` + toPath(investmentPoints.slice().reverse()).substring(1) + ` Z`;
            const xAxisTicks = dataPoints.filter(d => d.year % 5 === 0 || d.year === totalYears || d.year === 0).map(d => ({
                x: xScale(d.year),
                label: `${d.year}年後`,
                ageLabel: `(${d.currentAge}歲)`
            }));
            const yAxisTicks = Array.from({ length: 6 }, (_, i) => {
                const value = (i / 5) * maxValue;
                return { y: yScale(value), label: formatCurrency(value) };
            });
            let svgContent = `<svg width="100%" viewBox="0 0 ${width} ${height}" class="chart-svg" style="font-family: Arial, sans-serif;">`;
            yAxisTicks.forEach(tick => {
                svgContent += `<line x1="${padding.left}" y1="${tick.y}" x2="${width - padding.right}" y2="${tick.y}" stroke="#374151" stroke-width="0.5"/>`;
                svgContent += `<text x="${padding.left - 8}" y="${tick.y + 4}" text-anchor="end" fill="#9CA3AF" font-size="12px">${tick.label}</text>`;
            });
            svgContent += `<path d="${investmentAreaPath}" fill="rgba(66, 153, 225, 0.7)" />`;
            svgContent += `<path d="${growthAreaPath}" fill="rgba(64, 160, 128, 0.7)" />`;
            const goalLineY = yScale(goal);
            if (goal > 0 && goal < maxValue * 1.1) {
                const goalText = `目標 ${formatCurrency(goal)}`;
                const textWidth = goalText.length * 7;
                svgContent += `<line x1="${padding.left}" y1="${goalLineY}" x2="${width - padding.right - textWidth - 15}" y2="${goalLineY}" stroke="#f87171" stroke-width="2" stroke-dasharray="4,4"/>`;
                svgContent += `<rect x="${width - padding.right - textWidth - 10}" y="${goalLineY - 12}" width="${textWidth + 10}" height="24" fill="#f87171" rx="4"/>`;
                svgContent += `<text x="${width - padding.right - 5}" y="${goalLineY + 5}" text-anchor="end" fill="white" font-size="12px" font-weight="bold">${goalText}</text>`;
            }
            xAxisTicks.forEach(tick => {
                svgContent += `<g transform="translate(${tick.x}, ${height - padding.bottom})">
                    <text text-anchor="middle" fill="#9CA3AF" font-size="12px" y="20">${tick.label}</text>
                    <text text-anchor="middle" fill="#9CA3AF" font-size="10px" y="35">${tick.ageLabel}</text>
                </g>`;
            });
            const sliceWidth = (width - padding.left - padding.right) / (totalYears > 0 ? totalYears : 1);
            dataPoints.forEach(d => {
                const tooltipContent = `<strong>${d.year}年後 (${d.currentAge}歲)</strong><br>總資產: ${formatCurrency(d.totalAsset)}<br>累積投資成本: ${formatCurrency(d.totalInvestment)}<br>投資增長收益: ${formatCurrency(d.growth)}`;
                svgContent += `<rect x="${xScale(d.year) - sliceWidth / 2}" y="${padding.top}" width="${sliceWidth}" height="${height - padding.top - padding.bottom}" fill="transparent"
                    onmouseover='window.appInstance.showTooltip(event, "${tooltipContent}")'
                    onmousemove="window.appInstance.moveTooltip(event)"
                    onmouseout="window.appInstance.hideTooltip()"/>`;
            });
            svgContent += `</svg>`;
            const legendHTML = `
                <div class="chart-legend flex justify-center gap-4 mb-2">
                    <div class="legend-item flex items-center text-sm">
                        <div class="w-3 h-3 rounded-full mr-2" style="background-color: rgba(66, 153, 225, 0.7);"></div>
                        <span>累積投資成本</span>
                    </div>
                    <div class="legend-item flex items-center text-sm">
                        <div class="w-3 h-3 rounded-full mr-2" style="background-color: rgba(64, 160, 128, 0.7);"></div>
                        <span>投資增長收益</span>
                    </div>
                </div>
            `;
            chartHTML.value = legendHTML + svgContent;
        };

        return { 
            form, formErrors, results, chartHTML, recommendationResults, savedGoals, isLoggedIn, snackbar,
            goalTypes, pageTitle, targetCurrentAge, targetAgeLabel, targetAmountLabel, monthlyInvestmentLabel, resultsTitle, 
            calculateButtonText, goalOptions, strategyOptions, calculate,
            saveGoal, loadSavedGoal, deleteSavedGoal, showTooltip, moveTooltip, hideTooltip,
            getCalculatedTargetAmount, calculateGoalProgress, formatCurrency
        };
    }
});

const vm = app.mount('#app');
window.appInstance = vm;
