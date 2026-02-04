async function checkAuth() {
  const res = await fetch("/api/session");
  const data = await res.json();

  const nav = document.getElementById("nav-auth");

  if (!nav) return;

  if (!data.loggedIn) {
    nav.innerHTML = `<a href="/login">Login</a>`;
    return;
  }

  let html = `<span>Hi, ${data.user.username}</span> `;

  if (data.user.role === "admin") {
    html += `<a href="/admin">Admin</a> `;
  }

  html += `<button id="logoutBtn">Logout</button>`;

  nav.innerHTML = html;

  document.getElementById("logoutBtn").onclick = async () => {
    await fetch("/api/session/logout", { method: "POST" });
    location.reload();
  };
}

checkAuth();
