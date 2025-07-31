window.addEventListener('DOMContentLoaded', () => {
  const codigo = document.getElementById('codigoCupon').textContent.trim();
  localStorage.setItem('cuponCodigo', codigo);
  console.log('Cupón guardado:', codigo);
});