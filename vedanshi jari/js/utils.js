// ===============================
// Company Configuration
// ===============================
const COMPANY = {
  name: "Vedanshi Jari",
  state: "Gujarat",
  gstRate: 18
};

// ===============================
// GST Calculation
// ===============================
function calculateGST(amount, clientState) {
  if (clientState === COMPANY.state) {
    return {
      cgst: amount * 0.09,
      sgst: amount * 0.09,
      igst: 0
    };
  } else {
    return {
      cgst: 0,
      sgst: 0,
      igst: amount * 0.18
    };
  }
}

// ===============================
// Helpers
// ===============================
function formatCurrency(amount) {
  return "₹ " + Number(amount).toFixed(2);
}
