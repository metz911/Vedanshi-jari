let editClientId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addClientBtn").addEventListener("click", addClient);
  document.getElementById("saveEditBtn").addEventListener("click", updateClient);
  document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("themeBtn").addEventListener("click", toggleTheme);

  loadClients();
});

// LOAD CLIENTS (SAFE)
async function loadClients() {
  const table = document.getElementById("clientsTable");
  table.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  const { data, error } = await window.supabase
    .from("clients")
    .select("id, name, phone, state")
    .order("id", { ascending: false });

  if (error) {
    console.error("Load clients error:", error);
    table.innerHTML =
      `<tr><td colspan="4">❌ Failed to load clients</td></tr>`;
    alert(error.message);
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML =
      `<tr><td colspan="4">No clients found</td></tr>`;
    return;
  }

  table.innerHTML = "";

  data.forEach(c => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.phone ?? ""}</td>
      <td>${c.state ?? "-"}</td>
      <td style="text-align:right;">
        <button class="editBtn" data-id="${c.id}">Edit</button>
        <button class="deleteBtn" data-id="${c.id}">Delete</button>
      </td>
    `;

    table.appendChild(tr);
  });

  bindActionButtons();
}

// BIND BUTTONS
function bindActionButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", () => openEdit(btn.dataset.id));
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => deleteClient(btn.dataset.id));
  });
}

// ADD CLIENT
async function addClient() {
  const name = clientName.value.trim();
  const phone = clientPhone.value.trim();
  const state = clientState.value.trim();

  if (!name || !state) {
    alert("Name and State are required");
    return;
  }

  const { error } = await window.supabase.from("clients").insert({
    name,
    phone,
    state
  });

  if (error) {
    alert(error.message);
    return;
  }

  clientName.value = "";
  clientPhone.value = "";
  clientState.value = "";

  loadClients();
}

// OPEN EDIT
async function openEdit(id) {
  const { data, error } = await window.supabase
    .from("clients")
    .select("id, name, phone, state")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editClientId = id;
  editName.value = data.name;
  editPhone.value = data.phone ?? "";
  editState.value = data.state ?? "";

  editModal.style.display = "flex";
}

// CLOSE MODAL
function closeModal() {
  editModal.style.display = "none";
  editClientId = null;
}

// UPDATE CLIENT
async function updateClient() {
  if (!editClientId) return;

  const name = editName.value.trim();
  const phone = editPhone.value.trim();
  const state = editState.value.trim();

  if (!name || !state) {
    alert("Invalid data");
    return;
  }

  const { error } = await window.supabase
    .from("clients")
    .update({ name, phone, state })
    .eq("id", editClientId);

  if (error) {
    alert(error.message);
    return;
  }

  closeModal();
  loadClients();
}

// DELETE CLIENT (SAFE FK CHECK)
async function deleteClient(id) {
  if (!confirm("Delete this client?")) return;

  // Check invoices
  const { data: invoices, error: checkError } = await window.supabase
    .from("invoices")
    .select("id")
    .eq("client_id", id);

  if (checkError) {
    alert(checkError.message);
    return;
  }

  if (invoices.length > 0) {
    alert("❌ Cannot delete client.\nInvoices exist for this client.");
    return;
  }

  const { error } = await window.supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadClients();
}
