const tempMailAliasInput = document.getElementById('tempMailAlias');
const tempMailDomainInput = document.getElementById('tempMailDomain');
const tempMailAddress = document.getElementById('tempMailAddress');
const copyTempMailAddressBtn = document.getElementById('copyTempMailAddress');
const tempMailStatus = document.getElementById('tempMailStatus');
const fallbackTempMailDomains = ['catsoft.store'];

function normalizeTempMailAlias(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 64);
}

function getSupplierDefaultAlias() {
  const supplier = window.CatsoftSupplierAuth ? window.CatsoftSupplierAuth.getCurrentSupplier() : null;
  const username = supplier ? supplier.username : 'supplier-openai';
  return normalizeTempMailAlias(username) || 'supplier-openai';
}

function buildTempMailAddress() {
  const alias = normalizeTempMailAlias(tempMailAliasInput.value) || getSupplierDefaultAlias();
  const domain = tempMailDomainInput.value || 'catsoft.store';
  return `${alias}@${domain}`;
}

function getAllowedTempMailDomains() {
  if (window.CatsoftSupplierAuth && typeof window.CatsoftSupplierAuth.getAllowedDomains === 'function') {
    const domains = window.CatsoftSupplierAuth.getAllowedDomains();
    return Array.isArray(domains) && domains.length ? domains : fallbackTempMailDomains;
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

  tempMailAddress.textContent = buildTempMailAddress();
  tempMailStatus.textContent = '';
}

async function copyTempMailAddress() {
  const address = buildTempMailAddress();

  try {
    await navigator.clipboard.writeText(address);
    tempMailStatus.textContent = `Email dicopy: ${address}`;
  } catch (error) {
    tempMailStatus.textContent = address;
  }
}

if (tempMailAliasInput && tempMailDomainInput && tempMailAddress && copyTempMailAddressBtn) {
  renderAllowedTempMailDomains();
  tempMailAliasInput.value = getSupplierDefaultAlias();
  updateTempMailAddress();
  tempMailAliasInput.addEventListener('input', updateTempMailAddress);
  tempMailDomainInput.addEventListener('change', updateTempMailAddress);
  copyTempMailAddressBtn.addEventListener('click', copyTempMailAddress);
}
