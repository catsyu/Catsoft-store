(function () {
  const PRODUCT_ID = 'DAC628518DDD843D4D19A8BF7D8FF1FE';
  const CHECKOUT_BASE_URL = 'https://commerce.adobe.com/store/email';
  const OWNER_USERNAME = 'ownercatsoft';

  const root = document.querySelector('[data-adobe-maker-root]');

  if (!root) {
    return;
  }

  const elements = {
    ownerLabel: document.querySelector('[data-owner-label]'),
    form: document.getElementById('adobeMakerForm'),
    quantity: document.getElementById('adobeQuantity'),
    country: document.getElementById('adobeCountry'),
    language: document.getElementById('adobeLanguage'),
    checkoutUrl: document.getElementById('adobeCheckoutUrl'),
    copyButton: document.getElementById('copyAdobeCheckout'),
    status: document.getElementById('adobeMakerStatus')
  };

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getCurrentAdmin() {
    if (window.CatsoftAdminAuth && typeof window.CatsoftAdminAuth.getCurrentAdmin === 'function') {
      return window.CatsoftAdminAuth.getCurrentAdmin();
    }

    try {
      return JSON.parse(sessionStorage.getItem('catsoftAdminSession') || 'null');
    } catch (error) {
      return null;
    }
  }

  function isOwner(admin) {
    return Boolean(admin && (
      normalize(admin.role) === 'owner'
      || normalize(admin.username) === OWNER_USERNAME
    ));
  }

  function renderLocked() {
    document.body.innerHTML = `
      <main class="adobe-maker-locked">
        <section class="adobe-maker-locked-card">
          <span class="adobe-maker-kicker">Owner only</span>
          <h1>Akses terkunci</h1>
          <p>Halaman Adobe Maker hanya bisa dibuka oleh OwnerCatsoft.</p>
          <a href="https://admin.catsoft.store/">Masuk ke Admin Console</a>
        </section>
      </main>
    `;
  }

  function clampQuantity(value) {
    const number = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
    if (!Number.isFinite(number)) {
      return 10;
    }
    return Math.min(50, Math.max(1, number));
  }

  function buildCheckoutUrl() {
    const quantity = clampQuantity(elements.quantity.value);
    const country = elements.country.value || 'ES';
    const language = elements.language.value || 'es';
    const url = new URL(CHECKOUT_BASE_URL);

    url.searchParams.set('items[0][id]', PRODUCT_ID);
    url.searchParams.set('items[0][q]', String(quantity));
    url.searchParams.set('rrItems[0][id]', PRODUCT_ID);
    url.searchParams.set('rrItems[0][q]', String(quantity));
    url.searchParams.set('co', country);
    url.searchParams.set('lang', language);
    url.searchParams.set('cli', 'mini_plans');
    url.searchParams.set('ss', 'email');
    url.searchParams.set('sm', 't');
    url.searchParams.set('rf', 'p_uc_personalized_content');

    return url.toString();
  }

  function updateCheckoutUrl() {
    const quantity = clampQuantity(elements.quantity.value);
    elements.quantity.value = String(quantity);
    elements.checkoutUrl.value = buildCheckoutUrl();
  }

  function setStatus(message) {
    elements.status.textContent = message;
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  async function copyCheckoutUrl() {
    const url = elements.checkoutUrl.value || buildCheckoutUrl();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopy(url);
      }
      setStatus('Link checkout Adobe sudah disalin.');
    } catch (error) {
      fallbackCopy(url);
      setStatus('Link checkout Adobe sudah disalin.');
    }
  }

  function openCheckout(event) {
    event.preventDefault();
    updateCheckoutUrl();

    const url = elements.checkoutUrl.value;
    const opened = window.open(url, 'catsoft_adobe_checkout', 'noopener,noreferrer,width=1240,height=900');

    if (!opened) {
      window.location.href = url;
      return;
    }

    setStatus('Checkout Adobe dibuka. Lanjutkan pembayaran dan 3DS di tab Adobe resmi.');
  }

  function init() {
    const admin = getCurrentAdmin();

    if (!window.CATSOFT_ADMIN_AUTHORIZED || !isOwner(admin)) {
      renderLocked();
      return;
    }

    if (elements.ownerLabel) {
      elements.ownerLabel.textContent = admin.username || 'OwnerCatsoft';
    }

    root.hidden = false;
    updateCheckoutUrl();

    ['input', 'change'].forEach((eventName) => {
      elements.quantity.addEventListener(eventName, updateCheckoutUrl);
      elements.country.addEventListener(eventName, updateCheckoutUrl);
      elements.language.addEventListener(eventName, updateCheckoutUrl);
    });

    elements.form.addEventListener('submit', openCheckout);
    elements.copyButton.addEventListener('click', copyCheckoutUrl);
  }

  init();
})();
