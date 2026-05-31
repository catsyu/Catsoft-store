(function () {
  const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  function isDateLikeInput(input) {
    return input instanceof HTMLInputElement && (input.type === 'date' || input.type === 'month');
  }

  function formatDateValue(value) {
    const [yearText, monthText, dayText] = String(value || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (!year || !month || !day || month < 1 || month > 12) {
      return value;
    }

    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  }

  function formatMonthValue(value) {
    const [yearText, monthText] = String(value || '').split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!year || !month || month < 1 || month > 12) {
      return value;
    }

    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  function getEmptyLabel(input) {
    if (input.dataset.emptyLabel) {
      return input.dataset.emptyLabel;
    }

    return input.type === 'month' ? 'Pilih Bulan' : 'Pilih Tanggal';
  }

  function ensureSoftDateShell(input) {
    if (!isDateLikeInput(input)) {
      return null;
    }

    if (input.parentElement?.classList.contains('soft-date-shell')) {
      return input.parentElement;
    }

    const shell = document.createElement('span');
    shell.className = 'soft-date-shell';

    const display = document.createElement('span');
    display.className = 'soft-date-display';
    display.setAttribute('aria-hidden', 'true');

    input.parentNode.insertBefore(shell, input);
    shell.appendChild(input);
    shell.appendChild(display);

    return shell;
  }

  function syncDateInput(input) {
    if (!isDateLikeInput(input)) {
      return;
    }

    const hasValue = Boolean(input.value);
    const displayValue = hasValue
      ? (input.type === 'month' ? formatMonthValue(input.value) : formatDateValue(input.value))
      : getEmptyLabel(input);

    input.classList.add('soft-date-input');
    input.classList.toggle('has-date-value', hasValue);
    input.dataset.dateDisplay = displayValue || getEmptyLabel(input);

    const shell = ensureSoftDateShell(input);
    if (shell) {
      const display = shell.querySelector('.soft-date-display');
      shell.classList.toggle('has-date-value', hasValue);
      shell.classList.toggle('is-month-input', input.type === 'month');
      shell.classList.toggle('is-date-input', input.type === 'date');

      if (display) {
        display.textContent = input.dataset.dateDisplay;
      }
    }
  }

  function syncDateInputs(root = document) {
    root.querySelectorAll?.('input[type="date"], input[type="month"]').forEach(syncDateInput);
  }

  function patchInputValueSetter() {
    if (window.__catsoftDateInputPatched) {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!descriptor?.get || !descriptor?.set) {
      return;
    }

    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get() {
        return descriptor.get.call(this);
      },
      set(nextValue) {
        descriptor.set.call(this, nextValue);

        if (isDateLikeInput(this)) {
          queueMicrotask(() => syncDateInput(this));
        }
      }
    });

    window.__catsoftDateInputPatched = true;
  }

  function bootDateInputs() {
    patchInputValueSetter();
    syncDateInputs(document);

    document.addEventListener('input', (event) => syncDateInput(event.target), true);
    document.addEventListener('change', (event) => syncDateInput(event.target), true);
    document.addEventListener('focusin', (event) => syncDateInput(event.target), true);
    document.addEventListener('blur', (event) => syncDateInput(event.target), true);
    document.addEventListener('click', (event) => syncDateInput(event.target), true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
          }

          if (isDateLikeInput(node)) {
            syncDateInput(node);
          } else {
            syncDateInputs(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDateInputs, { once: true });
  } else {
    bootDateInputs();
  }

  window.CatsoftFormStandard = {
    syncDateInput,
    syncDateInputs
  };
})();
