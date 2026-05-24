const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    item.classList.toggle('active');
  });
});

const termsModal = document.getElementById('termsModal');
const openTerms = document.getElementById('openTermsLink');
const closeTerms = document.getElementById('closeTerms');

openTerms.addEventListener('click', (e) => {
  e.preventDefault();
  termsModal.classList.add('active');
  history.replaceState(null, '', '?terms=open');
});

closeTerms.addEventListener('click', () => {
  termsModal.classList.remove('active');
  history.replaceState(null, '', window.location.pathname);
});

termsModal.addEventListener('click', (e) => {
  if (e.target === termsModal) {
    termsModal.classList.remove('active');
    history.replaceState(null, '', window.location.pathname);
  }
});

const params = new URLSearchParams(window.location.search);

if (params.get('terms') === 'open') {
  termsModal.classList.add('active');
}

const emailAliasInput = document.getElementById('emailAliasInput');
const emailDomainInput = document.getElementById('emailDomainInput');
const emailPreviewValue = document.getElementById('emailPreviewValue');
const emailPreviewHint = document.getElementById('emailPreviewHint');
const emailStatus = document.getElementById('emailStatus');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const openMailBtn = document.getElementById('openMailBtn');

function sanitizeAlias(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function sanitizeDomain(value) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9.-]+/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/\.+/g, '.')
    .replace(/\.$/, '')
    .slice(0, 64);
}

function buildEmailAddress() {
  const alias = sanitizeAlias(emailAliasInput.value || 'customer');
  const domain = sanitizeDomain(emailDomainInput.value || 'catsoft.store');
  return `${alias}@${domain}`;
}

function updateEmailPreview() {
  const alias = sanitizeAlias(emailAliasInput.value || 'customer');
  const domain = sanitizeDomain(emailDomainInput.value || 'catsoft.store');
  const emailAddress = `${alias}@${domain}`;

  emailAliasInput.value = alias || 'customer';
  emailDomainInput.value = domain || 'catsoft.store';
  emailPreviewValue.textContent = emailAddress;
  emailPreviewHint.textContent = `Gunakan ${emailAddress} dan buka webmail domain Anda untuk akses email customer.`;
  emailStatus.textContent = `Email siap digunakan: ${emailAddress}. Pastikan provider email untuk ${domain} sudah aktif.`;

  openMailBtn.disabled = !domain;
}

async function copyEmailAddress() {
  const emailAddress = buildEmailAddress();

  if (!emailAddress.includes('@')) {
    emailStatus.textContent = 'Alias atau domain belum valid. Periksa kembali input email Anda.';
    return;
  }

  try {
    await navigator.clipboard.writeText(emailAddress);
    emailStatus.textContent = `Alamat email ${emailAddress} berhasil disalin.`;
  } catch (error) {
    emailStatus.textContent = 'Gagal menyalin otomatis. Silakan salin alamat email secara manual.';
  }
}

function openMailPortal() {
  const domain = sanitizeDomain(emailDomainInput.value || 'catsoft.store');

  if (!domain) {
    emailStatus.textContent = 'Domain belum valid. Masukkan domain yang benar untuk membuka webmail.';
    return;
  }

  const candidates = [
    `https://mail.${domain}`,
    `https://webmail.${domain}`,
    `https://${domain}`,
    `https://mail.google.com/a/${domain}`
  ];

  const targetUrl = candidates.find((url) => url !== `https://mail.google.com/a/${domain}` || domain.length > 0);
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
  emailStatus.textContent = `Membuka ${targetUrl}. Jika portal tidak bisa diakses, silakan gunakan panel webmail provider domain Anda.`;
}

function initProductOrderButtons() {
  const groups = document.querySelectorAll('.product-card .button-group');

  groups.forEach(group => {
    const buttons = group.querySelectorAll('.btn');

    buttons.forEach((button) => {
      button.classList.remove('active');

      button.addEventListener('click', () => {
        buttons.forEach(item => item.classList.remove('active'));
      });
    });
  });
}

emailAliasInput.addEventListener('input', updateEmailPreview);
emailDomainInput.addEventListener('input', updateEmailPreview);
copyEmailBtn.addEventListener('click', copyEmailAddress);
openMailBtn.addEventListener('click', openMailPortal);

window.addEventListener('DOMContentLoaded', () => {
  updateEmailPreview();
  initProductOrderButtons();
});
