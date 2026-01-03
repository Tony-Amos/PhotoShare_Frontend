
const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

async function register() {
  await fetch(API+'/register',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:name.value,email:email.value,password:password.value,role:role.value
    })});
  window.location.href = 'login.html';
}

async function login() {
  const r = await fetch(API+'/login',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:email.value,password:password.value})});
  const d = await r.json();
  localStorage.setItem('token', d.token);
  window.location.href = d.role === 'creator' ? 'creator.html' : 'index.html';
}

async function upload() {
  const fd = new FormData();
  fd.append('title', title.value);
  fd.append('image', image.files[0]);

  await fetch(API+'/photos',{method:'POST',
    headers:{Authorization:'Bearer '+localStorage.getItem('token')},body:fd});
  window.location.href = 'index.html';
}

async function loadFeed() {
  const r = await fetch(API+'/photos');
  const data = await r.json();
  feed.innerHTML = data.map(p=>`
    <div class="card">
      <img src="${p.url}">
      <h4>${p.title}</h4>
      <p>By ${p.creator}</p>
      <div class="reactions">
        <button onclick="react('${p.id}','like')">👍 ${p.reactions.like}</button>
        <button onclick="react('${p.id}','love')">❤️ ${p.reactions.love}</button>
        <button onclick="react('${p.id}','sad')">😢 ${p.reactions.sad}</button>
        <button onclick="react('${p.id}','hate')">😡 ${p.reactions.hate}</button>
        <button onclick="share('${p.id}')">🔗 ${p.shares}</button>
      </div>
      <input placeholder="Comment..." onkeydown="comment(event,'${p.id}')">
      <div>${p.comments.map(c=>'<p><b>'+c.user+':</b> '+c.text+'</p>').join('')}</div>
    </div>`).join('');
}

async function react(id,type) {
  await fetch(`${API}/photos/${id}/react/${type}`,{
    method:'POST',headers:{Authorization:'Bearer '+token}
  });
  loadFeed();
}

async function comment(e,id) {
  if(e.key==='Enter'){
    await fetch(`${API}/photos/${id}/comment`,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({text:e.target.value})
    });
    loadFeed();
  }
}

async function share(id){
  await fetch(`${API}/photos/${id}/share`,{
    method:'POST',headers:{Authorization:'Bearer '+token}
  });
  loadFeed();
}

if(document.getElementById('feed')) loadFeed();
