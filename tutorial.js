(function () {
  const optionButtons = Array.from(document.querySelectorAll('[data-tutorial-target][data-tutorial-group]'));

  if (!optionButtons.length) {
    return;
  }

  const getPanels = (group) => Array.from(document.querySelectorAll(`[data-tutorial-panel][data-tutorial-group="${group}"]`));
  const getButtons = (group) => optionButtons.filter((button) => button.dataset.tutorialGroup === group);

  const activateTutorial = (group, target, options = {}) => {
    const panels = getPanels(group);
    const selectedPanel = panels.find((panel) => panel.dataset.tutorialPanel === target);

    if (!selectedPanel) {
      return;
    }

    panels.forEach((panel) => {
      const isActive = panel.dataset.tutorialPanel === target;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    getButtons(group).forEach((button) => {
      const isActive = button.dataset.tutorialTarget === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (options.updateHash && window.history && selectedPanel.id) {
      window.history.replaceState(null, '', `#${selectedPanel.id}`);
    }

    if (options.scroll) {
      selectedPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const groups = Array.from(new Set(optionButtons.map((button) => button.dataset.tutorialGroup)));
  const hashTarget = window.location.hash.replace('#', '');

  groups.forEach((group) => {
    const panels = getPanels(group);
    const hashPanel = panels.find((panel) => panel.id === hashTarget || panel.dataset.tutorialPanel === hashTarget);
    const activeButton = getButtons(group).find((button) => button.classList.contains('is-active'));
    const fallbackTarget = hashPanel?.dataset.tutorialPanel || activeButton?.dataset.tutorialTarget || panels[0]?.dataset.tutorialPanel;

    if (fallbackTarget) {
      activateTutorial(group, fallbackTarget);
    }
  });

  optionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateTutorial(button.dataset.tutorialGroup, button.dataset.tutorialTarget, {
        scroll: true,
        updateHash: true
      });
    });
  });

  window.addEventListener('hashchange', () => {
    const target = window.location.hash.replace('#', '');

    groups.forEach((group) => {
      const panel = getPanels(group).find((item) => item.id === target || item.dataset.tutorialPanel === target);

      if (panel) {
        activateTutorial(group, panel.dataset.tutorialPanel);
      }
    });
  });
})();
