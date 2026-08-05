<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

  export let dataPoints: { label: string; value: number; color: string }[] = [];

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            titleFont: { family: 'Geist', size: 13 },
            bodyFont: { family: 'Geist', size: 13 },
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) label += ': ';
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed);
                }
                return label;
              }
            }
          }
        }
      }
    });

    updateChart();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });

  $: if (chart && dataPoints) {
    updateChart();
  }

  function updateChart() {
    if (!chart || !dataPoints.length) return;
    
    chart.data.labels = dataPoints.map(p => p.label);
    chart.data.datasets[0].data = dataPoints.map(p => p.value);
    chart.data.datasets[0].backgroundColor = dataPoints.map(p => p.color);
    chart.update();
  }
</script>

<div class="w-full h-64 relative flex justify-center items-center">
  {#if dataPoints.length > 0}
    <canvas bind:this={canvas}></canvas>
  {:else}
    <div class="absolute inset-0 flex items-center justify-center border-4 border-dashed border-gray-100 rounded-full w-48 h-48 m-auto">
      <span class="text-text-muted text-sm font-medium">Kosong</span>
    </div>
  {/if}
</div>