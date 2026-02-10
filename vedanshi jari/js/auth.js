async function protect() {
  const { data } = await window.supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
  }
}

async function logout() {
  await window.supabase.auth.signOut();
  window.location.href = "login.html";
}
