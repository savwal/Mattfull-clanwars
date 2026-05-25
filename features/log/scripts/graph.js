const chartInstances = {};

function renderChart(canvasId, labels, dataPoints, zones, options = {}) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const currentLabel = options.currentLabel || null;
  const currentTimeLine = currentLabel ? {
    type: 'line',
    xMin: currentLabel,
    xMax: currentLabel,
    borderColor: '#2A8CFF',
    borderWidth: 2,
    label: {
      display: true,
      content: 'Nu',
      backgroundColor: '#2A8CFF',
      color: '#FFF',
      position: 'start'
    }
  } : null;
  
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Promille',
        data: dataPoints,
        borderColor: '#FFCC00',
        backgroundColor: 'rgba(255, 204, 0, 0.2)',
        borderWidth: 5,
        pointBackgroundColor: '#2C3E50',
        pointBorderColor: '#FFCC00',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      scales: { 
        y: { 
          beginAtZero: true,
          suggestedMax: zones.greenMax + 0.5,
          grid: { color: '#bdc3c7', lineWidth: 2 }
        },
        x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
      },
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            legalZone: { type: 'box', yMin: 0, yMax: zones.legalMax, backgroundColor: 'rgba(52, 152, 219, 0.15)', borderWidth: 0 },
            redZone: { type: 'box', yMin: zones.legalMax, yMax: zones.redMax, backgroundColor: 'rgba(231, 76, 60, 0.15)', borderWidth: 0 },
            funZone: { type: 'box', yMin: zones.redMax, yMax: zones.greenMax, backgroundColor: 'rgba(46, 204, 113, 0.15)', borderWidth: 0 },
            psykosZone: { type: 'box', yMin: zones.greenMax, yMax: 10, backgroundColor: 'rgba(155, 89, 182, 0.15)', borderWidth: 0 },
            ...(currentTimeLine ? { currentTimeLine } : {})
          }
        }
      }
    }
  });
}