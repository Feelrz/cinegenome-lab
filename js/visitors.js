// One shared visitor counter component for desktop + mobile.
(() => {
  const displays = document.querySelectorAll('[data-visitor-total]');
  const statuses = document.querySelectorAll('[data-visitor-status]');
  if (!displays.length) return;

  const update = (value, label, state='ready') => displays.forEach(display => {
    display.textContent = value;
    display.title = label;
    display.dataset.state = state;
    display.setAttribute('aria-label', label);
  });
  const note = (message='') => statuses.forEach(node=>{
    node.hidden=!message;
    node.textContent=message;
  });

  const request = async (method) => {
    const response = await fetch('/api/visitors', {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(data.detail || data.error || `visitor_http_${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (!Number.isSafeInteger(data.total) || data.total < 0) {
      throw new Error('invalid_visitor_total');
    }
    return data.total;
  };

  if (location.protocol === 'file:') {
    update('ONLINE ONLY', 'A global visitor count requires deployment with an API and Redis.', 'offline');
    note('GLOBAL COUNT NEEDS VERCEL + UPSTASH');
    return;
  }

  // POST registers this browser. If registration has a transient problem but the
  // database is still readable, fall back to GET so the UI can at least show total.
  request('POST').then(total=>({total,readOnly:false}))
    .catch(async postError => {
      console.warn('[CINEGENOME VISITORS] POST failed:', postError.message, postError.status || '');
      try {
        return {total:await request('GET'),readOnly:true};
      } catch (getError) {
        console.error('[CINEGENOME VISITORS] GET failed:', getError.message, getError.status || '');
        throw postError;
      }
    })
    .then(({total,readOnly}) => {
      update(String(total).padStart(6, '0'), `${total.toLocaleString('en-US')} unique browser visitors`);
      note(readOnly?'READ ONLY // REGISTRATION TEMPORARILY FAILED':'');
    })
    .catch(error => {
      const code=error.status===503?'SETUP NEEDED':error.status===404?'API MISSING':'API ERROR';
      update(code, `Visitor counter unavailable: ${error.message}. Check the Vercel function and Upstash REST environment variables.`, 'error');
      note(error.status===503?'SET REST URL + TOKEN IN VERCEL, THEN REDEPLOY':error.status===404?'DEPLOY THE API FUNCTION IN VERCEL':'CHECK UPSTASH REST CONNECTION');
    });
})();
