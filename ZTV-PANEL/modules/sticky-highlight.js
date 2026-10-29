// modules/sticky-highlight.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.stickyHighlight = (() => {
  function enable() {
    const collapseEl = document.getElementById('collapseHighlightParameter');
    if (!collapseEl) return;

    let stickyWrapper = document.getElementById('ztvStickyHighlightWrapper');
    if (stickyWrapper) return;

    const toggleBtn = document.querySelector('button[data-bs-target="#collapseHighlightParameter"]');
    const cardHeader = toggleBtn ? toggleBtn.closest('.card-header') : null;
    if (!cardHeader) return;

    let placeholder = document.getElementById('ztvHighlightPlaceholder');
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.id = 'ztvHighlightPlaceholder';
      placeholder.style.display = 'none';
      cardHeader.parentNode.insertBefore(placeholder, cardHeader);
    }

    stickyWrapper = document.createElement('div');
    stickyWrapper.id = 'ztvStickyHighlightWrapper';
    stickyWrapper.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      width: 320px;
      max-width: 90vw;
      z-index: 1050;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-radius: 10px;
      overflow: hidden;
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      transition: all 0.25s ease-in-out;
    `;

    const cardBody = collapseEl.querySelector('.card-body');
    if (cardBody) {
      cardBody.setAttribute('data-orig-max-height', cardBody.style.maxHeight || '');
      cardBody.setAttribute('data-orig-overflow-y', cardBody.style.overflowY || '');
      cardBody.style.maxHeight = '350px';
      cardBody.style.overflowY = 'auto';
      cardBody.style.padding = '0.75rem';
    }

    stickyWrapper.appendChild(cardHeader);
    stickyWrapper.appendChild(collapseEl);
    document.body.appendChild(stickyWrapper);
  }

  function disable() {
    const stickyWrapper = document.getElementById('ztvStickyHighlightWrapper');
    const placeholder = document.getElementById('ztvHighlightPlaceholder');
    const collapseEl = document.getElementById('collapseHighlightParameter');
    const toggleBtn = document.querySelector('button[data-bs-target="#collapseHighlightParameter"]');
    const cardHeader = toggleBtn ? toggleBtn.closest('.card-header') : null;

    if (stickyWrapper && placeholder && cardHeader && collapseEl) {
      placeholder.parentNode.insertBefore(cardHeader, placeholder);
      placeholder.parentNode.insertBefore(collapseEl, placeholder);
      placeholder.remove();

      const cardBody = collapseEl.querySelector('.card-body');
      if (cardBody) {
        cardBody.style.maxHeight = cardBody.getAttribute('data-orig-max-height') || '';
        cardBody.style.overflowY = cardBody.getAttribute('data-orig-overflow-y') || '';
      }

      stickyWrapper.remove();
    }
  }

  return { enable, disable };
})();