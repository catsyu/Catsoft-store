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
  office: {
    name: 'Microsoft Office Original Lifetime',
    plans: [
      {
        value: 'office-2016',
        label: 'Office Professional Plus 2016 — Rp60.000',
        name: 'Office Professional Plus 2016',
        price: 'Rp60.000',
        duration: 'Lifetime activation',
        terms: 'Original key, 1 PC/Laptop, aktivasi dibantu admin'
      },
      {
        value: 'office-2019',
        label: 'Office Professional Plus 2019 — Rp90.000',
        name: 'Office Professional Plus 2019',
        price: 'Rp90.000',
        duration: 'Lifetime activation',
        terms: 'Original key, 1 PC/Laptop, aktivasi dibantu admin'
      },
      {
        value: 'office-2021',
        label: 'Office Professional Plus 2021 — Rp120.000',
        name: 'Office Professional Plus 2021',
        price: 'Rp120.000',
        duration: 'Lifetime activation',
        terms: 'Original key, 1 PC/Laptop, aktivasi dibantu admin'
      },
      {
        value: 'office-2024',
        label: 'Office Professional Plus 2024 — Rp150.000',
        name: 'Office Professional Plus 2024',
        price: 'Rp150.000',
        duration: 'Lifetime activation',
        terms: 'Original key, 1 PC/Laptop, aktivasi dibantu admin'
      }
    ]
  },
  aeassets: {
    name: 'After Effects Assets Pack 5000+',
    plans: [
      {
        value: 'assets-pack-5000',
        label: 'After Effects Assets Pack 5000+ — Rp75.000',
        name: 'After Effects Assets Pack 5000+',
        price: 'Rp75.000',
        duration: 'Akses lifetime',
        terms: 'Produk digital, file siap pakai, garansi file dan support bantuan'
      }
    ]
  },
  lutapplelog: {
    name: 'LUT Apple Log ProRes',
    plans: [
      {
        value: 'lut-pack',
        label: 'LUT Apple Log ProRes Pack — Rp100.000',
        name: 'LUT Apple Log ProRes Pack',
        price: 'Rp100.000',
        duration: 'Akses lifetime',
        terms: '4 file LUT .cube untuk footage iPhone Apple Log, panduan penggunaan, dan support admin'
      }
    ]
  },
  lightroompreset: {
    name: 'Preset Lightroom Street Photography',
    plans: [
      {
        value: 'street-140',
        label: 'Preset Lightroom 140++ Street Photography — Rp125.000',
        name: 'Preset Lightroom 140++ Street Photography',
        price: 'Rp125.000',
        duration: 'Akses lifetime',
        terms: '140++ preset Lightroom untuk mobile, iPad, Mac, Windows, PC, lengkap dengan tutorial instalasi'
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
  },
  viewreelsig: {
    name: 'View Reels IG Bergaransi',
    plans: [
      {
        value: '2500-view',
        label: '2.500 View — Rp21.500',
        name: '2.500 View',
        price: 'Rp21.500',
        duration: 'Proses bertahap',
        terms: 'Real penonton Indo, aman, tanpa password, bergaransi permanen'
      },
      {
        value: '5000-view',
        label: '5.000 View — Rp35.000',
        name: '5.000 View',
        price: 'Rp35.000',
        duration: 'Proses bertahap',
        terms: 'Real penonton Indo, aman, tanpa password, bergaransi permanen'
      },
      {
        value: '100000-view',
        label: '100.000 View — Rp56.000',
        name: '100.000 View',
        price: 'Rp56.000',
        duration: 'Proses bertahap',
        terms: 'Real penonton Indo, aman, tanpa password, bergaransi permanen'
      }
    ]
  },
  komenig: {
    name: 'Komen IG Bergaransi',
    plans: [
      {
        value: '10-komen-custom',
        label: '10 Komen Custom — Rp35.000',
        name: '10 Komen Custom',
        price: 'Rp35.000',
        duration: 'Proses bertahap',
        terms: 'Real Indo, bisa custom komen, aman, tanpa password'
      },
      {
        value: '50-komen-random',
        label: '50 Komen Random Positif — Rp15.500',
        name: '50 Komen Random Positif',
        price: 'Rp15.500',
        duration: 'Proses bertahap',
        terms: 'Real Indo, komentar random positif, aman, tanpa password'
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
  office: {
    label: 'Microsoft Office',
    title: 'Microsoft Office Original Lifetime License',
    lead: 'Lisensi original lifetime untuk Microsoft Office Professional Plus 2016, 2019, 2021, dan 2024 dengan aktivasi online dibantu admin Catsoft.',
    summary: [
      'Tersedia varian Office Professional Plus 2016, 2019, 2021, dan 2024.',
      'Original & genuine Microsoft key untuk 1 PC atau 1 laptop.',
      'One-time purchase tanpa subscription atau biaya bulanan.',
      'Support Windows 10 / 11 dan compatible untuk PC/Laptop.',
      'Termasuk panduan aktivasi, official setup link jika diperlukan, dan bantuan admin hingga selesai.'
    ],
    terms: [
      'Aktivasi dilakukan melalui Desktop App dengan metode Activate by Telephone.',
      'Customer mengirim Installation ID atau screenshot Installation ID kepada admin melalui chat.',
      'Tidak perlu melakukan panggilan telepon ke Microsoft karena admin akan membantu proses aktivasi.',
      'Key bersifat hardware bind dan tidak terhubung ke akun Microsoft.',
      'Garansi tidak berlaku jika key digunakan melebihi batas perangkat, sistem tidak kompatibel, atau terjadi penyalahgunaan key.'
    ],
    note: 'Mohon chat admin setelah pembelian untuk mendapatkan panduan instalasi dan aktivasi dengan benar.',
    tutorialUrl: 'office-tutorial.html',
    tutorialLabel: 'Tutorial aktivasi',
    orderProduct: 'office',
    orderPlan: 'office-2024'
  },
  aeassets: {
    label: 'After Effects Assets',
    title: 'After Effects Assets Pack 5000+ Item',
    lead: 'Koleksi lengkap berisi 5000+ aset premium untuk Adobe After Effects, cocok untuk video editor, content creator, motion designer, hingga pemula.',
    summary: [
      'Berisi template, motion graphics, transisi, efek visual, preset animasi, elemen teks, dan aset desain profesional.',
      'Akses lifetime sekali beli tanpa biaya bulanan.',
      'File digital siap pakai untuk mempercepat workflow editing.',
      'Cocok untuk kebutuhan YouTube, promosi, cinematic, social media, dan konten profesional.',
      'Garansi 100% apabila file bermasalah atau tidak sesuai.'
    ],
    terms: [
      'Produk digital, tidak ada pengiriman fisik.',
      'Aset dapat langsung digunakan dan diedit sesuai kebutuhan project.',
      'Kompatibel dengan berbagai versi Adobe After Effects sesuai file yang tersedia.',
      'Support bantuan diberikan jika ada kendala penggunaan aset.',
      'Membeli berarti setuju dengan ketentuan toko pada deskripsi maupun foto produk.'
    ],
    note: 'Klaim garansi di luar jam operasional akan dibalas saat jam operasional berikutnya.',
    tutorialUrl: 'tutorial-after-effects-assets.html',
    tutorialLabel: 'Tutorial penggunaan',
    orderProduct: 'aeassets',
    orderPlan: 'assets-pack-5000'
  },
  lutapplelog: {
    label: 'LUT Apple Log ProRes',
    title: 'LUT iPhone Apple Log ProRes',
    lead: 'Paket 4 file LUT .cube untuk pengguna iPhone Pro yang merekam Apple Log/ProRes Log dan ingin mendapatkan warna cinematic lebih cepat.',
    summary: [
      'Berisi Apple Log To CineColor, Apple Log To Mirrorless Neutral, Apple Log To Mirrorless STD, dan Apple Log STD Enhanced.',
      'Dioptimalkan untuk footage Apple Log dari iPhone 15 Pro, 15 Pro Max, 16 Pro, dan 16 Pro Max.',
      'Dapat digunakan di Blackmagic Camera App, Kino App, DaVinci Resolve, Final Cut Pro, atau editor video yang mendukung file LUT .cube.',
      'Membantu mengubah footage Log yang flat menjadi look lebih siap publish tanpa grading dari nol.',
      'Termasuk panduan penggunaan dan referensi workflow untuk pengguna iPhone.'
    ],
    terms: [
      'Pastikan video direkam dengan Color Space/Encoding Apple Log agar warna LUT sesuai.',
      'Tidak disarankan untuk video standar non-Log karena hasil warna bisa terlalu kontras atau tidak natural.',
      'Untuk hasil terbaik, gunakan exposure dan white balance yang konsisten saat merekam.',
      'Kompatibilitas aplikasi mengikuti dukungan import LUT .cube pada aplikasi masing-masing.',
      'Produk digital, tidak ada pengiriman fisik, dan support diberikan sesuai jam operasional Catsoft.'
    ],
    note: 'Jika belum pernah merekam Apple Log, buka tutorial produk terlebih dahulu sebelum menggunakan LUT.',
    tutorialUrl: 'tutorial-lut-apple-log.html',
    tutorialLabel: 'Tutorial LUT',
    orderProduct: 'lutapplelog',
    orderPlan: 'lut-pack'
  },
  lightroompreset: {
    label: 'Preset Lightroom',
    title: 'Preset Lightroom 140++ Street Photography Professional',
    lead: 'Paket preset Lightroom untuk membuat foto street photography terlihat lebih aesthetic, konsisten, dan profesional di mobile, iPad, Mac, Windows, maupun PC.',
    summary: [
      'Berisi 140++ preset Lightroom dengan tone street photography yang beragam.',
      'Mudah digunakan untuk pemula, konten kreator, fotografer mobile, dan kebutuhan editing cepat.',
      'Kompatibel untuk Lightroom mobile di Android, iPhone, iPad, serta Lightroom desktop di Mac dan Windows.',
      'File bisa digunakan selamanya setelah pembelian.',
      'Dilengkapi tutorial instalasi lengkap untuk tiap device dan bantuan admin jika ada kendala.'
    ],
    terms: [
      'Customer wajib mengikuti format file dan tutorial sesuai device yang digunakan.',
      'Jika menggunakan preset XMP di mobile dan ingin sinkron antar device, gunakan akun Adobe yang sama.',
      'Untuk preset DNG, simpan file DNG lalu buat preset dari foto contoh di Lightroom mobile.',
      'Hasil warna dapat berbeda tergantung pencahayaan foto, kamera, dan kondisi file original.',
      'Produk digital, tidak ada pengiriman fisik, dan klaim garansi akan dibantu sesuai jam operasional.'
    ],
    note: 'Buka tutorial terlebih dahulu jika belum pernah memasang preset Lightroom di perangkat Anda.',
    tutorialUrl: 'tutorial-lightroom-preset.html',
    tutorialLabel: 'Tutorial preset',
    orderProduct: 'lightroompreset',
    orderPlan: 'street-140'
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
      'Cukup kirim link target Instagram setelah checkout.'
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
  },
  viewreelsig: {
    label: 'View Reels IG',
    title: 'View Reels IG Bergaransi Permanen',
    lead: 'Paket view Reels Instagram real penonton Indo untuk menaikkan viewers secara bertahap, cepat, aman, dan tetap praktis tanpa password.',
    summary: [
      'Tersedia paket 2.500 View, 5.000 View, dan 100.000 View.',
      'Viewers naik secara alami dan bertahap.',
      '100% real, aman, dan bergaransi sesuai ketentuan.',
      'Jumlah bonus dapat bervariasi sesuai kondisi proses.',
      'Produk digital, tidak ada pengiriman fisik.'
    ],
    terms: [
      'Akun Instagram wajib public selama proses berlangsung.',
      'Dilarang mengganti username selama proses.',
      'Kirim link target Reels atau username serta screenshot postingan di chat setelah checkout.',
      'Klaim garansi wajib menyertakan detail kendala dan bukti order.',
      'Membeli berarti setuju dengan kebijakan pada foto produk maupun deskripsi.'
    ],
    note: 'Pastikan Reels dapat diakses publik agar proses berjalan lancar.',
    orderProduct: 'viewreelsig',
    orderPlan: '2500-view'
  },
  komenig: {
    label: 'Komen IG',
    title: 'Jasa Komen IG Bergaransi Permanen',
    lead: 'Layanan komentar Instagram real Indo dengan pilihan komentar custom atau random positif untuk meningkatkan interaksi secara aman dan bertahap.',
    summary: [
      'Tersedia paket 10 Komen Custom dan 50 Komen Random Positif.',
      'Komentar naik secara alami dan bertahap.',
      'Bisa request serta custom komentar sesuai paket.',
      '100% real, aman, dan bergaransi sesuai ketentuan.',
      'Produk digital, tidak ada pengiriman fisik.'
    ],
    terms: [
      'Akun Instagram wajib public selama proses berlangsung.',
      'Dilarang mengganti username selama proses.',
      'Untuk paket custom, kirim list komentar di chat setelah checkout.',
      'Perhatikan pilihan variasi custom atau non-custom sebelum order.',
      'Membeli berarti setuju dengan kebijakan pada foto produk maupun deskripsi.'
    ],
    note: 'Untuk paket custom, siapkan list komentar agar admin dapat memproses lebih cepat.',
    orderProduct: 'komenig',
    orderPlan: '10-komen-custom'
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

function closeMobileMenu() {
  if (!mobileMenuToggle || !navLinks) {
    return;
  }

  navLinks.classList.remove('open');
  mobileMenuToggle.classList.remove('active');
  mobileMenuToggle.setAttribute('aria-expanded', 'false');
}

const cleanSectionPaths = {
  produk: '/produk',
  order: '/order',
  keunggulan: '/keunggulan',
  testimoni: '/testimoni',
  faq: '/faq',
  kontak: '/kontak'
};

function getCleanSectionFromPath(pathname) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return Object.entries(cleanSectionPaths).find(([, path]) => path === cleanPath)?.[0] || '';
}

function scrollToCleanSection(sectionId, behavior = 'smooth') {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior, block: 'start' });
}

function initCleanSectionLinks() {
  document.querySelectorAll('[data-clean-section]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const sectionId = link.dataset.cleanSection;
      const cleanPath = cleanSectionPaths[sectionId];

      if (!cleanPath) {
        return;
      }

      event.preventDefault();
      history.pushState(null, '', cleanPath);
      closeMobileMenu();

      if (sectionId === 'order') {
        revealOrderForm();
      }

      scrollToCleanSection(sectionId);
    });
  });

  const initialSection = getCleanSectionFromPath(window.location.pathname);

  if (initialSection) {
    if (initialSection === 'order') {
      revealOrderForm();
    }

    window.setTimeout(() => scrollToCleanSection(initialSection, 'auto'), 80);
  }

  window.addEventListener('popstate', () => {
    const sectionId = getCleanSectionFromPath(window.location.pathname);

    if (sectionId) {
      if (sectionId === 'order') {
        revealOrderForm();
      }

      scrollToCleanSection(sectionId);
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
const productDetailTutorial = document.getElementById('productDetailTutorial');
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

  if (productDetailTutorial) {
    productDetailTutorial.hidden = !detail.tutorialUrl;

    if (detail.tutorialUrl) {
      productDetailTutorial.href = detail.tutorialUrl;
      productDetailTutorial.textContent = detail.tutorialLabel || 'Tutorial';
    }
  }

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
    revealOrderForm();

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
        target: '/order'
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

const orderPanel = document.getElementById('orderPanel');
const orderStartCard = document.getElementById('orderStartCard');
const showOrderFormBtn = document.getElementById('showOrderFormBtn');
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
    valueMissing: 'Link target Instagram wajib diisi.',
    typeMismatch: 'Link target Instagram tidak valid.'
  },
  likeIgOrderStatus: {
    valueMissing: 'Pilih status order.'
  },
  shopeeOrderNumber: {
    valueMissing: 'Nomor pesanan Shopee wajib diisi.'
  }
};

const socialMediaProductKeys = ['likeig', 'viewreelsig', 'komenig'];

function isSocialMediaProduct(productKey) {
  return socialMediaProductKeys.includes(productKey);
}

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
    return messages.typeMismatch || 'Link target Instagram tidak valid.';
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

function focusFirstOrderField() {
  if (!quickOrderForm) {
    return;
  }

  const firstField = quickOrderForm.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');

  if (!firstField) {
    return;
  }

  try {
    firstField.focus({ preventScroll: true });
  } catch (error) {
    firstField.focus();
  }
}

function revealOrderForm({ shouldFocus = false } = {}) {
  if (orderPanel) {
    orderPanel.classList.remove('is-hidden');
  }

  if (orderStartCard) {
    orderStartCard.classList.add('is-hidden');
  }

  if (showOrderFormBtn) {
    showOrderFormBtn.setAttribute('aria-expanded', 'true');
  }

  if (shouldFocus) {
    window.setTimeout(focusFirstOrderField, 120);
  }
}

function shouldRevealOrderFromUrl() {
  return getCleanSectionFromPath(window.location.pathname) === 'order' || window.location.hash === '#order' || getOrderPackageFromUrl() !== null;
}

function isOrderSectionLink(link) {
  const href = link.getAttribute('href');

  if (!href || link.dataset.orderProduct) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    return url.hash === '#order' || getCleanSectionFromPath(url.pathname) === 'order';
  } catch (error) {
    return href.includes('#order') || href.replace(/\/+$/, '') === '/order';
  }
}

function initOrderRevealTriggers() {
  if (showOrderFormBtn) {
    showOrderFormBtn.addEventListener('click', () => {
      revealOrderForm({ shouldFocus: true });

      if (orderPanel) {
        orderPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    if (!isOrderSectionLink(link)) {
      return;
    }

    link.addEventListener('click', () => {
      revealOrderForm();
    });
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#order') {
      revealOrderForm();
    }
  });

  if (shouldRevealOrderFromUrl()) {
    revealOrderForm();
  }
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
  url.pathname = cleanSectionPaths.order;
  url.hash = '';

  const nextUrl = `${url.pathname}${url.search}`;

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
  const isSocialMediaOrder = isSocialMediaProduct(orderProductSelect.value);
  const isShopeeOrder = isSocialMediaOrder && likeIgOrderStatusSelect?.value === 'sudah-order-shopee';

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
    likeIgFields.classList.toggle('is-hidden', !isSocialMediaOrder);
    instagramPostLinkInput.required = isSocialMediaOrder;
    instagramPostLinkInput.disabled = !isSocialMediaOrder;
    likeIgOrderStatusSelect.required = isSocialMediaOrder;
    likeIgOrderStatusSelect.disabled = !isSocialMediaOrder;
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
    orderFormStatus.textContent = isSocialMediaOrder
      ? 'Untuk produk Instagram, isi link target. Jika sudah order di Shopee, masukkan nomor pesanan agar admin bisa mencocokkan transaksi.'
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

  if (isSocialMediaProduct(orderProductSelect.value)) {
    messageLines.push(
      `Link target Instagram: ${instagramPostLink || '-'}`,
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

  if (isSocialMediaProduct(orderProductSelect.value)) {
    messageLines.push(`Status order: ${likeIgOrderStatus === 'sudah-order-shopee' ? 'Sudah order di Shopee' : 'Mau beli'}`);

    if (instagramPostLink) {
      messageLines.push(`Link target Instagram: ${instagramPostLink}`);
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

  if (shouldRevealOrderFromUrl()) {
    revealOrderForm();
  }

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
      revealOrderForm();

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

function initProductFilters() {
  const filters = document.querySelectorAll('[data-product-filter]');
  const cards = document.querySelectorAll('[data-product-category]');

  if (!filters.length || !cards.length) {
    return;
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const selectedCategory = filter.dataset.productFilter;

      filters.forEach((item) => {
        item.classList.toggle('active', item === filter);
      });

      cards.forEach((card) => {
        const shouldShow = selectedCategory === 'all' || card.dataset.productCategory === selectedCategory;
        card.classList.toggle('is-filter-hidden', !shouldShow);
      });
    });
  });
}

const orderNotificationItems = [
  {
    initial: 'C',
    title: 'Canva Pro',
    text: 'Paket 1 Bulan'
  },
  {
    initial: 'G',
    title: 'ChatGPT Plus',
    text: 'Sharing 4 User'
  },
  {
    initial: 'I',
    title: 'Like IG Bergaransi',
    text: '500 Like'
  },
  {
    initial: 'V',
    title: 'View Reels IG',
    text: '5.000 View'
  },
  {
    initial: 'K',
    title: 'Komen IG',
    text: '50 Komen Random Positif'
  },
  {
    initial: 'V',
    title: 'CapCut Pro',
    text: 'Private 1 Bulan'
  },
  {
    initial: 'O',
    title: 'Microsoft Office',
    text: 'Office 2021 Pro Plus'
  },
  {
    initial: 'A',
    title: 'After Effects Assets',
    text: 'Assets Pack 5000+'
  },
  {
    initial: 'L',
    title: 'LUT Apple Log ProRes',
    text: 'LUT Pack iPhone'
  },
  {
    initial: 'Lr',
    title: 'Preset Lightroom',
    text: 'Street 140++ Preset'
  },
  {
    initial: 'A',
    title: 'ChatGPT Plus',
    text: 'Konsultasi Private'
  }
];

const orderNotificationUsernames = [
  '@nadia.creative',
  '@arya.design',
  '@putri.store',
  '@fajar.ai',
  '@dina.content',
  '@raka.edits',
  '@meysocial',
  '@bagas.studio'
];

function initOrderNotification() {
  const notification = document.getElementById('orderNotification');
  const icon = document.getElementById('orderNotificationIcon');
  const username = document.getElementById('orderNotificationUsername');
  const title = document.getElementById('orderNotificationTitle');
  const text = document.getElementById('orderNotificationText');
  const closeButton = document.getElementById('closeOrderNotification');

  if (!notification || !icon || !username || !title || !text || !closeButton) {
    return;
  }

  let activeIndex = 0;
  let isClosed = false;

  function renderNotification() {
    if (isClosed) {
      return;
    }

    const item = orderNotificationItems[activeIndex % orderNotificationItems.length];
    const randomUsername = orderNotificationUsernames[Math.floor(Math.random() * orderNotificationUsernames.length)];

    notification.classList.remove('is-visible');

    window.setTimeout(() => {
      if (isClosed) {
        return;
      }

      icon.textContent = item.initial;
      username.textContent = randomUsername;
      title.textContent = item.title;
      text.textContent = item.text;
      notification.classList.add('is-visible');
      activeIndex += 1;
    }, 320);
  }

  window.setTimeout(renderNotification, 1800);
  const intervalId = window.setInterval(renderNotification, 7800);

  closeButton.addEventListener('click', () => {
    isClosed = true;
    window.clearInterval(intervalId);
    notification.classList.remove('is-visible');
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
window.addEventListener('DOMContentLoaded', initProductFilters);
window.addEventListener('DOMContentLoaded', initClickTracking);
window.addEventListener('DOMContentLoaded', initCleanSectionLinks);
window.addEventListener('DOMContentLoaded', initThemedFormValidation);
window.addEventListener('DOMContentLoaded', initOrderRevealTriggers);
window.addEventListener('DOMContentLoaded', initQuickOrderForm);
window.addEventListener('DOMContentLoaded', initOrderNotification);
window.addEventListener('DOMContentLoaded', () => {
  updateAdminStatus();
  setInterval(updateAdminStatus, 60000);
});
