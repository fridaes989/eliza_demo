// src/all_weather.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vTJOnAP0pKYY9aSGqhB3dbKAtzM32FSPHH4J8VKtdM3rBvm97qG2zPMgPfhLAgMzfTkW571ODjEmvVd',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '261742724',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '283425635',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
   portfolio: {
        name: "核心四基金",
        data: {
            allocations: {  
                VTI: 50,    // Total Stock Market Index Fund
                VXUS: 20,   // Total International Stock Index Fund  
                VNQ: 10,    // Real Estate Index Fund
                BND: 20     // Total Bond Market Index Fund 
            },
            CAGR: 0,
            volatility: 0,
            maxDrawdown: 0
        },
        description: `
        <p class="pb-4">此為增長型資產配置策略，在經典三基金組合基礎上，額外納入不動產基金（REITs），以增強抗通膨能力。</p>
        <p class="pb-4">該組合由50%美國股票、20%國際股票、10%不動產及20%美國債券組成，旨在透過更多元化的資產類別，在追求長期增長的同時，提供比傳統組合更佳的通膨保護，尤其適合希望在面對未來高通膨環境時增加防禦力的投資者。</p> `,
        
        // 改為數組格式
        pros: [
            "資產多元化更佳：納入不動產基金（REITs），提供比傳統股債組合更廣泛的資產配置。",
            "具備抗通膨能力：不動產基金的租金和資產價值能隨通膨上漲，為組合提供額外保護。"
        ],
        
        cons: [
            "仍跑不贏大盤：與其他被動投資組合相似，此組合的目標是穩健成長，而非追求超越大盤的超額報酬。",
            "最大回撤較大：在2022年股債雙殺期間，此組合的最大回撤仍高達23.5%，波動性較高。"
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


// portfolio_config.js
