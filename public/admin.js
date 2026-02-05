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


document.getElementById("reloadBtn").onclick = loadAssets;
document.getElementById("resetBtn").onclick = resetForm;


function formatMoney(n){
  return n ? "$" + Number(n).toLocaleString() : "-";
}

function resetForm(){

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

function setMessage(t){
  msg.textContent = t;
}

async function loadAssets(){

  const q = searchInput.value.trim();
  const sortBy = sortSelect.value;

  const params = new URLSearchParams();

  if(q) params.set("q", q);
  if(sortBy) params.set("sortBy", sortBy);

  const res = await fetch("/api/assets?" + params);
  const assets = await res.json();

  tableBody.innerHTML = "";


  if(!Array.isArray(assets) || !assets.length){

    tableBody.innerHTML =
      "<p style='text-align:center'>No assets</p>";

    return;
  }


  for(const a of assets){

    const img =
      a.imageUrl ||
      "https://cdn-icons-png.flaticon.com/512/825/825508.png";


    const row = document.createElement("div");
    row.className = "admin-row";


    row.innerHTML = `

      <img src="${img}">

      <b>${a.name}</b>

      <span>${a.symbol}</span>

      <span>${formatMoney(a.price)}</span>

      <span>${formatMoney(a.marketCap)}</span>

      <span>${a.change24h ?? 0}%</span>

      <div class="admin-actions">

        <button class="edit" data-edit="${a._id}">
          Edit
        </button>

        <button class="delete" data-del="${a._id}">
          Delete
        </button>

      </div>

    `;


    tableBody.appendChild(row);

  }


  document.querySelectorAll("[data-edit]").forEach(b=>{
    b.onclick = ()=>editAsset(b.dataset.edit);
  });

  document.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = ()=>deleteAsset(b.dataset.del);
  });

}

async function editAsset(id){

  const res = await fetch("/api/assets/"+id);
  const a = await res.json();

  if(!a || a.error){
    setMessage("Load error");
    return;
  }

  formTitle.textContent = "Update Asset";
  assetIdInput.value = a._id;

  nameInput.value = a.name || "";
  symbolInput.value = a.symbol || "";
  priceInput.value = a.price ?? "";
  descriptionInput.value = a.description || "";
  marketCapInput.value = a.marketCap ?? "";
  change24hInput.value = a.change24h ?? "";
  imageUrlInput.value = a.imageUrl || "";

  setMessage("Editing: "+a.name);
}

async function deleteAsset(id){

  if(!confirm("Delete asset?")) return;

  const res = await fetch("/api/assets/"+id,{
    method:"DELETE"
  });

  const data = await res.json();

  if(data.error){
    setMessage(data.error);
    return;
  }

  setMessage("Deleted ✔");

  resetForm();
  loadAssets();
}


form.onsubmit = async e=>{

  e.preventDefault();

  const payload = {

    name: nameInput.value.trim(),
    symbol: symbolInput.value.trim(),

    price: Number(priceInput.value),

    description: descriptionInput.value.trim(),

    marketCap: Number(marketCapInput.value||0),

    change24h: Number(change24hInput.value||0),

    imageUrl: imageUrlInput.value.trim()

  };


  const id = assetIdInput.value;


  let res;

  if(!id){

    res = await fetch("/api/assets",{

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify(payload)

    });

  }else{

    res = await fetch("/api/assets/"+id,{

      method:"PUT",

      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    });

  }

  const data = await res.json();

  if(data.error){

    setMessage(data.error);
    return;
  }

  setMessage(id ? "Updated ✔" : "Created ✔");

  resetForm();
  loadAssets();
};

searchInput.oninput = loadAssets;
sortSelect.onchange = loadAssets;

loadAssets();
