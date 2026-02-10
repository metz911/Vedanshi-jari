document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", login);
});

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "Logging in...";

  if (!email || !password) {
    msg.innerText = "Email and password required";
    return;
  }

  const { data, error } = await window.supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.innerText = error.message;
    return;
  }

  // OPTIONAL: role fetch (safe)
  const { data: profile } = await window.supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role) {
    localStorage.setItem("role", profile.role);
  }

  window.location.href = "dashboard.html";
}
