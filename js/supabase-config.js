/* ============================================================
   IGNEA LABS — Supabase REST Client (lightweight, no SDK)
   Direct fetch wrapper against the PostgREST API.
   No SES, no eval, no CSP issues.
   ============================================================ */

var IgneaSupabase = (function() {
  var URL = 'https://uqupiesctjvosvszovuq.supabase.co/rest/v1';
  var KEY = 'sb_publishable_wUXzJhf8mERI7m9hL4Th6g_GpWvSEMP';

  var headers = {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  function from(table) {
    return new QueryBuilder(table);
  }

  function QueryBuilder(table) {
    this._table = table;
    this._filters = [];
    this._select = '*';
    this._order = null;
    this._limit = null;
    this._single = false;
  }

  QueryBuilder.prototype.select = function(cols) {
    this._select = cols || '*';
    return this;
  };

  QueryBuilder.prototype.eq = function(col, val) {
    this._filters.push(col + '=eq.' + encodeURIComponent(val));
    return this;
  };

  QueryBuilder.prototype.neq = function(col, val) {
    this._filters.push(col + '=neq.' + encodeURIComponent(val));
    return this;
  };

  QueryBuilder.prototype.in = function(col, vals) {
    this._filters.push(col + '=in.(' + vals.map(encodeURIComponent).join(',') + ')');
    return this;
  };

  QueryBuilder.prototype.order = function(col, opts) {
    var dir = (opts && opts.ascending === false) ? '.desc' : '.asc';
    this._order = 'order=' + col + dir;
    return this;
  };

  QueryBuilder.prototype.limit = function(n) {
    this._limit = n;
    return this;
  };

  QueryBuilder.prototype.single = function() {
    this._single = true;
    return this._execute('GET');
  };

  QueryBuilder.prototype.maybeSingle = function() {
    this._single = true;
    return this._execute('GET').then(function(result) {
      if (result.error && result.status === 406) {
        return { data: null, error: null };
      }
      return result;
    });
  };

  QueryBuilder.prototype.then = function(onFulfilled, onRejected) {
    return this._execute('GET').then(onFulfilled, onRejected);
  };

  QueryBuilder.prototype.insert = function(rows) {
    this._body = JSON.stringify(Array.isArray(rows) ? rows : [rows]);
    return this._execute('POST');
  };

  QueryBuilder.prototype.update = function(data) {
    this._body = JSON.stringify(data);
    this._method = 'PATCH';
    var self = this;
    return {
      eq: function(col, val) {
        self._filters.push(col + '=eq.' + encodeURIComponent(val));
        return self._execute('PATCH');
      }
    };
  };

  QueryBuilder.prototype.delete = function() {
    this._method = 'DELETE';
    var self = this;
    return {
      eq: function(col, val) {
        self._filters.push(col + '=eq.' + encodeURIComponent(val));
        return self._execute('DELETE');
      }
    };
  };

  QueryBuilder.prototype._execute = function(method) {
    var url = URL + '/' + this._table + '?select=' + encodeURIComponent(this._select);

    for (var i = 0; i < this._filters.length; i++) {
      url += '&' + this._filters[i];
    }
    if (this._order) url += '&' + this._order;
    if (this._limit) url += '&limit=' + this._limit;

    var reqHeaders = {};
    for (var k in headers) reqHeaders[k] = headers[k];

    if (this._single) {
      reqHeaders['Accept'] = 'application/vnd.pgrst.object+json';
    }

    var opts = { method: method, headers: reqHeaders };
    if (this._body) opts.body = this._body;

    return fetch(url, opts).then(function(resp) {
      if (resp.status === 204) return { data: null, error: null };
      return resp.json().then(function(json) {
        if (!resp.ok) {
          return { data: null, error: json, status: resp.status };
        }
        return { data: json, error: null, status: resp.status };
      });
    }).catch(function(err) {
      return { data: null, error: { message: err.message } };
    });
  };

  // Mimic the SDK interface: IgneaSupabase.client.from('table')
  var client = { from: from };

  return {
    client: client,
    init: function() {}
  };
})();
