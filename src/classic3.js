// src/classic3_config.js

// This object variable is what the generic app.js will read
const portfolioConfig = {
    // Section 1: Google Sheet URLs for THIS portfolio
    googleSheet: {
        sheetId: '2PACX-1vQ9HlHWa8I9gXJxhWR33zfEzFYNUPlmQ6JXW-ieNTNJ4eNxPj8cIz3n06GeinH0_UHI1dSQtVUOw6bg',
        cagrGid: '30612939',
        volatilityGid: '663951904',
        
        // Let's build the final URLs here for cleanliness
        get cagrUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.cagrGid}&single=true&output=csv` },
        get volatilityUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.volatilityGid}&single=true&output=csv` }
    },

    // Section 2: Portfolio-specific details (name, description, etc.)
    portfolio: {
        name: "三基金組合",
        data: {
            allocations: { VTI: 42, VXUS: 18, BND: 40 },
            CAGR: 0.081, 
            volatility: 0.105, 
            maxDrawdown: -0.33,
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