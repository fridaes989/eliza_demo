// src/classic3.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vSHW-797FZrmMwApsIYm8hkv_ehu6ws3OhAuAY8I5azo45Lf8-JFwzgRheZr4JJKMzOEtYqBUVUOPVp',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '875507893',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '218723572',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
     portfolio: {
        name: "三基金組合",
        columnName: "classic3", // Corresponds to the header in the new sheet
        data: {
            allocations: { VTI: 42, VXUS: 18, BND: 40 },
            CAGR: 0, 
            volatility: 0, 
            maxDrawdown: 0,
        },
        description: `
        <p class="pb-4">此策略源於指數基金之父約翰·柏格（John Bogle）的被動投資哲學，核心是用最少的基金達到最大程度的全球市場分散，並將成本降至最低。</p>
        <p class="pb-4">它由三種核心基金組成 ：</p>
        <ol class="list-decimal list-inside pb-4">
            <li>本國股票市場基金 (如: VTI)，抓住本國經濟增長紅利。</li>
            <li>國際股票市場基金 (如: VXUS)，分散地理風險，不錯過世界其他地區的增長機會。</li>
            <li>本國債券市場基金 (如: BND)，作為投資組合的穩定器，在股市下跌時提供緩衝。</li>
        </ol>
        <h3 class="pb-4">關於配置比例的說明</h3>
        <p class="pb-4">最經典的配置為 <span class="text-primary"> 「60/40 組合」</span>，即60%股票與40%債券。</p>
        <p class="pb-4">一個常見的預設配置是：42% VTI、18% VXUS、40% BND 。投資者也可根據經驗法則（如 <span class="text-primary">「債券比例 = 您的年齡」</span>）來調整比例</p>
        <p class="pb-4">「墨鏡姐複利樹」預設的，是一個帶有「美國偏好」的經典 60/40 配置（股票部分約 70% 為美股，30% 為國際股）。這背後的理念是，美國經濟作為全球最強大的引擎，其穩定性和增長潛力值得我們給予更高的權重。</p>
        <p class="pb-4">然而，另一種嚴格的被動投資哲學，是採用「全球市值加權」股票部分約 60% 為美股，40% 為國際股，完全按照各國股市的實際大小來分配，不做任何主觀偏好。</p>
        <p class="pb-4">這兩種理念都非常優秀，沒有絕對的對錯。 「墨鏡姐複利樹」鼓勵您理解這兩種思路，並找到最適合您自己信念的配置。</p>
        `,
         pros: [
            "極度簡單：僅需管理三檔基金，容易上手與維護。",
            "成本極低：使用被動指數基金，管理費用通常非常低。",
            "高度分散：橫跨全球股票和本國債券市場，有效降低單一國家或公司的風險。",
            "易於再平衡：每年僅需操作一次，將比例調回目標即可。"
            
        ],
        
        cons: [
            "不包含其他資產類別：缺乏黃金、不動產(REITs)等可在高通膨時期提供額外保護的資產。",
            "回報率完全取決於市場：作為被動策略，其表現就是市場的平均表現，不會有超額報酬。"
        ],
        retirement:"可依年齡調整股債比，是簡單有效的長期退休規劃",
        education:"全球分散投資，適合穩健累積10年以上的教育費用",
        housing:"股債配置攻守兼備，適合5至10年的中期購屋儲蓄"
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
