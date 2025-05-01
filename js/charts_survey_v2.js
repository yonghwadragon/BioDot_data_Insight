// js/charts_survey_v2.js
// survey.html 전용 차트 로직 모듈 (v2025.05.02 – 전체 차트 렌더링 및 파일 경로 인코딩 처리)

// 응답 데이터 집계 함수
function countValues(rows, column, isMulti = false) {
  const counts = {};
  rows.forEach(row => {
    const cell = String(row[column] || '').trim();
    const items = isMulti ? cell.split(',').map(v => v.trim()) : [cell];
    items.forEach(v => {
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
  });
  return counts;
}

// 파이 차트 렌더링 (퍼센트 표시)
function renderPieWithPercent(id, counts, title = '') {
  const labels = Object.keys(counts);
  const data   = Object.values(counts);
  const total  = data.reduce((a, b) => a + b, 0);

  new Chart(document.getElementById(id).getContext('2d'), {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: defaultColors }] },
    options: {
      ...defaultOptions,
      plugins: {
        ...defaultOptions.plugins,
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label(ctx) {
              const val = ctx.parsed;
              const pct = ((val / total) * 100).toFixed(1) + '%';
              return `${ctx.label}: ${val} (${pct})`;
            }
          }
        }
      }
    }
  });
}

// 수평 바 차트 렌더링
function renderHorizontalBar(id, counts, title = '') {
  const entries = Object.entries(counts)
    .filter(([k,v]) => k && v)
    .sort((a,b) => b[1] - a[1]);
  const labels = entries.map(e => e[0]);
  const data   = entries.map(e => e[1]);

  new Chart(document.getElementById(id).getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: title, data, backgroundColor: defaultColors, borderColor: defaultColors.map(c => c.replace('0.8','1')), borderWidth: 1 }] },
    options: { ...defaultOptions, indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });
}

// 리스트 항목 랜덤 추출 및 렌더링
function renderTextList(targetId, items, count = 5) {
  const ul = document.getElementById(targetId);
  ul.innerHTML = '';
  items
    .filter(Boolean)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .forEach(txt => {
      const li = document.createElement('li');
      li.textContent = txt;
      ul.appendChild(li);
    });
}

// 객체 키/값 배열 분리
function splitCounts(obj) {
  return [Object.keys(obj), Object.values(obj)];
}

// DOM 로드 후 대시보드 렌더링
document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('page-loading-message');
  try {
    // 1) 엑셀 파일 경로 및 인코딩 처리
    const fileName = 'survey_responses.xlsx';
    const fileUrl  = encodeURI(`data/${fileName}`);

    // 2) 엑셀 불러오기
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type:'array', raw:true });
    let rows   = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

    // 컬럼명 트리밍
    rows = rows.map(r => {
      const nr = {};
      Object.keys(r).forEach(k => nr[k.trim()] = r[k]);
      return nr;
    });

    const currentYear = new Date().getFullYear();

    // 연령대 분포
    const ageGroups = { '10대':0, '20대':0, '30대':0, '40대':0, '50대 이상':0 };
    rows.forEach(r => {
      const b = parseInt(r['출생년도']);
      if (!isNaN(b)) {
        const age = currentYear - b;
        if (age < 20)       ageGroups['10대']++;
        else if (age < 30)  ageGroups['20대']++;
        else if (age < 40)  ageGroups['30대']++;
        else if (age < 50)  ageGroups['40대']++;
        else                ageGroups['50대 이상']++;
      }
    });
    createBarChart('ageChart', Object.keys(ageGroups), Object.values(ageGroups), '연령대 분포');

    // 성별 분포
    renderPieWithPercent('genderChart', countValues(rows, '성별'), '성별 분포');

    // 직업 분포
    createBarChart('jobChart', ...splitCounts(countValues(rows, '직업')), '직업 분포');

    // 건강기능식품 섭취 차트 (column name 정확히 일치)
    renderHorizontalBar(
      'supplementChart',
      countValues(rows, '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)', true),
      '기능식품 섭취 항목'
    );
    renderPieWithPercent(
      'frequencyChart',
      countValues(rows, '평소 건강기능식품을 얼마나 섭취하시나요?'),
      '섭취 빈도'
    );
    createBarChart(
      'reasonChart',
      ...splitCounts(countValues(rows, '현재 섭취 중인 건강기능식품이 있다면 왜 섭취하시나요?')),
      '섭취 이유'
    );
    createBarChart(
      'criteriaChart',
      ...splitCounts(countValues(rows, '건강기능식품을 선택할 때 가장 중요하게 생각하는 기준은 무엇인가요?')),
      '선택 기준'
    );
    createBarChart(
      'purchaseChart',
      ...splitCounts(countValues(rows, '건강기능식품을 온라인에서 주로 어디서 구매하시나요?')),
      '구매처'
    );

    // 추천 경로 & 릴스 스타일
    createBarChart(
      'recommendationChart',
      ...splitCounts(countValues(rows, '건강기능식품 추천을 주로 어디서 받나요?')),
      '추천 경로'
    );
    createBarChart(
      'reelsStyleChart',
      ...splitCounts(countValues(rows, '인스타그램 릴스/숏폼 콘텐츠에서 어떤 스타일을 선호하시나요?')),
      '릴스 스타일'
    );

    // 녹용 인지도 · 경험
    createBarChart(
      'deerKnowledgeChart',
      ...splitCounts(countValues(rows, '녹용에 대해 얼마나 알고 있나요?')),
      '녹용 인지도'
    );
    createBarChart(
      'deerExperienceChart',
      ...splitCounts(countValues(rows, '녹용 제품을 섭취해본 적이 있나요?')),
      '녹용 경험'
    );

    // 복수 응답 항목 차트 일괄 생성
    [
      ['deerImageChart',   '녹용에 대해 떠오르는 이미지는 무엇인가요 (복수 선택 가능)'],
      ['deerBarrierChart', '녹용 제품 구매를 망설이게 하는 이유가 있다면 무엇인가요? (복수 선택 가능)'],
      ['deerAppealChart',  '만약 MZ세대 맞춤형 녹용 제품이 있다면 어떤 요소가 가장 매력적인가요? (복수 선택 가능)'],
      ['instagramActionChart', '인스타그램에서 건강 관련 콘텐츠를 볼 때 주로 어떤 행동을 하나요? (복수 선택 가능)'],
      ['reelsInterestChart',   '건강기능식품 관련 릴스를 보면 어떤 경우에 제품에 대한 호감이 생기나요? (복수 선택 가능)'],
      ['keywordChart',         '건강기능식품 관련 릴스를 볼 때 기억에 남았던 키워드는 무엇인가요? (복수 선택 가능)']
    ].forEach(([id, col]) => {
      createBarChart(id, ...splitCounts(countValues(rows, col, true)), col);
    });

    // 주관식 랜덤 추출
    renderTextList(
      'deerStopReasons',
      rows
        .map(r => r["(선택) '과거에는 먹었지만, 현재는 먹지 않는다'를 택하신 분들은, 왜 현재는 드시지 않나요?"])
        .filter(Boolean)
    );
    renderTextList(
      'friendlyStrategies',
      rows
        .map(r => r['녹용 제품이 MZ세대에게 더 친숙해지기 위해 가장 필요한 점은 무엇이라고 생각하시나요?'])
        .filter(Boolean)
    );
  } catch (e) {
    console.error('설문 데이터 처리 오류:', e);
    loader.innerHTML = '<h2>데이터를 불러올 수 없습니다.</h2>';
  } finally {
    loader.style.display = 'none';
  }
});
