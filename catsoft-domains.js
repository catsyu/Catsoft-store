(function () {
  const cloudflareDomains = [
    'catsoft.store',
    'catsoft.digital',
    'catsoft.online',
    'ask1q2.uk',
    'fadisa1.uk',
    'gasddqw1.uk',
    'kulamusic.us',
    'wkwkksks.uk',
    'malibus.org'
  ];

  const domains = cloudflareDomains
    .map((domain) => String(domain || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((domain, index, list) => list.indexOf(domain) === index);

  window.CATSOFT_EMAIL_DOMAINS = Object.freeze([...domains]);
  window.CATSOFT_CLOUDFLARE_DOMAINS = window.CATSOFT_EMAIL_DOMAINS;
  window.CATSOFT_DEFAULT_EMAIL_DOMAIN = domains[0];
  window.CATSOFT_EMAIL_DOMAIN_VERSION = '20260601-cloudflare-domains';

  window.getCatsoftEmailDomains = function getCatsoftEmailDomains() {
    return [...domains];
  };
})();
