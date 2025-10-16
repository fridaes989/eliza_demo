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
    components: { 'strategy-card': StrategyCard, 'results-summary': ResultsSummary },
    setup() {
        const isFormCollapsed = ref(false);
        const isMenuOpen = ref(false);
        const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

        const API_BASE_URL = 'https://development-executeapi.cmoney.tw/MemberSurvey/forms';
        const AUTH_TOKEN = '';

        const defaultGoalTypes = { 
            retirement: { key: 'retirement', title: "退休規劃", icon: "mdi-beach", CurrentAge:"目前年齡", ageLabel: "預計退休年齡", amountLabel: "每月期望退休被動收入(美元)", withdrawRate: 0.04, formId: 3 }, 
            house: { key: 'house', title: "購屋計畫", icon: "mdi-home-plus", CurrentAge:"目前年齡", ageLabel: "預計購屋年齡", amountLabel: "目標房屋頭期款(萬美元)", withdrawRate: 1.0,formId: 4 }, 
            education: { key: 'education', title: "教育基金", icon: "mdi-school", CurrentAge:"孩子目前年齡", ageLabel: "孩子預計入學年齡", amountLabel: "預估教育總費用(萬美元)", withdrawRate: 1.0, formId: 5 }, 
            emergency: { key: 'emergency', title: "緊急預備金", icon: "mdi-lifebuoy", CurrentAge:"目前年齡", ageLabel: "預計完成年齡", amountLabel: "緊急預備金目標(萬美元)", withdrawRate: 1.0, formId: 6 }, 
            custom: { key: 'custom', title: "自定義目標", icon: "mdi-bullseye-arrow", CurrentAge:"目前年齡", ageLabel: "預計達成年齡", amountLabel: "目標金額(萬美元)", withdrawRate: 1.0, formId: 7 } 
        };
        const goalTypes = ref({});

        const inflationRate = 0.03;

        const chartColors = {
            '股票': 'rgba(58, 134, 255, 1)',
            '債券': 'rgba(58, 134, 255, 0.5)',
            '黃金': 'rgba(58, 134, 255, 0.5)',
            '商品': 'rgba(58, 134, 255, 0.35)',
            '其他': 'rgba(58, 134, 255, 0.25)'
        };
        
        const strategies = { 
            '全天候策略': { icon: 'mdi-weather-pouring', expectedReturn: 0.037, volatility: 0.09, url: 'all_weather.html', allocation: { 'VTI': 30, 'TLT': 40, 'IEF': 15, 'GLD': 7.5, 'DBC': 7.5 }, simplifiedAllocation: { '股票': 30, '債券': 55, '其他': 15 }, description: '股債比為 30/55，另有 15% 為非股非債資產。' }, 
            '三基金組合': { icon: 'mdi-vector-triangle', expectedReturn: 0.068, volatility: 0.1256, url: 'classic3.html', allocation: { 'VTI (美國股市)': 60, 'VTIAX (國際股市)': 20, 'BND (債券)': 20 }, simplifiedAllocation: { '股票': 80, '債券': 20 }, description: '股債比為 80/20。' }, 
            '核心四基金': { icon: 'mdi-sitemap', expectedReturn: 0.069, volatility: 0.125, url: 'core4.html', allocation: { 'VTI (美國股市)': 50, 'VXUS': 20, 'VNQ':10,'BND (債券)': 20 }, simplifiedAllocation: { '股票': 70, '債券': 20, '其他': 10 }, description: '股債比為 70/20，另有 10% 為不動產資產。' },
            '積極型股債組合': { icon: 'mdi-rocket-launch', expectedReturn: 0.075, volatility: 0.1263, url: 'aggressive.html', allocation: { 'VTI (美國股市)': 70, 'VTIAX (國際股市)': 10, 'BND (債券)': 20 }, simplifiedAllocation: { '股票': 80, '債券': 20 }, description: '股債比為 80/20。' },
            '巴菲特推薦': { icon: 'mdi-face-man-shimmer', expectedReturn: 0.123, volatility: 0.152, url: 'voo.html', allocation: { 'VOO': 100}, simplifiedAllocation: { '股票': 100 }, description: '全壓股票，股債比為 100/0。' } 
        };

        const getVolatilityByReturn = (returnValue) => {
            const match = Object.values(strategies).find(s => s.expectedReturn === returnValue);
            return match ? match.volatility : null;
        };

        const strategyReasons = { 
            '全天候策略': '提供良好的風險分散，適合追求穩定報酬的投資者', 
            '三基金組合': '簡單而有效的配置，適合長期投資且希望降低管理複雜度的投資者', 
            '核心四基金': '「三基金組合」的進階選項，增加房地產以對抗通膨。', 
            '積極型股債組合': '較高的股票配置，適合年輕且風險承受度高的投資者',
            '巴菲特推薦': '完全相信並押注於美國最具代表性的 500 家頂級企業的長期增長。'  
        };

        const form = ref({ goalType: 'retirement', currentAge: 25, targetAge: 65, targetValue: 5000, currentAssets: 100, monthlyInvestment: 1000, strategyReturn: 0.037});
        const formErrors = ref({});
        const results = ref({
            show: false,
            strategyAllocation: {}
        });
        const chartHTML = ref('');
        const recommendationResults = ref([]);
        const savedGoals = ref([
            { goalType: 'retirement', currentAge: 30, targetAge: 65, targetValue: 5000, currentAssets: 150, monthlyInvestment: 1200, strategyReturn: 0.068 },
            { goalType: 'house', currentAge: 28, targetAge: 35, targetValue: 300, currentAssets: 80, monthlyInvestment: 2, strategyReturn: 0.075 }
        ]);
        const charts = {};
        const snackbar = ref({ show: false, message: '', color: 'success' });
        const currentStep = ref(1);

        const showSnackbar = (message, color = 'success', duration = 3000) => {
            snackbar.value = { show: true, message, color };
            setTimeout(() => { snackbar.value.show = false; }, duration);
        };

        const loadFormDefinitions = async () => {
            try {
                const questionTitleToFieldMap = {
                    '目前年齡': 'currentAge',
                    '預計退休年齡': 'targetAge',
                    '每月期望退休被動收入': 'targetValue',
                    '當前總資產': 'currentAssets',
                    '每月投資金額': 'monthlyInvestment',
                    '選擇投資策略': 'strategyReturn',
                    '預計購屋年齡': 'targetAge',
                    '目標房屋頭期款(萬美元)': 'targetValue',
                    '孩子目前年齡': 'currentAge',
                    '孩子預計入學年齡': 'targetAge',
                    '預估教育總費用(萬美元)': 'targetValue',
                    '預計完成年齡': 'targetAge',
                    '緊急預備金目標(萬美元)': 'targetValue',
                    '預計達成年齡': 'targetAge',
                    '目標金額(萬美元)': 'targetValue'
                };

                const newGoalTypes = {};
                const detailFetchPromises = Object.entries(defaultGoalTypes).map(async ([key, defaultGoal]) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/${defaultGoal.formId}`, { headers: { 'Authorization': AUTH_TOKEN, 'accept': 'application/json' } });
                        if (!response.ok) throw new Error(`Failed to fetch formId ${defaultGoal.formId}`);
                        const formDef = await response.json();
    
                        const goalData = { ...defaultGoal, ...formDef.info, isResponded: formDef.isResponded, questionIdMap: {}, questionFormats: {} };
    
                        if (formDef.questions && Array.isArray(formDef.questions)) {
                            formDef.questions.forEach(q => {
                                const internalFieldName = questionTitleToFieldMap[q.title];
                                if (internalFieldName) {
                                    goalData.questionIdMap[internalFieldName] = q.questionId;
                                    if (q.textQuestion && q.textQuestion.textFormat) {
                                        goalData.questionFormats[q.questionId] = q.textQuestion.textFormat;
                                    }
                                    if (q.choiceQuestion && q.choiceQuestion.options) {
                                        const apiOptions = q.choiceQuestion.options.map(apiOpt => {
                                            const matchingDefaultOption = strategyOptions.find(defaultOpt => defaultOpt.text === apiOpt.value);
                                            return {
                                                text: apiOpt.value,
                                                value: matchingDefaultOption ? matchingDefaultOption.value : apiOpt.value
                                            };
                                        });
                                        strategyOptionsRef.value = apiOptions;
                                    }
                                }
                            });
                        }
                        newGoalTypes[key] = goalData;
                    } catch (e) {
                        console.error(`獲取 formId ${defaultGoal.formId} 的詳細資料失敗，將使用預設值:`, e);
                        newGoalTypes[key] = defaultGoal;
                    }
                });
    
                await Promise.all(detailFetchPromises);
    
                goalTypes.value = newGoalTypes;
            } catch (error) {
                console.error('從 API 獲取表單定義失敗:', error);
                goalTypes.value = defaultGoalTypes;
            }
        };

        const loadGoalsFromAPI = async () => {
            if (Object.keys(goalTypes.value).length === 0) return;
        
            const fetchPromises = Object.entries(goalTypes.value).map(async ([goalKey, goalConfig]) => {
                if (goalConfig.isResponded) {
                    try {
                        const responseUrl = `${API_BASE_URL}/${goalConfig.formId}/responses`;
                        const response = await fetch(responseUrl, {
                            headers: { 'Authorization': AUTH_TOKEN, 'accept': 'application/json' }
                        });
        
                        if (!response.ok) {
                            throw new Error(`Failed to fetch response for formId ${goalConfig.formId}, status: ${response.status}`);
                        }
        
                        const responseData = await response.json();
                        if (responseData && responseData.answers) {
                            const savedGoal = { goalType: goalKey };
                            const { questionIdMap } = goalConfig;
                            const questionIdToFieldMap = Object.entries(questionIdMap).reduce((acc, [field, qId]) => {
                                acc[qId] = field;
                                return acc;
                            }, {});
        
                            responseData.answers.forEach(answer => {
                                const fieldName = questionIdToFieldMap[answer.questionId];
                                if (fieldName && answer.answers && answer.answers.length > 0) {
                                    const value = answer.answers[0].value;
                                    if (fieldName === 'strategyReturn') {
                                        const option = strategyOptions.value.find(opt => opt.text === value);
                                        savedGoal[fieldName] = option ? option.value : value;
                                    } else if (fieldName === 'goalType') {
                                        savedGoal[fieldName] = value;
                                    } else {
                                        savedGoal[fieldName] = isNaN(Number(value)) ? value : Number(value);
                                    }
                                }
                            });
                            return savedGoal;
                        }
                    } catch (error) {
                        console.error(`Error fetching saved goal for formId ${goalConfig.formId}:`, error);
                        return null;
                    }
                }
                return null;
            });
        
            try {
                const results = await Promise.all(fetchPromises);
                const loadedGoals = results.filter(goal => goal !== null);
                if (loadedGoals.length > 0) {
                    savedGoals.value = loadedGoals;
                    showSnackbar(`成功載入 ${loadedGoals.length} 個已存目標`, 'info');
                }
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
        
        const allGoalSlots = computed(() => {
            if (Object.keys(goalTypes.value).length === 0) return [];
            const savedGoalsMap = new Map(savedGoals.value.map(g => [g.goalType, g]));
            
            return Object.keys(goalTypes.value).map(key => {
                const savedData = savedGoalsMap.get(key);
                return {
                    ...goalTypes.value[key],
                    savedData: savedData || null
                };
            });
        });
        const monthlyInvestmentLabel = computed(() => {
            const unit = form.value.goalType === 'retirement' ? '美元' : '萬美元';
            return `每月投資金額 (${unit})`;
        });

        const strategyOptions = [
            { text: '極保守型｜低風險｜年化報酬 <5%', value: 0.037, key: '全天候策略' },
            { text: '穩健型｜中低風險｜年化報酬 6~8%', value: 0.068, key: '三基金組合' },
            { text: '增長型｜中高風險｜年化報酬 6~8%', value: 0.069, key: '核心四基金' },
            { text: '積極型｜中高風險｜年化報酬 8~10%', value: 0.075, key: '積極型股債組合' },
            { text: '高風險型｜波動大｜年化報酬 12.3%', value: 0.123, key: '巴菲特推薦' }
        ];
        const strategyOptionsRef = ref([...strategyOptions]);
        
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
            // todo: 檢查是否登入
            // if (!isLoggedIn.value) { showSnackbar('請先登入才能儲存目標', 'warning'); return; }
            const formId = goalTypes.value[form.value.goalType].formId;
            if (!formId) { showSnackbar('無效的目標類型', 'error'); return; }

            const currentGoalType = goalTypes.value[form.value.goalType];
            if (!currentGoalType || !currentGoalType.questionIdMap) {
                showSnackbar('找不到問題對應表，無法儲存', 'error');
                return;
            }
            const { questionIdMap, questionFormats } = currentGoalType;

            const answersArray = Object.entries(form.value)
                .map(([key, value]) => {
                    if (key === 'goalType') return null;
                    const questionId = questionIdMap[key];
                    if (!questionId) return null;
                    const format = questionFormats[questionId];
                    const answerValue = String(value);
                    return { questionId, answers: [{ value: answerValue }] };
                })

            const requestBody = { answers: answersArray.filter(Boolean) };
            const apiUrl = `${API_BASE_URL}/${formId}/responses`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': AUTH_TOKEN 
                    },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) { throw new Error(`API 請求失敗: ${response.statusText}`); }
                const goalData = { ...form.value, savedAt: new Date().toISOString() };
                const existingIndex = savedGoals.value.findIndex(g => g.goalType === goalData.goalType);
                if (existingIndex !== -1) { savedGoals.value[existingIndex] = goalData; } 
                else { savedGoals.value.push(goalData); }
                showSnackbar('目標已儲存！', 'success');
            } catch (error) {
                console.error('儲存目標失敗:', error.message);
                showSnackbar('儲存目標失敗，請稍後再試', 'error');
            }
        };

        const loadSavedGoal = (goal) => {
            const goalToLoad = { ...goal };
            if (typeof goalToLoad.strategyReturn === 'string') {
                const strategyOption = strategyOptions.find(opt => opt.text === goalToLoad.strategyReturn);
                if (strategyOption) goalToLoad.strategyReturn = strategyOption.value;
            }
            results.value.show = false;
            form.value = goalToLoad;
            calculate();
            isFormCollapsed.value = true;
            currentStep.value = 2;
            showSnackbar('已載入目標並重新計算', 'info');
        };

        const selectUnsavedGoal = (goalType) => {
            form.value.goalType = goalType;
            isFormCollapsed.value = false;
            results.value.show = false;
            nextTick(() => {
                document.getElementById('goal-form-section').scrollIntoView({ behavior: 'smooth' });
            });
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

        // =================================================================
        // == START: 顯示與計算邏輯修正區塊 ==
        // =================================================================

        /**
         * @description 【修正】格式化貨幣，顯示完整數字以便比對
         */
        const formatCurrency = (value, unit = '美元') => {
            const num = Number(value);
            if (isNaN(num)) return value;
        
            // 對於非 '萬美元' 的單位，顯示帶有逗號和兩位小數的完整數字
            if (unit !== '萬美元') {
                return num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
        
            // 對於 '萬美元'，顯示整數和逗號
            return Math.round(num).toLocaleString('en-US');
        };

        /**
         * @description 【修正】計算目標金額，確保退休目標單位正確
         */
        const getCalculatedTargetAmount = (goal) => {
            const config = goalTypes.value[goal.goalType];
            if (!config) return 0;
        
            const years = goal.targetAge - goal.currentAge;
        
            if (goal.goalType === 'retirement') {
                // --- 退休邏輯 ---
                const monthlyIncomeGoal = Number(goal.targetValue) || 0; // 強制轉為數字
                if (years <= 0) {
                    return (monthlyIncomeGoal * 12) / config.withdrawRate; // 立即退休所需本金
                }
                // 根據4%法則計算今日所需的本金
                const principalToday = (monthlyIncomeGoal * 12) / config.withdrawRate;
                // 將此本金透過通膨率計算其未來價值
                const futurePrincipal = principalToday * Math.pow(1 + inflationRate, years);
                return futurePrincipal;
            } else {
                // --- 非退休邏輯 ---
                const targetAmountTenK = Number(goal.targetValue) || 0; // 強制轉為數字
                const targetAmountUSD = targetAmountTenK * 10000;
                // 非退休目標目前不計算通膨
                return targetAmountUSD;
            }
        };
        
        const calculateGoalProgress = (goal) => { 
            const targetAmount = getCalculatedTargetAmount(goal); 
            if (targetAmount <= 0) return 0; 
            const currentAssetsUSD = goal.currentAssets * 10000; 
            return Math.min((currentAssetsUSD / targetAmount) * 100, 100); 
        };

        /**
         * @description 精確計算未來值的函式，對齊 Google Sheet FV 公式
         */
        const calculateFutureValue = (years, annualReturn, monthlyInvestment, presentValue) => {
            if (years <= 0) return presentValue;
            
            const monthlyRate = annualReturn / 12;
            const numberOfPeriods = years * 12;
            
            if (monthlyRate === 0) {
                return presentValue + (monthlyInvestment * numberOfPeriods);
            }

            const fvFromPv = presentValue * Math.pow(1 + monthlyRate, numberOfPeriods);
            const fvFromPmt = monthlyInvestment * ((Math.pow(1 + monthlyRate, numberOfPeriods) - 1) / monthlyRate);
            
            return fvFromPv + fvFromPmt;
        };

        /**
         * @description 產生每年資產預估陣列 (供圖表使用)
         */
        const projectAssets = (years, annualReturn, monthlyInvestUSD, currentAssetsUSD) => { 
            const projection = [currentAssetsUSD]; 
            for (let year = 1; year <= years; year++) { 
                const finalAssetForYear = calculateFutureValue(year, annualReturn, monthlyInvestUSD, currentAssetsUSD);
                projection.push(finalAssetForYear); 
            } 
            return projection; 
        };

        /**
         * @description 精確計算所需每月投資金額，對齊 Google Sheet PMT 公式
         */
        const calcRequiredInvestment = (target, years, annualReturn, startAssetsUSD) => {
            const monthlyRate = annualReturn / 12;
            const numberOfPeriods = years * 12;

            if (numberOfPeriods <= 0) return 0;
            
            if (monthlyRate === 0) {
                const requiredTotalInvestment = target - startAssetsUSD;
                return requiredTotalInvestment > 0 ? requiredTotalInvestment / numberOfPeriods : 0;
            }

            const fvFromPv = startAssetsUSD * Math.pow(1 + monthlyRate, numberOfPeriods);
            const requiredFvFromPmt = target - fvFromPv;

            if (requiredFvFromPmt <= 0) return 0;

            const pmt = requiredFvFromPmt / (((Math.pow(1 + monthlyRate, numberOfPeriods) - 1) / monthlyRate));
            return pmt;
        };

        // =================================================================
        // == END: 顯示與計算邏輯修正區塊 ==
        // =================================================================

        const calculateAccumulatedInvestment = (years, monthlyInvestUSD, currentAssetsUSD) => { 
            const accumulated = [currentAssetsUSD]; 
            for (let i = 1; i <= years; i++) { 
                accumulated.push(currentAssetsUSD + (monthlyInvestUSD * 12 * i)); 
            } 
            return accumulated; 
        };

        const calculate = () => { 
            if (Object.keys(formErrors.value).length > 0) { showSnackbar('請修正表單中的錯誤', 'error'); return; } 
            
            // --- START: Robust Input Sanitization ---
            const goalType = form.value.goalType;
            const currentAge = Number(form.value.currentAge) || 0;
            const targetAge = Number(form.value.targetAge) || 0;
            const targetValue = Number(form.value.targetValue) || 0;
            const currentAssets = Number(form.value.currentAssets) || 0;
            const monthlyInvestment = Number(form.value.monthlyInvestment) || 0;
            const strategyReturn = Number(form.value.strategyReturn) || 0;

            if (targetAge <= currentAge) { showSnackbar('目標年齡必須大於目前年齡', 'error'); return; } 
            
            isFormCollapsed.value = false;
            const years = targetAge - currentAge; 
            
            // Pass a clean object to the calculation function
            const goalAmount = getCalculatedTargetAmount({ goalType, targetAge, currentAge, targetValue });

            const monthlyInvestUSD = goalType === 'retirement' ? monthlyInvestment : monthlyInvestment * 10000;
            const currentAssetsUSD = currentAssets * 10000; 
            // --- END: Robust Input Sanitization ---
            
            const assetsProjection = projectAssets(years, strategyReturn, monthlyInvestUSD, currentAssetsUSD); 
            const investmentProjection = calculateAccumulatedInvestment(years, monthlyInvestUSD, currentAssetsUSD); 
            
            const finalAsset = assetsProjection[assetsProjection.length - 1]; 
            const totalInvestment = currentAssetsUSD + (monthlyInvestUSD * 12 * years);
            const investmentGrowth = finalAsset - totalInvestment;
            const growthMultiple = totalInvestment > 0 ? finalAsset / totalInvestment : 0;

            const selectedOption = strategyOptions.find(opt => opt.value === strategyReturn);
            const chosenStrategy = selectedOption ? strategies[selectedOption.key] : null;

            results.value = { 
                show: true, 
                isGoalAchieved: finalAsset >= goalAmount, 
                finalAsset, 
                goalAmount, 
                years,
                totalInvestment,
                investmentGrowth,
                growthMultiple,
                strategyName: selectedOption ? selectedOption.key : null,
                strategyReturn: chosenStrategy ? chosenStrategy.expectedReturn : null,
                strategyVolatility: chosenStrategy ? chosenStrategy.volatility : null,
                strategyAllocation: chosenStrategy ? chosenStrategy.allocation : {},
                strategyReason: selectedOption ? strategyReasons[selectedOption.key] : null,
                simplifiedAllocation: chosenStrategy ? chosenStrategy.simplifiedAllocation : {},
                strategyDescription: chosenStrategy ? chosenStrategy.description : '',
                currentAssets: currentAssetsUSD,
            };
            
            if (!results.value.isGoalAchieved) { 
                results.value.requiredReturn = calcRequiredReturn(goalAmount, years, monthlyInvestUSD, currentAssetsUSD); 
                let requiredInvestmentUSD = calcRequiredInvestment(goalAmount, years, strategyReturn, currentAssetsUSD);
                results.value.requiredInvestment = requiredInvestmentUSD;
            } 
            updateStrategyRecommendations(goalAmount, years, currentAssetsUSD); 
            renderCustomChart(assetsProjection, investmentProjection, goalAmount, years); 
            currentStep.value = 2;
        };

        const calcRequiredReturn = (target, years, monthlyInvestUSD, startAssetsUSD) => { 
            let low = 0, high = 0.5; 
            for (let i = 0; i < 100; i++) { 
                const mid = (low + high) / 2; 
                let val = calculateFutureValue(years, mid, monthlyInvestUSD, startAssetsUSD);
                if (val > target) high = mid; 
                else low = mid; 
            } 
            return low * 100; 
        };
        
        const updateStrategyRecommendations = (goalAmount, years, currentAssetsUSD) => { 
            const recommendations = Object.entries(strategies).map(([name, strategy]) => { 
                const requiredMonthlyUSD = calcRequiredInvestment(goalAmount, years, strategy.expectedReturn, currentAssetsUSD);
                const isMetByInitial = requiredMonthlyUSD <= 0 && calculateFutureValue(years, strategy.expectedReturn, 0, currentAssetsUSD) >= goalAmount;

                return { 
                    name, 
                    strategy, 
                    requiredMonthly: requiredMonthlyUSD, 
                    isMetByInitial: isMetByInitial, 
                    unit: '美元' 
                }; 
            }); 
            
            recommendationResults.value = recommendations.map(rec => ({ 
                name: rec.name, 
                expectedReturn: rec.strategy.expectedReturn, 
                ...rec,
                reason: strategyReasons[rec.name],
                url: rec.strategy.url,
                simplifiedAllocation: rec.strategy.simplifiedAllocation,
                volatility: rec.strategy.volatility,
                icon: rec.strategy.icon
            }));
        };
        
        const renderCustomChart = (assetsProjection, investmentProjection, goal, totalYears) => {
            const maxValue = Math.max(goal, ...assetsProjection);
            
            const generateChartYears = (total) => {
                const years = new Set([0]);
                if (total > 0) years.add(1);
                let increment = 5;
                if (total > 20) increment = 10;
                for (let y = increment; y < total; y += increment) { years.add(y); }
                if (total > 1) years.add(total);
                return Array.from(years).sort((a, b) => a - b);
            };

            const chartYears = generateChartYears(totalYears);

            const legendHTML = `<div class="chart-legend"><div class="legend-item"><div class="legend-color" style="background: linear-gradient(to top, #3182ce 0%, #4299e1 100%);"></div><span>累積投資成本</span></div><div class="legend-item"><div class="legend-color" style="background: linear-gradient(to top, #208065 0%, #40A080 100%);"></div><span>投資增長收益</span></div></div>`;
            
            let barsHTML = chartYears.map(year => {
                if (year > totalYears) return '';
                const totalAsset = assetsProjection[year] || 0;
                const totalInvestment = investmentProjection[year] || 0;
                const growth = Math.max(0, totalAsset - totalInvestment);

                const totalHeightPercent = maxValue > 0 ? (totalAsset / maxValue) * 100 : 0;
                const investmentHeightPercent = totalAsset > 0 ? (totalInvestment / totalAsset) * 100 : 0;
                const growthHeightPercent = totalAsset > 0 ? (growth / totalAsset) * 100 : 0;
                
                // 使用新的 formatCurrency 函式，但為了 tooltip 簡潔，還是用一個內部函式來縮寫
                const shortFormatCurrencyForTooltip = (val) => {
                     if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
                     if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
                     return val.toLocaleString();
                }

                const tooltipContent = `<strong>${year}年後 (${form.value.currentAge + year}歲)</strong><br>總資產: ${formatCurrency(totalAsset)}<br>累積投資成本: ${formatCurrency(totalInvestment)}<br>投資增長收益: ${formatCurrency(growth)}`;
                
                return `<div class="bar" style="height: ${totalHeightPercent}%;" onmouseover='window.appInstance.showTooltip(event, "${tooltipContent}")' onmousemove="window.appInstance.moveTooltip(event)" onmouseout="window.appInstance.hideTooltip()">
                            <div class="bar-value text-md">$${shortFormatCurrencyForTooltip(totalAsset)}</div>
                            <div class="bar-segment growth" style="height: ${growthHeightPercent}%;"></div>
                            <div class="bar-segment investment" style="height: ${investmentHeightPercent}%;"></div>
                        </div>`;
            }).join('');

            const goalLineBottomPercent = Math.min(maxValue > 0 ? (goal / maxValue) * 100 : 0, 95);

            let labelsHTML = chartYears.map(year => {
                const labelText = year === 0 ? `起始金額` : `${year}年後`;
                return `<div class="bar-label">
                            <span class="year-text text-xs">${labelText}</span>
                            <span class="age-text text-xs">(${form.value.currentAge + year}歲)</span>
                        </div>`;
            }).join('');

            chartHTML.value = `${legendHTML}
                <div class="bar-chart mt-6">
                    <div class="bars-container mt-6">
                        <div class="goal-line" style="bottom: ${goalLineBottomPercent}%;">
                            <div class="goal-label">目標 ${formatCurrency(goal)}</div>
                        </div>
                        ${barsHTML}
                    </div>
                    <div class="labels-container">${labelsHTML}</div>
                </div>`;
        };

        return { 
            isMenuOpen, toggleMenu, isFormCollapsed,
            form, formErrors, results, chartHTML, recommendationResults, savedGoals, snackbar, currentStep,
            goalTypes, pageTitle, targetCurrentAge, targetAgeLabel, targetAmountLabel, monthlyInvestmentLabel, resultsTitle,
            calculateButtonText, goalOptions, allGoalSlots, strategyOptions: strategyOptionsRef, calculate, selectUnsavedGoal,
            saveGoal, loadSavedGoal, deleteSavedGoal, showTooltip, moveTooltip, hideTooltip,
            getCalculatedTargetAmount, calculateGoalProgress, formatCurrency, chartColors,
        };
    }
});

const vm = app.mount('#app');
window.appInstance = vm;


