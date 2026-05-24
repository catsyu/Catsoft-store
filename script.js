const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    item.classList.toggle('active');
  });
});

const termsModal = document.getElementById('termsModal');
const openTerms = document.getElementById('openTermsLink');
const closeTerms = document.getElementById('closeTerms');

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

window.addEventListener('DOMContentLoaded', initProductOrderButtons);
