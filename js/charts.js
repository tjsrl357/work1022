/**
 * Chart.js 기반 인포그래픽 시각화 모듈
 */
const DashboardCharts = (function () {
  let categoryShareChart = null;
  let categoryCompareChart = null;
  let topProjectsChart = null;

  // 세련된 색상 팔레트
  const PALETTE = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316', // orange
    '#64748b'  // slate
  ];

  /**
   * 분야별 집계 데이터 생성
   */
  function aggregateByCategory(items) {
    const map = {};
    items.forEach(item => {
      const cat = item.category || '기타';
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          prevTotal: 0,
          currTotal: 0,
          diffTotal: 0,
          count: 0,
          newCount: 0
        };
      }
      map[cat].prevTotal += item.prevAmount;
      map[cat].currTotal += item.currAmount;
      map[cat].diffTotal += item.diffAmount;
      map[cat].count += 1;
      if (item.isNew) map[cat].newCount += 1;
    });
    return Object.values(map);
  }

  /**
   * 1. 분야별 예산 점유율 (도넛 차트)
   */
  function renderCategoryShareChart(canvasId, categories) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (categoryShareChart) {
      categoryShareChart.destroy();
    }

    const labels = categories.map(c => c.name);
    const dataValues = categories.map(c => c.currTotal);
    const totalAmount = dataValues.reduce((a, b) => a + b, 0);

    categoryShareChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: PALETTE.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { family: 'Pretendard, system-ui, sans-serif', size: 12 },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const val = data.datasets[0].data[i];
                    const pct = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
                    return {
                      text: `${label} (${pct}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw;
                const pct = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString()}억원 (${pct}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  /**
   * 2. 분야별 전년 vs 정부안 비교 막대 차트
   */
  function renderCategoryCompareChart(canvasId, categories) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (categoryCompareChart) {
      categoryCompareChart.destroy();
    }

    const labels = categories.map(c => {
      // 분야명이 너무 길면 축약
      return c.name.length > 14 ? c.name.substring(0, 13) + '…' : c.name;
    });

    categoryCompareChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '기준년도(A)',
            data: categories.map(c => c.prevTotal),
            backgroundColor: '#94a3b8',
            borderRadius: 6
          },
          {
            label: '2027년 정부안(B)',
            data: categories.map(c => c.currTotal),
            backgroundColor: '#2563eb',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Pretendard, system-ui', size: 11 },
              maxRotation: 25,
              minRotation: 0
            }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: function (val) {
                return val.toLocaleString() + '억';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'Pretendard, system-ui', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} 억원`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * 3. 신규사업 / 핵심 증액 사업 랭킹 차트 (가로 바 차트)
   */
  function renderTopProjectsChart(canvasId, items, mode = 'diff') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (topProjectsChart) {
      topProjectsChart.destroy();
    }

    // 증감액 또는 증가율 기준 상위 6개 선정
    let sorted = [...items];
    if (mode === 'diff') {
      sorted.sort((a, b) => b.diffAmount - a.diffAmount);
    } else {
      sorted.sort((a, b) => b.diffRate - a.diffRate);
    }
    const topItems = sorted.slice(0, 6);

    const labels = topItems.map(item => {
      const prefix = item.isNew ? '[신규] ' : '';
      const name = prefix + item.title;
      return name.length > 16 ? name.substring(0, 15) + '…' : name;
    });

    const dataValues = topItems.map(item => mode === 'diff' ? item.diffAmount : item.diffRate);

    topProjectsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: mode === 'diff' ? '증감액 (억원)' : '증가율 (%)',
          data: dataValues,
          backgroundColor: topItems.map(item => item.isNew ? '#10b981' : '#3b82f6'),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: function (val) {
                return mode === 'diff' ? val.toLocaleString() + '억' : val + '%';
              }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Pretendard, system-ui', size: 11 }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (tooltipItems) {
                const idx = tooltipItems[0].dataIndex;
                return topItems[idx].title + (topItems[idx].isNew ? ' (신규사업)' : '');
              },
              label: function (ctx) {
                const idx = ctx.dataIndex;
                const item = topItems[idx];
                return mode === 'diff'
                  ? ` 증감액: +${item.diffAmount.toLocaleString()} 억원 (${item.diffRate}%)`
                  : ` 증가율: +${item.diffRate}% (+${item.diffAmount.toLocaleString()} 억원)`;
              }
            }
          }
        }
      }
    });
  }

  return {
    renderAll: function (items, topMode = 'diff') {
      const categories = aggregateByCategory(items);
      renderCategoryShareChart('categoryShareCanvas', categories);
      renderCategoryCompareChart('categoryCompareCanvas', categories);
      renderTopProjectsChart('topProjectsCanvas', items, topMode);
    },
    aggregateByCategory: aggregateByCategory
  };
})();
