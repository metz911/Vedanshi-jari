let currentItems = [];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Load initial data
  loadClients();
  loadInventory();

  // Attach Event Listeners
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("saveInvoiceBtn").addEventListener("click", saveInvoice);
  
  // Auto-fill Item Details when an item is selected
  document.getElementById("itemSelect").addEventListener("change", (e) => {
    const option = e.target.options[e.target.selectedIndex];
    if (option && option.dataset.price) {
      document.getElementById("rateInput").value = option.dataset.price;
    }
  });
});

// --- LOAD DATA ---
async function loadClients() {
  const { data, error } = await window.supabase.from("clients").select("*");
  if (error) {
    console.error("Error loading clients:", error);
    return;
  }
  
  const select = document.getElementById("clientSelect");
  select.innerHTML = '<option value="" disabled selected>Select a client...</option>';
  
  data.forEach(client => {
    const opt = document.createElement("option");
    opt.value = client.id;
    opt.textContent = client.name;
    // Store extra data for preview if needed
    opt.dataset.phone = client.phone || ""; 
    select.appendChild(opt);
  });
}

async function loadInventory() {
  const { data, error } = await window.supabase.from("items").select("*");
  if (error) {
    console.error("Error loading inventory:", error);
    return;
  }

  const select = document.getElementById("itemSelect");
  select.innerHTML = '<option value="" disabled selected>Select item...</option>';
  
  data.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id; // We need the ITEM ID for the database
    opt.textContent = item.item_name; 
    opt.dataset.price = item.price; // Store price for auto-fill
    opt.dataset.name = item.item_name; // Store name for table display
    select.appendChild(opt);
  });
}

// --- ADD ITEMS TO TABLE ---
function addItem() {
  const itemSelect = document.getElementById("itemSelect");
  const itemId = itemSelect.value;
  const itemName = itemSelect.options[itemSelect.selectedIndex]?.dataset.name;
  
  const rate = parseFloat(document.getElementById("rateInput").value);
  const qty = parseFloat(document.getElementById("qtyInput").value);

  if (!itemId || isNaN(rate) || isNaN(qty) || qty <= 0) {
    alert("Please select an item and enter valid Rate and Quantity.");
    return;
  }

  const amount = rate * qty;

  // Add to local array
  currentItems.push({
    item_id: itemId, // This is crucial for the foreign key
    name: itemName,  // Just for display
    rate: rate,
    qty: qty,
    amount: amount
  });

  renderTable();
  
  // clear inputs
  document.getElementById("qtyInput").value = "";
}

function renderTable() {
  const tbody = document.getElementById("billTable");
  tbody.innerHTML = "";

  let subtotal = 0;

  currentItems.forEach((item, index) => {
    subtotal += item.amount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.rate.toFixed(2)}</td>
      <td>${item.qty}</td>
      <td style="text-align:right;">${item.amount.toFixed(2)}</td>
      <td style="text-align:right;">
        <button onclick="removeItem(${index})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Calculate Totals
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("cgst").textContent = cgst.toFixed(2);
  document.getElementById("sgst").textContent = sgst.toFixed(2);
  document.getElementById("total").textContent = total.toFixed(2);
}

function removeItem(index) {
  currentItems.splice(index, 1);
  renderTable();
}

// --- SAVE INVOICE (CRITICAL FIX) ---
async function saveInvoice() {
  const clientId = document.getElementById("clientSelect").value;
  const invoiceDate = document.getElementById("invoiceDate") ? document.getElementById("invoiceDate").value : new Date().toISOString();

  if (!clientId) {
    alert("Please select a client.");
    return;
  }
  if (currentItems.length === 0) {
    alert("Please add at least one item.");
    return;
  }

  // 1. Calculate final totals
  const subtotal = parseFloat(document.getElementById("subtotal").textContent);
  const cgst = parseFloat(document.getElementById("cgst").textContent);
  const sgst = parseFloat(document.getElementById("sgst").textContent);
  const total = parseFloat(document.getElementById("total").textContent);

  try {
    // 2. Insert Invoice Record
    // invoice_no is usually auto-generated by your DB or you can generate one here
    const invoiceNo = "INV-" + Date.now().toString().slice(-6); 

    const { data: invoiceData, error: invoiceError } = await window.supabase
      .from("invoices")
      .insert([{
        client_id: clientId,
        invoice_no: invoiceNo,
        created_at: new Date().toISOString(), // Use selected date if preferred
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        total: total
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const newInvoiceId = invoiceData.id;

    // 3. Prepare Items for Insertion
    // We must map our local array to match the DB columns exactly
    const itemsToInsert = currentItems.map(item => ({
      invoice_id: newInvoiceId,
      item_id: item.item_id, // Ensure this matches your table column name (item_id vs item_name?)
      qty: item.qty,
      rate: item.rate,
      amount: item.amount
    }));

    // 4. Insert Items
    const { error: itemsError } = await window.supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    alert("Invoice saved successfully!");
    
    // Redirect to reports to print it
    window.location.href = "reports.html";

  } catch (err) {
    console.error("Save Error:", err);
    alert("Error saving invoice: " + err.message);
  }
}