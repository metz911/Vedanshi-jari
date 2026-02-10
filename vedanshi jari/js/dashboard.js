document.addEventListener("DOMContentLoaded", () => {
  showDate();
  loadStats();
  loadWeather();
});

// DATE
function showDate() {
  const now = new Date();
  document.getElementById("todayDate").innerText =
    now.toDateString() + " " + now.toLocaleTimeString();
}

// STATS + CHART
async function loadStats() {
  const { data, error } = await window.supabase
    .from("invoices")
    .select("total, created_at");

  if (error) {
    console.error(error.message);
    return;
  }

  document.getElementById("totalInvoices").innerText = data.length;

  let totalSales = 0;
  const chartData = {};

  data.forEach(inv => {
    totalSales += Number(inv.total);

    const date = new Date(inv.created_at).toLocaleDateString();
    chartData[date] = (chartData[date] || 0) + inv.total;
  });

  document.getElementById("totalSales").innerText =
    totalSales.toFixed(2);

  renderChart(chartData);
}

// CHART
function renderChart(chartData) {
  const ctx = document.getElementById("invoiceChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(chartData),
      datasets: [{
        label: "Sales ₹",
        data: Object.values(chartData),
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.2)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// WEATHER (FREE API, NO KEY)
async function loadWeather() {
  try {
    const res = await fetch(
      "https://wttr.in/Surat?format=%C+%t"
    );
    const text = await res.text();
    document.getElementById("weather").innerText = text;
  } catch {
    document.getElementById("weather").innerText = "Unavailable";
  }
}
