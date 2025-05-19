// js/charts_engagement.js
// v2025.05.19 — 이중 Y축 + ASMR 및 전체 콘텐츠 개선

Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', async () => {
  let rows = [];
  try {
    const res = await fetch('data/한동녹용연구소_인스타그램_인게이지먼트.xlsx');
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type: 'array' });
    const wsName = '콘텐츠별 인게이지먼트';
    const ws     = wb.Sheets[wsName];
    rows = XLSX.utils.sheet_to_json(ws, { raw: true });
  } catch (e) {
    console.error('❌ 엑셀 로드 실패:', e);
    return;
  }

  // 1) 날짜 문자열 → JS Date
  rows.forEach(r => {
    const [ymd, ampm, h시] = String(r.날짜).split(' ');
    const [Y, M, D] = ymd.split('.').map(n=>parseInt(n,10));
    let H = parseInt(h시,10);
    if (ampm==='오후' && H<12) H+=12;
    if (ampm==='오전' && H===12) H=0;
    r._dt = new Date(Y, M-1, D, H);
  });

  // 2) 콘텐츠별 **가장 최신 행**만 뽑아내기
  const latest = {};
  rows.forEach(r => {
    const key = r.콘텐츠명.trim();
    if (!latest[key] || r._dt > latest[key]._dt) {
      latest[key] = r;
    }
  });

  // 3) 콘텐츠 키워드 매칭
  const getByName = kw => Object.keys(latest).find(k => k.includes(kw));
  const female = latest[getByName('반말ver')];
  const male   = latest[getByName('존댓말ver')];
  const asmr   = latest[getByName('ASMR')];
  const cafe   = latest[getByName('카페')]; // 준비중 콘텐츠, 없으면 undefined

  if (!female || !male || !asmr) {
    console.error('❌ 필수 콘텐츠를 찾지 못했습니다:', Object.keys(latest));
    return;
  }

  // 4) 통계 계산 함수
  const calcStats = list => {
    const total = { 좋아요:0, 댓글:0, 저장:0, 공유:0, 도달:0, 참여:0 };
    list.forEach(d => {
      if (!d) return;
      total.좋아요 += d.좋아요 || 0;
      total.댓글  += d.댓글  || 0;
      total.저장  += d.저장  || 0;
      total.공유  += d.공유  || 0;
      total.도달  += d['도달된 계정'] || 0;
      total.참여  += d['참여한 계정'] || 0;
    });
    const 참여율 = +(((total.좋아요+total.댓글+total.저장+total.공유) / total.도달) * 100).toFixed(2);
    const 반응률 = +((total.참여 / total.도달) * 100).toFixed(2);
    return { ...total, 참여율, 반응률 };
  };

  const statsFemale  = calcStats([female]);
  const statsMale    = calcStats([male]);
  const statsTotal   = calcStats([female, male]);
  const statsAsmr    = calcStats([asmr, cafe]);
  const statsOverall = calcStats([female, male, asmr, cafe]);
  const statsAsmrSingle = calcStats([asmr]);

  // 5) DOM에 숫자 채워넣기
  const setText = (id, v) => document.getElementById(id).textContent = v;
  // 체험 릴스
  setText('totalEngageRate', statsTotal.참여율);
  setText('totalReactRate',  statsTotal.반응률);
  setText('totalLikes',      statsTotal.좋아요);
  setText('totalComments',   statsTotal.댓글);
  setText('totalSaves',      statsTotal.저장);
  setText('totalShares',     statsTotal.공유);
  // ASMR (3+4)
  setText('asmrEngageRate', statsAsmr.참여율);
  setText('asmrReactRate',  statsAsmr.반응률);
  setText('asmrLikes',      statsAsmr.좋아요);
  setText('asmrComments',   statsAsmr.댓글);
  setText('asmrSaves',      statsAsmr.저장);
  setText('asmrShares',     statsAsmr.공유);

  // 6) 차트 생성 헬퍼 (막대 + 선 + 이중 Y축)
  function makeChart(id, title, stats) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['좋아요','댓글','저장','공유','참여율(%)','반응률(%)'],
        datasets: [
          {
            label: '행동 수치',
            data: [stats.좋아요, stats.댓글, stats.저장, stats.공유, null, null],
            backgroundColor: ['rgba(52,152,219,0.7)','rgba(231,76,60,0.7)',
                              'rgba(46,204,113,0.7)','rgba(155,89,182,0.7)','transparent','transparent'],
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: '비율 (%)',
            data: [null,null,null,null,stats.참여율, stats.반응률],
            borderColor: '#e67e22', backgroundColor: '#e67e22', tension: 0.3,
            fill: false, yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          datalabels: {
            anchor: 'end', align: 'start', color: '#000', font: { weight: 'bold' },
            formatter: (v, ctx) => v===null ? '' : (ctx.dataset.yAxisID==='y1' ? v+'%' : v)
          }
        },
        scales: {
          y:  { beginAtZero:true, title:{display:true,text:'행동 수치'}, position:'left' },
          y1: { beginAtZero:true, title:{display:true,text:'비율 (%)'}, position:'right',
                grid:{drawOnChartArea:false}, ticks:{callback:v=>v+'%'} }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // 7) 차트 렌더링
  makeChart('engageFemale',    '체험 릴스 반말 ver',    statsFemale);
  makeChart('engageMale',      '체험 릴스 높임말 ver',  statsMale);
  makeChart('engagementChart','체험 릴스 전체 합산',    statsTotal);
  makeChart('asmrDetailChart',  '젤리 정통 ASMR 성과',    statsAsmrSingle);
  makeChart('asmrChart',      'ASMR 콘텐츠 성과 요약',  statsAsmr);
  makeChart('overallChart',   '전체 콘텐츠 성과',      statsOverall);
});