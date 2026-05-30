(function () {
  const params = new URLSearchParams(window.location.search || '');
  const pathname = window.location.pathname || '';
  const isEmbeddedTool = params.get('embedded') === '1' || pathname.startsWith('/tool/');
  const isPopupTool = params.get('popup') === '1';

  if (isEmbeddedTool || isPopupTool) {
    return;
  }

  const pageName = (pathname.split('/').pop() || '').replace(/\.html$/i, '');
  const hashByPage = {
    'admin-access': '#admin',
    'supplier-access': '#supplier-access',
    'customer-access': '#customer-access',
    'customer-database': '#customer',
    'refund-calculator': '#refund',
    'office-activation': '#office',
    'email-inbox': '#email',
    'internal-chat': '#chat',
    'marketing-calculator': '#marketing',
    'content-editor': '#content',
    'product-stock': '#stock',
    'finance-database': '#finance'
  };
  const targetHash = hashByPage[pageName];

  if (!targetHash) {
    return;
  }

  let targetUrl;
  if (window.location.protocol === 'file:') {
    targetUrl = new URL(`admin-tools.html${targetHash}`, window.location.href);
  } else {
    const adminOrigin = window.location.hostname === 'admin.catsoft.store'
      ? window.location.origin
      : 'https://admin.catsoft.store';
    targetUrl = new URL(`/${targetHash}`, adminOrigin);
  }

  window.location.replace(targetUrl.toString());
})();
