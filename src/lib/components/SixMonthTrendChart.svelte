<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Filler } from 'chart.js';

  Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Filler);

  export let dataPoints: { month: number; year: number; income: number; expense: number }[] = [];

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Pemasukan',
            data: [],
            borderColor: '#006c49', // secondary emerald
            backgroundColor: 'rgba(0, 108, 73, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pengeluaran',
            data: [],
            borderColor: '#ba1a1a', // error rose
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 10,
            titleFont: { family: 'Geist', size: 13 },
            bodyFont: { family: 'Geist', size: 13 },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { family: 'Geist', size: 11 },
              color: '#94a3b8',
              maxTicksLimit: 6
            }
          },
          y: {
            display: false,
            grid: {
              display: false
            }
          }
        }
      }
    });

    updateChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  $: if (chart && dataPoints) {
    updateChart();
  }

  function getMonthName(month: number): string {
    const d = new Date();
    d.setMonth(month - 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
  }

  function updateChart() {
    if (!chart || !dataPoints.length) return;
    
    chart.data.labels = dataPoints.map(p => `${getMonthName(p.month)} ${p.year}`);
    chart.data.datasets[0].data = dataPoints.map(p => p.income);
    chart.data.datasets[1].data = dataPoints.map(p => p.expense);
    chart.update();
  }
</script>

<div class="w-full h-48 relative">
  <canvas bind:this={canvas}></canvas>
</div>
