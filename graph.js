let chartInstance = null;

function renderChart(canvasId, labels, dataPoints, zones) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Promille',
        data: dataPoints,
        borderColor: '#0984e3',
        backgroundColor: 'rgba(9, 132, 227, 0.1)',
        borderWidth: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0984e3',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      scales: { 
        y: { 
          beginAtZero: true,
          suggestedMax: zones.greenMax + 0.5,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            redZone: {
              type: 'box',
              yMin: 0,
              yMax: zones.redMax,
              backgroundColor: 'rgba(255, 118, 117, 0.15)',
              borderWidth: 0
            },
            funZone: {
              type: 'box',
              yMin: zones.redMax,
              yMax: zones.greenMax,
              backgroundColor: 'rgba(85, 239, 196, 0.15)',
              borderWidth: 0
            },
            psykosZone: {
              type: 'box',
              yMin: zones.greenMax,
              yMax: 10,
              backgroundColor: 'rgba(162, 155, 254, 0.15)',
              borderWidth: 0
            }
          }
        }
      }
    }
  });
}