function showForm() {
  document.getElementById('headerSection').style.display = 'none';
  document.getElementById('mainButtons').style.display = 'none';
  const fs = document.getElementById('formSection');
  fs.style.display = 'flex';
  fs.style.animation = 'fadeIn 0.5s ease';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideForm() {
  document.getElementById('headerSection').style.display = 'block';
  document.getElementById('mainButtons').style.display = 'flex';
  document.getElementById('formSection').style.display = 'none';
  const btn = document.getElementById('btnSubmit');
  btn.classList.remove('loading');
  document.getElementById('consultForm').reset();
  document.getElementById('consultForm').style.display = 'block';
  document.getElementById('success-message').style.display = 'none';
}

function handleSubmit() {
  const btn = document.getElementById('btnSubmit');
  btn.classList.add('loading');
  setTimeout(() => {
    document.getElementById('consultForm').style.display = 'none';
    document.getElementById('success-message').style.display = 'block';
    btn.classList.remove('loading');
  }, 1500);
}
