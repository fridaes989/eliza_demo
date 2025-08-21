
    // ===== Base data =====
    const portfolios = {
      "全天候策略": { allocations: { VTI: 30, TLT: 40, IEF: 15, GLD: 7.5, GSG: 7.5 }, CAGR: 0.078, volatility: 0.092, maxDrawdown: -0.28 },
      "三基金組合": { allocations: { VTI: 42, VXUS: 18, BND: 40 }, CAGR: 0.081, volatility: 0.105, maxDrawdown: -0.33 },
      "積極型股債組合": { allocations: { VT: 80, BNDW: 20 }, CAGR: 0.095, volatility: 0.132, maxDrawdown: -0.40 }
    };

    // Assumptions for editable weighting math (rough long-run estimates)
    const assetAssumptions = {
      VTI:{ ret:0.10, yield:0.015, vol:0.16 },
      VXUS:{ ret:0.07, yield:0.025, vol:0.17 },
      BND:{ ret:0.04, yield:0.030, vol:0.05 },
      TLT:{ ret:0.03, yield:0.025, vol:0.18 },
      IEF:{ ret:0.025, yield:0.025, vol:0.08 },
      GLD:{ ret:0.06, yield:0.000, vol:0.20 },
      DBC:{ ret:0.03, yield:0.000, vol:0.25 },
      GSG:{ ret:0.03, yield:0.000, vol:0.25 },
      VT:{ ret:0.085, yield:0.020, vol:0.17 },
      BNDW:{ ret:0.04, yield:0.027, vol:0.06 }
    };

    const benchmark = { // S&P500 proxy
      priceReturn: 0.07, // 價格報酬（不含配息）
      dividendYield: 0.02, // 配息殖利率
      totalReturn: 0.09 // 近似總報酬
    };

    // ===== Data sources for real backtest (Stooq monthly close; price-only) =====
    const symbolToStooq = {
      VTI: 'vti.us', TLT: 'tlt.us', IEF: 'ief.us', GLD: 'gld.us', DBC: 'dbc.us', GSG: 'gsg.us',
      VXUS: 'vxus.us', BND: 'bnd.us', VT: 'vt.us', BNDW: 'bnd.us', // fallback for BNDW
      SPY: 'spy.us'
    };
    const priceCache = {}; // { symbol: [ {date:'YYYY-MM', close:Number} ] }

    async function fetchStooqMonthly(symbol){
      if(priceCache[symbol]) return priceCache[symbol];
      const stooqCode = symbolToStooq[symbol];
      if(!stooqCode) return [];
      const url = `https://cors-anywhere.herokuapp.com/https://stooq.com/q/d/l/?s=${stooqCode}&i=m`;
      const resp = await fetch(url, { cache:'no-store' });
      if(!resp.ok){
        console.warn('Failed to fetch', symbol, resp.status);
        priceCache[symbol] = [];
        return [];
      }
      const csv = await resp.text();
      const lines = csv.trim().split(/\r?\n/);
      // Expect header: Date,Open,High,Low,Close,Volume
      const out = [];
      for(let i=1;i<lines.length;i++){
        const parts = lines[i].split(',');
        if(parts.length < 5) continue;
        const dateStr = parts[0];
        const close = Number(parts[4]);
        if(!close || !dateStr) continue;
        // Normalize to YYYY-MM for monthly key/label
        const ym = dateStr.slice(0,7);
        out.push({ date: ym, close });
      }
      priceCache[symbol] = out;
      return out;
    }

    function intersectMonths(arrays){
      // arrays: array of [ {date, close}, ... ]
      const sets = arrays.map(a => new Set(a.map(d=>d.date)));
      const common = [...sets[0]].filter(m => sets.every(s=>s.has(m)));
      common.sort();
      return common;
    }

    function computeMonthlyReturns(series){
      // series sorted by date asc: [ {date, close} ] -> { months:[..], returns:[..] } where returns[i] is growth from i-1 to i
      const months = series.map(d=>d.date);
      const returns = series.map((d,i)=> i===0 ? 0 : (d.close/series[i-1].close - 1));
      return { months, returns };
    }

    async function buildRealBacktest(backtestYears, allocations){
      const symbols = Object.keys(allocations);
      // fetch all asset prices and spy
      const allSymbols = [...new Set([...symbols, 'SPY'])];
      const priceSeries = {};
      await Promise.all(allSymbols.map(async s=>{ priceSeries[s] = await fetchStooqMonthly(s); }));

      // intersect common months across portfolio symbols and SPY
      const portArrays = symbols.map(s=> priceSeries[s] || []);
      if(portArrays.some(a=>a.length===0) || (priceSeries['SPY']||[]).length===0){
        // fallback to simulated if any data missing
        return null;
      }
      let commonMonths = intersectMonths([...portArrays, priceSeries['SPY']]);
      // keep last N years of months
      const maxMonths = backtestYears * 12;
      if(commonMonths.length > maxMonths) commonMonths = commonMonths.slice(commonMonths.length - maxMonths);

      // Build aligned close arrays
      const aligned = {};
      symbols.forEach(s=>{
        const map = new Map((priceSeries[s]||[]).map(d=>[d.date, d.close]));
        aligned[s] = commonMonths.map(m=> ({ date:m, close: map.get(m) }));
      });
      const spyAligned = commonMonths.map(m=> ({ date:m, close: new Map(priceSeries['SPY'].map(d=>[d.date,d.close])).get(m) }));

      // Compute monthly returns
      const weightsNorm = normalizedWeights(allocations);
      const portMonthlyReturns = commonMonths.map((m, idx)=>{
        if(idx===0) return 0;
        let r = 0;
        for(const s of symbols){
          const prev = aligned[s][idx-1].close; const cur = aligned[s][idx].close;
          if(!prev || !cur) return 0; // safety
          const sr = (cur/prev - 1);
          r += (weightsNorm[s]||0)/100 * sr;
        }
        return r;
      });
      const spyReturns = computeMonthlyReturns(spyAligned).returns;

      // Simulate growth without additional contributions (PV style)
      let pValue = 10000, sValue = 10000; // starting values
      const pSeries = [], sSeries = [];
      for(let i=0;i<commonMonths.length;i++){
        pValue *= (1 + (portMonthlyReturns[i]||0));
        sValue *= (1 + (spyReturns[i]||0));
        pSeries.push(Math.round(pValue));
        sSeries.push(Math.round(sValue));
      }

      return { labels: commonMonths, pSeries, sSeries };
    }

    // ===== State =====
    let selectedPortfolio = "全天候策略";
    let currentAllocations = { ...portfolios[selectedPortfolio].allocations };
    let years = 10; // projection horizon
    let backtestYears = 3; // backtest horizon
    let divMode = 'drip'; // 'drip' or 'cash'
    let initial = 100000;
    let monthly = 10000;
    let target = 1000000;

    let portfolioChart=null, comparisonChart=null, backtestChart=null;

    // ===== Chart.js global options (crisp, no smoothing) =====
    Chart.defaults.elements.point.radius = 2;
    Chart.defaults.elements.point.hoverRadius = 3;
    Chart.defaults.animation = { duration: 200, easing: 'linear' };
    Chart.defaults.animations = { colors: { type: 'color', duration: 200, easing: 'linear' } };
    if(Chart.defaults.elements && Chart.defaults.elements.line){ Chart.defaults.elements.line.tension = 0; }

    // ===== Helpers =====
    function formatK(num){
      if(Math.abs(num) >= 1_000_000) return (num/1_000_000).toFixed(2).replace(/\.00$/,'') + 'M';
      if(Math.abs(num) >= 1_000) return (num/1_000).toFixed(1).replace(/\.0$/,'') + 'K';
      return num.toLocaleString();
    }
    function pct(n){ return (n*100).toFixed(1) + '%'; }

    function normalizedWeights(obj){
      const sum = Object.values(obj).reduce((a,b)=>a+Number(b||0),0);
      if(sum === 0) return obj;
      const out = {}; Object.keys(obj).forEach(k=>{ out[k] = (obj[k]/sum)*100; });
      return out;
    }

    function computeWeightedStats(weights){
      // weights in % (0-100)
      let ret=0, vol=0, dy=0;
      for(const [k, wPct] of Object.entries(weights)){
        const w = (wPct||0)/100;
        const a = assetAssumptions[k] || {ret:0.05,yield:0.01,vol:0.12};
        ret += w * a.ret;
        dy  += w * a.yield;
        vol += w * a.vol; // simple approx
      }
      return { ret, dy, vol, maxDD: -0.35 + (0.20 - vol) }; // rough proxy for UI
    }

    function monthlyRate(annual){ return Math.pow(1+annual, 1/12) - 1; }

    // ===== UI Builds =====
    function buildAllocationGrid(){
      const grid = document.getElementById('allocationGrid');
      grid.innerHTML = '';
      Object.entries(currentAllocations).forEach(([symbol, pctVal])=>{
        const wrap = document.createElement('div');
        wrap.className = 'allocation-item';
        wrap.innerHTML = `
          <span>${symbol}</span>
          <input class="allocation-input" type="number" step="0.5" min="0" max="100" value="${pctVal}" data-sym="${symbol}" />
        `;
        grid.appendChild(wrap);
      });

      grid.querySelectorAll('.allocation-input').forEach(inp=>{
        inp.addEventListener('input', (e)=>{
          const sym = e.target.getAttribute('data-sym');
          currentAllocations[sym] = Number(e.target.value)||0;
          updateAllocationTotal();
          updatePerformanceFromWeights();
          updateAllCharts();
        });
      });

      updateAllocationTotal();
    }

    function updateAllocationTotal(){
      const total = Object.values(currentAllocations).reduce((a,b)=>a+(Number(b)||0),0);
      const el = document.getElementById('allocationTotal');
      el.textContent = `合計：${total.toFixed(1)}%`;
      el.classList.toggle('valid', Math.abs(total-100) < 0.01);
      el.classList.toggle('invalid', Math.abs(total-100) >= 0.01);
    }

    // ===== Calculations =====
    function buildProjectionSeries(years, initial, monthly, annualReturn){
      const data=[]; let invested=initial, value=initial; const m = monthly; const r = monthlyRate(annualReturn);
      let targetYear=null;
      for(let y=1;y<=years;y++){
        for(let i=0;i<12;i++){
          value = (value + m) * (1+r);
          invested += m;
        }
        if(!targetYear && value >= target) targetYear = y;
        data.push({ year:`${y}年`, invested:Math.round(invested), value:Math.round(value) });
      }
      return { data, invested, value, targetYear };
    }

    function simulateBacktest(years, allocations, divMode){
      // allocations in % (0-100) -> normalize
      const w = normalizedWeights(allocations);
      const stats = computeWeightedStats(w);

      // For DRIP use total return (ret + dy). For cash mode, grow by price return only, and accrue dividends in cash.
      const portAnnualTotal = stats.ret + stats.dy;
      const portAnnualPrice = stats.ret;
      const portDivY = stats.dy;

      const spAnnualTotal = benchmark.totalReturn;
      const spAnnualPrice = benchmark.priceReturn;
      const spDivY = benchmark.dividendYield;

      const months = years*12;

      // Initialize portfolios (no monthly contributions for clarity)
      let pValue = 10000; // initial input for backtest
      let pCash = 0;
      let sValue = 10000;
      let sCash = 0;

      const pmr = monthlyRate(divMode==='drip'? portAnnualTotal : portAnnualPrice);
      const smr = monthlyRate(divMode==='drip'? spAnnualTotal   : spAnnualPrice);
      const pDivMR = portDivY/12;
      const sDivMR = spDivY/12;

      const labels=[], pSeries=[], sSeries=[];

      for(let m=1;m<=months;m++){

        if(divMode==='cash'){
          // accrue dividends as cash (no compounding)
          pCash += pValue * pDivMR; // dividends from holdings before growth
          sCash += sValue * sDivMR;
        }

        // grow holdings
        pValue *= (1 + pmr);
        sValue *= (1 + smr);

        // labels (monthly)
        labels.push(`${Math.ceil(m/12)}年${(m-1)%12+1}月`);
        pSeries.push(Math.round(pValue + (divMode==='cash'? pCash:0)));
        sSeries.push(Math.round(sValue + (divMode==='cash'? sCash:0)));
      }

      return { labels, pSeries, sSeries };
    }

    // ===== Charts =====
    function updatePortfolioChart(data){
      const ctx = document.getElementById('portfolioChart').getContext('2d');
      if(portfolioChart) portfolioChart.destroy();
      portfolioChart = new Chart(ctx, {
        type:'line',
        data:{
          labels: data.map(d=>d.year),
          datasets:[
            { label:'累積投入金額', data:data.map(d=>d.invested), borderColor:'#2aa27f', backgroundColor:'rgba(21,90,71,.20)', fill:true, tension:.1 },
            { label:'累積總資產', data:data.map(d=>d.value), borderColor:'#5bc7a7', backgroundColor:'rgba(32,128,100,.25)', fill:true, tension:.1 }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'#fff' } } },
          interaction:{ mode:'index', intersect:false },
          scales:{
            x:{ ticks:{ color:'#fff' }, grid:{ color:'rgba(255,255,255,.1)' } },
            y:{ ticks:{ color:'#fff', callback:v=>formatK(v) }, grid:{ color:'rgba(255,255,255,.1)' } }
          }
        }
      });
    }

    function updateComparisonChart(){
      const ctx = document.getElementById('comparisonChart').getContext('2d');
      if(comparisonChart) comparisonChart.destroy();

      const names = Object.keys(portfolios);
      const rows=[]; const trackers={};
      names.forEach(n=> trackers[n] = { value:initial, r: portfolios[n].CAGR });

      for(let y=1;y<=years;y++){
        const row={ year:`${y}年` };
        names.forEach(n=>{
          const r = monthlyRate(trackers[n].r);
          for(let i=0;i<12;i++){
            trackers[n].value = (trackers[n].value + monthly) * (1+r);
          }
          row[n] = Math.round(trackers[n].value);
        });
        rows.push(row);
      }

      const colors = ['rgba(91,199,167,.25)','rgba(42,162,127,.25)','rgba(32,128,100,.25)'];
      const borders = ['#5bc7a7','#2aa27f','#208064'];

      comparisonChart = new Chart(ctx, {
        type:'line',
        data:{ labels: rows.map(d=>d.year), datasets: names.map((n,i)=>({ label:n, data:rows.map(d=>d[n]), borderColor:borders[i], backgroundColor:colors[i], fill:true, tension:.1 })) },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#fff' } } }, interaction:{ mode:'index', intersect:false }, scales:{ x:{ ticks:{ color:'#fff' }, grid:{ color:'rgba(255,255,255,.1)' } }, y:{ ticks:{ color:'#fff', callback:v=>formatK(v) }, grid:{ color:'rgba(255,255,255,.1)' } } } }
      });
    }

    async function updateBacktestChart(){
      const ctx = document.getElementById('backtestChart').getContext('2d');
      if(backtestChart) backtestChart.destroy();
      let dataReal = null;
      try{ dataReal = await buildRealBacktest(backtestYears, currentAllocations); }catch(e){ console.warn('Real backtest failed', e); }

      let xLabels, pSeries, sSeries;
      if(dataReal){
        xLabels = dataReal.labels; pSeries = dataReal.pSeries; sSeries = dataReal.sSeries;
      } else {
        // fallback to simulated if network or symbol missing
        const sim = simulateBacktest(backtestYears, currentAllocations, divMode);
        // Convert like "1年1月" to pseudo calendar labels so formatter can show YYYY/MM
        const baseYear = new Date().getFullYear() - backtestYears + 1;
        xLabels = sim.labels.map((l)=>{
          const m = l.match(/(\d+)年(\d+)月/);
          if(m){
            const y = baseYear + Number(m[1]) - 1;
            const mm = String(Number(m[2])).padStart(2,'0');
            return `${y}-${mm}`;
          }
          return l;
        });
        pSeries = sim.pSeries; sSeries = sim.sSeries;
      }
      const tickFontSize = window.innerWidth < 768 ? 10 : 12;

      backtestChart = new Chart(ctx, {
        type:'line',
        data:{
          labels:xLabels,
          datasets:[
            { label:`當前組合（價格報酬，月頻）`, data:pSeries, borderColor:'#5bc7a7', backgroundColor:'rgba(32,128,100,0)', fill:false, tension:0 },
            { label:'S&P 500（價格報酬，月頻）', data:sSeries, borderColor:'#FFD700', backgroundColor:'rgba(255,215,0,0)', fill:false, tension:0 }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'#fff' } } },
          interaction:{ mode:'index', intersect:false },
          scales:{
            x:{
              ticks:{
                color:'#fff',
                autoSkip:true,
                maxTicksLimit: Math.min(12, backtestYears*12),
                font: { size: tickFontSize },
                callback: function(value){
                  const raw = xLabels[value];
                  if(typeof raw === 'string'){
                    if(/^\d{4}-\d{2}$/.test(raw)){
                      const [y,m] = raw.split('-');
                      return `${y}/${m}`;
                    }
                    const m = raw.match(/(\d{4})[\/-]?(\d{2})/);
                    if(m){ return `${m[1]}/${m[2]}`; }
                  }
                  return raw;
                }
              },
              grid:{ color:'rgba(255,255,255,.08)' }
            },
            y:{ ticks:{ color:'#fff', callback:v=>formatK(v) }, grid:{ color:'rgba(255,255,255,.08)' } }
          }
        }
      });
    }

    // ===== Update flows =====
    function updatePerformanceFromWeights(){
      const weights = normalizedWeights(currentAllocations);
      const stats = computeWeightedStats(weights);
      document.getElementById('annualReturn').textContent = pct(stats.ret);
      document.getElementById('volatility').textContent = pct(stats.vol);
      document.getElementById('maxDrawdown').textContent = (stats.maxDD*100).toFixed(1) + '%';
    }

    function updateProjectionAndSummary(){
      // Use weighted return for current editable combo
      const weights = normalizedWeights(currentAllocations);
      const stats = computeWeightedStats(weights);
      const { data, invested, value } = buildProjectionSeries(years, initial, monthly, stats.ret + stats.dy); // use total return for projection

      // Summary
      document.getElementById('totalInvested').textContent = formatK(invested);
      document.getElementById('totalValue').textContent = formatK(value);
      const totalInvestedAmount = initial + monthly * 12 * years;
      const totalReturnPct = totalInvestedAmount>0 ? ((value-totalInvestedAmount)/totalInvestedAmount)*100 : 0;
      document.getElementById('totalReturnPct').textContent = totalReturnPct.toFixed(1) + '%';

      // Chart
      document.getElementById('currentPortfolioName').textContent = selectedPortfolio;
      updatePortfolioChart(data);
    }

    function updateAllCharts(){
      updateProjectionAndSummary();
      updateComparisonChart();
      updateBacktestChart();
    }

    // ===== Event wiring =====
    document.addEventListener('DOMContentLoaded', ()=>{
      // Tabs (switch presets)
      document.querySelectorAll('.tab-button').forEach(btn=>{
        btn.addEventListener('click', function(){
          document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          selectedPortfolio = this.getAttribute('data-portfolio');
          currentAllocations = { ...portfolios[selectedPortfolio].allocations };
          buildAllocationGrid();
          updatePerformanceFromWeights();
          updateAllCharts();
        });
      });

      // Horizon buttons for projection
      document.querySelectorAll('.horizon-years').forEach(btn=>{
        btn.addEventListener('click', function(){
          document.querySelectorAll('.horizon-years').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          years = parseInt(this.getAttribute('data-years'));
          updateAllCharts();
        });
      });

      // Backtest year chips
      document.querySelectorAll('.backtest-years').forEach(btn=>{
        btn.addEventListener('click', function(){
          document.querySelectorAll('.backtest-years').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          backtestYears = parseInt(this.getAttribute('data-years'));
          updateBacktestChart();
        });
      });

      // DRIP vs CASH
      document.querySelectorAll('input[name="divMode"]').forEach(r=>{
        r.addEventListener('change', function(){
          divMode = this.value; // 'drip' | 'cash'
          updateBacktestChart();
        });
      });

      // Inputs
      document.getElementById('initial').addEventListener('input', function(){ initial = Number(this.value)||0; updateAllCharts(); });
      document.getElementById('monthly').addEventListener('input', function(){ monthly = Number(this.value)||0; updateAllCharts(); });
      document.getElementById('target').addEventListener('input', function(){ target = Number(this.value)||0; updateAllCharts(); });

      // Initial render
      buildAllocationGrid();
      updatePerformanceFromWeights();
      updateAllCharts();
    });
