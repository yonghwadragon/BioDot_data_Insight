// charts_ecommerce_v2.js

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('page-loading-message');
  const M = 40;
  const GLOBAL_AVG = 3.93;
  const reviewMap = {};

  function generateRainbowColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.floor((i / count) * 360);
      colors.push(`hsl(${hue}, 85%, 60%)`);
    }
    return colors;
  }

  fetch('data/한동녹용연구소_이커머스데이터__2025-04-25.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const wb = XLSX.read(data, { type:'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['products']);

      // 리뷰 수 맵핑
      rows.forEach(r => reviewMap[r['제품명']] = r['리뷰수'] || 0);

      // 정렬 및 색상 매핑 준비
      const byReview = [...rows].sort((a,b)=>b['리뷰수']-a['리뷰수']);
      const rainbowTargets = [];
      const specialColors = {};
      byReview.forEach(r => {
        const name = r['제품명'];
        if ((r['리뷰수']||0) === 0) specialColors[name] = '#000000';
        else rainbowTargets.push(name);
      });

      const total = rainbowTargets.length;
      const threshold = Math.floor(total * 0.75);
      const rainbowPalette = generateRainbowColors(threshold);
      const graySteps = total - threshold;
      const colorMap = {};
      rainbowTargets.forEach((name,i) => {
        if(i < threshold) colorMap[name] = rainbowPalette[i];
        else {
          const p = (i - threshold) / (graySteps - 1);
          const light = 50 - 50 * p;
          colorMap[name] = `hsl(0,0%,${light}%)`;
        }
      });
      Object.assign(colorMap, specialColors);

      // 리뷰 수 차트
      const ctx1 = document.getElementById('reviewCountChart').getContext('2d');
      new Chart(ctx1, {
        type:'bar',
        data:{ labels: byReview.map(r=>r['제품명']), datasets:[{ label:'리뷰 수', data: byReview.map(r=>r['리뷰수']), backgroundColor: byReview.map(r=>colorMap[r['제품명']]) }] },
        options:{ scales:{ y:{ beginAtZero:true } }, plugins:{ tooltip:{ enabled:true }} },
        plugins:[{
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets[0].data.forEach((val,idx) => {
              if(val === 0) {
                const bar = chart.getDatasetMeta(0).data[idx];
                ctx.save(); ctx.fillStyle='#27ae60'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
                ctx.fillText('✔︎', bar.x, bar.y - 5); ctx.restore();
              }
            });
          }
        }]
      });

      // 평균 평점 차트
      const byRating = [...rows].sort((a,b)=>b['실제 평균 리뷰별점']-a['실제 평균 리뷰별점']);
      const ctx2 = document.getElementById('ratingChart').getContext('2d');
      new Chart(ctx2, {
        type:'bar',
        data:{ labels: byRating.map(r=>r['제품명']), datasets:[{ label:'평균 평점', data: byRating.map(r=>r['실제 평균 리뷰별점']), backgroundColor: byRating.map(r=>colorMap[r['제품명']]) }] },
        options:{ scales:{ y:{ beginAtZero:true, max:5 } } },
        plugins:[{
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets[0].data.forEach((val,idx) => {
              const name = chart.data.labels[idx];
              if(reviewMap[name] === 0) {
                const bar = chart.getDatasetMeta(0).data[idx];
                ctx.save(); ctx.fillStyle='#27ae60'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
                ctx.fillText('✔︎', bar.x, bar.y - 5); ctx.restore();
              }
            });
          }
        }]
      });

      // 보정 평점 차트
      const weightedArr = rows.map(r => { const n=r['리뷰수']||0; return { 제품명:r['제품명'], weighted:(n/(n+M))*r['실제 평균 리뷰별점']+(M/(n+M))*GLOBAL_AVG }; }).sort((a,b)=>b.weighted-a.weighted);
      const ctx3 = document.getElementById('weightedChart').getContext('2d');
      new Chart(ctx3, {
        type:'bar',
        data:{ labels: weightedArr.map(r=>r['제품명']), datasets:[{ label:'보정 평점', data: weightedArr.map(r=>r.weighted.toFixed(2)), backgroundColor: weightedArr.map(r=>colorMap[r['제품명']]) }] },
        options:{ scales:{ y:{ beginAtZero:true, max:5 } } },
        plugins:[{
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets[0].data.forEach((_,idx) => {
              const name = chart.data.labels[idx];
              if(reviewMap[name] === 0) {
                const bar = chart.getDatasetMeta(0).data[idx];
                ctx.save(); ctx.fillStyle='#27ae60'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
                ctx.fillText('✔︎', bar.x, bar.y - 5); ctx.restore();
              }
            });
          }
        }]
      });

      // 리뷰 없음 제품 목록
      const noReviewList = document.getElementById('noReviewList');
      rows.filter(r=> (r['리뷰수']||0)===0).forEach(r=>{
        const li=document.createElement('li');
        const check=document.createElement('span'); check.textContent='✔︎'; check.style.color='#27ae60'; check.style.marginRight='5px';
        li.append(check, document.createTextNode(r['제품명'])); noReviewList.append(li);
      });
    })
    .catch(console.error)
    .finally(()=>{ loading.style.display='none'; });
});