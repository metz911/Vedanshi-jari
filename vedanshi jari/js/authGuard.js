(async function () {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const role = localStorage.getItem("role");
  const page = location.pathname.split("/").pop();

  // Admin-only pages
  const adminPages = ["inventory.html", "reports.html"];

  if (adminPages.includes(page) && role !== "admin") {
    alert("Admin access only");
    window.location.href = "dashboard.html";
  }
})();

async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = "login.html";
}
