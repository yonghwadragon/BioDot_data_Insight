// js/charts_engagement.js
// v2025.05.17 — 시트명 고정, 파일명 띄어쓰기 적용

Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', async () => {
  let rows = [];
  try {
    // 정확한 파일명(띄어쓰기 포함)을 써주세요
    const res = await fetch('data/한동녹용연구소_인스타그램_인게이지먼트.xlsx');
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type: 'array' });
    // 반드시 첫 번째 시트(정확한 시트명)만 읽어옵니다
    const wsName = '콘텐츠별 인게이지먼트';
    const ws     = wb.Sheets[wsName];
    rows = XLSX.utils.sheet_to_json(ws, { raw: true });
  } catch (e) {
    console.error('❌ 엑셀 로드 실패:', e);
    return; // 더 이상 진행하지 않습니다
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

  // 3) "반말ver" / "존댓말ver" 키워드로 안전 매칭
  const femaleKey = Object.keys(latest).find(k => k.includes('반말ver'));
  const maleKey = Object.keys(latest).find(k => k.includes('존댓말ver'));
  
  // 콘텐츠 데이터 가져오기
  const female = latest[femaleKey];
  const male = latest[maleKey];

  // 데이터 유효성 검사
  if (!female || !male) {
    console.error('❌ 콘텐츠를 찾지 못했습니다:', { 
      availableKeys: Object.keys(latest)
    });
    return; // 더 이상 진행하지 않습니다
  }

  // 4) 합산 통계 계산
  const total = {
    likes:    (female.좋아요 || 0) + (male.좋아요   || 0),
    comments: (female.댓글   || 0) + (male.댓글     || 0),
    saves:    (female.저장   || 0) + (male.저장     || 0),
    shares:   (female.공유   || 0) + (male.공유     || 0),
    reached:  (female['도달된 계정']||0) + (male['도달된 계정']||0),
    engaged:  (female['참여한 계정']||0) + (male['참여한 계정']||0)
  };
  total.참여율 = +((total.likes + total.comments + total.saves + total.shares) / total.reached * 100).toFixed(2);
  total.반응률 = +((total.engaged / total.reached) * 100).toFixed(2);

  female.참여율 = +(((female.좋아요 + female.댓글 + female.저장 + female.공유) / female['도달된 계정']) * 100).toFixed(2);
  female.반응률 = +((female['참여한 계정'] / female['도달된 계정']) * 100).toFixed(2);

  male.참여율 = +(((male.좋아요 + male.댓글 + male.저장 + male.공유) / male['도달된 계정']) * 100).toFixed(2);
  male.반응률 = +((male['참여한 계정'] / male['도달된 계정']) * 100).toFixed(2);

  // total 객체의 속성 이름을 한글로 매핑 (이 부분이 추가됨)
  total.좋아요 = total.likes;
  total.댓글 = total.comments;
  total.저장 = total.saves;
  total.공유 = total.shares;

  // 5) DOM에 숫자 채워넣기
  document.getElementById('totalEngageRate').textContent = total.참여율;
  document.getElementById('totalReactRate').textContent  = total.반응률;
  document.getElementById('totalLikes').textContent      = total.likes;
  document.getElementById('totalComments').textContent   = total.comments;
  document.getElementById('totalSaves').textContent      = total.saves;
  document.getElementById('totalShares').textContent     = total.shares;

// 6) 차트 생성 헬퍼
  function makeChart(id, title, stats) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['좋아요','댓글','저장','공유','참여율(%)','반응률(%)'],
        datasets: [{
          label: title,
          data: [
            Number(stats.좋아요 || 0),
            Number(stats.댓글 || 0),
            Number(stats.저장 || 0),
            Number(stats.공유 || 0),
            Number(stats.참여율 || 0),
            Number(stats.반응률 || 0)
          ],
          backgroundColor: [
            'rgba(52,152,219,0.7)',
            'rgba(231,76,60,0.7)',
            'rgba(46,204,113,0.7)',
            'rgba(155,89,182,0.7)',
            'rgba(230,126,34,0.7)',
            'rgba(241,196,15,0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display:true, text: title + ' 반응 요약' },
          datalabels: {
            anchor:'end', align:'start',
            color:'#fff', font:{ weight:'bold' },
            formatter: v => typeof v === 'number' ? v.toFixed(1) : v
          }
        },
        scales: {
          y: {
            beginAtZero:true,
            ticks: {
              callback: t => {
                if (typeof t === 'number') {
                  return Number.isInteger(t) ? t : t.toFixed(1) + '%';
              }
              return t;
  }
}

          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // 7) 차트 렌더링
  makeChart('engageFemale',   '여성 릴스',   female);
  makeChart('engageMale',     '남성 릴스',   male);
  makeChart('engagementChart','전체 합산',   total);
});