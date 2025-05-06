// js/cluster_presets.js

const CLUSTER_PRESETS = {
    '건강 관심형 MZ': {
      generation: [
        'Z세대 (1997~2006, 19~28세)',
        '밀레니얼세대 (1987~1996, 29~38세)'
      ],
      gender: ['여'],
      '평소 건강기능식품을 얼마나 섭취하시나요?': [
        '주 2-3회',
        '필요할 때만'
      ],
      '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': [
        '비타민',
        '유산균'
      ],
      '녹용 제품을 섭취해본 적이 있나요?': ['먹어본 적 없다']
    },
    '활동적 건강 관심층': {
      generation: [
        'Z세대 (1997~2006, 19~28세)',
        '밀레니얼세대 (1987~1996, 29~38세)'
      ],
      gender: ['남','여'],
      '평소 건강기능식품을 얼마나 섭취하시나요?': ['매일'],
      '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': [
        '단백질 파우더',
        '오메가3',
        '비타민'
      ],
      '인스타그램에서 건강 관련 콘텐츠를 볼 때 주로 어떤 행동을 하나요? (복수 선택 가능)': [
        '좋아요',
        '댓글 작성',
        '저장'
      ]
    },
    '녹용 집중 관심층': {
      generation: [
        'Z세대 (1997~2006, 19~28세)',
        '밀레니얼세대 (1987~1996, 29~38세)'
      ],
      gender: ['남','여'],
      '평소 건강기능식품을 얼마나 섭취하시나요?': [
        '필요할 때만',
        '주 2-3회'
      ],
      '현재 섭취 중인 건강기능식품이 있다면 선택해 주세요. (복수 선택 가능)': [
        '녹용',
        '홍삼'
      ],
      '녹용에 대해 얼마나 알고 있나요?': [
        '보통',
        '알고 있음',
        '매우 알고 있음'
      ],
      '녹용 제품을 섭취해본 적이 있나요?': [
        '지금도 먹고 있다',
        '과거에는 먹었지만, 현재는 먹지 않는다'
      ],
      '만약 MZ세대 맞춤형 녹용 제품이 있다면 어떤 요소가 가장 매력적인가요? (복수 선택 가능)': [
        '합리적인 가격대',
        '맛 개선(부담 없는 맛)',
        '스틱형/젤리형/양갱 등 간편한 섭취 방식'
      ]
    }
  };
  
  function applyClusterPreset(clusterName) {
    const preset = CLUSTER_PRESETS[clusterName];
    if (!preset) return;
  
    // 👉 1) 모든 필터 초기화 (버튼 “초기화” 누른 것과 동일)
    document.querySelectorAll(
      '#generation-filter input, #gender-filter input, #dynamic-filter-panel input'
    ).forEach(cb => cb.checked = false);
  
    // 👉 2) 프리셋 값 적용
    // 2-1) 세대
    document.querySelectorAll('#generation-filter input').forEach(cb => {
      cb.checked = preset.generation.includes(cb.value);
    });
    // 2-2) 성별
    document.querySelectorAll('#gender-filter input').forEach(cb => {
      cb.checked = preset.gender.includes(cb.value);
    });
    // 2-3) 나머지 동적 필터
    Object.entries(preset).forEach(([key, values]) => {
      if (key === 'generation' || key === 'gender') return;
      document.querySelectorAll(`input[name="${key}"]`).forEach(cb => {
        cb.checked = values.includes(cb.value);
      });
    });
  
    // 👉 3) 필터 적용 함수 호출
    applyFilters();
  }
  