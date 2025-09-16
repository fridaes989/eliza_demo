// src/all_weather.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vTJOnAP0pKYY9aSGqhB3dbKAtzM32FSPHH4J8VKtdM3rBvm97qG2zPMgPfhLAgMzfTkW571ODjEmvVd',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '1457921733',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '283425635',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
     portfolio: {
        name: "全天候策略",
        data: {
            allocations: { VTI: 30, TLT: 40, IEF: 15, GLD: 7.5, GSG: 7.5 },
            // 以下數值將從 Google Sheet 動態載入，此處設為 0 作為初始預設值
            CAGR: 0,
            volatility: 0,
            maxDrawdown: 0,
        },
        description: `<p class='pb-4'>全天候策略 (All-Weather Strategy) 是一個由全球最大避險基金「橋水基金」的創辦人瑞·達利歐(Ray Dalio)所創造的著名投資組合策略。</p>
        <p class='pb-4'>其核心理念非常簡單卻強大：不要試圖去預測未來的經濟走向，而是建立一個在任何經濟環境下（無論晴天或雨天）都能有相對穩健表現的投資組合。</p>        
        <p class="pb-4">其核心理念是無論經濟處於何種環境，都能保持穩健表現。該策略不試圖預測市場，而是採用「風險平價」原則，讓不同資產的風險貢獻度大致平衡，而非資金佔比相同。</p>
        <p class="pb-4">它將經濟環境分為經濟成長高低、通貨膨脹高低四種「季節」，並配置在不同季節中表現良好的資產。</p>
        <p class="pb-4">經典的全天候策略配置包括：40%長期公債（TLT）、30%美國股票（VTI）、15%中期公債（IEF）、7.5%黃金（GLD）和7.5%大宗商品（DBC）。</p>
         <p class="pb-4">這種配置旨在透過大量低風險的債券來平衡股票的波動性，同時利用黃金和大宗商品對抗通膨，以實現無論市場如何變動，都能相對平穩地增長的目標。</p>
        `,
        pros: [
            "高穩定性、低回撤：最大的優點是在市場大跌時，虧損幅度遠小於純股票或傳統的股債混合組合。這能讓投資人抱得住、睡得著。",
            "穿越牛熊：理論上，它的設計使其能夠應對各種未知的經濟衝擊。",
            "操作簡單：一旦建立，只需要定期（例如每年一次）進行「再平衡」（Rebalancing），將資產比例調回初始設定即可，不需要頻繁買賣。"
        ],
        cons: [
            "牛市表現平庸：在股市大漲的牛市期間，由於配置了大量的債券和黃金，其上漲幅度會遠遠落後於純股票型指數（如 S&P 500）。",
            "收益率可能較低：其目標是求「穩」而非求「高」，長期總回報可能會低於風險較高的投資組合。"
        ],
        retirement:"接近退休、極度厭惡風險的人士",
        education:"孩子已上高中，剩 3-5 年，保值為主",
        housing:"不太適用（因期限短，波動應更低）"
    }
};
