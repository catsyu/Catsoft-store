(function () {
  const OWNER_USERNAME = 'ownercatsoft';
  const STORAGE_KEY = 'catsoftAdobeMakerGenerator';
  const DOMAINS = (typeof window.getCatsoftEmailDomains === 'function'
    ? window.getCatsoftEmailDomains()
    : Array.isArray(window.CATSOFT_EMAIL_DOMAINS)
      ? window.CATSOFT_EMAIL_DOMAINS
      : [
        'catsoft.store',
        'catsoft.digital',
        'catsoft.online',
        'ask1q2.uk',
        'fadisa1.uk',
        'gasddqw1.uk',
        'kulamusic.us',
        'wkwkksks.uk'
      ])
    .map((domain) => String(domain || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((domain, index, list) => list.indexOf(domain) === index);

  const COUNTRIES = {
    DE: {
      label: 'Jerman',
      phoneCode: '+49',
      phonePrefixes: ['151', '152', '157', '160', '170', '171', '172', '176', '177', '178'],
      firstNames: ['Felix', 'Lukas', 'Jonas', 'Leon', 'Noah', 'Mia', 'Emma', 'Hannah', 'Sophie', 'Clara', 'Lina', 'Marie'],
      lastNames: ['Muller', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter'],
      companyWords: ['Studio', 'Digital', 'Creative', 'Media', 'Design', 'Solutions', 'Works'],
      companySuffixes: ['GmbH', 'UG', 'Group GmbH', 'Holding GmbH'],
      streets: ['Alexanderstrasse', 'Friedrichstrasse', 'Hauptstrasse', 'Bahnhofstrasse', 'Schillerstrasse', 'Kaiserstrasse'],
      cities: [
        { city: 'Berlin', postal: '10115' },
        { city: 'Munich', postal: '80331' },
        { city: 'Hamburg', postal: '20095' },
        { city: 'Cologne', postal: '50667' },
        { city: 'Frankfurt', postal: '60311' },
        { city: 'Stuttgart', postal: '70173' }
      ]
    },
    ES: {
      label: 'Spanyol',
      phoneCode: '+34',
      phonePrefixes: ['6', '7'],
      firstNames: ['Mateo', 'Hugo', 'Lucas', 'Leo', 'Daniel', 'Sofia', 'Lucia', 'Martina', 'Valeria', 'Paula', 'Claudia', 'Alba'],
      lastNames: ['Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Perez', 'Gomez', 'Martin', 'Jimenez', 'Ruiz', 'Hernandez'],
      companyWords: ['Studio', 'Digital', 'Creativo', 'Media', 'Design', 'Vision', 'Lab'],
      companySuffixes: ['SL', 'Group SL', 'Partners SL', 'Labs SL'],
      streets: ['Calle Mayor', 'Gran Via', 'Calle de Alcala', 'Carrer de Mallorca', 'Avenida Diagonal', 'Calle Serrano'],
      cities: [
        { city: 'Madrid', postal: '28001' },
        { city: 'Barcelona', postal: '08001' },
        { city: 'Valencia', postal: '46001' },
        { city: 'Sevilla', postal: '41001' },
        { city: 'Bilbao', postal: '48001' },
        { city: 'Malaga', postal: '29001' }
      ]
    },
    CH: {
      label: 'Swiss',
      phoneCode: '+41',
      phonePrefixes: ['76', '77', '78', '79'],
      firstNames: ['Luca', 'Noah', 'Leon', 'Matteo', 'Elias', 'Mia', 'Emma', 'Lena', 'Lea', 'Sofia', 'Elena', 'Nina'],
      lastNames: ['Meier', 'Muller', 'Schmid', 'Keller', 'Weber', 'Huber', 'Meyer', 'Steiner', 'Frei', 'Brunner'],
      companyWords: ['Studio', 'Digital', 'Creative', 'Media', 'Design', 'Lab', 'Works'],
      companySuffixes: ['AG', 'GmbH', 'Group AG', 'Holding AG'],
      streets: ['Bahnhofstrasse', 'Seefeldstrasse', 'Rue du Rhone', 'Marktgasse', 'Freie Strasse', 'Pilatusstrasse'],
      cities: [
        { city: 'Zurich', postal: '8001' },
        { city: 'Geneva', postal: '1201' },
        { city: 'Basel', postal: '4051' },
        { city: 'Bern', postal: '3011' },
        { city: 'Lausanne', postal: '1003' },
        { city: 'Lucerne', postal: '6003' }
      ]
    },
    ID: {
      label: 'Indonesia',
      phoneCode: '+62',
      phonePrefixes: ['811', '812', '813', '821', '822', '851', '852', '857', '858', '878'],
      firstNames: ['Adi', 'Bima', 'Dimas', 'Fajar', 'Raka', 'Rizky', 'Alya', 'Dinda', 'Nadia', 'Putri', 'Salsa', 'Tiara'],
      lastNames: ['Pratama', 'Wijaya', 'Saputra', 'Santoso', 'Permana', 'Kusuma', 'Lestari', 'Anggraini', 'Wulandari', 'Ramadhani'],
      companyWords: ['Digital', 'Kreatif', 'Media', 'Studio', 'Teknologi', 'Solusi', 'Karya'],
      companySuffixes: ['PT', 'CV', 'Group', 'Studio'],
      streets: ['Jl. Jenderal Sudirman No.', 'Jl. Gatot Subroto No.', 'Jl. Asia Afrika No.', 'Jl. Diponegoro No.', 'Jl. Pemuda No.', 'Jl. Ahmad Yani No.'],
      cities: [
        { city: 'Jakarta', postal: '10220' },
        { city: 'Bandung', postal: '40115' },
        { city: 'Surabaya', postal: '60271' },
        { city: 'Yogyakarta', postal: '55281' },
        { city: 'Denpasar', postal: '80234' },
        { city: 'Medan', postal: '20112' }
      ]
    }
  };

  const root = document.querySelector('[data-adobe-maker-root]');
  const loading = document.querySelector('[data-adobe-maker-loading]');

  if (!root) {
    return;
  }

  const elements = {
    ownerLabel: document.querySelector('[data-owner-label]'),
    form: document.getElementById('adobeMakerForm'),
    country: document.getElementById('makerCountry'),
    domain: document.getElementById('makerDomain'),
    phone: document.getElementById('makerPhone'),
    email: document.getElementById('makerEmail'),
    firstName: document.getElementById('makerFirstName'),
    lastName: document.getElementById('makerLastName'),
    postalCode: document.getElementById('makerPostalCode'),
    company: document.getElementById('makerCompany'),
    address: document.getElementById('makerAddress'),
    copyEmailButton: document.getElementById('copyMakerEmail'),
    copyDataButton: document.getElementById('copyMakerData'),
    generateButton: document.getElementById('generateMakerData'),
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

  function isLocalPreview() {
    return window.location.protocol === 'file:'
      || window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1';
  }

  function showLoading(visible) {
    if (loading) {
      loading.hidden = !visible;
    }
  }

  function setStatus(message) {
    if (elements.status) {
      elements.status.textContent = message;
    }
  }

  function renderLocked() {
    document.body.classList.remove('catsoft-auth-locked');
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

  function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function onlyAscii(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .toLowerCase();
  }

  function formatPhone(countryCode, country) {
    const prefix = randomFrom(country.phonePrefixes);
    if (countryCode === 'ID') {
      return `${country.phoneCode} ${prefix} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`;
    }
    if (countryCode === 'DE') {
      return `${country.phoneCode} ${prefix} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`;
    }
    if (countryCode === 'CH') {
      return `${country.phoneCode} ${prefix} ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`;
    }
    return `${country.phoneCode} ${prefix}${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`;
  }

  function formatCompany(countryCode, lastName, word, suffix) {
    if (countryCode === 'ID') {
      if (suffix === 'PT' || suffix === 'CV') {
        return `${suffix} ${lastName} ${word}`;
      }
      return `${lastName} ${word} ${suffix}`;
    }

    return `${lastName} ${word} ${suffix}`;
  }

  function buildGeneratedData() {
    const countryCode = elements.country.value || 'ES';
    const country = COUNTRIES[countryCode] || COUNTRIES.ES;
    const domain = elements.domain.value || DOMAINS[0];
    const firstName = randomFrom(country.firstNames);
    const lastName = randomFrom(country.lastNames);
    const city = randomFrom(country.cities);
    const street = randomFrom(country.streets);
    const houseNumber = randomInt(8, 188);
    const word = randomFrom(country.companyWords);
    const suffix = randomFrom(country.companySuffixes);
    const email = `${onlyAscii(firstName)}.${onlyAscii(lastName)}${randomInt(10, 99)}@${domain}`;
    const company = formatCompany(countryCode, lastName, word, suffix);
    const address = `${street} ${houseNumber}, ${city.postal} ${city.city}, ${country.label}`;

    return {
      countryCode,
      countryLabel: country.label,
      domain,
      firstName,
      lastName,
      email,
      phone: formatPhone(countryCode, country),
      company,
      postalCode: city.postal,
      city: city.city,
      address,
      updatedAt: new Date().toISOString()
    };
  }

  function collectCurrentData() {
    const countryCode = elements.country.value || 'ES';
    const country = COUNTRIES[countryCode] || COUNTRIES.ES;
    return {
      countryCode,
      countryLabel: country.label,
      domain: elements.domain.value || DOMAINS[0],
      firstName: elements.firstName.value.trim(),
      lastName: elements.lastName.value.trim(),
      email: elements.email.value.trim(),
      phone: elements.phone.value.trim(),
      company: elements.company.value.trim(),
      postalCode: elements.postalCode.value.trim(),
      address: elements.address.value.trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function applyGeneratedData(data) {
    elements.country.value = data.countryCode || 'ES';
    elements.domain.value = data.domain || DOMAINS[0];
    elements.firstName.value = data.firstName || '';
    elements.lastName.value = data.lastName || '';
    elements.email.value = data.email || '';
    elements.phone.value = data.phone || '';
    elements.company.value = data.company || '';
    elements.postalCode.value = data.postalCode || '';
    elements.address.value = data.address || '';
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Local draft is a convenience only. The generator still works without it.
    }
  }

  function readSavedData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function buildSummaryText() {
    const data = collectCurrentData();
    return [
      'Adobe Maker - Data Generator Catsoft',
      `Negara: ${data.countryLabel}`,
      `Email: ${data.email || '-'}`,
      `Nama depan: ${data.firstName || '-'}`,
      `Nama belakang: ${data.lastName || '-'}`,
      `Nomor HP: ${data.phone || '-'}`,
      `Team/perusahaan: ${data.company || '-'}`,
      `Kode pos: ${data.postalCode || '-'}`,
      `Alamat: ${data.address || '-'}`
    ].join('\n');
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

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      return true;
    } catch (error) {
      fallbackCopy(text);
      return true;
    }
  }

  function renderDomainOptions() {
    elements.domain.innerHTML = DOMAINS
      .map((domain) => `<option value="${domain}">${domain}</option>`)
      .join('');
  }

  function generateData(event) {
    if (event) {
      event.preventDefault();
    }

    if (elements.generateButton.disabled) {
      return;
    }

    const originalLabel = elements.generateButton.textContent;
    elements.generateButton.disabled = true;
    elements.generateButton.textContent = 'Membuat...';

    window.setTimeout(() => {
      const data = buildGeneratedData();
      applyGeneratedData(data);
      saveData(data);
      setStatus(`Data ${data.countryLabel} berhasil dibuat dengan domain ${data.domain}.`);
      elements.generateButton.disabled = false;
      elements.generateButton.textContent = originalLabel;
    }, 160);
  }

  async function copyEmail() {
    const email = elements.email.value.trim();
    if (!email) {
      setStatus('Generate data terlebih dulu sebelum menyalin email.');
      return;
    }
    await copyText(email);
    setStatus('Email sudah disalin.');
  }

  async function copyData() {
    const data = collectCurrentData();
    if (!data.email || !data.firstName || !data.address) {
      setStatus('Generate data terlebih dulu sebelum menyalin semua data.');
      return;
    }
    await copyText(buildSummaryText());
    setStatus('Semua data generator sudah disalin.');
  }

  function bindEvents() {
    elements.form.addEventListener('submit', generateData);
    elements.copyEmailButton.addEventListener('click', copyEmail);
    elements.copyDataButton.addEventListener('click', copyData);
    [
      elements.country,
      elements.domain,
      elements.phone,
      elements.email,
      elements.firstName,
      elements.lastName,
      elements.postalCode,
      elements.company,
      elements.address
    ].forEach((element) => {
      element.addEventListener('input', () => saveData(collectCurrentData()));
      element.addEventListener('change', () => saveData(collectCurrentData()));
    });
  }

  function showApp(admin, message = '') {
    if (elements.ownerLabel) {
      elements.ownerLabel.textContent = admin && admin.username ? admin.username : 'OwnerCatsoft';
    }
    renderDomainOptions();
    const saved = readSavedData();
    if (saved.email) {
      applyGeneratedData(saved);
    } else {
      applyGeneratedData(buildGeneratedData());
    }
    bindEvents();
    showLoading(false);
    root.hidden = false;
    setStatus(message || 'Data siap. Klik Generate Data untuk membuat identitas sintetis baru.');
  }

  function init() {
    const admin = getCurrentAdmin();

    if (isLocalPreview() && !window.CATSOFT_ADMIN_AUTHORIZED) {
      showApp({ username: 'Preview lokal', role: 'owner' }, 'Preview lokal aktif. Di production, halaman ini tetap dikunci untuk OwnerCatsoft.');
      return;
    }

    if (!admin) {
      showLoading(false);
      if (document.querySelector('.admin-login-page')) {
        return;
      }
      renderLocked();
      return;
    }

    if (!isOwner(admin)) {
      renderLocked();
      return;
    }

    showApp(admin);
  }

  init();
})();
