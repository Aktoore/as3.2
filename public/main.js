async function initAuthUI(){

  try{

    const res = await fetch("/api/auth/me");
    const data = await res.json();

    const login = document.getElementById("loginBtn");
    const logout = document.getElementById("logoutBtn");
    const admin = document.getElementById("adminLink");

    if(!login) return;

    if(data.authenticated){

      login.style.display="none";
      logout.style.display="inline";

      if(data.user.role!=="admin"){
        admin.style.display="none";
      }

    }else{

      logout.style.display="none";
      admin.style.display="none";

    }

  }catch(e){}
}


async function logout(){

  await fetch("/api/auth/logout",{method:"POST"});
  location.href="/";
}


document.addEventListener("DOMContentLoaded",()=>{

  initAuthUI();

  const btn = document.getElementById("logoutBtn");

  if(btn){
    btn.onclick = logout;
  }

});
