// Dummy data for now (next step: load real invoice)
document.getElementById("invoiceNo").innerText = "VJ-1001";
document.getElementById("invoiceDate").innerText =
  new Date().toLocaleDateString();

document.getElementById("clientName").innerText =
  "Sample Client, Surat";

const items = [
  { name: "Polyester Jari", qty: 2, rate: 120 },
  { name: "Zari Thread", qty: 1, rate: 80 }
];

let subtotal = 0;
const tbody = document.getElementById("items");

items.forEach(i => {
  const amt = i.qty * i.rate;
  subtotal += amt;

  tbody.innerHTML += `
    <tr>
      <td>${i.name}</td>
      <td align="center">${i.qty}</td>
      <td align="right">${i.rate}</td>
      <td align="right">${amt}</td>
    </tr>
  `;
});

const cgst = subtotal * 0.09;
const sgst = subtotal * 0.09;
const total = subtotal + cgst + sgst;

document.getElementById("subtotal").innerText = subtotal.toFixed(2);
document.getElementById("cgst").innerText = cgst.toFixed(2);
document.getElementById("sgst").innerText = sgst.toFixed(2);
document.getElementById("total").innerText = total.toFixed(2);
