let editItemId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("saveEditBtn").addEventListener("click", updateItem);
  document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("themeBtn").addEventListener("click", toggleTheme);

  loadInventory();
});

// LOAD INVENTORY
async function loadInventory() {
  const table = document.getElementById("inventoryTable");
  table.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  const { data, error } = await window.supabase
    .from("items")
    .select("id, item_name, hsn, price, stock_qty")
    .order("id", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No items found</td></tr>`;
    return;
  }

  table.innerHTML = "";

  data.forEach(i => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i.item_name}</td>
      <td>${i.hsn ?? "-"}</td>
      <td>${i.price}</td>
      <td>${i.stock_qty}</td>
      <td style="text-align:right;">
        <button class="editBtn" data-id="${i.id}">Edit</button>
        <button class="deleteBtn" data-id="${i.id}">Delete</button>
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
    btn.addEventListener("click", () => deleteItem(btn.dataset.id));
  });
}

// ADD ITEM
async function addItem() {
  const name = itemName.value.trim();
  const hsn = itemHsn.value.trim();
  const price = Number(itemPrice.value);
  const stock = Number(itemStock.value);

  if (!name || !price || !stock) {
    alert("All fields required");
    return;
  }

  const { error } = await window.supabase.from("items").insert({
    item_name: name,
    hsn,
    price,
    stock_qty: stock
  });

  if (error) {
    alert(error.message);
    return;
  }

  itemName.value = "";
  itemHsn.value = "";
  itemPrice.value = "";
  itemStock.value = "";

  loadInventory();
}

// OPEN EDIT
async function openEdit(id) {
  const { data, error } = await window.supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editItemId = id;
  editName.value = data.item_name;
  editHsn.value = data.hsn ?? "";
  editPrice.value = data.price;
  editStock.value = data.stock_qty;

  editModal.style.display = "flex";
}

// CLOSE MODAL
function closeModal() {
  editModal.style.display = "none";
  editItemId = null;
}

// UPDATE ITEM
async function updateItem() {
  if (!editItemId) return;

  const name = editName.value.trim();
  const hsn = editHsn.value.trim();
  const price = Number(editPrice.value);
  const stock = Number(editStock.value);

  if (!name || !price || !stock) {
    alert("Invalid data");
    return;
  }

  const { error } = await window.supabase
    .from("items")
    .update({
      item_name: name,
      hsn,
      price,
      stock_qty: stock
    })
    .eq("id", editItemId);

  if (error) {
    alert(error.message);
    return;
  }

  closeModal();
  loadInventory();
}

// DELETE ITEM (SAFE)
async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;

  // In future: check invoice_items table here
  const { error } = await window.supabase
    .from("items")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadInventory();
}
  