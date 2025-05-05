document.addEventListener('DOMContentLoaded', function () {
    const loader = document.getElementById('page-loading-message');
    const delay = new Promise(res => setTimeout(res, 1000));
    const load = loadExcelData();
    Promise.all([delay, load]).finally(() => {
      loader.style.display = 'none';
    });
  });

  function loadExcelData() {
    return new Promise((resolve) => {
      const url = 'data/한동녹용연구소_이커머스데이터__2025-04-25.xlsx';
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => {
          const wb = XLSX.read(data, { type: 'array' });
          const pos = wb.Sheets['긍정단어_빈도'];
          const neg = wb.Sheets['부정단어_빈도'];
          const reviews = wb.Sheets['reviews'];

          if (pos && neg) {
            const posData = XLSX.utils.sheet_to_json(pos);
            const negData = XLSX.utils.sheet_to_json(neg);

            const positiveKeywords = posData.filter(r => r['등장횟수'] > 1).map(row => ({
              word: row['긍정단어'],
              count: row['등장횟수'] || 1
            })).slice(0, 150);

            const negativeKeywords = negData.filter(r => r['등장횟수'] > 1).map(row => ({
              word: row['부정단어'],
              count: row['등장횟수'] || 1
            })).slice(0, 150);

            const wordcloudData = [
              ...positiveKeywords.map(w => ({ text: w.word, weight: w.count, sentiment: 'positive' })),
              ...negativeKeywords.map(w => ({ text: w.word, weight: w.count, sentiment: 'negative' }))
            ];

            createKeywordCharts('positiveChart', 'negativeChart', {
              positive: positiveKeywords,
              negative: negativeKeywords
            });
            initWordCloud('wordcloudCanvas', wordcloudData);

            document.getElementById('totalReviews').textContent = reviews ? XLSX.utils.sheet_to_json(reviews).length : '-';
            document.getElementById('positiveRatio').textContent = '65%';
            document.getElementById('negativeRatio').textContent = '15%';
            document.getElementById('neutralRatio').textContent = '20%';
            document.getElementById('mainKeywords').textContent = positiveKeywords.slice(0, 3).map(k => k.word).join(', ');
            resolve();
          } else {
            useDummyData();
            resolve();
          }
        })
        .catch(error => {
          console.error('엑셀 로드 오류:', error);
          useDummyData();
          resolve();
        });
    });
  }
