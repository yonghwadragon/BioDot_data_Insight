// js/charts_survey_v2.js
// v2025.05.12 – 성별 필터 + 성별 차트 전용 색상 처리

let originalRows = [];
let chartInstances = [];
let selectedGenders = [];  // 전역에 성별 필터 상태 저장

// --- 1) 유틸 함수 --------------------------------------------------------------

// 기존 차트 인스턴스 제거
function clearCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
}

// 문자열→년도 파싱 ('1986 이상', '2007 이하' 등 처리)
function parseBirthYear(raw) {
  if (typeof raw === 'number') return raw;
  if (!raw) return NaN;
  const s = String(raw).trim();
  if (s.includes('이상')) return 1986;
  if (s.includes('이하')) return 2007;
  const n = parseInt(s, 10);
  return isNaN(n) ? NaN : n;
}

// 단일/복수 응답값 카운트
function countValues(rows, col, isMulti = false) {
  const cnt = {};
  rows.forEach(r => {
    const v = String(r[col] || '').trim();
    const items = isMulti ? v.split(',').map(x => x.trim()) : [v];
    items.forEach(x => { if (x) cnt[x] = (cnt[x] || 0) + 1; });
  });
  return cnt;
}

// 객체→[keys, values]
function splitCounts(obj, sort = false) {
  const entries = Object.entries(obj);
  if (sort) entries.sort((a, b) => b[1] - a[1]); // 값 기준 내림차순 정렬
  return [entries.map(e => e[0]), entries.map(e => e[1])];
}

// 랜덤 텍스트 리스트 렌더
function renderTextList(id, items, n = 5) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  items
    .filter(Boolean)
    .sort(() => Math.random() - 0.5)
    .slice(0, n)
    .forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
}

// --- 2) 차트 헬퍼 -------------------------------------------------------------

// 파이 차트 (% 포함) + 성별 차트 전용 색상 처리
function renderPieWithPercent(id, counts, title = '') {
  const ctx = document.getElementById(id).getContext('2d');
  const labels = Object.keys(counts), data = Object.values(counts);
  const total = data.reduce((a, b) => a + b, 0);

  // 기본 팔레트
  let colors = defaultColors;
  // 성별 차트 단독 선택 시 전용 색상
  if (id === 'genderChart' && selectedGenders.length === 1) {
    colors = selectedGenders[0] === '여'
      ? ['rgba(255, 99, 132, 0.8)']  // 여성만: 핑크
      : ['rgba(54, 162, 235, 0.8)']; // 남성만: 블루
  }

  const chart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      ...defaultOptions,
      plugins: {
        ...defaultOptions.plugins,
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label(ctx) {
              const v = ctx.parsed, p = ((v / total) * 100).toFixed(1) + '%';
              return `${ctx.label}: ${v} (${p})`;
            }
          }
        }
      }
    }
  });
  return chart;
}

// 수평 바 차트
function renderHorizontalBar(id, counts, title = '') {
  const ctx = document.getElementById(id).getContext('2d');
  const entries = Object.entries(counts)
    .filter(([k, v]) => k && v)
    .sort((a, b) => b[1] - a[1]);
  const labels = entries.map(e => e[0]), data = entries.map(e => e[1]);
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: defaultColors,
        borderColor: defaultColors.map(c => c.replace('0.8','1')),
        borderWidth: 1
      }]
    },
    options: {
      ...defaultOptions,
      indexAxis: 'y',
      scales: { x: { beginAtZero: true } }
    }
  });
  return chart;
}

// --- 3) 필터 그룹 정의 ------------------------------------------------------

const GROUPS = {
  직업: ['학생','취준생','사무직','전문직','프리랜서','자영업','무직','기타'],
  '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': ['비타민','홍삼','녹용','유산균','오메가3','단백질 파우더','없음','기타'],
  '현재 섭취 중인 건강기능식품이 있다면 왜 섭취하시나요?': ['면역력 증진','피로 회복','체력 강화','혈액 순환','다이어트/체중 관리','SNS 광고 시청','주변 지인이나 인플루언서 추천','질병 예방 목적','기타'],
  '건강기능식품을 선택할 때 가장 중요하게 생각하는 기준은 무엇인가요?': ['효능/효과','가격','맛과 섭취의 편리함','브랜드 신뢰도','성분/원산지','디자인/패키지','지인 추천','SNS/유튜브 후기','기타'],
  '건강기능식품을 온라인에서 주로 어디서 구매하시나요?': ['브랜드 공식몰','네이버 스마트스토어','소셜커머스(쿠팡 등)','오픈마켓(G마켓, 옥션 등)','카카오톡 선물하기','기타'],
  '녹용에 대해 떠오르는 이미지는 무엇인가요 (복수 선택 가능)': ['면역력에 좋다','비싸다','부모님/어르신용이다','효과가 좋다','맛이 부담스럽다','고급 건강식품이다','전통적이다','떠오르는 이미지가 없다','기타'],
  '녹용 제품 구매를 망설이게 하는 이유가 있다면 무엇인가요? (복수 선택 가능)': ['맛/향에 대한 거부감','가격 부담','효능에 대한 의심','젊은 세대와 어울리지 않는 이미지','복용 방법이 번거로움','정보 부족','기타'],
  '만약 MZ세대 맞춤형 녹용 제품이 있다면 어떤 요소가 가장 매력적인가요? (복수 선택 가능)': ['스틱형/젤리형/양갱 등 간편한 섭취 방식','트렌디한 디자인과 패키지','합리적인 가격대','과학적 효능 인증 & 원산지 투명성','유명 인플루언서/SNS 바이럴','맛 개선(부담 없는 맛)','기타'],
  '건강기능식품 추천을 주로 어디서 받나요?': ['인스타그램','유튜브','블로그/카페','지인 추천','쇼핑몰 리뷰','기타'],
  '인스타그램 릴스/숏폼 콘텐츠에서 어떤 스타일을 선호하시나요?': ['정보형 (효능, 성분 설명 등)','리뷰형 (실제 후기, 체험담)','트렌디한 밈/유머 형식','비주얼 중심 (디자인, 감성)','챌린지/참여형 콘텐츠','기타'],
  '인스타그램에서 건강 관련 콘텐츠를 볼 때 주로 어떤 행동을 하나요? (복수 선택 가능)': ['좋아요','댓글 작성','저장','공유','팔로우','단순 시청(아무 액션 X)','기타'],
  '건강기능식품 관련 릴스를 보면 어떤 경우에 제품에 대한 호감이 생기나요? (복수 선택 가능)': ['제품 효능이 눈에 띄게 전달될 때','재미있고 트렌디할 때','실제 사용자가 등장할 때','감각적인 비주얼/디자인일 때','신뢰할 만한 정보가 포함될 때','이벤트/할인 정보가 있을 때','신뢰할 수 있고, 사회적 책임을 다하는 브랜드라고 느껴질 때','기타'],
  '건강기능식품 관련 릴스를 볼 때 기억에 남았던 키워드는 무엇인가요? (복수 선택 가능)': ['건강 루틴','효능 (면역력, 체력 회복, 혈액 순환 등)','고객 후기','천연 재료','간편함','이벤트/특가','기타']
};

// --- 3-1) 동적 필터 UI 생성 ----------------------------------------------------

function generateDynamicFilterUI() {
  const container = document.getElementById('dynamic-filter-panel');
  Object.entries(GROUPS).forEach(([key, opts]) => {
    const box = document.createElement('div');
    box.style.minWidth = '200px';
    box.style.marginRight = '20px';

    const title = document.createElement('h4');
    title.textContent = key;
    box.appendChild(title);

    const inputs = [];
    // 전체/해제 버튼
    const btnWrap = document.createElement('div');
    btnWrap.style.marginBottom = '8px';
    const btnAll = document.createElement('button');
    btnAll.textContent = '전체';
    btnAll.style.marginRight = '6px';
    btnAll.addEventListener('click', () => {
      inputs.forEach(cb => cb.checked = true);
      applyFilters();
    });
    const btnNone = document.createElement('button');
    btnNone.textContent = '해제';
    btnNone.addEventListener('click', () => {
      inputs.forEach(cb => cb.checked = false);
      applyFilters();
    });
    btnWrap.appendChild(btnAll);
    btnWrap.appendChild(btnNone);
    box.appendChild(btnWrap);

    // 옵션 체크박스
    opts.forEach(opt => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginBottom = '4px';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.name = key;
      cb.value = opt;
      inputs.push(cb);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + opt));
      box.appendChild(label);
    });

    container.appendChild(box);
  });
}

// --- 4) UI 토글 & 초기화 --------------------------------------------------------

function initUI() {
  // 고급 필터 토글
  const advPanel = document.getElementById('dynamic-filter-panel');
  const advToggle = document.createElement('button');
  advToggle.textContent = '고급 필터 ▶';
  advToggle.style.display = 'block';
  advToggle.style.marginBottom = '10px';
  advToggle.addEventListener('click', () => {
    const show = advPanel.style.display === 'block';
    advPanel.style.display = show ? 'none' : 'block';
    advToggle.textContent = show ? '고급 필터 ▶' : '고급 필터 ◀';
  });
  advPanel.parentNode.insertBefore(advToggle, advPanel);
  advPanel.style.display = 'none';

  // 리셋 버튼
  const summary = document.getElementById('filter-summary');
  const btnReset = document.createElement('button');
  btnReset.textContent = '초기화';
  btnReset.style.marginLeft = '10px';
  btnReset.addEventListener('click', () => {
    document.querySelectorAll(
      '#generation-filter input, #gender-filter input, #dynamic-filter-panel input'
    ).forEach(cb => cb.checked = false);
    applyFilters();
  });
  summary.parentNode.insertBefore(btnReset, summary.nextSibling);
}

// --- 5) 필터 적용 --------------------------------------------------------------

function applyFilters() {
  // 세대 필터
  const gens = Array.from(document.querySelectorAll('#generation-filter input:checked'))
                    .map(i => i.value);

  // 성별 필터
  selectedGenders = Array.from(document.querySelectorAll('#gender-filter input:checked'))
                          .map(i => i.value);

  // 동적 필터 선택값
  const dynSel = {};
  Object.keys(GROUPS).forEach(key => {
    dynSel[key] = Array.from(
      document.querySelectorAll(`input[name="${key}"]:checked`)
    ).map(cb => cb.value);
  });

  const filtered = originalRows.filter(r => {
    // 세대
    const y = parseBirthYear(r['출생년도']);
    let g = '';
    if (!isNaN(y)) {
      if (y <= 1986)       g = '중장년층 (1986이상, 39세 이상)';
      else if (y <= 1996)  g = '밀레니얼세대 (1987~1996, 29~38세)';
      else if (y <= 2006)  g = 'Z세대 (1997~2006, 19~28세)';
      else                  g = '청소년 이하 (2007이하, 18세 이하)';
    }
    if (gens.length && !gens.includes(g)) return false;

    // 성별
    const sex = String(r['성별'] || '').trim();
    if (selectedGenders.length && !selectedGenders.includes(sex)) return false;

    // 동적 그룹
    for (const [key, opts] of Object.entries(GROUPS)) {
      const raw = String(r[key] || '');
      const items = raw.split(',').map(x => x.trim()).filter(x => x);
      const mapped = items.map(i => opts.includes(i) ? i : '기타');
      if (dynSel[key].length && !mapped.some(m => dynSel[key].includes(m))) {
        return false;
      }
    }
    return true;
  });

  updateSummary(filtered);
  renderAllCharts(filtered);
}

// --- 6) 요약 업데이트 ----------------------------------------------------------

function updateSummary(rows) {
  document.getElementById('response-count').textContent = `(응답 수: ${rows.length}명)`;
  const parts = [];

  const gens = Array.from(document.querySelectorAll('#generation-filter input:checked'))
                    .map(i => i.value);
  if (gens.length) parts.push(`세대: ${gens.join(',')}`);

  if (selectedGenders.length) {
    parts.push(`성별: ${selectedGenders.join(',')}`);
  }

  Object.keys(GROUPS).forEach(key => {
    const sel = Array.from(document.querySelectorAll(`input[name="${key}"]:checked`))
                     .map(cb => cb.value);
    if (sel.length) parts.push(`${key}: ${sel.join(',')}`);
  });

  document.getElementById('filter-summary').textContent =
    parts.length ? parts.join(' | ') : '선택 조건: 전체';

  document.querySelectorAll('.chart-container').forEach(c => {
    c.classList.toggle('dimmed', rows.length === 0);
    c.classList.toggle('highlighted', rows.length > 0);
  });
}

// --- 7) 차트 렌더링 ------------------------------------------------------------

function renderAllCharts(rows) {
  clearCharts();

  // 세대 분포
  const genCnt = rows.reduce((a, r) => {
    const y = parseBirthYear(r['출생년도']);
    let key = '';
    if (!isNaN(y)) {
      if (y <= 1986)      key = '중장년층 (1986이상, 39세 이상)';
      else if (y <= 1996) key = '밀레니얼세대 (1987~1996, 29~38세)';
      else if (y <= 2006) key = 'Z세대 (1997~2006, 19~28세)';
      else                 key = '청소년 이하 (2007이하, 18세 이하)';
      a[key] = (a[key] || 0) + 1;
    }
    return a;
  }, {});
  const genLabels = [
    '청소년 이하 (2007이하, 18세 이하)',
    'Z세대 (1997~2006, 19~28세)',
    '밀레니얼세대 (1987~1996, 29~38세)',
    '중장년층 (1986이상, 39세 이상)'
  ];
  chartInstances.push(
    createBarChart('ageChart', genLabels, genLabels.map(l => genCnt[l] || 0), '세대 분포')
  );
  
  chartInstances.push(renderPieWithPercent('genderChart', countValues(rows, '성별'), '성별 분포'));
  chartInstances.push(createBarChart('jobChart', ...splitCounts(countValues(rows, '직업'), true), '직업 분포'));
  chartInstances.push(renderHorizontalBar('supplementChart', countValues(rows, '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)', true), '기능식품 섭취'));
  chartInstances.push(renderPieWithPercent('frequencyChart', countValues(rows, '평소 건강기능식품을 얼마나 섭취하시나요?'), '섭취 빈도'));
  chartInstances.push(renderHorizontalBar('reasonChart', countValues(rows, '현재 섭취 중인 건강기능식품이 있다면 왜 섭취하시나요?'), '섭취 이유'));
  chartInstances.push(renderHorizontalBar('criteriaChart', countValues(rows, '건강기능식품을 선택할 때 가장 중요하게 생각하는 기준은 무엇인가요?'), '선택 기준'));
  chartInstances.push(renderHorizontalBar('purchaseChart', countValues(rows, '건강기능식품을 온라인에서 주로 어디서 구매하시나요?'), '구매처'));
  chartInstances.push(renderHorizontalBar('recommendationChart', countValues(rows, '건강기능식품 추천을 주로 어디서 받나요?'), '추천 경로'));
  chartInstances.push(renderHorizontalBar('reelsStyleChart', countValues(rows, '인스타그램 릴스/숏폼 콘텐츠에서 어떤 스타일을 선호하시나요?'), '릴스 스타일'));
  
  chartInstances.push(createBarChart(
    'deerKnowledgeChart',
    ['완전 모름', '모름', '보통', '알고 있음', '매우 알고 있음'],  
    splitCounts(countValues(rows, '녹용에 대해 얼마나 알고 있나요?'))[1],
    '녹용 인지도'
  ));
  chartInstances.push(createBarChart(
    'deerExperienceChart',
    ['과거에는 먹었지만, 현재는 먹지 않는다', '먹어본 적 없다', '지금도 먹고 있다'],
    splitCounts(countValues(rows, '녹용 제품을 섭취해본 적이 있나요?'))[1],
    '녹용 경험'
  ));

  // 복수 응답 차트 (전부 정렬 + 수평 그래프)
  [
    ['deerImageChart','녹용에 대해 떠오르는 이미지는 무엇인가요 (복수 선택 가능)'],
    ['deerBarrierChart','녹용 제품 구매를 망설이게 하는 이유가 있다면 무엇인가요? (복수 선택 가능)'],
    ['deerAppealChart','만약 MZ세대 맞춤형 녹용 제품이 있다면 어떤 요소가 가장 매력적인가요? (복수 선택 가능)'],
    ['instagramActionChart','인스타그램에서 건강 관련 콘텐츠를 볼 때 주로 어떤 행동을 하나요? (복수 선택 가능)'],
    ['reelsInterestChart','건강기능식품 관련 릴스를 보면 어떤 경우에 제품에 대한 호감이 생기나요? (복수 선택 가능)'],
    ['keywordChart','건강기능식품 관련 릴스를 볼 때 기억에 남았던 키워드는 무엇인가요? (복수 선택 가능)']
  ].forEach(([id, key]) => {
    const multi = key.includes('(복수');
    const ct = countValues(rows, key, multi);
    chartInstances.push(renderHorizontalBar(id, ct, key));
  });


  // 주관식 리스트
  renderTextList('deerStopReasons', rows.map(r => r["(선택) '과거에는 먹었지만, 현재는 먹지 않는다'를 택하신 분들은, 왜 현재는 드시지 않나요?"]).filter(Boolean));
  renderTextList('friendlyStrategies', rows.map(r => r['녹용 제품이 MZ세대에게 더 친숙해지기 위해 가장 필요한 점은 무엇이라고 생각하시나요?']).filter(Boolean));
}

// --- 8) 초기 로드 & 바인딩 ------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/survey_responses.xlsx');
    const ab  = await res.arrayBuffer();
    const wb  = XLSX.read(ab, { type: 'array', raw: true });
    originalRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
                      .map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k.trim(), v])));

    generateDynamicFilterUI();
    initUI();

    // 세대·성별·고급 필터 모두 변경 시
    document.querySelectorAll(
      '#generation-filter input, #gender-filter input, #dynamic-filter-panel input'
    ).forEach(cb => cb.addEventListener('change', applyFilters));

    applyFilters();
  } catch (e) {
    console.error('설문 데이터 처리 오류:', e);
    document.getElementById('page-loading-message').innerHTML = '<h2>데이터 로드 실패</h2>';
  } finally {
    document.getElementById('page-loading-message').style.display = 'none';
  }
});
