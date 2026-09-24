// One shared counter component for both responsive entry points.
(() => {
  const displays = document.querySelectorAll('[data-visitor-total]');
  if (!displays.length) return;

  const update = (value, label) => displays.forEach(display => {
    display.textContent = value;
    display.title = label;
  });

  if (location.protocol === 'file:') {
    update('—', 'Visitor total is available on the deployed site.');
    return;
  }

  fetch('/api/visitors', { method: 'POST', credentials: 'same-origin', cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Visitor service is offline');
      return response.json();
    })
    .then(({ total }) => {
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid visitor total');
      update(String(total).padStart(6, '0'), `${total.toLocaleString('en-US')} unique browser visitors`);
    })
    .catch(() => update('—', 'Visitor total is currently unavailable.'));
})();
