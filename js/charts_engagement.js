// js/charts_engagement.js
// v2025.05.21 — 날짜 추가 + shake ASMR 반영 + 이중 Y축에서 비율은 막대 유지

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
  const female = latest[getByName('반말ver')];
  const male   = latest[getByName('존댓말ver')];
  const asmr   = latest[getByName('ASMR')];
  const shake  = latest[getByName('쉐이크')] || latest[getByName('shake')];
  const cafe   = shake || latest[getByName('카페')];

  if (!female || !male || !asmr) {
    console.error('❌ 필수 콘텐츠 누락:', Object.keys(latest));
    return;
  }

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

  const statsFemale      = calcStats([female]);
  const statsMale        = calcStats([male]);
  const statsAsmrDetail  = calcStats([asmr]);
  const statsShakeDetail = calcStats([shake]);
  const statsAsmr        = calcStats([asmr, shake].filter(Boolean));
  const statsTotal       = calcStats([female, male]);
  const statsOverall     = calcStats([female, male, asmr, shake].filter(Boolean));

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  setText('totalEngageRate', statsTotal.참여율);
  setText('totalReactRate',  statsTotal.반응률);
  setText('totalLikes',      statsTotal.좋아요);
  setText('totalComments',   statsTotal.댓글);
  setText('totalSaves',      statsTotal.저장);
  setText('totalShares',     statsTotal.공유);

  setText('asmrEngageRate', statsAsmr.참여율);
  setText('asmrReactRate',  statsAsmr.반응률);
  setText('asmrLikes',      statsAsmr.좋아요);
  setText('asmrComments',   statsAsmr.댓글);
  setText('asmrSaves',      statsAsmr.저장);
  setText('asmrShares',     statsAsmr.공유);

function makeChart(id, title, stats) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dateStr = '';
  if (stats.날짜들?.length) {
    const uniq = [...new Set(stats.날짜들)];
    dateStr = uniq.length > 1 ? ` (${uniq.join(', ')})` : ` (${uniq[0]})`;
  }
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['좋아요', '댓글', '저장', '공유', '참여율(%)', '반응률(%)'],
      datasets: [
        {
          label: '행동 수치',
          data: [
            stats.좋아요,
            stats.댓글,
            stats.저장,
            stats.공유,
            null,
            null
          ],
          backgroundColor: [
            'rgba(52,152,219,0.7)',
            'rgba(231,76,60,0.7)',
            'rgba(46,204,113,0.7)',
            'rgba(155,89,182,0.7)',
            'rgba(241,196,15,0.0)', // 투명
            'rgba(230,126,34,0.0)'
          ],
          yAxisID: 'y',
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          grouped: false
        },
        {
          label: '비율(%)',
          data: [
            null,
            null,
            null,
            null,
            stats.참여율,
            stats.반응률
          ],
          backgroundColor: [
            'rgba(241,196,15,0.7)',
            'rgba(230,126,34,0.7)'
          ],
          yAxisID: 'y1',
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          grouped: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: title + dateStr },
        datalabels: {
          anchor: 'end', align: 'start', color: '#000', font: { weight: 'bold' },
          formatter: (v, ctx) => {
            if (ctx.dataset.yAxisID === 'y1' && v !== null) return v + '%';
            return v === null ? '' : v;
          }
        }
      },
      scales: {
        y:  { beginAtZero: true, title: { display: true, text: '행동 수치' } },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: { display: true, text: '비율(%)' },
          grid: { drawOnChartArea: false },
          ticks: { callback: v => v + '%' }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

  makeChart('engageFemale',     '체험 릴스 반말 ver',      statsFemale);
  makeChart('engageMale',       '체험 릴스 높임말 ver',    statsMale);
  makeChart('engagementChart',  '체험 릴스 전체 합산',     statsTotal);
  makeChart('asmrDetailChart',  '젤리 정통 ASMR 성과',     statsAsmrDetail);
  makeChart('asmrChart',        'ASMR 콘텐츠 성과 요약',   statsAsmr);
  if (shake) makeChart('shakeDetailChart', '쉐이크 ASMR 성과', statsShakeDetail);
  makeChart('overallChart',     '전체 콘텐츠 성과',        statsOverall);
});