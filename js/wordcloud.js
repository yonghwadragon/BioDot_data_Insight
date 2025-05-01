// ✅ 개선된 wordcloud.js (Out of memory 방지 및 성능 최적화)
const cloudOptions = {
  fontFamily: 'Noto Sans KR, Roboto, sans-serif',
  fontWeight: 'normal',
  backgroundColor: 'transparent',
  minSize: 2,
  weightFactor: function (size) {
    return Math.pow(size* 3, 1.5) * 0.05; // ↓ 줄여서 부하 감소
  },
  rotateRatio: 0.5,
  rotationSteps: 2,
  drawOutOfBound: false,
  shrinkToFit: false // ↓ false로 설정하여 캔버스 압축 안 함
};

function getWordColor(sentiment) {
  const colors = {
    positive: ['#2ecc71', '#27ae60', '#1abc9c', '#16a085', '#3498db'],
    negative: ['#e74c3c', '#c0392b', '#d35400', '#e67e22', '#f39c12'],
    neutral: ['#95a5a6', '#7f8c8d', '#34495e', '#2c3e50', '#bdc3c7']
  };
  const palette = colors[sentiment] || colors.neutral;
  return palette[Math.floor(Math.random() * palette.length)];
}

function initWordCloud(canvasId, wordList) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!wordList || wordList.length === 0) {
    ctx.font = '18px Noto Sans KR';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('워드 데이터가 충분하지 않습니다.', canvas.width / 2, canvas.height / 2);
    return;
  }

  const coloredWordList = wordList.map(w => [w.text, w.weight, getWordColor(w.sentiment || 'neutral')]);

  try {
    WordCloud(canvas, {
      ...cloudOptions,
      list: coloredWordList,
      color: (word, weight, fontSize, distance, theta, extraData) => extraData || '#666',
      hover: item => {
        if (item) {
          const wordInfo = wordList.find(w => w.text === item[0]);
          showWordTooltip(canvas, item[0], item[1], wordInfo);
        }
      },
      click: item => {
        if (item) {
          const wordInfo = wordList.find(w => w.text === item[0]);
          showWordDetails(wordInfo);
        }
      }
    });
  } catch (e) {
    console.error('워드클라우드 렌더링 실패:', e);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('워드클라우드 생성 중 오류가 발생했습니다.', canvas.width / 2, canvas.height / 2);
  }
}

function showWordTooltip(canvas, word, weight, info) {
  let tooltip = document.getElementById('word-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'word-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);
  }
  tooltip.innerHTML = `<strong>${word}</strong><br>빈도: ${weight}`;
  const rect = canvas.getBoundingClientRect();
  tooltip.style.left = (rect.left + window.scrollX + 20) + 'px';
  tooltip.style.top = (rect.top + window.scrollY + 20) + 'px';
  tooltip.style.display = 'block';
  canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}

function showWordDetails(wordInfo) {
  console.log('단어 상세 정보:', wordInfo);
}
