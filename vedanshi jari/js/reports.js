document.addEventListener("DOMContentLoaded", () => {
  // Initialize
  loadReports();

  // Bind static buttons (check if they exist first to avoid errors)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn && typeof logout === 'function') {
    logoutBtn.addEventListener("click", logout);
  }

  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn && typeof toggleTheme === 'function') {
    themeBtn.addEventListener("click", toggleTheme);
  }
});

async function loadReports() {
  const table = document.getElementById("reportsTable");
  
  // Show loading state
  table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Loading invoices...</td></tr>`;

  const { data, error } = await window.supabase
    .from("invoices")
    .select(`
      id,
      invoice_no,
      total,
      created_at,
      clients ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading reports:", error);
    table.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error loading data. Check console.</td></tr>`;
    return;
  }

  // Clear table
  table.innerHTML = "";

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No invoices found.</td></tr>`;
    return;
  }

  // Populate rows
  data.forEach(inv => {
    const tr = document.createElement("tr");
    
    // We use inline 'onclick' here. It is safer and simpler for dynamically created lists.
    // Note the quotes around '${inv.id}' to handle UUIDs correctly.
    tr.innerHTML = `
      <td>${inv.invoice_no}</td>
      <td>${new Date(inv.created_at).toLocaleDateString()}</td>
      <td>${inv.clients?.name || "-"}</td>
      <td>₹ ${inv.total.toFixed(2)}</td>
      <td style="text-align:right;">
        <button 
          class="btn-action" 
          style="background-color: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;"
          onclick="generateInvoicePDF('${inv.id}')"
        >
          View / Print
        </button>

        <button 
          class="btn-action" 
          style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"
          onclick="deleteInvoice('${inv.id}')"
        >
          Delete
        </button>
      </td>
    `;
    table.appendChild(tr);
  });
}

async function deleteInvoice(id) {
  if (!confirm("Are you sure you want to delete this invoice permanently?")) return;

  const { error } = await window.supabase.from("invoices").delete().eq("id", id);
  
  if (error) {
    alert("Error deleting: " + error.message);
  } else {
    loadReports(); // Refresh the list
  }
}