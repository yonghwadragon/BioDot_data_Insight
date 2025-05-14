// js/cluster_presets.js

const CLUSTER_PRESETS = {
  '건강 관심형 MZ': {
    generation: [
      'Z세대 (1997~2006, 19~28세)',
      '밀레니얼세대 (1987~1996, 29~38세)'
    ],
    gender: ['여'],
    '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': ['비타민','유산균'],
    '평소 건강기능식품을 얼마나 섭취하시나요?': ['매일','필요할 때만','주 2-3회'],
    cardPreset: true
  },
  '활동적 건강 관심층': {
    generation: [
      'Z세대 (1997~2006, 19~28세)',
      '밀레니얼세대 (1987~1996, 29~38세)'
    ],
    gender: ['남','여'],
    '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': ['비타민','오메가3','단백질 파우더'],
    '인스타그램에서 건강 관련 콘텐츠를 볼 때 주로 어떤 행동을 하나요? (복수 선택 가능)': ['좋아요','댓글 작성','저장'],
    cardPreset: true
  },
  '녹용 집중 관심층': {
    generation: [
      'Z세대 (1997~2006, 19~28세)',
      '밀레니얼세대 (1987~1996, 29~38세)'
    ],
    gender: ['남','여'],
    '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': ['홍삼','녹용'],
    '만약 MZ세대 맞춤형 녹용 제품이 있다면 어떤 요소가 가장 매력적인가요? (복수 선택 가능)': ['스틱형/젤리형/양갱 등 간편한 섭취 방식','합리적인 가격대','맛 개선(부담 없는 맛)'],
    cardPreset: true
  }
};

/**
 * 클러스터 버튼 클릭 시 해당 필터 자동 적용
 */
function applyClusterPreset(clusterName) {
  const preset = CLUSTER_PRESETS[clusterName];
  if (!preset) return;

  // 1) 필터 초기화
  document.querySelectorAll('#generation-filter input, #gender-filter input, #dynamic-filter-panel input')
    .forEach(cb => cb.checked = false);

  // 2) 세대/성별 설정
  document.querySelectorAll('#generation-filter input')
    .forEach(cb => cb.checked = preset.generation.includes(cb.value));
  document.querySelectorAll('#gender-filter input')
    .forEach(cb => cb.checked = preset.gender.includes(cb.value));

  // 3) 기타 필터 설정
  Object.entries(preset).forEach(([key, values]) => {
    if (['generation','gender','cardPreset'].includes(key)) return;
    document.querySelectorAll(`input[name="${key}"]`)
      .forEach(cb => cb.checked = values.includes(cb.value));
  });

  // 4) 필터·차트·카드 동시 갱신
  applyFilters();
}

// 버튼 이벤트 바인딩
['건강 관심형 MZ','활동적 건강 관심층','녹용 집중 관심층'].forEach(name => {
  const btn = document.querySelector(`button[data-cluster="${name}"]`);
  if (btn) btn.addEventListener('click', () => applyClusterPreset(name));
});
