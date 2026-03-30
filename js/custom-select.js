/* ============================================================
   ONDA AI — Custom Select Dropdown
   Usage: initCustomSelect(selectElement)
   Hides native <select>, creates styled trigger + dropdown.
   ============================================================ */

function initCustomSelect(selectEl) {
  if (!selectEl || selectEl.dataset.customized) return;
  selectEl.dataset.customized = 'true';
  selectEl.style.display = 'none';

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

  var options = selectEl.querySelectorAll('option');
  var optEls = [];

  for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    if (!opt.value) {
      label.textContent = opt.textContent;
      label.classList.add('placeholder');
      continue;
    }

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
      el.addEventListener('click', function() {
        selectEl.value = val;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        selectEl.dispatchEvent(new Event('input', { bubbles: true }));

        label.textContent = text;
        label.classList.remove('placeholder');

        dropdown.querySelectorAll('.custom-select-option').forEach(function(o) {
          o.classList.remove('selected');
        });
        el.classList.add('selected');
        close();
      });
    })(optEl, opt.value, opt.textContent);

    optEls.push(optEl);
    dropdown.appendChild(optEl);
  }

  wrap.appendChild(trigger);
  wrap.appendChild(dropdown);
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  var isOpen = false;

  function open() {
    isOpen = true;
    trigger.classList.add('open');
    dropdown.classList.add('open');
  }

  function close() {
    isOpen = false;
    trigger.classList.remove('open');
    dropdown.classList.remove('open');
  }

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    isOpen ? close() : open();
  });

  trigger.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isOpen ? close() : open();
    } else if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      var current = dropdown.querySelector('.selected') || dropdown.firstElementChild;
      var next = current.nextElementSibling;
      if (next) next.click();
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      var current = dropdown.querySelector('.selected') || dropdown.firstElementChild;
      var prev = current.previousElementSibling;
      if (prev) prev.click();
    }
  });

  document.addEventListener('click', function(e) {
    if (!wrap.contains(e.target)) close();
  });

  // Update text when language changes
  document.addEventListener('langchange', function() {
    var sel = selectEl.options[selectEl.selectedIndex];
    if (sel && sel.value) {
      label.textContent = sel.textContent;
    }
    optEls.forEach(function(el) {
      var opt = selectEl.querySelector('option[value="' + el.dataset.value + '"]');
      if (opt) el.textContent = opt.textContent;
    });
  });
}

function initAllCustomSelects() {
  document.querySelectorAll('.form-select').forEach(initCustomSelect);
}
