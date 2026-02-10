document.addEventListener("DOMContentLoaded", () => {
  const mode = localStorage.getItem("theme");
  if (mode === "dark") document.body.classList.add("dark");
});

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}
