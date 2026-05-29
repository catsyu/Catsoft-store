const tempMailToggle = document.getElementById('tempMailToggle');
const tempMailPanel = document.getElementById('tempMailPanel');
const tempMailAliasInput = document.getElementById('tempMailAlias');
const tempMailDomainInput = document.getElementById('tempMailDomain');
const tempMailAddress = document.getElementById('tempMailAddress');
const copyTempMailAddressBtn = document.getElementById('copyTempMailAddress');
const generateTempMailAddressBtn = document.getElementById('generateTempMailAddress');
const tempMailStatus = document.getElementById('tempMailStatus');
let copyTempMailAddressTimer;
const CATSOFT_EMAIL_DOMAINS = [
  'catsoft.store',
  'catsoft.digital',
  'catsoft.online',
  'ask1q2.uk',
  'fadisa1.uk',
  'gasddqw1.uk',
  'kulamusic.us',
  'wkwkksks.uk'
];
const CATSOFT_DEFAULT_EMAIL_DOMAIN = CATSOFT_EMAIL_DOMAINS[0];
const fallbackTempMailDomains = [...CATSOFT_EMAIL_DOMAINS];
const TEMP_MAIL_PERSON_FIRST_NAMES = [
  'adam',
  'aiden',
  'alex',
  'amelia',
  'anna',
  'arthur',
  'ava',
  'benjamin',
  'caleb',
  'claire',
  'daniel',
  'dylan',
  'elena',
  'elijah',
  'ella',
  'emma',
  'ethan',
  'freddie',
  'gabriel',
  'george',
  'grace',
  'hannah',
  'harper',
  'henry',
  'isla',
  'jack',
  'jacob',
  'james',
  'julian',
  'leo',
  'liam',
  'lily',
  'logan',
  'lucas',
  'lucy',
  'maya',
  'mia',
  'miles',
  'nathan',
  'noah',
  'nolan',
  'oliver',
  'olivia',
  'oscar',
  'owen',
  'ruby',
  'samuel',
  'sarah',
  'sophia',
  'sophie',
  'theo',
  'victoria',
  'william',
  'zoe'
];
const TEMP_MAIL_PERSON_LAST_NAMES = [
  'anderson',
  'bailey',
  'bennett',
  'brooks',
  'carter',
  'clark',
  'coleman',
  'collins',
  'cooper',
  'elliot',
  'ellis',
  'evans',
  'fletcher',
  'foster',
  'grant',
  'hayes',
  'hudson',
  'jordan',
  'miller',
  'morgan',
  'morris',
  'murray',
  'parker',
  'reed',
  'reynolds',
  'russell',
  'spencer',
  'sullivan',
  'taylor',
  'thompson',
  'turner',
  'walker',
  'west',
  'wright'
];
const TEMP_MAIL_NAME_PATTERNS = [
  (first, last) => `${first}.${last}`,
  (first, last) => `${first}${last}`,
  (first, last) => `${first}_${last}`,
  (first, last) => `${first}.${last}${10 + getRandomNumber(90)}`,
  (first, last) => `${first}${last}${10 + getRandomNumber(90)}`
];
const TEMP_MAIL_LEGACY_RANDOM_ALIAS_RE = /^(akses|cloud|inbox|kode|mail|order|otp|pixel|prime|studio)-[a-z0-9]{5}$/;

function normalizeTempMailAlias(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 64);
}

function getRandomNumber(max) {
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function createRandomTempMailAlias() {
  const firstName = TEMP_MAIL_PERSON_FIRST_NAMES[getRandomNumber(TEMP_MAIL_PERSON_FIRST_NAMES.length)];
  const lastName = TEMP_MAIL_PERSON_LAST_NAMES[getRandomNumber(TEMP_MAIL_PERSON_LAST_NAMES.length)];
  const pattern = TEMP_MAIL_NAME_PATTERNS[getRandomNumber(TEMP_MAIL_NAME_PATTERNS.length)];
  return normalizeTempMailAlias(pattern(firstName, lastName));
}

function shouldGenerateTempMailAlias(alias) {
  return !alias
    || alias === tempMailAliasInput.dataset.generatedAlias
    || TEMP_MAIL_LEGACY_RANDOM_ALIAS_RE.test(alias);
}

function buildTempMailAddress() {
  const alias = normalizeTempMailAlias(tempMailAliasInput.value);
  if (!alias) {
    return '';
  }

  const domain = tempMailDomainInput.value || CATSOFT_DEFAULT_EMAIL_DOMAIN;
  return `${alias}@${domain}`;
}

function getAllowedTempMailDomains() {
  if (window.CatsoftSupplierAuth && typeof window.CatsoftSupplierAuth.getAllowedDomains === 'function') {
    const domains = window.CatsoftSupplierAuth.getAllowedDomains();
    return Array.isArray(domains) && domains.length ? domains : fallbackTempMailDomains;
  }

  if (window.CatsoftAdminAuth && window.CatsoftAdminAuth.getCurrentAdmin()) {
    return fallbackTempMailDomains;
  }

  return fallbackTempMailDomains;
}

function renderAllowedTempMailDomains() {
  if (!tempMailDomainInput) {
    return;
  }

  const allowedDomains = getAllowedTempMailDomains();
  tempMailDomainInput.innerHTML = allowedDomains
    .map((domain) => `<option value="${domain}">${domain}</option>`)
    .join('');
}

function updateTempMailAddress() {
  if (!tempMailAliasInput || !tempMailDomainInput || !tempMailAddress) {
    return;
  }

  const alias = normalizeTempMailAlias(tempMailAliasInput.value);
  if (tempMailAliasInput.value !== alias) {
    tempMailAliasInput.value = alias;
  }

  const address = buildTempMailAddress();
  tempMailAddress.textContent = address || 'Klik Generate Email';
  tempMailAddress.classList.toggle('is-empty', !address);
  if (copyTempMailAddressBtn) {
    copyTempMailAddressBtn.disabled = !address;
    resetCopyTempMailButton();
  }
  if (tempMailStatus) {
    tempMailStatus.textContent = '';
  }
}

function setTempMailPanelOpen(isOpen) {
  if (!tempMailToggle || !tempMailPanel) {
    return;
  }

  tempMailPanel.hidden = !isOpen;
  tempMailToggle.classList.toggle('is-open', isOpen);
  tempMailToggle.setAttribute('aria-expanded', String(isOpen));
}

function generateTempMailAddress() {
  if (!tempMailAliasInput) {
    return;
  }

  const currentAlias = normalizeTempMailAlias(tempMailAliasInput.value);
  const shouldGenerate = shouldGenerateTempMailAlias(currentAlias);
  tempMailAliasInput.value = shouldGenerate ? createRandomTempMailAlias() : currentAlias;
  if (shouldGenerate) {
    tempMailAliasInput.dataset.generatedAlias = tempMailAliasInput.value;
  }
  updateTempMailAddress();

  if (tempMailStatus) {
    tempMailStatus.textContent = shouldGenerate ? 'Username otomatis sudah dibuat.' : 'Email siap dipakai.';
  }
}

function resetCopyTempMailButton() {
  if (!copyTempMailAddressBtn) {
    return;
  }

  if (copyTempMailAddressTimer) {
    window.clearTimeout(copyTempMailAddressTimer);
    copyTempMailAddressTimer = undefined;
  }

  copyTempMailAddressBtn.textContent = 'Salin Email';
  copyTempMailAddressBtn.classList.remove('is-copied', 'is-copy-error');
}

function showCopyTempMailFeedback(label, className) {
  if (!copyTempMailAddressBtn) {
    return;
  }

  if (copyTempMailAddressTimer) {
    window.clearTimeout(copyTempMailAddressTimer);
  }

  copyTempMailAddressBtn.textContent = label;
  copyTempMailAddressBtn.classList.toggle('is-copied', className === 'is-copied');
  copyTempMailAddressBtn.classList.toggle('is-copy-error', className === 'is-copy-error');
  copyTempMailAddressTimer = window.setTimeout(resetCopyTempMailButton, 1400);
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
    if (copyTempMailAddressBtn) {
      copyTempMailAddressBtn.focus({ preventScroll: true });
    }
  }

  if (!copied) {
    throw new Error('Copy command was blocked.');
  }
}

async function copyTextToDevice(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Browser or iframe permission can block Clipboard API; continue with legacy copy.
    }
  }

  try {
    fallbackCopyText(text);
    return true;
  } catch (error) {
    return false;
  }
}

async function copyTempMailAddress() {
  let address = buildTempMailAddress();
  if (!address) {
    generateTempMailAddress();
    address = buildTempMailAddress();
  }

  if (!address) {
    return;
  }

  const copied = await copyTextToDevice(address);
  if (tempMailStatus) {
    tempMailStatus.textContent = copied ? 'Email tersalin.' : 'Browser memblokir salin otomatis.';
  }

  if (copied) {
    showCopyTempMailFeedback('Tersalin', 'is-copied');
  } else {
    showCopyTempMailFeedback('Gagal Salin', 'is-copy-error');
  }
}

if (tempMailAliasInput && tempMailDomainInput && tempMailAddress && copyTempMailAddressBtn) {
  renderAllowedTempMailDomains();
  setTempMailPanelOpen(false);
  tempMailAliasInput.value = '';
  updateTempMailAddress();
  if (tempMailToggle && tempMailPanel) {
    tempMailToggle.addEventListener('click', () => {
      setTempMailPanelOpen(tempMailPanel.hidden);
    });
  }
  tempMailAliasInput.addEventListener('input', () => {
    delete tempMailAliasInput.dataset.generatedAlias;
    updateTempMailAddress();
  });
  tempMailDomainInput.addEventListener('change', updateTempMailAddress);
  if (generateTempMailAddressBtn) {
    generateTempMailAddressBtn.addEventListener('click', generateTempMailAddress);
  }
  copyTempMailAddressBtn.addEventListener('click', copyTempMailAddress);
}
