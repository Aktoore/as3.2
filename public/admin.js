const tableBody = document.getElementById("assetsTable");
const form = document.getElementById("assetForm");
const msg = document.getElementById("msg");

const formTitle = document.getElementById("formTitle");
const assetIdInput = document.getElementById("assetId");

const nameInput = document.getElementById("name");
const symbolInput = document.getElementById("symbol");
const priceInput = document.getElementById("price");
const descriptionInput = document.getElementById("description");
const marketCapInput = document.getElementById("marketCap");
const change24hInput = document.getElementById("change24h");
const imageUrlInput = document.getElementById("imageUrl");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

document.getElementById("reloadBtn").addEventListener("click", loadAssets);
document.getElementById("resetBtn").addEventListener("click", resetForm);

function formatMoney(n) {
  const num = Number(n);
  if (isNaN(num)) return "-";
  return "$" + num.toLocaleString();
}

function resetForm() {
  formTitle.textContent = "Create Asset";
  assetIdInput.value = "";

  nameInput.value = "";
  symbolInput.value = "";
  priceInput.value = "";
  descriptionInput.value = "";
  marketCapInput.value = "";
  change24hInput.value = "";
  imageUrlInput.value = "";

  msg.textContent = "";
}

function setMessage(text) {
  msg.textContent = text;
}

async function loadAssets() {
  const q = searchInput.value.trim();
  const sortBy = sortSelect.value;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sortBy) params.set("sortBy", sortBy);

  const res = await fetch("/api/assets?" + params.toString());
  const assets = await res.json();

  tableBody.innerHTML = "";

  if (!Array.isArray(assets) || assets.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No assets</td></tr>`;
    return;
  }

  for (const a of assets) {
    const tr = document.createElement("tr");

    const img = a.imageUrl || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247";

    tr.innerHTML = `
      <td><img class="mini-img" src="${img}" alt="${a.name}"></td>
      <td><b>${a.name}</b></td>
      <td>${a.symbol}</td>
      <td>${formatMoney(a.price)}</td>
      <td>${formatMoney(a.marketCap)}</td>
      <td>${a.change24h ?? 0}%</td>
      <td>
        <button class="btn small" data-edit="${a._id}">Edit</button>
        <button class="btn small danger" data-del="${a._id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(tr);
  }

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => editAsset(btn.dataset.edit));
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteAsset(btn.dataset.del));
  });
}

async function editAsset(id) {
  const res = await fetch("/api/assets/" + id);
  const asset = await res.json();

  if (!asset || asset.error) {
    setMessage("Error loading asset");
    return;
  }

  formTitle.textContent = "Update Asset";
  assetIdInput.value = asset._id;

  nameInput.value = asset.name || "";
  symbolInput.value = asset.symbol || "";
  priceInput.value = asset.price ?? "";
  descriptionInput.value = asset.description || "";
  marketCapInput.value = asset.marketCap ?? "";
  change24hInput.value = asset.change24h ?? "";
  imageUrlInput.value = asset.imageUrl || "";

  setMessage("Editing: " + asset.name);
}

async function deleteAsset(id) {
  if (!confirm("Delete this asset?")) return;

  const res = await fetch("/api/assets/" + id, { method: "DELETE" });
  const data = await res.json();

  if (data.error) {
    setMessage("Delete error: " + data.error);
    return;
  }

  setMessage("Deleted!");
  resetForm();
  loadAssets();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    symbol: symbolInput.value.trim(),
    price: Number(priceInput.value),
    description: descriptionInput.value.trim(),
    marketCap: Number(marketCapInput.value || 0),
    change24h: Number(change24hInput.value || 0),
    imageUrl: imageUrlInput.value.trim()
  };

  const id = assetIdInput.value;

  let res;
  if (!id) {
    res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    res = await fetch("/api/assets/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  const data = await res.json();

  if (data.error) {
    setMessage("Error: " + data.error);
    return;
  }

  setMessage(id ? "Updated!" : "Created!");
  resetForm();
  loadAssets();
});

searchInput.addEventListener("input", () => {
  loadAssets();
});

sortSelect.addEventListener("change", () => {
  loadAssets();
});

loadAssets();
