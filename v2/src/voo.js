// src/all_weather.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vSHW-797FZrmMwApsIYm8hkv_ehu6ws3OhAuAY8I5azo45Lf8-JFwzgRheZr4JJKMzOEtYqBUVUOPVp',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '1254072941',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '218723572',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
     portfolio: {
        name: "巴菲特推薦",
        data: {
            allocations: {  
                VOO: 100 
                
            },
            CAGR: 0, 
            volatility: 0, 
            maxDrawdown: 0
        },
        description: `
        <p class="pb-4">此策略是將所有資金單一投入於Vanguard S&P 500 ETF (VOO)，等同於完全押注於美國最大的500家上市企業。</p>
        <p class="pb-4">這個組合旨在透過單一ETF，實現對美國大型股市場的極高曝險，以期獲得強勁的資本增長。歷史數據顯示，近十年平均年化報酬率達12.9%，但同時也伴隨著較高的波動與風險。</br></p>
        <p class="pb-4"></br></p>`,
        
        // 改為數組格式
        pros: [
            "極致的簡單與低成本：只需管理一支ETF，費用率極低，省去了複雜的資產配置和管理。",
            "追蹤美國最強市場：集中投資於美國最具代表性的500家公司，歷史上長期表現優於全球其他市場。",
            "強勁的歷史回報：自成立以來，VOO實現了年化14.2%的驚人回報，顯示出其卓越的長期增長潛力。"
        ],
        
        cons: [
            "極高的集中風險：所有資產集中於單一國家和單一資產類別，當美國股市下跌時，資產將面臨巨大衝擊。",
            "缺乏分散性：完全沒有國際股票或債券的配置，無法抵禦美國經濟衰退或特定產業風險。",
            "劇烈的波動與回撤：在熊市期間，資產回撤幅度極大，如2022年曾回撤超過25%，對投資者的心理承受力是極大考驗。"
        ],
        
        retirement:"適合，只要投資者有足夠長的投資年限（15年以上）且能承受市場大幅波動。",
        education:"若孩子年紀尚小，有超過15年的投資期間，則可考慮；若接近就學年齡，則應選擇更穩健的組合。",
        housing:"除非你的購屋時間在五年以上，否則不適合，因為短期內的高波動性會讓本金面臨巨大風險。"
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