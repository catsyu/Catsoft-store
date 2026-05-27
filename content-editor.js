(function () {
  const api = window.CatsoftContentAPI;

  if (!api || !window.CATSOFT_ADMIN_AUTHORIZED) {
    return;
  }

  const productList = document.getElementById('contentProductList');
  const productCount = document.getElementById('contentProductCount');
  const saveState = document.getElementById('contentSaveState');
  const searchInput = document.getElementById('contentSearch');
  const sortSelect = document.getElementById('contentSort');
  const form = document.getElementById('contentEditorForm');
  const emptyState = document.getElementById('contentEmptyState');
  const previewPanel = document.getElementById('contentPreviewPanel');
  const status = document.getElementById('contentStatus');
  const planList = document.getElementById('contentPlanList');
  const jsonBox = document.getElementById('contentJsonBox');

  if (!productList || !productCount || !saveState || !searchInput || !sortSelect || !form || !emptyState || !previewPanel || !status || !planList || !jsonBox) {
    return;
  }

  const fields = {
    productKey: document.getElementById('contentProductKey'),
    editorTitle: document.getElementById('contentEditorTitle'),
    productSlug: document.getElementById('contentProductSlug'),
    productName: document.getElementById('contentProductName'),
    detailLabel: document.getElementById('contentDetailLabel'),
    detailTitle: document.getElementById('contentDetailTitle'),
    detailLead: document.getElementById('contentDetailLead'),
    tutorialUrl: document.getElementById('contentTutorialUrl'),
    tutorialLabel: document.getElementById('contentTutorialLabel'),
    orderProduct: document.getElementById('contentOrderProduct'),
    orderPlan: document.getElementById('contentOrderPlan'),
    summary: document.getElementById('contentSummary'),
    terms: document.getElementById('contentTerms'),
    note: document.getElementById('contentNote')
  };

  let content = api.getContent();
  let activeProductKey = '';
  let workspaceMode = 'empty';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message, isError = false, state = 'Draft') {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
    saveState.textContent = isError ? 'Cek lagi' : state;
  }

  function setWorkspaceMode(mode) {
    workspaceMode = mode;
    emptyState.classList.toggle('is-hidden', mode !== 'empty');
    previewPanel.classList.toggle('is-hidden', mode !== 'preview');
    form.classList.toggle('is-hidden', mode !== 'edit');
  }

  function scrollWorkspaceIntoView(target) {
    if (!window.matchMedia('(max-width: 760px)').matches || !target) {
      return;
    }

    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function slugifyProductKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  function linesToArray(value) {
    return String(value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function arrayToLines(value) {
    return Array.isArray(value) ? value.join('\n') : '';
  }

  function getProductKeys() {
    const query = String(searchInput.value || '').trim().toLowerCase();

    const keys = Object.keys(content.productPackages).filter((key) => {
      const product = content.productPackages[key];
      const detail = content.productDetailContent[key] || {};
      const haystack = `${key} ${product.name || ''} ${detail.title || ''} ${detail.label || ''} ${detail.tutorialUrl || ''}`.toLowerCase();
      return !query || haystack.includes(query);
    });

    return keys.sort((firstKey, secondKey) => {
      const firstProduct = content.productPackages[firstKey];
      const secondProduct = content.productPackages[secondKey];
      const sortBy = sortSelect.value;

      if (sortBy === 'plans') {
        return secondProduct.plans.length - firstProduct.plans.length;
      }

      if (sortBy === 'key') {
        return firstKey.localeCompare(secondKey);
      }

      return String(firstProduct.name || firstKey).localeCompare(String(secondProduct.name || secondKey));
    });
  }

  function renderProductList() {
    const keys = getProductKeys();
    productList.innerHTML = '';
    productCount.textContent = String(Object.keys(content.productPackages).length);

    if (!keys.length) {
      productList.innerHTML = `
        <tr>
          <td class="content-empty-row" colspan="5">Tidak ada produk yang cocok dengan pencarian.</td>
        </tr>
      `;
      return;
    }

    keys.forEach((key) => {
      const product = content.productPackages[key];
      const detail = content.productDetailContent[key] || {};
      const row = document.createElement('tr');
      row.className = key === activeProductKey ? 'is-active' : '';
      row.dataset.productKey = key;
      row.innerHTML = `
        <td>
          <strong>${escapeHtml(product.name || key)}</strong>
          <span>${escapeHtml(detail.title || '-')}</span>
        </td>
        <td><code>${escapeHtml(key)}</code></td>
        <td>${product.plans.length}</td>
        <td>${detail.tutorialUrl ? escapeHtml(detail.tutorialLabel || 'Ada') : '<span class="content-muted">Tidak ada</span>'}</td>
        <td>
          <div class="content-row-actions">
            <button class="ghost-button" type="button" data-edit-product="${escapeAttr(key)}">Edit</button>
            <button class="ghost-button" type="button" data-preview-product="${escapeAttr(key)}">Lihat</button>
            <button class="ghost-button danger-button" type="button" data-delete-product="${escapeAttr(key)}">Hapus</button>
          </div>
        </td>
      `;
      productList.appendChild(row);
    });

    productList.querySelectorAll('[data-edit-product]').forEach((button) => {
      button.addEventListener('click', () => selectProduct(button.dataset.editProduct));
    });

    productList.querySelectorAll('[data-preview-product]').forEach((button) => {
      button.addEventListener('click', () => previewProduct(button.dataset.previewProduct));
    });

    productList.querySelectorAll('[data-delete-product]').forEach((button) => {
      button.addEventListener('click', () => deleteProduct(button.dataset.deleteProduct));
    });
  }

  function renderPlans(product) {
    planList.innerHTML = '';

    product.plans.forEach((plan, index) => {
      const card = document.createElement('article');
      card.className = 'content-plan-card';
      card.dataset.planIndex = String(index);
      card.innerHTML = `
        <div class="content-plan-top">
          <strong>Paket ${index + 1}</strong>
          <button class="ghost-button" type="button" data-remove-plan="${index}">Hapus</button>
        </div>
        <div class="content-form-grid">
          <label>Kode paket<input data-plan-field="value" type="text" value="${escapeAttr(plan.value)}" required /></label>
          <label>Nama paket<input data-plan-field="name" type="text" value="${escapeAttr(plan.name)}" required /></label>
        </div>
        <div class="content-form-grid">
          <label>Harga<input data-plan-field="price" type="text" value="${escapeAttr(plan.price)}" required /></label>
          <label>Durasi<input data-plan-field="duration" type="text" value="${escapeAttr(plan.duration)}" required /></label>
        </div>
        <label>Label dropdown<input data-plan-field="label" type="text" value="${escapeAttr(plan.label)}" required /></label>
        <label>Ketentuan paket<textarea data-plan-field="terms" rows="3" required>${escapeHtml(plan.terms)}</textarea></label>
      `;
      planList.appendChild(card);
    });

    planList.querySelectorAll('[data-remove-plan]').forEach((button) => {
      button.addEventListener('click', () => {
        if (content.productPackages[activeProductKey].plans.length <= 1) {
          setStatus('Minimal harus ada satu paket.', true);
          return;
        }

        const index = Number(button.dataset.removePlan);
        content.productPackages[activeProductKey].plans.splice(index, 1);
        renderEditor();
      });
    });
  }

  function renderEditor() {
    const product = content.productPackages[activeProductKey];
    const detail = content.productDetailContent[activeProductKey] || {};

    if (!product) {
      activeProductKey = '';
      setWorkspaceMode('empty');
      return;
    }

    setWorkspaceMode('edit');
    fields.productKey.textContent = activeProductKey;
    fields.editorTitle.textContent = product.name;
    fields.productSlug.value = activeProductKey;
    fields.productName.value = product.name || '';
    fields.detailLabel.value = detail.label || product.name || '';
    fields.detailTitle.value = detail.title || product.name || '';
    fields.detailLead.value = detail.lead || '';
    fields.tutorialUrl.value = detail.tutorialUrl || '';
    fields.tutorialLabel.value = detail.tutorialLabel || '';
    fields.orderProduct.value = detail.orderProduct || activeProductKey;
    fields.orderPlan.value = detail.orderPlan || product.plans[0]?.value || '';
    fields.summary.value = arrayToLines(detail.summary);
    fields.terms.value = arrayToLines(detail.terms);
    fields.note.value = detail.note || '';
    renderPlans(product);
  }

  function collectPlans() {
    return Array.from(planList.querySelectorAll('.content-plan-card')).map((card) => {
      const getField = (name) => card.querySelector(`[data-plan-field="${name}"]`).value.trim();
      return {
        value: getField('value'),
        label: getField('label'),
        name: getField('name'),
        price: getField('price'),
        duration: getField('duration'),
        terms: getField('terms')
      };
    });
  }

  function collectForm() {
    if (workspaceMode !== 'edit') {
      return true;
    }

    if (!activeProductKey || !content.productPackages[activeProductKey]) {
      return false;
    }

    const previousKey = activeProductKey;
    const nextKey = slugifyProductKey(fields.productSlug.value) || activeProductKey;

    if (nextKey !== activeProductKey && content.productPackages[nextKey]) {
      setStatus('Kode produk sudah dipakai produk lain. Gunakan kode berbeda.', true);
      fields.productSlug.value = activeProductKey;
      return false;
    }

    const plans = collectPlans();
    const nextProduct = {
      name: fields.productName.value.trim(),
      plans
    };
    const nextDetail = {
      ...(content.productDetailContent[activeProductKey] || {}),
      label: fields.detailLabel.value.trim(),
      title: fields.detailTitle.value.trim(),
      lead: fields.detailLead.value.trim(),
      summary: linesToArray(fields.summary.value),
      terms: linesToArray(fields.terms.value),
      note: fields.note.value.trim(),
      tutorialUrl: fields.tutorialUrl.value.trim(),
      tutorialLabel: fields.tutorialLabel.value.trim(),
      orderProduct: fields.orderProduct.value.trim(),
      orderPlan: fields.orderPlan.value.trim()
    };

    if (nextKey !== activeProductKey) {
      delete content.productPackages[activeProductKey];
      delete content.productDetailContent[activeProductKey];
      activeProductKey = nextKey;
      nextDetail.orderProduct = nextDetail.orderProduct === previousKey ? nextKey : nextDetail.orderProduct || nextKey;
    }

    content.productPackages[activeProductKey] = nextProduct;
    content.productDetailContent[activeProductKey] = nextDetail;
    fields.productSlug.value = activeProductKey;
    return true;
  }

  function validateActiveProduct() {
    const product = content.productPackages[activeProductKey];
    const detail = content.productDetailContent[activeProductKey];

    if (!activeProductKey || !product || !detail) {
      setStatus('Pilih atau tambah produk terlebih dahulu.', true);
      return false;
    }

    if (!product.name || !detail.title || !detail.lead) {
      setStatus('Kode, nama, judul, dan deskripsi utama wajib diisi.', true);
      return false;
    }

    if (!product.plans.length || product.plans.some((plan) => !plan.value || !plan.name || !plan.price)) {
      setStatus('Setiap paket wajib punya kode, nama, dan harga.', true);
      return false;
    }

    return true;
  }

  function selectProduct(productKey) {
    if (!content.productPackages[productKey]) {
      return;
    }

    if (!collectForm()) {
      return;
    }

    activeProductKey = productKey;
    renderEditor();
    renderProductList();
    scrollWorkspaceIntoView(form);
    setStatus('Mode edit produk.');
  }

  function renderProductPreview(productKey) {
    if (!content.productPackages[productKey]) {
      return;
    }

    const product = content.productPackages[productKey];
    const detail = content.productDetailContent[productKey] || {};
    const plans = Array.isArray(product.plans) ? product.plans : [];

    previewPanel.innerHTML = `
      <div class="content-preview-head">
        <div>
          <span class="section-kicker">${escapeHtml(productKey)}</span>
          <h2>${escapeHtml(detail.title || product.name || productKey)}</h2>
          <p>${escapeHtml(detail.lead || 'Belum ada deskripsi utama untuk produk ini.')}</p>
        </div>
        <button class="primary-button" type="button" data-preview-edit="${escapeAttr(productKey)}">Edit Produk</button>
      </div>

      <div class="content-live-preview-card">
        <div class="content-live-preview-top">
          <span>${escapeHtml(detail.label || product.name || 'Produk')}</span>
          <strong>${escapeHtml(product.name || productKey)}</strong>
        </div>
        <div class="content-live-preview-copy">
          <h3>Ringkasan</h3>
          <ul>
            ${(detail.summary || ['Belum ada ringkasan.']).slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="content-preview-grid">
        ${plans.map((plan) => `
          <article class="content-preview-plan">
            <span>${escapeHtml(plan.duration || 'Durasi')}</span>
            <h3>${escapeHtml(plan.name || plan.label || 'Paket')}</h3>
            <strong>${escapeHtml(plan.price || 'Rp0')}</strong>
            <p>${escapeHtml(plan.terms || 'Belum ada ketentuan paket.')}</p>
          </article>
        `).join('')}
      </div>

      <div class="content-preview-note">
        <strong>Catatan</strong>
        <p>${escapeHtml(detail.note || 'Tidak ada catatan tambahan.')}</p>
        ${detail.tutorialUrl ? `<a href="${escapeAttr(detail.tutorialUrl)}" target="_blank" rel="noopener">${escapeHtml(detail.tutorialLabel || 'Buka tutorial')}</a>` : ''}
      </div>
    `;

    const editButton = previewPanel.querySelector('[data-preview-edit]');
    if (editButton) {
      editButton.addEventListener('click', () => selectProduct(editButton.dataset.previewEdit));
    }

    activeProductKey = productKey;
    setWorkspaceMode('preview');
    renderProductList();
    scrollWorkspaceIntoView(previewPanel);
  }

  function previewProduct(productKey = activeProductKey) {
    const requestedKey = productKey;

    if (!collectForm()) {
      return;
    }

    const nextKey = content.productPackages[requestedKey] ? requestedKey : activeProductKey;

    if (!content.productPackages[nextKey]) {
      return;
    }

    renderProductPreview(nextKey);
    saveState.textContent = 'Preview';
  }

  function createProduct() {
    if (activeProductKey && content.productPackages[activeProductKey] && !collectForm()) {
      return;
    }

    let baseKey = 'produk-baru';
    let nextKey = baseKey;
    let counter = 2;

    while (content.productPackages[nextKey]) {
      nextKey = `${baseKey}-${counter}`;
      counter += 1;
    }

    content.productPackages[nextKey] = {
      name: 'Produk Baru',
      plans: [
        {
          value: 'paket-1',
          label: 'Paket 1 - Rp0',
          name: 'Paket 1',
          price: 'Rp0',
          duration: 'Durasi',
          terms: 'Ketentuan paket'
        }
      ]
    };

    content.productDetailContent[nextKey] = {
      label: 'Produk Baru',
      title: 'Produk Baru',
      lead: 'Tulis deskripsi utama produk baru di sini.',
      summary: ['Tulis ringkasan produk.'],
      terms: ['Tulis ketentuan produk.'],
      note: 'Tulis catatan order.',
      tutorialUrl: '',
      tutorialLabel: '',
      orderProduct: nextKey,
      orderPlan: 'paket-1'
    };

    activeProductKey = nextKey;
    renderProductList();
    renderEditor();
    scrollWorkspaceIntoView(form);
    setStatus('Produk baru dibuat. Lengkapi data lalu klik Simpan.');
  }

  function deleteProduct(productKey = activeProductKey) {
    if (!content.productPackages[productKey]) {
      return;
    }

    const productName = content.productPackages[productKey].name || productKey;
    const confirmed = window.confirm(`Hapus produk "${productName}" dari Content Editor?`);

    if (!confirmed) {
      return;
    }

    delete content.productPackages[productKey];
    delete content.productDetailContent[productKey];
    activeProductKey = '';

    if (!Object.keys(content.productPackages).length) {
      createProduct();
      return;
    }

    renderProductList();
    setWorkspaceMode('empty');
    setStatus('Produk dihapus. Klik Simpan untuk menerapkan perubahan.');
  }

  function saveContent() {
    if (!collectForm()) {
      return;
    }

    if (!validateActiveProduct()) {
      return;
    }

    api.saveOverrides(content);
    jsonBox.value = JSON.stringify(content, null, 2);
    renderProductList();
    setStatus('Konten tersimpan. Buka preview untuk melihat hasil di website.', false, 'Tersimpan');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveContent();
  });

  searchInput.addEventListener('input', renderProductList);
  sortSelect.addEventListener('change', renderProductList);

  document.getElementById('addProductBtn').addEventListener('click', createProduct);
  document.getElementById('deleteProductBtn').addEventListener('click', () => deleteProduct(activeProductKey));

  document.getElementById('addPlanBtn').addEventListener('click', () => {
    if (!collectForm()) {
      return;
    }

    content.productPackages[activeProductKey].plans.push({
      value: `paket-${content.productPackages[activeProductKey].plans.length + 1}`,
      label: 'Paket Baru - Rp0',
      name: 'Paket Baru',
      price: 'Rp0',
      duration: 'Durasi',
      terms: 'Ketentuan paket'
    });
    renderEditor();
  });

  document.getElementById('contentPreviewBtn').addEventListener('click', () => {
    previewProduct(activeProductKey);
  });

  document.getElementById('exportContentBtn').addEventListener('click', () => {
    collectForm();
    jsonBox.value = JSON.stringify(content, null, 2);
    setStatus('JSON export sudah dibuat.');
  });

  document.getElementById('copyContentBtn').addEventListener('click', async () => {
    collectForm();
    jsonBox.value = JSON.stringify(content, null, 2);

    try {
      await navigator.clipboard.writeText(jsonBox.value);
      setStatus('JSON sudah disalin.');
    } catch (error) {
      setStatus('JSON sudah dibuat, tapi browser menolak copy otomatis.', true);
    }
  });

  document.getElementById('importContentBtn').addEventListener('click', () => {
    try {
      const imported = JSON.parse(jsonBox.value || '{}');

      if (!imported.productPackages || !imported.productDetailContent) {
        setStatus('Format JSON tidak sesuai.', true);
        return;
      }

      content = imported;
      activeProductKey = '';
      api.saveOverrides(content);
      renderProductList();
      setWorkspaceMode('empty');
      setStatus('JSON berhasil diimport dan disimpan.', false, 'Tersimpan');
    } catch (error) {
      setStatus('JSON tidak valid.', true);
    }
  });

  document.getElementById('resetContentBtn').addEventListener('click', () => {
    content = clone(api.defaults);
    api.clearOverrides();
    activeProductKey = '';
    jsonBox.value = '';
    renderProductList();
    setWorkspaceMode('empty');
    setStatus('Konten kembali ke default bawaan website.', false, 'Default');
  });

  jsonBox.value = JSON.stringify(content, null, 2);
  renderProductList();
  setWorkspaceMode('empty');
})();
