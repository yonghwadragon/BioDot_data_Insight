// js/charts_engagement.js
// v2025.06.05 — 전체 콘텐츠 성과 자동 렌더링 + 12개 콘텐츠 대응 + 평균 개선

Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', async () => {
  let rows = [];
  try {
    const res = await fetch('data/한동녹용연구소_인스타그램_인게이지먼트.xlsx');
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type: 'array' });
    const ws  = wb.Sheets['콘텐츠별 인게이지먼트'];
    rows = XLSX.utils.sheet_to_json(ws, { raw: true });
  } catch (e) {
    console.error('❌ 엑셀 로드 실패:', e);
    return;
  }

  rows.forEach(r => {
    const [ymd, ampm, h시] = String(r.날짜).split(' ');
    const [Y, M, D] = ymd.split('.').map(n => parseInt(n, 10));
    let H = parseInt(h시, 10);
    if (ampm === '오후' && H < 12) H += 12;
    if (ampm === '오전' && H === 12) H = 0;
    r._dt = new Date(Y, M - 1, D, H);
    r._dateText = `${Y}.${String(M).padStart(2, '0')}.${String(D).padStart(2, '0')}`;
  });

  const latest = {};
  rows.forEach(r => {
    const key = r.콘텐츠명.trim();
    if (!latest[key] || r._dt > latest[key]._dt) {
      latest[key] = r;
    }
  });

  const getByName = kw => Object.keys(latest).find(k => k.includes(kw));
  const picks = {
    female: '반말ver', male: '존댓말ver', asmr: 'ASMR',
    shake: '쉐이크', cafe: '카페',
    teamLeader: '팀장은 근무중',
    char1: '캐릭터(1)', char2: '캐릭터(2)', slow: '저속노화',
    noknok: '녹녹디어', good: '굿띵',
    ng1: 'NG(1)', ng2: 'NG(2)'
  };

  const statsMap = {};
  Object.entries(picks).forEach(([k, kw]) => {
    const key = getByName(kw);
    if (key) statsMap[k] = latest[key];
  });

  const calcStats = list => {
    const total = { 좋아요: 0, 댓글: 0, 저장: 0, 공유: 0, 도달: 0, 참여: 0, 날짜들: [] };
    list.forEach(d => {
      if (!d) return;
      total.좋아요 += d.좋아요 || 0;
      total.댓글  += d.댓글 || 0;
      total.저장  += d.저장 || 0;
      total.공유  += d.공유 || 0;
      total.도달  += d['도달된 계정'] || 0;
      total.참여  += d['참여한 계정'] || 0;
      if (d._dateText) total.날짜들.push(d._dateText);
    });
    const 참여율 = +(((total.좋아요 + total.댓글 + total.저장 + total.공유) / total.도달) * 100).toFixed(2);
    const 반응률 = +((total.참여 / total.도달) * 100).toFixed(2);
    return { ...total, 참여율, 반응률 };
  };

  const sum = (...keys) => calcStats(keys.map(k => statsMap[k]).filter(Boolean));
  const avg = (keys, n) => {
    const s = sum(...keys);
    return { ...s, 좋아요: Math.round(s.좋아요 / n), 댓글: Math.round(s.댓글 / n), 저장: Math.round(s.저장 / n), 공유: Math.round(s.공유 / n) };
  };

  const chartList = [
    ['engageFemale', '체험 릴스 반말 ver', sum('female')],
    ['engageMale', '체험 릴스 높임말 ver', sum('male')],
    ['engagementChart', '체험 릴스 전체 평균', avg(['female', 'male'], 2)],
    ['asmrDetailChart', '젤리 정통 ASMR 성과', sum('asmr')],
    ['shakeDetailChart', '쉐이크 ASMR 성과', sum('shake')],
    ['asmrChart', 'ASMR 콘텐츠 전체 평균', avg(['asmr', 'shake'], 2)],
    ['teamLeaderChart', '한동팀장은 근무중', sum('teamLeader')],
    ['charInfo1Chart', '캐릭터(1)', sum('char1')],
    ['charInfo2Chart', '캐릭터(2)', sum('char2')],
    ['slowAgingChart', '저속노화', sum('slow')],
    ['characterSummaryChart', '캐릭터 콘텐츠 전체 평균', avg(['teamLeader', 'char1', 'char2', 'slow'], 3)],
    ['noknokChart', '녹녹디어', sum('noknok')],
    ['goodthingChart', '굿띵 챌린지', sum('good')],
    ['memeChallengeChart', '밈/챌린지 콘텐츠 전체 평균', avg(['noknok', 'good'], 1)],
    ['ng1Chart', 'NG컷 1', sum('ng1')],
    ['ng2Chart', 'NG컷 2', sum('ng2')],
    ['ngSummaryChart', 'NG 콘텐츠 전체 평균', avg(['ng1', 'ng2'], 2)],
    ['overallChart', '전체 콘텐츠 평균', avg(['female','male','asmr','shake','teamLeader','char1','char2','slow','noknok','good','ng1','ng2'], 10)]
  ];

  function makeChart(id, title, stats) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dateStr = stats.날짜들?.length ? ` (${[...new Set(stats.날짜들)].join(', ')})` : '';
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['좋아요', '댓글', '저장', '공유', '참여율(%)', '반응률(%)'],
        datasets: [
          {
            label: '행동 수치',
            data: [stats.좋아요, stats.댓글, stats.저장, stats.공유, null, null],
            backgroundColor: ['#3498dbcc','#e74c3ccc','#2ecc71cc','#9b59b6cc','transparent','transparent'],
            yAxisID: 'y', grouped: false,
            datalabels: { anchor: 'end', align: 'start', offset: -20 }
          },
          {
            label: '비율(%)',
            data: [null,null,null,null,stats.참여율,stats.반응률],
            backgroundColor: ['#f1c40fcc','#e67e22cc'],
            yAxisID: 'y1', grouped: false,
            datalabels: { anchor: 'end', align: 'start', offset: -20 }
          },
          {
           label: '과거 평균 행동 수치선',
           data: [134.33, 0.33, 0.67, 0.5, null, null],
           type: 'line',
           borderColor: 'red',
           borderDash: [4, 4],
           borderWidth: 1,
           pointRadius: 0,
           fill: false,
           yAxisID: 'y'
         },
         {
           label: '과거 비율 평균선',
           data: [null, null, null, null, 1.24, 4.26],
           type: 'line',
           borderColor: 'red',
           borderDash: [4, 4],
           borderWidth: 1,
           pointRadius: 0,
           fill: false,
           yAxisID: 'y1'
         }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title + dateStr },
          datalabels: {
            anchor: 'end', align: 'start', offset: -17, color: '#000', font: { weight: 'bold' },
            formatter: (v, ctx) => ctx.dataset.yAxisID === 'y1' && v !== null ? v + '%' : (v ?? '')
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '행동 수치' } },
          y1: { beginAtZero: true, position: 'right', title: { display: true, text: '비율(%)' }, grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function insertFormula(blockId, stats) {
    const el = document.getElementById(blockId);
    if (!el) return;
    const a = stats.좋아요, b = stats.댓글, c = stats.저장, d = stats.공유, e = stats.도달, f = stats.참여;
    el.textContent = `참여율 (%) = (좋아요 + 댓글 + 저장 + 공유) ÷ 도달된 계정 수 × 100\n = (${a} + ${b} + ${c} + ${d}) ÷ ${e} × 100\n = ${(a + b + c + d)} ÷ ${e} × 100 ≒ ${stats.참여율}%\n\n반응률 (%) = 참여한 계정 ÷ 도달된 계정 수 × 100\n = ${f} ÷ ${e} × 100 ≒ ${stats.반응률}%`;
  }

  const formulaMap = {
    engageFemale: 'femaleFormulaBlock',
    engageMale: 'maleFormulaBlock',
    engagementChart: 'totalFormulaBlock',
    asmrChart: 'asmrFormulaBlock',
    asmrDetailChart: 'asmrDetailFormulaBlock',
    shakeDetailChart: 'shakeDetailFormulaBlock',
    teamLeaderChart: 'teamLeaderFormulaBlock',
    charInfo1Chart: 'charInfo1FormulaBlock',
    charInfo2Chart: 'charInfo2FormulaBlock',
    slowAgingChart: 'slowAgingFormulaBlock',
    characterSummaryChart: 'characterSummaryFormula',
    noknokChart: 'noknokFormulaBlock',
    goodthingChart: 'goodthingFormulaBlock',
    memeChallengeChart: 'memeChallengeFormula',
    ng1Chart: 'ng1FormulaBlock',
    ng2Chart: 'ng2FormulaBlock',
    ngSummaryChart: 'ngSummaryFormula',
    overallChart: 'overallFormulaBlock'
  };

  chartList.forEach(([id, title, stats]) => {
    makeChart(id, title, stats);
    if (formulaMap[id]) insertFormula(formulaMap[id], stats);
  });
});