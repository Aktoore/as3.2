const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMsg");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

function setMessage(text) {
  msg.textContent = text;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value
  };

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(data.error || "Login failed");
    return;
  }

  setMessage("Logged in! Redirecting...");
  window.location.href = "/admin";
});
