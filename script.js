const faqItems = document.querySelectorAll('.faq-item');
const whatsappNumber = '6282318082303';
const trackingStorageKey = 'catsoftClickTracking';

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
  },
  likeig: {
    name: 'Like IG Bergaransi Permanen',
    plans: [
      {
        value: '100-like',
        label: '100 Like — Rp16.500',
        name: '100 Like',
        price: 'Rp16.500',
        duration: 'Proses bertahap',
        terms: 'Real Indo terpercaya, aman, tanpa password, garansi refill 7 hari'
      },
      {
        value: '500-like',
        label: '500 Like — Rp44.000',
        name: '500 Like',
        price: 'Rp44.000',
        duration: 'Proses bertahap',
        terms: 'Real Indo terpercaya, aman, tanpa password, garansi refill 7 hari'
      },
      {
        value: '1000-like',
        label: '1000 Like — Rp65.500',
        name: '1000 Like',
        price: 'Rp65.500',
        duration: 'Proses bertahap',
        terms: 'Real Indo terpercaya, aman, tanpa password, garansi refill 7 hari'
      }
    ]
  }
};

const chatgptUsageRules = [
  'Selalu backup project anda',
  'Dilarang mengubah pengaturan akun',
  'Dilarang mengaktifkan memori',
  'Dilarang melakukan kustomisasi instruksi',
  'Hindari membahas konten sensitif',
  'Dilarang menggunakan VPN',
  'Dilarang menghapus chat pengguna lain',
  'Dilarang mengeluarkan pengguna lain dari grup',
  'Dilarang ganti device'
];

const productDetailContent = {
  chatgpt: {
    label: 'ChatGPT Plus',
    title: 'ChatGPT Plus',
    lead: 'Paket terbaik untuk pekerjaan, riset, coding, menulis konten, dan kebutuhan AI harian dengan opsi private maupun sharing.',
    summary: [
      'Private, sharing 2 user, sharing 4 user, dan sharing 7–10 user tersedia.',
      'Garansi masa langganan 27–30 hari sesuai paket yang dipilih.',
      'Akses 2 device untuk paket sharing 2 dan 4 user.',
      'Admin Catsoft akan membantu aktivasi dan menjelaskan penggunaan dasar.'
    ],
    terms: [
      'Paket private cocok untuk 1 akun utama atau penggunaan personal.',
      'Paket sharing memiliki batas jumlah user dan mekanisme akses yang berbeda.',
      'Klaim garansi harus diajukan lewat WhatsApp dengan detail kendala yang jelas.',
      'Customer tetap wajib menjaga keamanan akun dan tidak menyebarluaskan akses tanpa izin.'
    ],
    note: 'Pastikan email atau nomor kontak yang diisi aktif agar admin dapat membalas dengan cepat.',
    orderProduct: 'chatgpt',
    orderPlan: 'private'
  },
  canva: {
    label: 'Canva Pro',
    title: 'Canva Pro',
    lead: 'Langganan desain premium untuk presentasi, konten social media, branding, dan kebutuhan visual harian.',
    summary: [
      'Pilihan paket 1 bulan, 3 bulan, 6 bulan, dan 1 tahun.',
      'Aktivasi dilakukan ke email Canva pembeli.',
      'Panduan aktivasi dan support admin disediakan setelah order.',
      'Paket tahunan cocok untuk kebutuhan jangka panjang dan tim kecil.'
    ],
    terms: [
      'Email Canva harus ditulis dengan benar agar aktivasi dapat berjalan lancar.',
      'Garansi berlaku selama masa aktif paket dan mengikuti ketentuan Catsoft.',
      'Kendala karena salah email atau salah paket tidak dapat dianggap sebagai kelalaian seller.',
      'Admin akan membantu pengecekan jika akses tidak dapat digunakan setelah aktivasi.'
    ],
    note: 'Pastikan email Canva sudah siap sebelum order.',
    orderProduct: 'canva',
    orderPlan: '1-bulan'
  },
  capcut: {
    label: 'CapCut Pro',
    title: 'CapCut Pro',
    lead: 'Fitur editing video premium tanpa watermark untuk konten promosi, edukasi, dan kebutuhan kreatif di HP maupun PC/Laptop.',
    summary: [
      'Tersedia paket sharing 1 bulan dan private 1 bulan.',
      'Export video tanpa watermark untuk kebutuhan konten profesional.',
      'Support tersedia untuk HP dan PC/Laptop.',
      'Admin akan membantu aktivasi serta memastikan paket cocok dengan perangkat Anda.'
    ],
    terms: [
      'Paket sharing cocok untuk kebutuhan bersama, sedangkan private cocok untuk penggunaan personal.',
      'Pelanggaran penggunaan dapat memengaruhi layanan sesuai ketentuan Catsoft.'
    ],
    note: 'Jika Anda belum yakin paket mana yang cocok, gunakan konsultasi dulu sebelum order.',
    orderProduct: 'capcut',
    orderPlan: 'sharing-1-bulan'
  },
  likeig: {
    label: 'Like IG Bergaransi Permanen',
    title: 'Like IG Bergaransi Permanen',
    lead: 'Paket like Instagram real Indo terpercaya untuk menaikkan engagement secara bertahap, cepat, aman, dan praktis tanpa perlu password.',
    summary: [
      'Tersedia paket 100 Like, 500 Like, dan 1000 Like.',
      'Likes naik secara alami dan bertahap.',
      'Aman dari banned selama instruksi produk diikuti.',
      '100% real, aman, dan bergaransi sesuai ketentuan.',
      'Cukup kirim link postingan Instagram setelah checkout.'
    ],
    terms: [
      'Akun Instagram wajib public selama proses berlangsung.',
      'Dilarang menghapus postingan atau mengubah akun menjadi private selama proses.',
      'Garansi refill berlaku 7 hari.',
      'Produk digital, tidak ada pengiriman fisik.',
      'Membeli berarti setuju dengan kebijakan pada foto produk maupun deskripsi.'
    ],
    note: 'Silakan chat admin Catsoft kalau ada yang ingin ditanyakan sebelum membeli.',
    orderProduct: 'likeig',
    orderPlan: '100-like'
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
const openTermsLinks = document.querySelectorAll('#openTermsLink, #orderTermsLink');
const closeTerms = document.getElementById('closeTerms');
const productDetailModal = document.getElementById('productDetailModal');
const productDetailLabel = document.getElementById('productDetailLabel');
const productDetailTitle = document.getElementById('productDetailTitle');
const productDetailLead = document.getElementById('productDetailLead');
const productDetailSummary = document.getElementById('productDetailSummary');
const productDetailTerms = document.getElementById('productDetailTerms');
const productDetailNote = document.getElementById('productDetailNote');
const productDetailPolicy = document.getElementById('productDetailPolicy');
const productDetailOrder = document.getElementById('productDetailOrder');
const closeProductDetail = document.getElementById('closeProductDetail');
const closeProductDetailBtn = document.getElementById('closeProductDetailBtn');
const trackingModal = document.getElementById('trackingModal');
const closeTracking = document.getElementById('closeTracking');
const trackingStats = document.getElementById('trackingStats');
const trackingRows = document.getElementById('trackingRows');
const trackingStatus = document.getElementById('trackingStatus');
const copyTracking = document.getElementById('copyTracking');
const downloadTracking = document.getElementById('downloadTracking');
const resetTracking = document.getElementById('resetTracking');

let activeProductDetailKey = null;

if (closeTerms && termsModal) {
  openTermsLinks.forEach((openTermsLink) => {
    openTermsLink.addEventListener('click', (e) => {
      e.preventDefault();
      termsModal.classList.add('active');

      const url = new URL(window.location.href);
      url.searchParams.set('terms', 'open');
      history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    });
  });

  closeTerms.addEventListener('click', () => {
    termsModal.classList.remove('active');

    const url = new URL(window.location.href);
    url.searchParams.delete('terms');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  });

  termsModal.addEventListener('click', (e) => {
    if (e.target === termsModal) {
      termsModal.classList.remove('active');

      const url = new URL(window.location.href);
      url.searchParams.delete('terms');
      history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  });

  const params = new URLSearchParams(window.location.search);

  if (params.get('terms') === 'open') {
    termsModal.classList.add('active');
  }
}

function createDetailListItems(targetElement, items) {
  if (!targetElement) {
    return;
  }

  targetElement.innerHTML = '';

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    targetElement.appendChild(listItem);
  });
}

function closeProductDetailModal() {
  if (!productDetailModal) {
    return;
  }

  productDetailModal.classList.remove('active');
  productDetailModal.setAttribute('aria-hidden', 'true');
  activeProductDetailKey = null;
}

function renderProductPolicy(productKey) {
  if (!productDetailPolicy) {
    return;
  }

  productDetailPolicy.innerHTML = '';
  productDetailPolicy.classList.add('is-hidden');

  if (productKey !== 'chatgpt') {
    return;
  }

  const title = document.createElement('p');
  title.className = 'product-detail-policy-title';
  title.textContent = '⚠️ PERATURAN PENGGUNAAN CHATGPT 🚀✨';

  const list = document.createElement('ol');
  list.className = 'product-detail-policy-list';

  chatgptUsageRules.forEach((rule) => {
    const item = document.createElement('li');
    item.textContent = rule;
    list.appendChild(item);
  });

  const footer = document.createElement('p');
  footer.className = 'product-detail-policy-footer';
  footer.textContent = '⛔️Jika ditemukan melanggar salah satu peraturan diatas, garansi akan otomatis hangus⛔️';

  productDetailPolicy.append(title, list, footer);
  productDetailPolicy.classList.remove('is-hidden');
}

function openProductDetail(productKey) {
  if (!productDetailModal || !productDetailContent[productKey]) {
    return;
  }

  const detail = productDetailContent[productKey];

  activeProductDetailKey = productKey;
  productDetailLabel.textContent = detail.label;
  productDetailTitle.textContent = detail.title;
  productDetailLead.textContent = detail.lead;
  createDetailListItems(productDetailSummary, detail.summary);
  createDetailListItems(productDetailTerms, detail.terms);
  productDetailNote.textContent = detail.note;
  renderProductPolicy(productKey);
  productDetailModal.classList.add('active');
  productDetailModal.setAttribute('aria-hidden', 'false');
}

if (productDetailModal) {
  productDetailModal.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
      closeProductDetailModal();
    }
  });
}

if (closeProductDetail) {
  closeProductDetail.addEventListener('click', closeProductDetailModal);
}

if (closeProductDetailBtn) {
  closeProductDetailBtn.addEventListener('click', closeProductDetailModal);
}

if (productDetailOrder) {
  productDetailOrder.addEventListener('click', () => {
    if (!activeProductDetailKey || !productDetailContent[activeProductDetailKey]) {
      return;
    }

    const detail = productDetailContent[activeProductDetailKey];

    closeProductDetailModal();
    selectOrderPackage(detail.orderProduct, detail.orderPlan, true);

    const orderSection = document.getElementById('order');

    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

document.querySelectorAll('[data-product-detail]').forEach((button) => {
  button.addEventListener('click', () => {
    openProductDetail(button.dataset.productDetail);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && productDetailModal?.classList.contains('active')) {
    closeProductDetailModal();
  }
});

function getTrackingEvents() {
  try {
    const savedEvents = JSON.parse(localStorage.getItem(trackingStorageKey) || '[]');
    return Array.isArray(savedEvents) ? savedEvents : [];
  } catch (error) {
    return [];
  }
}

function saveTrackingEvents(events) {
  localStorage.setItem(trackingStorageKey, JSON.stringify(events.slice(-500)));
}

function getClickSource(element) {
  const section = element.closest('section');

  if (section && section.id) {
    return section.id;
  }

  if (element.closest('footer')) {
    return 'footer';
  }

  if (element.closest('header')) {
    return 'header';
  }

  return 'page';
}

function trackClick(type, label, details = {}) {
  const events = getTrackingEvents();
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toISOString(),
    type,
    label,
    product: details.product || '',
    plan: details.plan || '',
    source: details.source || '',
    target: details.target || ''
  };

  events.push(event);
  saveTrackingEvents(events);

  if (trackingModal && trackingModal.classList.contains('active')) {
    renderTrackingPanel();
  }

  return event;
}

function countTrackingEvents(events, matcher) {
  return events.filter(matcher).length;
}

function getTopProduct(events) {
  const counts = events.reduce((result, event) => {
    if (!event.product) {
      return result;
    }

    result[event.product] = (result[event.product] || 0) + 1;
    return result;
  }, {});

  const sortedProducts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sortedProducts[0] || null;
}

function formatTrackingTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function createTrackingStat(value, label) {
  const item = document.createElement('div');
  const valueElement = document.createElement('strong');
  const labelElement = document.createElement('span');

  item.className = 'tracking-stat';
  valueElement.textContent = value;
  labelElement.textContent = label;
  item.append(valueElement, labelElement);

  return item;
}

function getTrackingSummaryText() {
  const events = getTrackingEvents();
  const topProduct = getTopProduct(events);
  const lines = [
    'Ringkasan Tracking Catsoft',
    `Total klik: ${events.length}`,
    `WhatsApp: ${countTrackingEvents(events, (event) => event.type === 'whatsapp')}`,
    `Shopee: ${countTrackingEvents(events, (event) => event.type === 'shopee')}`,
    `Klik produk: ${countTrackingEvents(events, (event) => event.type === 'produk')}`,
    `Produk teratas: ${topProduct ? `${topProduct[0]} (${topProduct[1]} klik)` : '-'}`
  ];

  return lines.join('\n');
}

function renderTrackingPanel() {
  if (!trackingStats || !trackingRows) {
    return;
  }

  const events = getTrackingEvents();
  const topProduct = getTopProduct(events);
  const latestEvents = [...events].reverse().slice(0, 80);

  trackingStats.innerHTML = '';
  trackingStats.append(
    createTrackingStat(events.length, 'Total klik'),
    createTrackingStat(countTrackingEvents(events, (event) => event.type === 'whatsapp'), 'Klik WhatsApp'),
    createTrackingStat(countTrackingEvents(events, (event) => event.type === 'shopee'), 'Klik Shopee'),
    createTrackingStat(topProduct ? `${topProduct[0]} (${topProduct[1]})` : '-', 'Produk teratas')
  );

  trackingRows.innerHTML = '';

  if (!latestEvents.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'tracking-empty';
    cell.colSpan = 5;
    cell.textContent = 'Belum ada klik yang tercatat di browser ini.';
    row.appendChild(cell);
    trackingRows.appendChild(row);
    return;
  }

  latestEvents.forEach((event) => {
    const row = document.createElement('tr');
    const cells = [
      formatTrackingTime(event.time),
      event.type,
      event.label,
      event.product || '-',
      event.plan || '-'
    ];

    cells.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    trackingRows.appendChild(row);
  });
}

function openTrackingPanel() {
  if (!trackingModal) {
    return;
  }

  trackingModal.classList.add('active');
  renderTrackingPanel();
}

function closeTrackingPanel() {
  if (!trackingModal) {
    return;
  }

  trackingModal.classList.remove('active');

  const url = new URL(window.location.href);
  url.searchParams.delete('tracking');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function getTrackingCsv() {
  const rows = [
    ['time', 'type', 'label', 'product', 'plan', 'source', 'target'],
    ...getTrackingEvents().map((event) => [
      event.time,
      event.type,
      event.label,
      event.product,
      event.plan,
      event.source,
      event.target
    ])
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadTrackingCsv() {
  const blob = new Blob([getTrackingCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `catsoft-click-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function initClickTracking() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (!link) {
      return;
    }

    const label = link.textContent.trim() || link.getAttribute('aria-label') || 'Link';
    const href = link.getAttribute('href') || '';

    if (link.dataset.orderProduct) {
      const product = productPackages[link.dataset.orderProduct]?.name || link.dataset.orderProduct;
      const plan = productPackages[link.dataset.orderProduct]?.plans.find((item) => item.value === link.dataset.orderPlan)?.name || link.dataset.orderPlan;

      trackClick('produk', label, {
        product,
        plan,
        source: getClickSource(link),
        target: '#order'
      });

      return;
    }

    if (href.includes('wa.me/')) {
      trackClick('whatsapp', label, {
        source: getClickSource(link),
        target: href
      });
      return;
    }

    if (href.includes('shopee.co.id')) {
      trackClick('shopee', label, {
        source: getClickSource(link),
        target: href
      });
    }
  });

  if (trackingModal) {
    const params = new URLSearchParams(window.location.search);

    if (params.get('tracking') === 'open') {
      openTrackingPanel();
    }

    trackingModal.addEventListener('click', (event) => {
      if (event.target === trackingModal) {
        closeTrackingPanel();
      }
    });
  }

  if (closeTracking) {
    closeTracking.addEventListener('click', closeTrackingPanel);
  }

  if (copyTracking) {
    copyTracking.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(getTrackingSummaryText());
        trackingStatus.textContent = 'Ringkasan tracking berhasil disalin.';
      } catch (error) {
        trackingStatus.textContent = 'Gagal menyalin otomatis. Buka console dan jalankan CatsoftTracker.report().';
      }
    });
  }

  if (downloadTracking) {
    downloadTracking.addEventListener('click', () => {
      downloadTrackingCsv();
      trackingStatus.textContent = 'File CSV tracking berhasil dibuat.';
    });
  }

  if (resetTracking) {
    resetTracking.addEventListener('click', () => {
      if (!confirm('Reset semua data tracking di browser ini?')) {
        return;
      }

      saveTrackingEvents([]);
      renderTrackingPanel();
      trackingStatus.textContent = 'Data tracking sudah direset.';
    });
  }

  window.CatsoftTracker = {
    open: openTrackingPanel,
    events: getTrackingEvents,
    report: getTrackingSummaryText,
    csv: getTrackingCsv,
    reset() {
      saveTrackingEvents([]);
      renderTrackingPanel();
    }
  };
}

const quickOrderForm = document.getElementById('quickOrderForm');
const customerNameInput = document.getElementById('customerName');
const customerContactInput = document.getElementById('customerContact');
const orderProductSelect = document.getElementById('orderProduct');
const orderPlanSelect = document.getElementById('orderPlan');
const orderNoteInput = document.getElementById('orderNote');
const canvaEmailField = document.getElementById('canvaEmailField');
const canvaActivationEmailInput = document.getElementById('canvaActivationEmail');
const likeIgFields = document.getElementById('likeIgFields');
const instagramPostLinkInput = document.getElementById('instagramPostLink');
const likeIgOrderStatusSelect = document.getElementById('likeIgOrderStatus');
const shopeeOrderNumberField = document.getElementById('shopeeOrderNumberField');
const shopeeOrderNumberInput = document.getElementById('shopeeOrderNumber');
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
  },
  instagramPostLink: {
    valueMissing: 'Link postingan Instagram wajib diisi.',
    typeMismatch: 'Link postingan Instagram tidak valid.'
  },
  likeIgOrderStatus: {
    valueMissing: 'Pilih status order.'
  },
  shopeeOrderNumber: {
    valueMissing: 'Nomor pesanan Shopee wajib diisi.'
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

function normalizeUrlInput(value) {
  const cleanValue = value.trim().replace(/\s+/g, '');

  if (/^https?:\/\//i.test(cleanValue)) {
    return cleanValue;
  }

  return `https://${cleanValue}`;
}

function hasValidInstagramPostLink(value) {
  try {
    const url = new URL(normalizeUrlInput(value));
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    const hasInstagramHost = hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
    const hasPostPath = /^\/(p|reel|tv)\/[^/?#]+\/?$/i.test(url.pathname);

    return hasInstagramHost && hasPostPath;
  } catch (error) {
    return false;
  }
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

  if (field.id === 'instagramPostLink' && value && !hasValidInstagramPostLink(value)) {
    return messages.typeMismatch || 'Link postingan Instagram tidak valid.';
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

function getOrderPackageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const productKey = params.get('produk') || params.get('product');
  const planKey = params.get('paket') || params.get('plan');

  if (!productKey || !productPackages[productKey]) {
    return null;
  }

  const product = productPackages[productKey];
  const hasPlan = product.plans.some((plan) => plan.value === planKey);

  return {
    productKey,
    planKey: hasPlan ? planKey : product.plans[0].value
  };
}

function updateOrderUrl(productKey, planKey, mode = 'replace') {
  if (!productPackages[productKey]) {
    return;
  }

  const product = productPackages[productKey];
  const selectedPlan = product.plans.some((plan) => plan.value === planKey) ? planKey : product.plans[0].value;
  const url = new URL(window.location.href);

  url.searchParams.set('produk', productKey);
  url.searchParams.set('paket', selectedPlan);
  url.searchParams.delete('terms');
  url.hash = 'order';

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;

  if (mode === 'push') {
    history.pushState(null, '', nextUrl);
    return;
  }

  history.replaceState(null, '', nextUrl);
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
  const isLikeIgOrder = orderProductSelect.value === 'likeig';
  const isShopeeOrder = isLikeIgOrder && likeIgOrderStatusSelect?.value === 'sudah-order-shopee';

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

  if (likeIgFields && instagramPostLinkInput && likeIgOrderStatusSelect) {
    likeIgFields.classList.toggle('is-hidden', !isLikeIgOrder);
    instagramPostLinkInput.required = isLikeIgOrder;
    instagramPostLinkInput.disabled = !isLikeIgOrder;
    likeIgOrderStatusSelect.required = isLikeIgOrder;
    likeIgOrderStatusSelect.disabled = !isLikeIgOrder;
    clearFieldError(instagramPostLinkInput);
    clearFieldError(likeIgOrderStatusSelect);
  }

  if (shopeeOrderNumberField && shopeeOrderNumberInput) {
    shopeeOrderNumberField.classList.toggle('is-hidden', !isShopeeOrder);
    shopeeOrderNumberInput.required = isShopeeOrder;
    shopeeOrderNumberInput.disabled = !isShopeeOrder;
    clearFieldError(shopeeOrderNumberInput);
  }

  if (orderFormStatus) {
    orderFormStatus.textContent = isLikeIgOrder
      ? 'Untuk Like IG, isi link postingan. Jika sudah order di Shopee, masukkan nomor pesanan agar admin bisa mencocokkan transaksi.'
      : 'Pesan WhatsApp akan dibuat otomatis sesuai pilihan paket.';
  }
}

function selectOrderPackage(productKey, planKey, shouldUpdateUrl = false) {
  if (!orderProductSelect || !orderPlanSelect) {
    return;
  }

  if (productPackages[productKey]) {
    orderProductSelect.value = productKey;
  }

  populatePlanOptions(planKey);
  updateOrderSummary();

  if (shouldUpdateUrl) {
    updateOrderUrl(orderProductSelect.value, orderPlanSelect.value, 'push');
  }
}

function buildOrderMessage() {
  const { product, plan } = getSelectedPackage();
  const customerName = customerNameInput.value.trim();
  const customerContact = customerContactInput.value.trim();
  const canvaActivationEmail = canvaActivationEmailInput ? canvaActivationEmailInput.value.trim() : '';
  const instagramPostLink = instagramPostLinkInput ? instagramPostLinkInput.value.trim() : '';
  const likeIgOrderStatus = likeIgOrderStatusSelect ? likeIgOrderStatusSelect.value : 'mau-beli';
  const shopeeOrderNumber = shopeeOrderNumberInput ? shopeeOrderNumberInput.value.trim() : '';
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

  if (orderProductSelect.value === 'likeig') {
    messageLines.push(
      `Link postingan Instagram: ${instagramPostLink || '-'}`,
      `Status order: ${likeIgOrderStatus === 'sudah-order-shopee' ? 'Sudah order di Shopee' : 'Mau beli'}`
    );

    if (likeIgOrderStatus === 'sudah-order-shopee') {
      messageLines.push(`Nomor pesanan Shopee: ${shopeeOrderNumber || '-'}`);
    }
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
  const instagramPostLink = instagramPostLinkInput ? instagramPostLinkInput.value.trim() : '';
  const likeIgOrderStatus = likeIgOrderStatusSelect ? likeIgOrderStatusSelect.value : 'mau-beli';
  const shopeeOrderNumber = shopeeOrderNumberInput ? shopeeOrderNumberInput.value.trim() : '';
  const messageLines = [
    'Halo Min Catsoft, saya ingin konsultasi dulu sebelum order.',
    '',
    `Nama: ${customerName}`,
    `Email/WhatsApp: ${customerContact}`,
    `Produk yang ditanyakan: ${product.name}`,
    `Paket yang dipertanyakan: ${plan.name}`,
    `Harga paket: ${plan.price}`
  ];

  if (orderProductSelect.value === 'likeig') {
    messageLines.push(`Status order: ${likeIgOrderStatus === 'sudah-order-shopee' ? 'Sudah order di Shopee' : 'Mau beli'}`);

    if (instagramPostLink) {
      messageLines.push(`Link postingan Instagram: ${instagramPostLink}`);
    }

    if (likeIgOrderStatus === 'sudah-order-shopee' && shopeeOrderNumber) {
      messageLines.push(`Nomor pesanan Shopee: ${shopeeOrderNumber}`);
    }
  }

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

  const orderPackageFromUrl = getOrderPackageFromUrl();

  if (orderPackageFromUrl) {
    orderProductSelect.value = orderPackageFromUrl.productKey;
    populatePlanOptions(orderPackageFromUrl.planKey);
  } else {
    populatePlanOptions();
  }

  updateOrderSummary();

  orderProductSelect.addEventListener('change', () => {
    populatePlanOptions();
    updateOrderSummary();
    updateOrderUrl(orderProductSelect.value, orderPlanSelect.value);
  });

  orderPlanSelect.addEventListener('change', () => {
    updateOrderSummary();
    updateOrderUrl(orderProductSelect.value, orderPlanSelect.value);
  });

  if (likeIgOrderStatusSelect) {
    likeIgOrderStatusSelect.addEventListener('change', updateOrderSummary);
  }

  quickOrderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateOrderForm()) {
      return;
    }

    const message = buildOrderMessage();
    const { product, plan } = getSelectedPackage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    trackClick('whatsapp', 'Order Cepat WhatsApp', {
      product: product.name,
      plan: plan.name,
      source: 'order',
      target: 'quick-order-form'
    });

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
      const { product, plan } = getSelectedPackage();
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      trackClick('whatsapp', 'Konsultasi Dulu', {
        product: product.name,
        plan: plan.name,
        source: 'order',
        target: 'consultation-button'
      });

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      if (orderFormStatus) {
        orderFormStatus.textContent = 'Pesan konsultasi sudah disiapkan sesuai nama dan produk yang dipilih.';
      }
    });
  }

  document.querySelectorAll('[data-order-product]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      selectOrderPackage(trigger.dataset.orderProduct, trigger.dataset.orderPlan, true);

      const orderSection = document.getElementById('order');

      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
window.addEventListener('DOMContentLoaded', initClickTracking);
window.addEventListener('DOMContentLoaded', initThemedFormValidation);
window.addEventListener('DOMContentLoaded', initQuickOrderForm);
window.addEventListener('DOMContentLoaded', () => {
  updateAdminStatus();
  setInterval(updateAdminStatus, 60000);
});
