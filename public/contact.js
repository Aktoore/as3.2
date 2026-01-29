const form = document.getElementById("contactForm");
const msg = document.getElementById("cMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("cName").value.trim(),
    email: document.getElementById("cEmail").value.trim(),
    message: document.getElementById("cMessage").value.trim()
  };

  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.error) {
    msg.textContent = "Error: " + data.error;
    return;
  }

  msg.textContent = "Message saved to MongoDB!";
  form.reset();
});
