// modules/reset-dilution.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.resetDilution = (() => {
  function enable() {
    if (document.getElementById('btnResetDilutionCustom')) return;

    const btnApply = document.querySelector('button.btnApplyInputDilution');
    if (!btnApply) return;

    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.id = 'btnResetDilutionCustom';
    btnReset.className = 'btn btn-sm btn-outline-danger';
    btnReset.style.cssText = 'font-size: 0.75rem; padding: 0.2rem 0.4rem; white-space: nowrap; flex: 1;';
    btnReset.innerText = 'Reset';

    btnReset.addEventListener('click', () => {
      const inputs = document.querySelectorAll('input.row-dilution-input');
      inputs.forEach(input => {
        if (input.value.trim() !== '') {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    const container = document.createElement('div');
    container.id = 'ztvResetWrapper';
    container.className = 'd-flex gap-1 mt-1';
    container.style.width = '100%';

    btnApply.classList.remove('w-100');
    btnApply.style.flex = '1';
    btnApply.style.whiteSpace = 'nowrap';

    btnApply.parentNode.insertBefore(container, btnApply);
    container.appendChild(btnApply);
    container.appendChild(btnReset);
  }

  function disable() {
    const btnReset = document.getElementById('btnResetDilutionCustom');
    const container = document.getElementById('ztvResetWrapper');
    const btnApply = document.querySelector('button.btnApplyInputDilution');

    if (btnReset) btnReset.remove();

    if (container && btnApply) {
      container.parentNode.insertBefore(btnApply, container);
      container.remove();
      btnApply.classList.add('w-100');
      btnApply.style.removeProperty('flex');
    }
  }

  return { enable, disable };
})();