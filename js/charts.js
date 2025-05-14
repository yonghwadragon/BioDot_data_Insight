// ✅ 개선된 charts.js (v2025.05.02)
// ※ survey.html 에서는 로드하지 않습니다.

const defaultColors = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(199, 199, 199, 0.8)'
];

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: "'Noto Sans KR', 'Roboto', sans-serif", size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      titleFont: { family: "'Noto Sans KR', 'Roboto', sans-serif", size: 14 },
      bodyFont:  { family: "'Noto Sans KR', 'Roboto', sans-serif", size: 13 },
      padding: 10
    }
  },
  layout: { padding: 10 }
};

function createBarChart(elementId, labels, data, title = '') {
  const ctx = document.getElementById(elementId).getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: title, data,
      backgroundColor: defaultColors,
      borderColor: defaultColors.map(c => c.replace('0.8','1')),
      borderWidth: 1 }] },
    options: {
      ...defaultOptions,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function createPieChart(elementId, labels, data, title = '') {
  const ctx = document.getElementById(elementId).getContext('2d');
  return new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ label: title, data,
      backgroundColor: defaultColors,
      borderColor: defaultColors.map(c => c.replace('0.8','1')),
      borderWidth: 1 }] },
    options: defaultOptions
  });
}

function createLineChart(elementId, labels, datasets, title = '') {
  const ctx = document.getElementById(elementId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds,i)=>({
        label: ds.label||'', data: ds.data,
        borderColor: ds.borderColor||defaultColors[i%defaultColors.length],
        backgroundColor: 'transparent',
        tension:0.2, borderWidth:2
      }))
    },
    options: {
      ...defaultOptions,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function createKeywordCharts(posId, negId, keywords) {
  createBarChart(posId, keywords.positive.map(k=>k.word), keywords.positive.map(k=>k.count), '긍정 키워드 빈도');
  createBarChart(negId, keywords.negative.map(k=>k.word), keywords.negative.map(k=>k.count), '부정 키워드 빈도');
}
