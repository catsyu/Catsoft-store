(function () {
  const domains = [
    'catsoft.store',
    'catsoft.digital',
    'catsoft.online',
    'ask1q2.uk',
    'fadisa1.uk',
    'gasddqw1.uk',
    'kulamusic.us',
    'wkwkksks.uk'
  ];

  window.CATSOFT_EMAIL_DOMAINS = Object.freeze([...domains]);
  window.CATSOFT_DEFAULT_EMAIL_DOMAIN = domains[0];

  window.getCatsoftEmailDomains = function getCatsoftEmailDomains() {
    return [...domains];
  };
})();
