/* ============================================================
   IGNEA LABS — Admin Submissions: Table, Filters, Sorting
   ============================================================ */

var AdminSubmissions = (function() {

  var data = [];
  var filtered = [];
  var sortCol = 'created_at';
  var sortAsc = false;

  function setData(submissions) {
    data = submissions;
    filtered = data.slice();
  }

  function render() {
    applyFilters();
    applySort();
    renderTable();
    bindEvents();
  }

  function applyFilters() {
    var search = (document.getElementById('filterSearch') || {}).value || '';
    var status = (document.getElementById('filterStatus') || {}).value || '';
    var industry = (document.getElementById('filterIndustry') || {}).value || '';
    var level = (document.getElementById('filterLevel') || {}).value || '';
    var q = search.toLowerCase();

    filtered = data.filter(function(d) {
      if (status && (d.status || 'new') !== status) return false;
      if (industry && (d.industry || '') !== industry) return false;
      if (level && (d.level || '') !== level) return false;
      if (q) {
        var haystack = [
          d.company_name || '',
          d.contact_name || '',
          d.contact_email || '',
          d.industry || ''
        ].join(' ').toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function applySort() {
    filtered.sort(function(a, b) {
      var av = a[sortCol];
      var bv = b[sortCol];
      if (av == null) av = '';
      if (bv == null) bv = '';
      if (sortCol === 'total_score') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      if (sortCol === 'created_at') {
        av = new Date(av).getTime() || 0;
        bv = new Date(bv).getTime() || 0;
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  function renderTable() {
    var tbody = document.getElementById('submissionsBody');
    var empty = document.getElementById('emptyState');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var d = filtered[i];
      var date = d.created_at ? new Date(d.created_at) : null;
      var dateStr = date ? (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() : '--';
      var status = d.status || 'new';
      var level = d.level || '--';
      var score = d.total_score != null ? d.total_score : '--';

      html += '<tr data-id="' + d.id + '">' +
        '<td class="td-date">' + dateStr + '</td>' +
        '<td class="td-company">' + esc(d.company_name || '--') + '</td>' +
        '<td>' + esc(d.contact_name || '--') + '</td>' +
        '<td>' + esc(d.industry || '--') + '</td>' +
        '<td class="td-score">' + score + '</td>' +
        '<td><span class="level-badge l-' + level + '">' + level + '</span></td>' +
        '<td><span class="status-badge s-' + status + '">' + statusLabel(status) + '</span></td>' +
        '</tr>';
    }
    tbody.innerHTML = html;

    // Row click → open detail
    var rows = tbody.querySelectorAll('tr');
    for (var j = 0; j < rows.length; j++) {
      rows[j].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var item = findById(id);
        if (item && typeof AdminDetail !== 'undefined') {
          AdminDetail.open(item);
        }
      });
    }
  }

  function bindEvents() {
    var searchEl = document.getElementById('filterSearch');
    var statusEl = document.getElementById('filterStatus');
    var industryEl = document.getElementById('filterIndustry');
    var levelEl = document.getElementById('filterLevel');

    if (searchEl) searchEl.addEventListener('input', debounce(render, 300));
    if (statusEl) statusEl.addEventListener('change', render);
    if (industryEl) industryEl.addEventListener('change', render);
    if (levelEl) levelEl.addEventListener('change', render);

    // Sort headers
    var ths = document.querySelectorAll('.admin-table th[data-sort]');
    for (var i = 0; i < ths.length; i++) {
      ths[i].addEventListener('click', function() {
        var col = this.getAttribute('data-sort');
        if (sortCol === col) {
          sortAsc = !sortAsc;
        } else {
          sortCol = col;
          sortAsc = true;
        }
        // Update header styles
        ths = document.querySelectorAll('.admin-table th[data-sort]');
        for (var j = 0; j < ths.length; j++) {
          ths[j].classList.remove('sorted');
          var arrow = ths[j].querySelector('.sort-arrow');
          if (arrow) arrow.textContent = '';
        }
        this.classList.add('sorted');
        var myArrow = this.querySelector('.sort-arrow');
        if (myArrow) myArrow.textContent = sortAsc ? '▲' : '▼';

        applySort();
        renderTable();
      });
    }
  }

  function findById(id) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(id)) return data[i];
    }
    return null;
  }

  function statusLabel(s) {
    var labels = {
      new: 'NEW',
      analyzed: 'ANALYZED',
      reviewed: 'REVIEWED',
      report_generated: 'REPORT',
      proposal_sent: 'PROPOSAL',
      closed_won: 'WON',
      closed_lost: 'LOST'
    };
    return labels[s] || s.toUpperCase();
  }

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  return {
    setData: setData,
    render: render
  };

})();
