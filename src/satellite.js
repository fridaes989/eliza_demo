// src/classic3.js

// 這個物件變數是 app.js 將讀取的設定檔
const portfolioConfig = {
    // Section 1: Google Sheet URL for THIS portfolio
    googleSheet: {
        // 這是所有投資組合共用的 Google Sheet 檔案 ID
        sheetId: '2PACX-1vSHW-797FZrmMwApsIYm8hkv_ehu6ws3OhAuAY8I5azo45Lf8-JFwzgRheZr4JJKMzOEtYqBUVUOPVp',
        
        // 這是「投資組合」 (e.g., 全天候策略) 對應的工作表 ID
        gid: '2002470195',

        // 這是 S&P 500 指數專用的工作表 ID
        sp500Gid: '218723572',

        // 根據 gid 產生對應的資料 URL
        get dataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.gid}&single=true&output=csv`; },
        get sp500DataUrl() { return `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?gid=${this.sp500Gid}&single=true&output=csv`; }
    },

    // Section 2: Portfolio-specific details
     portfolio: {
        name: "核心-衛星策略",
        columnName: "satellite", // Corresponds to the header in the new sheet
        data: {
            allocations: { VTI: 50, VXUS: 20, BND: 20, QQQ: 10 },
            CAGR: 0, 
            volatility: 0, 
            maxDrawdown: 0,
        },
        simplifiedAllocation: { '股票': 80, '債券': 20 },
        description: `
        <p class="pb-4">這是一種專業投資者常用的資產配置框架，旨在巧妙地平衡「穩健求勝」與「積極進取」。大部分資金（90%）構成了我們的「核心」，任務是穩固防守，確保獲取市場的平均回報。而一小部分資金（10%），則構成了「衛星」，任務是突破和進球，帶來超額回報的驚喜。</p>
        <h2 class="pb-4 text-primary text-lg">問與答</h2>
        <h3 class="pb-4 text-primary">1.為什麼是 QQQ，而不是單一個股？</h3>
        <p class="pb-4">既然要追求高增長，為什麼衛星不用更熱門的輝達或特斯拉，而是用 QQQ 呢？這是一個非常好的問題，它直擊我們「墨鏡姐複利樹」的風險控制核心。</p>
        <p class="pb-4">我們的第一原則，永遠是「分散化」。即使在追求超額回報的「衛星」部分，我們也依然堅守這一原則，這是我們與純粹投機的根本區別。</p>
        <ol class="list-decimal list-inside pb-4">
            <li>投資 QQQ，是在投資美國最具創新力的「一百家頂級公司」組成的「科技軍團」。這個軍團整體向前推進，即使其中個別公司意外倒下，整個軍團的戰鬥力依然強大。</li>
            <li>而投資一支個股，是在押注「一位超級公司」。這個公司可能盈利非常強大，敘事也很美好，但他也可能因為一次錯誤的決策或一個強大的競爭對手而意外倒下，導致這部分投資血本無歸。</li>
        </ol>
        <h3 class="pb-4 text-primary">2.VTI 裡不是已經有科技股了嗎？</h3>
        <p class="pb-4">沒錯！像 VTI 這樣的美國整體市場基金，已經按照市值，包含了 QQQ 裡的幾乎所有公司。額外加入 10% 的 QQQ 作為衛星，其本質不是為了「分散」，而是為了「加倍押注」。您是在對美國最大的一批科技和成長型公司，進行一次額外的、集中的看好，並希望它們能為您帶來超額的回報。</p>
        <p class="pb-4">「墨鏡姐複利樹」的目標，是幫助您在理性的框架內，去捕捉時代的趨勢。選擇 QQQ 這樣的「行業 ETF」作為衛星，正是我們在「追求熱點」和「控制風險」之間，找到的最佳平衡點。</p>
        
        `,
         pros: [
            "兼顧穩健與增長： 大部分資產享受市場的穩健回報，小部分資產捕捉科技行業的超額增長潛力。",
            "滿足時代趨勢： 讓保守型投資者，也能在不顛覆自己投資體系的前提下，參與到當下最重要的科技革命浪潮中。"
        ],
        
        cons: [
            "波動性與回撤更高： 相比純粹的懶人組合，加入 QQQ 會無可避免地增加整個組合的波動和潛在虧損幅度。",
            "行業集中風險：「衛星」部分的成敗，高度依賴於科技行業的整體表現。"
        ],
        retirement:"適合：投資年限長達 15 年以上、能承受較大市場波動、並希望增強長期回報潛力的投資者。| 不適合：臨近退休或已退休人士。他們的首要任務是資產保值，而非承擔額外的行業集中風險。",
        education:"適合：孩子年齡尚小（例如 10 歲以下），投資期限較長，可以配置一小部分衛星來增強增長。| 不適合：孩子即將上大學（例如只剩 5 年以內）。此時應逐步降低風險，而非增加風險",
        housing:"通常不推薦。 因為購房計畫大多是中短期目標，對本金的安全性要求極高。加入像 QQQ 這樣高波動性的衛星資產，會顯著增加在您需要用錢時，本金可能處於虧損狀態的風險。"
    }
};
