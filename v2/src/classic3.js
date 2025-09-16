// src/all_weather.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vTJOnAP0pKYY9aSGqhB3dbKAtzM32FSPHH4J8VKtdM3rBvm97qG2zPMgPfhLAgMzfTkW571ODjEmvVd',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '1808108800',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '283425635',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
     portfolio: {
        name: "三基金組合",
        data: {
            allocations: { VTI: 42, VXUS: 18, BND: 40 },
            CAGR: 0, 
            volatility: 0, 
            maxDrawdown: 0,
        },
        description: `
        <p class="pb-4">來自指數基金之父約翰·柏格，其核心理念是簡單、低成本的「買入並持有」被動投資哲學。</p>
        <p class="pb-4">這個組合的最大優勢在於其極簡的結構和靈活性。投資者可根據自身年齡和風險承受能力來調整股債比例，特別適合新手。</p>
        <p class="pb-4">它由三種核心基金組成： 本國股票基金、國際股票基金 和 本國債券基金，旨在透過極低的成本實現全球市場的高度分散。</p>
         <p class="pb-4">一個常見的經驗法則是 <span class="text-primary"> 「債券比例 = 你的年齡」</span>。例如，30歲投資者可配置70%股票和30%債券。.</p>
        `,
        pros: [
            "極度簡單：只需要管理三檔基金，非常容易上手和維護。",
            "成本極低：由於只使用被動追蹤大盤的指數基金...",
            "高度分散：橫跨全球股票和本國債券市場..."
        ],
        cons: [
            "不包含其他資產類別： 這個基礎組合沒有包含黃金...",
            "回報率完全取決於市場： 作為一個完全被動的策略..."
        ],
        retirement:"大多數距離退休尚有時日的穩健規劃者",
        education:"孩子上小學，還有 10 年左右，攻守兼備",
        housing:"5-7 年的長期購房計畫"
    }
};

/**
 * 其他投資組合的設定方式：
 * 1. 複製此檔案並重新命名 (例如 classic3.js, aggressive.js)。
 * 2. 修改 portfolioConfig.googleSheet.gid 為對應的 ID：
 * - classic3: 1808108800
 * - aggressive: 1065112708
 * - core4: 261742724
 * - voo: 736791427
 * 3. 修改 portfolio 物件中的 name, allocations, description, pros, cons 等資訊。
 */

