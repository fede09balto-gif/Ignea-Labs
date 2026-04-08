/* ============================================================
   IGNEA LABS — Custom Select Dropdown (v2 — searchable)
   Usage: initCustomSelect(selectElement)
   Hides native <select>, creates styled trigger + dropdown.
   Features: type-to-search filtering + "Other" free-text input.
   ============================================================ */

function initCustomSelect(selectEl) {
  if (!selectEl || selectEl.dataset.customized) return;
  selectEl.dataset.customized = 'true';
  selectEl.style.display = 'none';

  var allowOther = selectEl.querySelector('option[value="other"]') !== null;

  var wrap = document.createElement('div');
  wrap.className = 'custom-select';

  var trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('tabindex', '0');

  var label = document.createElement('span');
  label.className = 'custom-select-label';

  var arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '\u25BE';

  trigger.appendChild(label);
  trigger.appendChild(arrow);

  var dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';

  // Search input
  var searchWrap = document.createElement('div');
  searchWrap.className = 'cs-search-wrap';
  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'cs-search';
  searchInput.placeholder = 'Buscar...';
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  // Options container (scrollable)
  var optsList = document.createElement('div');
  optsList.className = 'cs-options-list';

  var options = selectEl.querySelectorAll('option');
  var optEls = [];
  var placeholderText = '';

  for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    if (!opt.value) {
      placeholderText = opt.textContent;
      label.textContent = opt.textContent;
      label.classList.add('placeholder');
      continue;
    }
    // Skip the "other" option — we'll add a custom input for it
    if (opt.value === 'other' && allowOther) continue;

    var optEl = document.createElement('div');
    optEl.className = 'custom-select-option';
    optEl.dataset.value = opt.value;
    optEl.textContent = opt.textContent;

    if (opt.selected && opt.value) {
      optEl.classList.add('selected');
      label.textContent = opt.textContent;
      label.classList.remove('placeholder');
    }

    (function(el, val, text) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        selectOption(val, text);
        close();
      });
    })(optEl, opt.value, opt.textContent);

    optEls.push(optEl);
    optsList.appendChild(optEl);
  }

  dropdown.appendChild(optsList);

  // "Other" free-text row at the bottom
  var otherWrap = null;
  var otherInput = null;
  if (allowOther) {
    otherWrap = document.createElement('div');
    otherWrap.className = 'cs-other-wrap';

    var otherLabel = document.createElement('span');
    otherLabel.className = 'cs-other-label';
    otherLabel.textContent = 'Otro:';
    otherLabel.dataset.i18nOther = 'true';

    otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.className = 'cs-other-input';
    otherInput.placeholder = 'Escribe tu industria...';
    otherInput.dataset.i18nOtherPh = 'true';

    otherWrap.appendChild(otherLabel);
    otherWrap.appendChild(otherInput);
    dropdown.appendChild(otherWrap);

    otherInput.addEventListener('input', function() {
      var val = this.value.trim();
      if (val) {
        selectOption('other', val);
        // Deselect all list items visually
        optEls.forEach(function(o) { o.classList.remove('selected'); });
      }
    });

    otherInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        close();
      }
      e.stopPropagation();
    });

    otherInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  wrap.appendChild(trigger);
  wrap.appendChild(dropdown);
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  var isOpen = false;

  function selectOption(val, text) {
    selectEl.value = val;
    // For "other" with custom text, store the typed value in a data attribute
    if (val === 'other') {
      selectEl.dataset.otherText = text;
    } else {
      delete selectEl.dataset.otherText;
    }
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));

    label.textContent = text;
    label.classList.remove('placeholder');

    optEls.forEach(function(o) { o.classList.remove('selected'); });
    var match = optsList.querySelector('[data-value="' + val + '"]');
    if (match) match.classList.add('selected');
  }

  function filterOptions(query) {
    var q = query.toLowerCase().trim();
    var visibleCount = 0;
    optEls.forEach(function(el) {
      var text = el.textContent.toLowerCase();
      var show = !q || text.indexOf(q) !== -1;
      el.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    // If no matches and we have "other", focus the other input
    if (visibleCount === 0 && otherInput) {
      otherInput.focus();
      otherInput.value = query;
    }
  }

  function open() {
    isOpen = true;
    trigger.classList.add('open');
    dropdown.classList.add('open');
    searchInput.value = '';
    filterOptions('');
    // Focus search after a frame so the dropdown is visible
    requestAnimationFrame(function() { searchInput.focus(); });
  }

  function close() {
    isOpen = false;
    trigger.classList.remove('open');
    dropdown.classList.remove('open');
    searchInput.value = '';
    filterOptions('');
  }

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    isOpen ? close() : open();
  });

  searchInput.addEventListener('input', function() {
    filterOptions(this.value);
  });

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      close();
      trigger.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus first visible option
      var first = optsList.querySelector('.custom-select-option:not([style*="display: none"])');
      if (first) first.click();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If only one visible option, select it
      var visible = optsList.querySelectorAll('.custom-select-option:not([style*="display: none"])');
      if (visible.length === 1) {
        visible[0].click();
      } else if (visible.length === 0 && otherInput) {
        otherInput.value = searchInput.value;
        selectOption('other', searchInput.value.trim());
        close();
      }
    }
    e.stopPropagation();
  });

  searchInput.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  trigger.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isOpen ? close() : open();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  document.addEventListener('click', function(e) {
    if (!wrap.contains(e.target)) close();
  });

  // Update text when language changes
  document.addEventListener('langchange', function() {
    var lang = (typeof IgneaI18n !== 'undefined') ? IgneaI18n.getLang() : 'es';
    searchInput.placeholder = lang === 'es' ? 'Buscar...' : 'Search...';
    if (otherWrap) {
      otherWrap.querySelector('.cs-other-label').textContent = lang === 'es' ? 'Otro:' : 'Other:';
      otherInput.placeholder = lang === 'es' ? 'Escribe tu industria...' : 'Type your industry...';
    }

    var sel = selectEl.options[selectEl.selectedIndex];
    if (sel && sel.value && sel.value !== 'other') {
      label.textContent = sel.textContent;
    }
    optEls.forEach(function(el) {
      var opt = selectEl.querySelector('option[value="' + el.dataset.value + '"]');
      if (opt) el.textContent = opt.textContent;
    });
  });
}

function initAllCustomSelects() {
  document.querySelectorAll('select[data-custom]').forEach(initCustomSelect);
}
