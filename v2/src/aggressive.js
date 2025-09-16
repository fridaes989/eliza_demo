// src/all_weather.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vTJOnAP0pKYY9aSGqhB3dbKAtzM32FSPHH4J8VKtdM3rBvm97qG2zPMgPfhLAgMzfTkW571ODjEmvVd',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '1065112708',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '283425635',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
    portfolio: {
        name: "積極型股債組合",
        data: {
            allocations: { VT: 80, BNDW: 20 },
            CAGR: 0, 
            volatility: 0, 
            maxDrawdown: 0,
            
        },
        description: `
        <p>此配置為「80/20」高增長策略，旨在透過高比例股票追求長期回報最大化。</p>
        <p>組合由80%「全球股票市場基金(VT)」和20%「全球債券市場基金(BNDW)」組成。VT單一基金便涵蓋全球逾九千家公司股票，實現一檔基金投遍世界的目標，適合投資年限長、風險承受度高的投資人。</p>`,
        
        // 改為數組格式
        pros: [
            "極致的分散: 僅用VT和BNDW兩支ETF，便能有效投資全球數十國的股票及債券，實現最大化的資產分散。",
            "極致的簡單: 將複雜的全球資產配置簡化為僅需管理兩支ETF，對於懶人投資者來說無比便捷。",
            "避免本國偏好: 相較於以單一國家為主的配置，此組合客觀反映全球經濟權重，對非美國投資者特別具吸引力。"
        ],
        
        cons: [
            "劇烈波動與潛在回撤：80%的股票配置使此組合在熊市時回撤劇烈，20%的債券緩衝有限。",
            "資產類別單一：組合僅包含股票和債券，缺乏能有效對抗停滯性通膨等特定經濟環境的其他資產。",
            "匯率風險：投資全球市場代表資產以多種貨幣計價，匯率波動將直接影響最終總回報。",
            "放棄超額回報：此組合目標是獲取全球市場平均回報，代表它永遠無法成為表現最好的，放棄了超額回報的可能。"
        ],
        
        retirement:"剛開始工作、距離退休非常遙遠的年輕人",
        education:"孩子剛出生，有 18 年時間追求最高增長",
        housing:"不太適用（風險過高）"
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
