// Loading management
document.addEventListener('DOMContentLoaded', function () {
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
        // 解決 iOS WebView <a> 點擊失效，改用 JS 跳轉
        const openUrl = (url) => { window.location.href = url; };
        const isFormCollapsed = ref(false);
        const isMenuOpen = ref(false);
        const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

        const API_BASE_URL = 'https://development-executeapi.cmoney.tw/MemberSurvey/forms';

        const defaultGoalTypes = {
            retirement: { key: 'retirement', title: "退休規劃", icon: "mdi-beach", CurrentAge: "目前年齡", ageLabel: "預計退休年齡", amountLabel: "每月期望退休被動收入 (美元)", currentAssets: "當前總資產 (萬美元)", monthlyInvestment: "每月投資金額 (萬美元)", withdrawRate: 0.04, formId: 3 },
            house: { key: 'house', title: "購屋計畫", icon: "mdi-home-plus", CurrentAge: "目前年齡", ageLabel: "預計購屋年齡", amountLabel: "目標房屋頭期款 (萬美元)", withdrawRate: 1.0, formId: 4 },
            education: { key: 'education', title: "子女教育", icon: "mdi-school", CurrentAge: "孩子目前年齡", ageLabel: "孩子預計入學年齡", amountLabel: "預估教育總費用 (萬美元)", withdrawRate: 1.0, formId: 5 },
            emergency: { key: 'emergency', title: "緊急預備金", icon: "mdi-hospital-box", CurrentAge: "目前年齡", ageLabel: "預計完成年齡", amountLabel: "緊急預備金目標 (萬美元)", withdrawRate: 1.0, formId: 6 },
            custom: { key: 'custom', title: "自定義目標", icon: "mdi-bullseye-arrow", CurrentAge: "目前年齡", ageLabel: "預計達成年齡", amountLabel: "目標金額 (萬美元)", withdrawRate: 1.0, formId: 7 }
        };
        const goalTypes = ref({});

        const inflationRate = 0.03;

        const chartColors = {
            '股票': 'rgba(58, 134, 255, 1)',    // Blue color at 100% opacity
            '債券': 'rgba(58, 134, 255, 0.5)',  // Blue color at 75% opacity
            '黃金': 'rgba(58, 134, 255, 0.5)',   // Blue color at 50% opacity
            '商品': 'rgba(58, 134, 255, 0.35)',  // Blue color at 35% opacity
            '其他': 'rgba(58, 134, 255, 0.25)'    // Blue color at 60% opacity
        };

        const strategies = {
            '全天候策略': { icon: 'mdi-weather-pouring', expectedReturn: 0.037, volatility: 0.09, url: 'all_weather.html', allocation: { 'VTI': 30, 'TLT': 40, 'IEF': 15, 'GLD': 7.5, 'DBC': 7.5 }, simplifiedAllocation: { '股票': 30, '債券': 55, '其他': 15 }, description: '股債比為 30/55，另有 15% 為非股非債資產。' },
            '三基金組合': { icon: 'mdi-vector-triangle', expectedReturn: 0.068, volatility: 0.1256, url: 'classic3.html', allocation: { 'VTI (美國股市)': 42, 'VXUS (國際股市)': 18, 'BND (債券)': 40 }, simplifiedAllocation: { '股票': 60, '債券': 40 }, description: '股債比為 60/40。' },
            '核心四基金': { icon: 'mdi-sitemap', expectedReturn: 0.069, volatility: 0.125, url: 'core4.html', allocation: { 'VTI (美國股市)': 50, 'VXUS': 20, 'VNQ': 10, 'BND (債券)': 20 }, simplifiedAllocation: { '股票': 70, '債券': 20, '其他': 10 }, description: '股債比為 70/20，另有 10% 為不動產資產。' },
            '積極型股債組合': { icon: 'mdi-rocket-launch', expectedReturn: 0.075, volatility: 0.1263, url: 'aggressive.html', allocation: { 'VTI (美國股市)': 80, 'BNDW (債券)': 20 }, simplifiedAllocation: { '股票': 80, '債券': 20 }, description: '股債比為 80/20。' },
            '巴菲特推薦': { icon: 'mdi-face-man-shimmer', expectedReturn: 0.123, volatility: 0.152, url: 'voo.html', allocation: { 'VOO': 100 }, simplifiedAllocation: { '股票': 100 }, description: '全壓股票，股債比為 100/0。' }
        };

        // 新增工具函式：由報酬率取得波動度
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

        const form = ref({ goalType: 'retirement', currentAge: 25, targetAge: 65, targetValue: 5000, currentAssets: 100, monthlyInvestment: 1000, strategyReturn: 0.037 });
        const formErrors = ref({});
        const results = ref({
            show: false,
            strategyAllocation: {}
        });
        const chartHTML = ref('');
        const recommendationResults = ref([]);
        const savedGoals = ref([]);
        const charts = {}; // To manage chart instances
        const snackbar = ref({ show: false, message: '', color: 'success' });

        const currentStep = ref(1); // 1 for form, 2 for results
        const showSnackbar = (message, color = 'success', duration = 3000) => {
            snackbar.value = { show: true, message, color };
            setTimeout(() => { snackbar.value.show = false; }, duration);
        };

        const loadFormDefinitions = async () => {
            try {
                const response = await fetch(API_BASE_URL, {
                    headers: { 'accept': 'application/json' },
                    credentials: 'include'  // 新增這行
                });
                if (!response.ok) throw new Error('無法從 API 獲取表單列表');
                const data = await response.json();
                const forms = data.forms; // 從 API 回應中取得 forms 陣列

                const newGoalTypes = {};
                const formIdToDefaultKey = Object.entries(defaultGoalTypes).reduce((acc, [key, conf]) => {
                    acc[conf.formId] = key;
                    return acc;
                }, {});

                const loadFormDetails = async (formId) => {
                    try {
                        const formResponse = await fetch(`${API_BASE_URL}/${formId}`, {
                            headers: { 'accept': 'application/json' },
                            credentials: 'include'  // 新增這行
                        });
                        if (!formResponse.ok) throw new Error(`無法獲取表單詳細資料，formId: ${formId}`);
                        const formData = await formResponse.json();
                        return formData;
                    } catch (error) {
                        console.error(`取得表單詳細資料失敗，formId: ${formId}:`, error);
                        return null;
                    }
                };

                // 建立問題與表單欄位的對應關係
                const createFieldMapping = (questions, formId) => {
                    const questionIdMap = {};
                    const questionFormats = {};
                    const questionTitleMap = {};
                    const unmappedQuestions = [];

                    // 找到對應的目標類型配置
                    const goalTypeKey = Object.keys(defaultGoalTypes).find(key =>
                        defaultGoalTypes[key].formId === formId
                    );
                    const goalTypeConfig = defaultGoalTypes[goalTypeKey];

                    questions.forEach(question => {
                        let fieldKey = null;

                        // 根據問題標題與 defaultGoalTypes 的欄位值進行對應
                        if (question.title === goalTypeConfig?.CurrentAge) {
                            fieldKey = 'currentAge';
                        } else if (question.title === goalTypeConfig?.ageLabel) {
                            fieldKey = 'targetAge';
                        } else if (question.title === goalTypeConfig?.amountLabel) {
                            fieldKey = 'targetValue';
                        } else {
                            // 處理通用欄位
                            switch (question.title) {
                                case '目前資產 (萬美元)':
                                case '當前總資產 (萬美元)':
                                    fieldKey = 'currentAssets';
                                    break;
                                case '每月投資金額 (美元)':
                                case '每月投資金額 (萬美元)':
                                    fieldKey = 'monthlyInvestment';
                                    break;
                                case '投資策略報酬率':
                                    fieldKey = 'strategyReturn';
                                    break;
                                case '選擇投資策略':
                                    fieldKey = 'strategySelection';
                                    break;
                            }
                        }

                        if (fieldKey) {
                            questionIdMap[fieldKey] = question.questionId;
                            questionFormats[question.questionId] = question.format;
                            questionTitleMap[fieldKey] = question.title;
                        } else {
                            // 記錄未對應的問題
                            unmappedQuestions.push({
                                formId,
                                goalType: goalTypeKey,
                                questionId: question.questionId,
                                title: question.title,
                                text: question.text,
                                format: question.format
                            });
                        }
                    });

                    // 列印未對應的問題資訊
                    if (unmappedQuestions.length > 0) {
                        console.group(`未對應的問題 (表單ID: ${formId}, 目標類型: ${goalTypeConfig?.title || goalTypeKey})`);
                        unmappedQuestions.forEach(q => {
                            console.log(`問題ID: ${q.questionId}`);
                            console.log(`標題: ${q.title}`);
                            console.log(`內文: ${q.text}`);
                            console.log(`格式: ${q.format}`);
                            console.log('---');
                        });
                        console.groupEnd();
                    }

                    return {
                        questionIdMap,
                        questionFormats,
                        questionTitleMap,
                        unmappedQuestions
                    };
                };

                // 平行處理所有表單的載入
                const formDetailsPromises = forms.map(async (form) => {
                    const key = formIdToDefaultKey[form.formId];
                    if (key && defaultGoalTypes[key]) {
                        const formDetails = await loadFormDetails(form.formId);
                        if (formDetails) {
                            const { questionIdMap, questionFormats, questionTitleMap, unmappedQuestions } = createFieldMapping(formDetails.questions, form.formId);
                            newGoalTypes[key] = {
                                ...defaultGoalTypes[key],
                                title: form.info.title,
                                isResponded: form.isResponded,
                                formId: form.formId,
                                questionIdMap,
                                questionFormats,
                                questionTitleMap,
                                unmappedQuestions,
                                questions: formDetails.questions
                            };
                        }
                    }
                });

                await Promise.all(formDetailsPromises);

                goalTypes.value = newGoalTypes;
                showSnackbar('成功載入表單定義', 'info');
            } catch (error) {
                console.error('從 API 獲取表單定義失敗:', error);
                goalTypes.value = defaultGoalTypes; // API 失敗時使用預設值
                showSnackbar('載入表單定義失敗，將使用預設值', 'error');
            }
        };

        const loadGoalsFromAPI = async () => {
            if (Object.keys(goalTypes.value).length === 0) return;

            const fetchPromises = Object.entries(goalTypes.value).map(async ([goalKey, goalConfig]) => {
                if (goalConfig.isResponded) {
                    try {
                        const responseUrl = `${API_BASE_URL}/${goalConfig.formId}/responses`;
                        const response = await fetch(responseUrl, {
                            headers: { 'accept': 'application/json' },
                            credentials: 'include'  // 新增這行
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to fetch response for formId ${goalConfig.formId}, status: ${response.status}`);
                        }

                        const responseData = await response.json();
                        if (responseData && responseData.answers) {
                            // 將 API 回應轉換回目標物件
                            const savedGoal = { goalType: goalKey };
                            const fieldToQuestionId = Object.entries(goalConfig.questionIdMap || {});

                            responseData.answers.forEach(answer => {
                                const fieldEntry = fieldToQuestionId.find(([_, qId]) => qId === answer.questionId);
                                if (fieldEntry) {
                                    const fieldName = fieldEntry[0];
                                    const value = answer.answers[0]?.value;
                                    if (value !== undefined) {
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
            await loadGoalsFromAPI();
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
                value: key // The value should still be the internal key like 'retirement'
            }));
        });

        const allGoalSlots = computed(() => {
            if (Object.keys(goalTypes.value).length === 0) return [];
            const savedGoalsMap = new Map(savedGoals.value.map(g => [g.goalType, g]));

            return Object.keys(goalTypes.value).map(key => {
                const savedData = savedGoalsMap.get(key);
                return {
                    ...goalTypes.value[key], // Includes title, formId, etc.
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
                // Use nextTick to ensure the tooltip content is rendered and sized
                // before computing its position.
                setTimeout(() => moveTooltip(event), 0);
            }
        };

        const moveTooltip = (event) => {
            const el = document.getElementById('chartTooltip');
            if (!el) return;

            // Ensure we have the tooltip dimensions after content set
            const tooltipRect = el.getBoundingClientRect();

            // Get viewport info
            const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

            // Margin from edges
            const margin = 8;

            // If event.target is available (bar element), prefer positioning relative to it
            let anchorRect = null;
            try {
                if (event && event.target && event.target.getBoundingClientRect) {
                    anchorRect = event.target.getBoundingClientRect();
                }
            } catch (e) {
                anchorRect = null;
            }

            // Compute desired left: center over the anchor (bar) if possible, else use event.pageX
            let desiredLeft;
            if (anchorRect) {
                // anchorRect.left is viewport-based; convert to page coordinate
                const anchorCenterX = anchorRect.left + window.scrollX + (anchorRect.width / 2);
                desiredLeft = anchorCenterX - (tooltipRect.width / 2);
            } else if (event && typeof event.pageX === 'number') {
                desiredLeft = event.pageX - (tooltipRect.width / 2);
            } else {
                desiredLeft = margin;
            }

            // Clamp left within viewport
            const maxLeft = viewportWidth - tooltipRect.width - margin;
            if (desiredLeft < margin) desiredLeft = margin;
            if (desiredLeft > maxLeft) desiredLeft = Math.max(margin, maxLeft);

            // Compute desired top: prefer above the anchor, otherwise below
            let desiredTop;
            if (anchorRect) {
                const aboveTop = anchorRect.top - tooltipRect.height - 12; // 12px gap
                const belowTop = anchorRect.bottom + 12; // 12px gap
                if (aboveTop >= margin) {
                    desiredTop = aboveTop + window.scrollY;
                } else if (belowTop + tooltipRect.height <= viewportHeight - margin) {
                    desiredTop = belowTop + window.scrollY;
                } else {
                    // fallback: clamp to viewport
                    desiredTop = Math.max(margin, Math.min(aboveTop + window.scrollY, viewportHeight - tooltipRect.height - margin));
                }
            } else if (event && typeof event.pageY === 'number') {
                desiredTop = event.pageY - tooltipRect.height - 15;
                if (desiredTop < margin) desiredTop = Math.min(margin, event.pageY + 12);
            } else {
                desiredTop = margin + window.scrollY;
            }

            el.style.left = `${Math.round(desiredLeft)}px`;
            el.style.top = `${Math.round(desiredTop)}px`;

            // Position the tooltip arrow so it points at the anchor (if available).
            try {
                if (anchorRect) {
                    const anchorCenterXPage = anchorRect.left + window.scrollX + (anchorRect.width / 2);
                    const arrowOffset = anchorCenterXPage - desiredLeft; // px inside tooltip
                    let arrowPercent = (arrowOffset / tooltipRect.width) * 100;
                    if (!isFinite(arrowPercent)) arrowPercent = 50;
                    // keep arrow a bit inset from edges
                    arrowPercent = Math.max(8, Math.min(92, arrowPercent));
                    el.style.setProperty('--arrow-left', `${arrowPercent}%`);
                } else {
                    el.style.setProperty('--arrow-left', `50%`);
                }
            } catch (e) {
                el.style.setProperty('--arrow-left', `50%`);
            }
        };
        const hideTooltip = () => {
            const el = document.getElementById('chartTooltip');
            if (el) el.classList.remove('visible');
        };

        // Ensure the tooltip closes when the user clicks or lifts their finger
        // anywhere outside the tooltip or the bars. We add listeners once.
        if (!window.__goalTooltipListenersAdded) {
            const globalHideHandler = (e) => {
                try {
                    const el = document.getElementById('chartTooltip');
                    if (!el || !el.classList.contains('visible')) return;
                    const target = e.target;
                    // If the user tapped/clicked inside the tooltip, keep it open
                    if (el.contains(target)) return;
                    // If the user tapped/clicked on a bar (or inside one), keep it open
                    if (target.closest && target.closest('.bar')) return;
                    // Otherwise hide
                    hideTooltip();
                } catch (err) {
                    // swallow errors to avoid breaking page interactions
                    console.error('globalHideHandler error', err);
                }
            };

            document.addEventListener('click', globalHideHandler, { capture: true });
            document.addEventListener('touchend', globalHideHandler, { passive: true, capture: true });
            // mark as added so we don't attach multiple times
            window.__goalTooltipListenersAdded = true;
        }

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
                    if (key === 'goalType') return null; // 移除 "選擇財務目標" 欄位
                    if (key === 'strategyReturn') {
                        const questionId = questionIdMap['strategySelection'];
                        return { questionId, answers: [{ value: strategyOptions.find(opt => opt.value === value).text || '' }] };
                    }
                    const questionId = questionIdMap[key];
                    if (!questionId) return null;
                    const answerValue = String(value);
                    return { questionId, answers: [{ value: answerValue }] };
                })

            const requestBody = { answers: answersArray.filter(Boolean) }; // 過濾掉 null 值
            const apiUrl = `${API_BASE_URL}/${formId}/responses`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',  // 新增這行
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
            // Create a mutable copy to avoid changing the original saved goal object
            const goalToLoad = { ...goal };

            // If strategyReturn is a string, convert it to its numeric value for the form
            if (typeof goalToLoad.strategyReturn === 'string') {
                const strategyOption = strategyOptions.find(opt => opt.text === goalToLoad.strategyReturn);
                if (strategyOption) goalToLoad.strategyReturn = strategyOption.value;
            }
            results.value.show = false; // Force reactivity by hiding results before recalculating
            form.value = goalToLoad;
            calculate();
            isFormCollapsed.value = true; // Collapse the form to show results immediately
            currentStep.value = 2; // Go to results page
            showSnackbar('已載入目標並重新計算', 'info');
        };

        const selectUnsavedGoal = (goalType) => {
            form.value.goalType = goalType; // Set the goal type in the form
            isFormCollapsed.value = false; // Ensure the form is expanded
            results.value.show = false; // Hide any previous results
            // Scroll to the form section smoothly
            nextTick(() => {
                document.getElementById('goal-form-section').scrollIntoView({ behavior: 'smooth' });
            });
        };

        const deleteSavedGoal = async (index) => {
            const goalToDelete = savedGoals.value[index];
            const formId = goalTypes.value[goalToDelete.goalType]?.formId;
            if (!formId) { showSnackbar('無法刪除：無效的目標類型', 'error'); return; }
            const apiUrl = `${API_BASE_URL}/${formId}/responses`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    credentials: 'include'  // 新增這行
                });
                if (!response.ok) { throw new Error(`API 刪除失敗: ${response.statusText}`); }
                savedGoals.value.splice(index, 1);
                showSnackbar('目標已刪除', 'success');
            } catch (error) {
                console.error('刪除目標時發生錯誤:', error);
                showSnackbar('刪除失敗，請稍後再試', 'error');
            }
        };

        const formatCurrency = (value, unit = '美元') => {
            const num = Math.round(value);
            let formattedValue;

            if (unit === '萬美元') {
                // For '萬美元', we just format the number without K/M conversion
                formattedValue = num.toLocaleString();
            } else {
                // For '美元', use K/M for large numbers
                if (num >= 1000000) {
                    formattedValue = (num / 1000000).toFixed(2) + 'M';
                } else if (num >= 1000) {
                    formattedValue = (num / 1000).toFixed(1) + 'K';
                } else {
                    formattedValue = num.toLocaleString();
                }
            }
            return `${formattedValue} ${unit}`;
        };

        const getCalculatedTargetAmount = (goal) => {
            const config = goalTypes.value[goal.goalType];
            if (!config) return 0;
            const years = goal.targetAge - goal.currentAge;
            const targetValueUSD = goal.goalType === 'retirement' ? goal.targetValue : goal.targetValue * 10000;
            if (years <= 0) return targetValueUSD;
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

            isFormCollapsed.value = false; // Ensure form is expanded when calculating
            const years = form.value.targetAge - form.value.currentAge;
            const goalAmount = getCalculatedTargetAmount(form.value);
            // 統一將輸入值轉換為美元進行計算
            // 退休規劃的 monthlyInvestment 單位是美元，其他是萬美元
            const monthlyInvestUSD = form.value.goalType === 'retirement' ? form.value.monthlyInvestment : form.value.monthlyInvestment * 10000;
            const currentAssetsUSD = form.value.currentAssets * 10000;

            const assetsProjection = projectAssets(years, form.value.strategyReturn, monthlyInvestUSD, currentAssetsUSD);
            const investmentProjection = calculateAccumulatedInvestment(years, monthlyInvestUSD, currentAssetsUSD);

            const finalAsset = assetsProjection[assetsProjection.length - 1];
            const totalInvestment = currentAssetsUSD + (monthlyInvestUSD * 12 * years);
            const investmentGrowth = finalAsset - totalInvestment;
            const growthMultiple = finalAsset / totalInvestment; // 資產/成本 倍數

            // 取得該策略的波動度
            const vol = getVolatilityByReturn(form.value.strategyReturn);

            const selectedOption = strategyOptions.find(opt => opt.value === form.value.strategyReturn);
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
                let requiredInvestmentUSD = calcRequiredInvestment(goalAmount, years, form.value.strategyReturn, currentAssetsUSD);
                // 根據目標類型，將計算出的美元金額轉回對應的顯示單位（退休：美元，其他：萬美元）
                results.value.requiredInvestment = form.value.goalType === 'retirement' ? requiredInvestmentUSD : requiredInvestmentUSD / 10000;

            }
            updateStrategyRecommendations(goalAmount, years, currentAssetsUSD);
            renderCustomChart(assetsProjection, investmentProjection, goalAmount, years);
            currentStep.value = 2; // Switch to results view
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
            if (remainingNeeded <= 0) return { amountUSD: 0, isMetByInitial: true };
            let requiredMonthlyUSD = 0;
            if (annualReturn > 0) {
                requiredMonthlyUSD = remainingNeeded / (((Math.pow(1 + annualReturn, years) - 1) / annualReturn) * 12);
            } else {
                requiredMonthlyUSD = remainingNeeded / (years * 12);
            }
            return { amountUSD: requiredMonthlyUSD, isMetByInitial: false };
        };

        const updateStrategyRecommendations = (goalAmount, years, currentAssetsUSD) => {
            const recommendations = Object.entries(strategies).map(([name, strategy]) => {
                const calcResult = calculateRequiredMonthlyInvestmentForStrategy(goalAmount, years, strategy.expectedReturn, currentAssetsUSD);
                const isRetirement = form.value.goalType === 'retirement';
                const requiredMonthlyDisplay = isRetirement ? calcResult.amountUSD : calcResult.amountUSD / 10000;
                return { name, strategy, requiredMonthly: requiredMonthlyDisplay, isMetByInitial: calcResult.isMetByInitial, unit: isRetirement ? '美元' : '萬美元' };
            });
            recommendationResults.value = recommendations.map(rec => ({
                name: rec.name,
                expectedReturn: rec.strategy.expectedReturn,
                ...rec, // This will include requiredMonthly and unit
                reason: strategyReasons[rec.name], isMetByInitial: rec.isMetByInitial,
                url: rec.strategy.url,
                simplifiedAllocation: rec.strategy.simplifiedAllocation, // This was already here, which is great!
                volatility: rec.strategy.volatility,
                icon: rec.strategy.icon
            }));
        };

        // === MODIFICATION START: Reverted to Bar Chart renderer ===
        const renderCustomChart = (assetsProjection, investmentProjection, goal, totalYears) => {
            const maxValue = Math.max(goal, ...assetsProjection);

            const generateChartYears = (total) => {
                const years = new Set([0]);
                if (total > 0) years.add(1);

                let increment = 5;
                if (total > 20) increment = 10;

                for (let y = increment; y < total; y += increment) {
                    years.add(y);
                }

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

                const shortFormatCurrency = (val) => {
                    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
                    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
                    return val.toLocaleString();
                }

                const tooltipContent = `<strong>${year}年後 (${form.value.currentAge + year}歲)</strong><br>總資產: ${formatCurrency(totalAsset)}<br>累積投資成本: ${formatCurrency(totalInvestment)}<br>投資增長收益: ${formatCurrency(growth)}`;

                return `<div class="bar" style="height: ${totalHeightPercent}%;" onmouseover='window.appInstance.showTooltip(event, "${tooltipContent}")' onmousemove="window.appInstance.moveTooltip(event)" onmouseout="window.appInstance.hideTooltip()">
                            <div class="bar-value text-md">$ ${shortFormatCurrency(totalAsset)}</div>
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
        // === MODIFICATION END ===

        return {
            isMenuOpen, toggleMenu, isFormCollapsed,
            form, formErrors, results, chartHTML, recommendationResults, savedGoals, snackbar, currentStep,
            goalTypes, pageTitle, targetCurrentAge, targetAgeLabel, targetAmountLabel, monthlyInvestmentLabel, resultsTitle,
            calculateButtonText, goalOptions, allGoalSlots, strategyOptions: strategyOptionsRef, calculate, selectUnsavedGoal,
            saveGoal, loadSavedGoal, deleteSavedGoal, showTooltip, moveTooltip, hideTooltip,
            getCalculatedTargetAmount, calculateGoalProgress, formatCurrency, chartColors,
            openUrl,
        };
    }
});

const vm = app.mount('#app');
window.appInstance = vm;