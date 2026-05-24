const faqItems = document.querySelectorAll('.faq-item');
const whatsappNumber = '6282318082303';

const productPackages = {
  chatgpt: {
    name: 'ChatGPT Plus',
    plans: [
      {
        value: 'private',
        label: 'Private — Rp580.000',
        name: 'Private',
        price: 'Rp580.000',
        duration: '27–30 hari',
        terms: 'Private, dibantu aktivasi oleh admin'
      },
      {
        value: 'sharing-2',
        label: 'Sharing 2 User — Rp200.000',
        name: 'Sharing 2 User',
        price: 'Rp200.000',
        duration: '27–30 hari',
        terms: 'Sharing 2 user, akses 2 device sesuai ketentuan'
      },
      {
        value: 'sharing-4',
        label: 'Sharing 4 User — Rp105.000',
        name: 'Sharing 4 User',
        price: 'Rp105.000',
        duration: '27–30 hari',
        terms: 'Sharing 4 user, akses 2 device sesuai ketentuan'
      },
      {
        value: 'sharing-7-10',
        label: 'Sharing 7–10 User — Rp42.500',
        name: 'Sharing 7–10 User',
        price: 'Rp42.500',
        duration: '27–30 hari',
        terms: 'Sharing 7–10 user, penggunaan mengikuti panduan admin'
      }
    ]
  },
  canva: {
    name: 'Canva Pro',
    plans: [
      {
        value: '1-bulan',
        label: '1 Bulan — Rp25.000',
        name: '1 Bulan',
        price: 'Rp25.000',
        duration: '1 bulan',
        terms: 'Aktivasi ke email Canva pembeli'
      },
      {
        value: '3-bulan',
        label: '3 Bulan — Rp70.000',
        name: '3 Bulan',
        price: 'Rp70.000',
        duration: '3 bulan',
        terms: 'Aktivasi ke email Canva pembeli'
      },
      {
        value: '6-bulan',
        label: '6 Bulan — Rp135.000',
        name: '6 Bulan',
        price: 'Rp135.000',
        duration: '6 bulan',
        terms: 'Aktivasi ke email Canva pembeli'
      },
      {
        value: '1-tahun',
        label: '1 Tahun — Rp270.000',
        name: '1 Tahun',
        price: 'Rp270.000',
        duration: '1 tahun',
        terms: 'Aktivasi ke email Canva pembeli'
      }
    ]
  },
  capcut: {
    name: 'CapCut Pro',
    plans: [
      {
        value: 'sharing-1-bulan',
        label: 'Sharing 1 Bulan — Rp45.566',
        name: 'Sharing 1 Bulan',
        price: 'Rp45.566',
        duration: '1 bulan',
        terms: 'Sharing, support HP & PC/Laptop sesuai ketentuan'
      },
      {
        value: 'private-1-bulan',
        label: 'Private 1 Bulan — Rp106.397',
        name: 'Private 1 Bulan',
        price: 'Rp106.397',
        duration: '1 bulan',
        terms: 'Private, support HP & PC/Laptop sesuai ketentuan'
      }
    ]
  }
};

faqItems.forEach((item) => {
  const question = item.querySelector('.faq-question');

  if (question) {
    question.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  }
});

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    mobileMenuToggle.classList.toggle('active', isOpen);
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      mobileMenuToggle.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (event) => {
    if (!navLinks.classList.contains('open')) {
      return;
    }

    if (!navLinks.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
      navLinks.classList.remove('open');
      mobileMenuToggle.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const termsModal = document.getElementById('termsModal');
const openTerms = document.getElementById('openTermsLink');
const closeTerms = document.getElementById('closeTerms');

if (openTerms && closeTerms && termsModal) {
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
}

const quickOrderForm = document.getElementById('quickOrderForm');
const customerNameInput = document.getElementById('customerName');
const customerContactInput = document.getElementById('customerContact');
const orderProductSelect = document.getElementById('orderProduct');
const orderPlanSelect = document.getElementById('orderPlan');
const orderNoteInput = document.getElementById('orderNote');
const canvaEmailField = document.getElementById('canvaEmailField');
const canvaActivationEmailInput = document.getElementById('canvaActivationEmail');
const consultationBtn = document.getElementById('consultationBtn');
const orderFormStatus = document.getElementById('orderFormStatus');
const summaryProduct = document.getElementById('summaryProduct');
const summaryPrice = document.getElementById('summaryPrice');
const summaryPlan = document.getElementById('summaryPlan');
const summaryDuration = document.getElementById('summaryDuration');
const summaryTerms = document.getElementById('summaryTerms');
const adminStatus = document.getElementById('adminStatus');
const adminStatusText = document.getElementById('adminStatusText');

const validationMessages = {
  customerName: {
    valueMissing: 'Nama wajib diisi.'
  },
  customerContact: {
    valueMissing: 'Kontak wajib diisi.'
  },
  orderProduct: {
    valueMissing: 'Pilih produk.'
  },
  orderPlan: {
    valueMissing: 'Pilih paket.'
  },
  canvaActivationEmail: {
    valueMissing: 'Email Canva wajib diisi.',
    typeMismatch: 'Email Canva tidak valid.'
  }
};

function isFieldAvailable(field) {
  return field && !field.disabled && !field.closest('.is-hidden');
}

function hasValidEmailDomain(value) {
  const email = value.trim();
  const parts = email.split('@');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }

  const domainLabels = parts[1].toLowerCase().split('.');
  const topLevelDomain = domainLabels[domainLabels.length - 1];

  if (domainLabels.length < 2 || !/^[a-z]{2,24}$/.test(topLevelDomain)) {
    return false;
  }

  return domainLabels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

function getValidationMessage(field) {
  if (!isFieldAvailable(field)) {
    return '';
  }

  const messages = validationMessages[field.id] || {};
  const value = field.value.trim();

  if (field.required && !value) {
    return messages.valueMissing || 'Lengkapi bagian ini dulu ya agar order bisa diproses.';
  }

  if (field.validity.typeMismatch) {
    return messages.typeMismatch || 'Format data belum sesuai. Cek lagi sebentar ya.';
  }

  if (field.id === 'canvaActivationEmail' && value && !hasValidEmailDomain(value)) {
    return messages.typeMismatch || 'Email Canva tidak valid.';
  }

  return '';
}

function getFieldErrorElement(field) {
  const fieldGroup = field.closest('.field-group');

  if (!fieldGroup) {
    return null;
  }

  let errorElement = fieldGroup.querySelector('.field-alert');

  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'field-alert';
    errorElement.id = `${field.id}Alert`;
    errorElement.setAttribute('role', 'alert');
    fieldGroup.appendChild(errorElement);
  }

  return errorElement;
}

function showFieldError(field, message) {
  const fieldGroup = field.closest('.field-group');
  const errorElement = getFieldErrorElement(field);

  if (!fieldGroup || !errorElement) {
    return;
  }

  fieldGroup.classList.add('has-error');
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', errorElement.id);
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearFieldError(field) {
  const fieldGroup = field.closest('.field-group');
  const errorElement = fieldGroup ? fieldGroup.querySelector('.field-alert') : null;

  if (fieldGroup) {
    fieldGroup.classList.remove('has-error');
  }

  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  field.setCustomValidity('');

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.hidden = true;
  }
}

function validateField(field, shouldShowError = true) {
  clearFieldError(field);

  const message = getValidationMessage(field);

  if (!message) {
    return true;
  }

  field.setCustomValidity(message);

  if (shouldShowError) {
    showFieldError(field, message);
  }

  return false;
}

function getOrderFields() {
  if (!quickOrderForm) {
    return [];
  }

  return Array.from(quickOrderForm.querySelectorAll('input, select, textarea')).filter(isFieldAvailable);
}

function validatePreviousFields(currentField) {
  const fields = getOrderFields();
  const currentIndex = fields.indexOf(currentField);

  if (currentIndex <= 0) {
    return;
  }

  fields.slice(0, currentIndex).forEach((field) => {
    validateField(field, true);
  });
}

function validateOrderForm() {
  const fields = getOrderFields();
  let firstInvalidField = null;

  fields.forEach((field) => {
    if (!validateField(field, true) && !firstInvalidField) {
      firstInvalidField = field;
    }
  });

  if (firstInvalidField) {
    firstInvalidField.focus();

    if (orderFormStatus) {
      orderFormStatus.textContent = 'Lengkapi data yang ditandai.';
    }

    return false;
  }

  return true;
}

function initThemedFormValidation() {
  if (!quickOrderForm) {
    return;
  }

  quickOrderForm.noValidate = true;

  quickOrderForm.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('blur', () => {
      validateField(field, true);
    });

    field.addEventListener('focus', () => {
      validatePreviousFields(field);
    });

    field.addEventListener('input', () => {
      validateField(field, field.closest('.has-error') !== null);
    });

    field.addEventListener('change', () => {
      validateField(field, field.closest('.has-error') !== null);
    });
  });
}

function getSelectedPackage() {
  const productKey = orderProductSelect.value;
  const product = productPackages[productKey] || productPackages.chatgpt;
  const plan = product.plans.find((item) => item.value === orderPlanSelect.value) || product.plans[0];

  return { product, plan };
}

function populatePlanOptions(preferredPlan) {
  if (!orderProductSelect || !orderPlanSelect) {
    return;
  }

  const product = productPackages[orderProductSelect.value] || productPackages.chatgpt;
  const selectedPlan = preferredPlan || orderPlanSelect.value || product.plans[0].value;

  orderPlanSelect.innerHTML = '';

  product.plans.forEach((plan) => {
    const option = document.createElement('option');
    option.value = plan.value;
    option.textContent = plan.label;
    orderPlanSelect.appendChild(option);
  });

  const hasSelectedPlan = product.plans.some((plan) => plan.value === selectedPlan);
  orderPlanSelect.value = hasSelectedPlan ? selectedPlan : product.plans[0].value;
}

function updateOrderSummary() {
  if (!orderProductSelect || !orderPlanSelect || !summaryProduct || !summaryPrice || !summaryPlan || !summaryDuration || !summaryTerms) {
    return;
  }

  const { product, plan } = getSelectedPackage();
  const isCanvaOrder = orderProductSelect.value === 'canva';

  summaryProduct.textContent = product.name;
  summaryPrice.textContent = plan.price;
  summaryPlan.textContent = plan.name;
  summaryDuration.textContent = plan.duration;
  summaryTerms.textContent = plan.terms;

  if (canvaEmailField && canvaActivationEmailInput) {
    canvaEmailField.classList.toggle('is-hidden', !isCanvaOrder);
    canvaActivationEmailInput.required = isCanvaOrder;
    canvaActivationEmailInput.disabled = !isCanvaOrder;
    clearFieldError(canvaActivationEmailInput);
  }
}

function selectOrderPackage(productKey, planKey) {
  if (!orderProductSelect || !orderPlanSelect) {
    return;
  }

  if (productPackages[productKey]) {
    orderProductSelect.value = productKey;
  }

  populatePlanOptions(planKey);
  updateOrderSummary();
}

function buildOrderMessage() {
  const { product, plan } = getSelectedPackage();
  const customerName = customerNameInput.value.trim();
  const customerContact = customerContactInput.value.trim();
  const canvaActivationEmail = canvaActivationEmailInput ? canvaActivationEmailInput.value.trim() : '';
  const orderNote = orderNoteInput.value.trim() || '-';

  const messageLines = [
    'Halo Min Catsoft, saya ingin order produk premium.',
    '',
    `Nama: ${customerName}`,
    `Email/WhatsApp: ${customerContact}`,
    `Produk: ${product.name}`
  ];

  if (orderProductSelect.value === 'canva') {
    messageLines.push(`Email Canva untuk aktivasi: ${canvaActivationEmail || '-'}`);
  }

  messageLines.push(
    `Paket: ${plan.name}`,
    `Harga: ${plan.price}`,
    `Masa aktif: ${plan.duration}`,
    `Catatan: ${orderNote}`,
    '',
    'Mohon dibantu konfirmasi stok, ketentuan, dan proses aktivasinya.'
  );

  return messageLines.join('\n');
}

function buildConsultationMessage() {
  const { product, plan } = getSelectedPackage();
  const customerName = customerNameInput.value.trim();
  const customerContact = customerContactInput.value.trim();
  const messageLines = [
    'Halo Min Catsoft, saya ingin konsultasi dulu sebelum order.',
    '',
    `Nama: ${customerName}`,
    `Email/WhatsApp: ${customerContact}`,
    `Produk yang ditanyakan: ${product.name}`,
    `Paket yang dipertanyakan: ${plan.name}`,
    `Harga paket: ${plan.price}`
  ];

  messageLines.push(
    '',
    'Mohon dibantu info stok, ketentuan, dan rekomendasinya.'
  );

  return messageLines.join('\n');
}

function initQuickOrderForm() {
  if (!quickOrderForm || !orderProductSelect || !orderPlanSelect) {
    return;
  }

  populatePlanOptions();
  updateOrderSummary();

  orderProductSelect.addEventListener('change', () => {
    populatePlanOptions();
    updateOrderSummary();
  });

  orderPlanSelect.addEventListener('change', updateOrderSummary);

  quickOrderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateOrderForm()) {
      return;
    }

    const message = buildOrderMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (orderFormStatus) {
      orderFormStatus.textContent = 'Pesan order sudah disiapkan. Lanjutkan kirim di WhatsApp agar admin bisa memproses.';
    }
  });

  if (consultationBtn) {
    consultationBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const hasValidName = validateField(customerNameInput, true);
      const hasValidContact = validateField(customerContactInput, true);

      if (!hasValidName || !hasValidContact) {
        (hasValidName ? customerContactInput : customerNameInput).focus();

        if (orderFormStatus) {
          orderFormStatus.textContent = 'Lengkapi nama dan kontak dulu.';
        }

        return;
      }

      const message = buildConsultationMessage();
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      if (orderFormStatus) {
        orderFormStatus.textContent = 'Pesan konsultasi sudah disiapkan sesuai nama dan produk yang dipilih.';
      }
    });
  }

  document.querySelectorAll('[data-order-product]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      selectOrderPackage(trigger.dataset.orderProduct, trigger.dataset.orderPlan);
    });
  });
}

function getJakartaTimeParts() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  });

  return formatter.formatToParts(new Date()).reduce((parts, item) => {
    parts[item.type] = item.value;
    return parts;
  }, {});
}

function updateAdminStatus() {
  if (!adminStatus || !adminStatusText) {
    return;
  }

  const parts = getJakartaTimeParts();
  const weekday = parts.weekday;
  const hour = Number(parts.hour);
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const openHour = isWeekend ? 9 : 8;
  const closeHour = 22;
  const isOnline = hour >= openHour && hour < closeHour;
  const openLabel = `${String(openHour).padStart(2, '0')}.00`;

  adminStatus.classList.toggle('online', isOnline);
  adminStatus.classList.toggle('offline', !isOnline);

  if (isOnline) {
    adminStatusText.textContent = `Admin sedang online sampai 22.00 WIB. Order diproses sesuai antrean masuk.`;
    return;
  }

  if (hour < openHour) {
    adminStatusText.textContent = `Admin belum online. Jam operasional hari ini mulai ${openLabel}–22.00 WIB.`;
    return;
  }

  adminStatusText.textContent = 'Admin sedang offline. Order tetap bisa dikirim dan akan dibalas saat jam operasional berikutnya.';
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

  const targetUrl = candidates[0];
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

if (emailAliasInput && emailDomainInput && emailPreviewValue && emailPreviewHint && emailStatus && copyEmailBtn && openMailBtn) {
  emailAliasInput.addEventListener('input', updateEmailPreview);
  emailDomainInput.addEventListener('input', updateEmailPreview);
  copyEmailBtn.addEventListener('click', copyEmailAddress);
  openMailBtn.addEventListener('click', openMailPortal);

  window.addEventListener('DOMContentLoaded', () => {
    updateEmailPreview();
  });
}

window.addEventListener('DOMContentLoaded', initProductOrderButtons);
window.addEventListener('DOMContentLoaded', initThemedFormValidation);
window.addEventListener('DOMContentLoaded', initQuickOrderForm);
window.addEventListener('DOMContentLoaded', () => {
  updateAdminStatus();
  setInterval(updateAdminStatus, 60000);
});
