(function () {
  const form = document.getElementById('promoSignupForm');
  if (!form) return;

  const btn = form.querySelector('.promo-signup-btn');
  const emailInput = form.querySelector('#promoEmail');

  function setStatus(msg, isError) {
    let el = form.querySelector('.promo-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'promo-status';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'margin:8px 0 0;font-size:13px;font-weight:600;';
      form.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = isError ? '#c03030' : '#607848';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = (emailInput ? emailInput.value : '').trim();
    if (!email) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('You\'re subscribed! Welcome to the VitraFruits family.', false);
        form.reset();
      } else {
        setStatus(data.error || 'Something went wrong. Please try again.', true);
      }
    } catch (err) {
      setStatus('Could not connect. Please check your connection and try again.', true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
    }
  });
})();
