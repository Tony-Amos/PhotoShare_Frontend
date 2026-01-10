/* =========================
   CONFIG
========================= */
const API =
  'https://photoshare-ap-g3dycybub5a8ave7.spaincentral-01.azurewebsites.net/api';

/* =========================
   HELPERS
========================= */
function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

/* =========================
   AUTH
========================= */
async function register() {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleInput = document.getElementById('role');

  if (
    !nameInput?.value ||
    !emailInput?.value ||
    !passwordInput?.value ||
    !roleInput?.value
  ) {
    alert('All fields are required');
    return;
  }

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: roleInput.value
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    alert('Account created successfully');
    window.location.href = 'login.html';

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

async function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!emailInput?.value || !passwordInput?.value) {
    alert('Email and password required');
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('token', data.token);
    window.location.href =
      data.role === 'creator' ? 'creator.html' : 'index.html';

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

/* =========================
   CONTENT ACTIONS
========================= */
async function upload() {
  const titleInput = document.getElementById('title');
  const imageInput = document.getElementById('image');

  if (!titleInput?.value || !imageInput?.files?.length) {
    alert('Title and image required');
    return;
  }

  try {
    const fd = new FormData();
    fd.append('title', titleInput.value);
    fd.append('image', imageInput.files[0]);

    const res = await fetch(`${API}/photos`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd
    });

    if (!res.ok) throw new Error('Upload failed');
    window.location.href = 'index.html';

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

async function react(id, type) {
  try {
    await fetch(`${API}/photos/${id}/react/${type}`, {
      method: 'POST',
      headers: authHeaders()
    });
    loadFeed();
  } catch (err) {
    console.error(err);
  }
}

async function share(id) {
  try {
    await fetch(`${API}/photos/${id}/share`, {
      method: 'POST',
      headers: authHeaders()
    });
    loadFeed();
  } catch (err) {
    console.error(err);
  }
}

async function comment(e, id) {
  if (e.key !== 'Enter' || !e.target.value.trim()) return;

  try {
    await fetch(`${API}/photos/${id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ text: e.target.value.trim() })
    });

    e.target.value = '';
    loadFeed();

  } catch (err) {
    console.error(err);
  }
}

/* =========================
   FEED (WITH COMMENTS)
========================= */
async function loadFeed() {
  const feed = document.getElementById('feed');
  if (!feed) return;

  try {
    const res = await fetch(`${API}/photos`);
    if (!res.ok) throw new Error('Failed to load feed');

    const data = await res.json();

    feed.innerHTML = data.map(p => `
      <div class="card">
        <img src="${p.url}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>by ${p.creator || 'SnapFlow User'}</p>

        <div class="actions">
          <button onclick="react('${p.id}','like')">👍 <span>${p.reactions?.like || 0}</span></button>
          <button onclick="react('${p.id}','love')">❤️ <span>${p.reactions?.love || 0}</span></button>
          <button onclick="react('${p.id}','wow')">😮 <span>${p.reactions?.wow || 0}</span></button>
          <button onclick="react('${p.id}','sad')">😢 <span>${p.reactions?.sad || 0}</span></button>
          <button onclick="share('${p.id}')">🔗 <span>${p.shares || 0}</span></button>
        </div>

        <div class="comments">
          ${(p.comments || []).map(c => `
            <div class="comment">
              <strong>${c.user}:</strong> ${c.text}
            </div>
          `).join('')}
        </div>

        <input
          class="comment-input"
          placeholder="Add a comment…"
          onkeydown="comment(event,'${p.id}')"
        >
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
    feed.innerHTML = '<p>Unable to load feed.</p>';
  }
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('feed')) {
    loadFeed();
  }
});
