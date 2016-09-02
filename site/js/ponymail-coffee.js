// Generated by CoffeeScript 1.9.3
var Calendar, HTML, HTTPRequest, calendar_months, cog, dbRead, dbWrite, e, genColors, get, hsl2rgb, isArray, isHash, listView, listviewScaffolding, pendingURLStatus, pending_url_operations, pm_storage_available, pm_storage_globvar, set, testCoffee, testToggle, toggleMonth, toggleYear, txt;

calendar_months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


/**
 * Calendar: Make a HTML calendar with years and months
 * that expands/contracts. For the left side view.
 * Usage: cal = new Calendar('2001-2', '2016-9', 2010)
 * Would make a calendar going from 2001 to 2016 with 2010 expanded.
 */

Calendar = (function() {
  function Calendar(start, end, jumpTo) {
    var div, eMonth, eYear, j, month, monthDiv, monthsDiv, now, o, ref, ref1, ref2, ref3, ref4, sMonth, sYear, uid, yDiv, year, years;
    now = new Date();
    uid = parseInt(Math.random() * 100000000).toString(16);

    /* Split start and end into years and months */
    ref = String(start).split("-"), sYear = ref[0], sMonth = ref[1];
    ref1 = [now.getFullYear(), now.getMonth() + 1], eYear = ref1[0], eMonth = ref1[1];

    /* If end year+month given, use it */
    if (end) {
      ref2 = String(end).split("-"), eYear = ref2[0], eMonth = ref2[1];
    }

    /* Make sure months are there, otherwise set them */
    if (!sMonth) {
      sMonth = 1;
    }
    if (!eMonth) {
      eMonth = 12;
    }

    /* For each year, construct the year div to hold months */
    years = [];
    for (year = j = ref3 = parseInt(sYear), ref4 = parseInt(eYear); ref3 <= ref4 ? j <= ref4 : j >= ref4; year = ref3 <= ref4 ? ++j : --j) {
      yDiv = new HTML('div', {
        id: ("calendar_year_" + uid + "_") + year,
        data: String(year),
        "class": "calendar_year",
        onclick: "toggleYear(this);"
      }, String(year));

      /* Construct the placeholder for months */

      /* Hide unless active year */
      monthsDiv = new HTML('div', {
        style: {
          display: (jumpTo && jumpTo === year) || (!jumpTo && year === parseInt(eYear)) ? "block" : "none"
        },
        "class": "calendar_months",
        id: ("calendar_months_" + uid + "_") + year
      });

      /* For each month, make a div */
      for (month = o = 12; o >= 1; month = --o) {

        /* Make sure this is within the start<->end range */
        if ((year > sYear || month >= sMonth) && (year < eYear || month <= eMonth)) {
          monthDiv = new HTML('div', {
            "class": "calendar_month",
            id: "calendar_month_" + uid + "_" + year + "-" + month,
            data: year + "-" + month,
            onclick: "toggleMonth(this)"
          }, calendar_months[month - 1]);
          monthsDiv.inject(monthDiv);
        }
      }

      /* unshift year into the div list (thus reverse order) */
      years.unshift(monthsDiv);
      years.unshift(yDiv);
    }

    /* Return a combined div */
    div = new HTML('div', {
      "class": "calendar",
      id: uid,
      data: sYear + "-" + eYear
    }, years);
    return div;
  }

  return Calendar;

})();

toggleYear = function(div) {

  /* Get the start and end year from the parent div */
  var eYear, j, ref, ref1, ref2, results, sYear, uid, y, year;
  ref = div.parentNode.getAttribute('data').split("-"), sYear = ref[0], eYear = ref[1];

  /* Get the year we clicked on */
  year = parseInt(div.getAttribute("data"));
  uid = div.parentNode.getAttribute("id");

  /* For each year, hide if not this year, else show */
  results = [];
  for (y = j = ref1 = parseInt(sYear), ref2 = parseInt(eYear); ref1 <= ref2 ? j <= ref2 : j >= ref2; y = ref1 <= ref2 ? ++j : --j) {
    if (y === year) {
      results.push(get("calendar_months_" + uid + "_" + y).show(true));
    } else {
      results.push(get("calendar_months_" + uid + "_" + y).show(false));
    }
  }
  return results;
};

toggleMonth = function(div) {
  var m, month, ref, year;
  m = div.getAttribute("data");
  ref = m.split("-"), year = ref[0], month = ref[1];

  /* Update the list view using the new month */
  return listView({
    month: m
  });
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

hsl2rgb = function(h, s, l) {
  var fract, min, sh, sv, switcher, v, vsf;
  h = h % 1;
  if (s > 1) {
    s = 1;
  }
  if (l > 1) {
    l = 1;
  }
  if (l <= 0.5) {
    v = l * (1 + s);
  } else {
    v = l + s - l * s;
  }
  if (v === 0) {
    return {
      r: 0,
      g: 0,
      b: 0
    };
  }
  min = 2 * l - v;
  sv = (v - min) / v;
  sh = (6 * h) % 6;
  switcher = Math.floor(sh);
  fract = sh - switcher;
  vsf = v * sv * fract;
  switch (switcher) {
    case 0:
      return {
        r: v,
        g: min + vsf,
        b: min
      };
    case 1:
      return {
        r: v - vsf,
        g: v,
        b: min
      };
    case 2:
      return {
        r: min,
        g: v,
        b: min + vsf
      };
    case 3:
      return {
        r: min,
        g: v - vsf,
        b: v
      };
    case 4:
      return {
        r: min + vsf,
        g: min,
        b: v
      };
    case 5:
      return {
        r: v,
        g: min,
        b: v - vsf
      };
  }
  return {
    r: 0,
    g: 0,
    b: 0
  };
};

genColors = function(numColors, saturation, lightness, hex) {
  var baseHue, c, cls, h, i, j, ref;
  cls = [];
  baseHue = 1.34;
  for (i = j = 1, ref = numColors; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    c = hsl2rgb(baseHue, saturation, lightness);
    if (hex) {
      h = (Math.round(c.r * 255 * 255 * 255) + Math.round(c.g * 255 * 255) + Math.round(c.b * 255)).toString(16);
      while (h.length < 6) {
        h = '0' + h;
      }
      h = '#' + h;
      cls.push(h);
    } else {
      cls.push({
        r: parseInt(c.r * 255),
        g: parseInt(c.g * 255),
        b: parseInt(c.b * 255)
      });
    }
    baseHue -= 0.23;
    if (baseHue < 0) {
      baseHue += 1;
    }
  }
  return cls;
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/**
 * HTML: DOM creator class
 * args:
 * - type: HTML element type (div, table, p etc) to produce
 * - params: hash of element params to add (class, style etc)
 * - children: optional child or children objects to insert into the new element
 * Example:
 * div = new HTML('div', {
 *    class: "footer",
 *    style: {
 *        fontWeight: "bold"
 *    }
#}, "Some text inside a div")
 */

HTML = (function() {
  function HTML(type, params, children) {

    /* create the raw element */
    var child, j, key, len, subkey, subval, val;
    this.element = document.createElement(type);

    /* If params have been passed, set them */
    if (isHash(params)) {
      for (key in params) {
        val = params[key];

        /* Standard string value? */
        if (typeof val === "string") {
          this.element.setAttribute(key, val);
        } else if (isArray(val)) {

          /* Are we passing a list of data to set? concatenate then */
          this.element.setAttribute(key, val.join(" "));
        } else if (isHash(val)) {

          /* Are we trying to set multiple sub elements, like a style? */
          for (subkey in val) {
            subval = val[subkey];
            this.element[key][subkey] = subval;
          }
        }
      }
    }

    /* If any children have been passed, add them to the element */
    if (children) {

      /* If string, convert to textNode using txt() */
      if (typeof children === "string") {
        this.element.inject(txt(children));
      } else {

        /* If children is an array of elems, iterate and add */
        if (isArray(children)) {
          for (j = 0, len = children.length; j < len; j++) {
            child = children[j];

            /* String? Convert via txt() then */
            if (typeof child === "string") {
              this.element.inject(txt(child));
            } else {

              /* Plain element, add normally */
              this.element.inject(child);
            }
          }
        } else {

          /* Just a single element, add it */
          this.element.inject(children);
        }
      }
    }
    return this.element;
  }

  return HTML;

})();


/* Set: shortcut for a.setAttribute(b,c) */

set = function(a, b, c) {
  return a.setAttribute(b, c);
};


/* txt: shortcut for creating a text node */

txt = function(a) {
  return document.createTextNode(a);
};


/* Get: Shortcut for doc.getElementById */

get = function(a) {
  return document.getElementById(a);
};


/**
 * prototype injector for HTML elements:
 * Example: mydiv.inject(otherdiv)
 */

HTMLElement.prototype.inject = function(child) {
  var item, j, len;
  if (isArray(child)) {
    for (j = 0, len = child.length; j < len; j++) {
      item = child[j];
      if (typeof item === 'string') {
        item = txt(item);
      }
      this.appendChild(item);
    }
  } else {
    if (typeof child === 'string') {
      child = txt(child);
    }
    this.appendChild(child);
  }
  return child;
};


/**
 * prototype show/hide function for HTML elements:
 * If called with a bool, show if True, hide if False.
 * If no bool, toggle show/hide based on current state.
 */

HTMLElement.prototype.show = function(bool) {
  var b, d;
  d = 'block';
  if (typeof bool === 'undefined') {
    d = this.style && this.style.display === 'none' ? 'block' : 'none';
  } else if (bool === false) {
    d = 'none';
  } else if (bool === true) {
    b = 'block';
  }
  this.style.display = d;
  return d;
};


/* Cog: Loading panel for when waiting for a response */

cog = function(div, size) {
  var i, idiv;
  if (size == null) {
    size = 200;
  }
  idiv = mk('div', {
    "class": "icon",
    style: {
      texAlign: 'center',
      verticalAlign: 'middle',
      height: '500px'
    }
  });
  i = mk('i', {
    "class": 'fa fa-spin fa-cog',
    style: {
      fontSize: size + 'pt !important',
      color: '#AAB'
    }
  });
  idiv.inject([i, mk('br'), "Loading data, please wait..."]);
  div.innerHTML = "";
  return div.appendChild(idiv);
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/**
 * Pending URLs watcher:
 * Wathes which URLs have been pending a result for a while
 * and shows the spinner if things are taking too long.
 */

pending_url_operations = {};

pendingURLStatus = function() {
  var div, now, pending, time, url;
  pending = 0;
  now = new Date().getTime();
  for (url in pending_url_operations) {
    time = pending_url_operations[url];

    /* Is something taking too long?? */
    if ((now - time) > 1500) {
      pending++;
      div = get('loading');
      if (!div) {
        div = new HTML('div', {
          "class": "spinner"
        }, [
          new HTML('img', {
            src: "images/spinner.gif"
          }), new HTML('br'), "Loading, please wait..."
        ]);
        document.body.inject(div);
      }
      div.style.display = "block";
    }
  }

  /* If no pending operations, hide the spnner */
  if (pending === 0) {
    div = get('loading');
    if (div) {
      return div.style.display = "none";
    }
  }
};

window.setInterval(pendingURLStatus, 500);


/**
 * HTTPRequest: Fire off a HTTP request.
 * Args:
 * - url: The URL to request (may be relative or absolute)
 * - args:
 * - - state: A callback stateful object
 * - - data: Any form/JSON data to send along if POST (method is derived
 *           from whether data is attached or not)
 * - - getdata: Any form vars to append to the URL as URI-encoded formdata
 * - - datatype: 'form' or 'json' data?
 * - - callback: function to call when request has returned a response
 * - - snap: snap function in case of internal server error or similar
 * - - nocreds: don't pass on cookies?

 * Example POST request:
 *    HTTPRequest("/api/foo.lua", {
 *        state: {
 *            ponies: true
 *        },
 *        callback: foofunc,
 *        data: {
 *            list: "foo.bar"
 *        }
 *   })
 */

HTTPRequest = (function() {
  function HTTPRequest(url1, args1) {
    var tmp;
    this.url = url1;
    this.args = args1;

    /* Set internal class data, determine request type */
    this.state = this.args.state;
    this.method = this.args.data ? 'POST' : 'GET';
    this.data = this.args.data;
    this.getdata = this.args.get;
    this.datatype = this.args.datatype || 'form';
    this.callback = this.args.callback;
    this.snap = this.args.snap || pm_snap;
    this.nocreds = this.args.nocreds || false;
    this.uid = parseInt(Math.random() * 10000000).toString(16);

    /* Construct request object */
    if (window.XMLHttpRequest) {
      this.request = new XMLHttpRequest();
    } else {
      this.request = new ActiveXObject("Microsoft.XMLHTTP");
    }

    /* Default to sending credentials */
    if (!this.nocreds) {
      this.request.withCredentials = true;
    }

    /* Determine what to send as data (if anything) */
    this.rdata = null;
    if (this.method === 'POST') {
      if (this.datatype === 'json') {
        this.rdata = JSON.stringify(this.data);
      } else {
        this.rdata = this.formdata(this.data);
      }
    }

    /* If tasked with appending data to the URL, do so */
    if (isHash(this.getdata)) {
      tmp = this.formdata(this.getdata);
      if (tmp.length > 0) {

        /* Do we have form data here aleady? if so, append the new */

        /* by adding an ampersand first */
        if (this.url.match(/\?/)) {
          this.url += "&" + tmp;
        } else {
          this.url += "?" + tmp;
        }
      }
    }

    /* Mark operation as pending result */
    pending_url_operations[this.uid] = new Date().getTime();

    /* Use @method on URL */
    this.request.open(this.method, this.url, true);

    /* Send data */
    this.request.send(this.rdata);

    /* Set onChange behavior */
    this.request.onreadystatechange = this.onchange;

    /* all done! */
    return this;
  }


  /* HTTPRequest state change calback */

  HTTPRequest.prototype.onchange = function() {

    /* Mark operation as done */
    var e;
    if (this.request.readyState === 4) {
      delete pending_url_operations[this.uid];
    }

    /* Internal Server Error: Try to call snap */
    if (this.request.readyState === 4 && this.request.status === 500) {
      if (this.snap) {
        this.snap(this.state);
      }
    }

    /* 200 OK, everything is okay, try to parse JSON response */
    if (this.request.readyState === 4 && this.request.status === 200) {
      if (this.callback) {

        /* Try to parse as JSON and deal with cache objects, fall back to old style parse-and-pass */
        try {

          /* Parse JSON response */
          this.response = JSON.parse(this.request.responseText);

          /* If loginRequired (rare!), redirect to oauth page */
          if (this.response && this.response.loginRequired) {
            location.href = "/oauth.html";
            return;
          }

          /* Otherwise, call the callback function */
          return this.callback(this.response, this.state);
        } catch (_error) {
          e = _error;
          return this.callback(this.request.responseText, this.state);
        }
      }
    }
  };


  /* Standard form data joiner for POST data */

  HTTPRequest.prototype.formdata = function(kv) {
    var ar, k, v;
    ar = [];

    /* For each key/value pair (assuming this is a hash) */
    if (isHash(kv)) {
      for (k in kv) {
        v = kv[k];

        /* Only append if the value is non-empty */
        if (v && v !== "") {

          /*  URI-Encode value and add to an array */
          ar.push(k + "=" + encodeURIComponent(v));
        }
      }
    }

    /* Join the array with ampersands, so we get "foo=bar&foo2=baz" */
    return ar.join("&");
  };

  return HTTPRequest;

})();


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/**
 * This is the listview basic library
 */


/* Generally, popping a window state should run a listView update */

window.onpopstate = function(event) {
  return listView(null, true);
};

listView = function(hash, reParse) {

  /* Get the HTML filename */
  var args, d, etc, htmlfile, ponymail_list, ponymail_month, ponymail_query, r, ref;
  ref = location.href.split("?"), htmlfile = ref[0], etc = ref[1];

  /* Do we need to call the URL parser here? */
  if (reParse) {
    parseURL();
  }

  /* Any new settings passed along? */
  if (isHash(hash)) {
    if (hash.month) {
      ponymail_month = hash.month;
    }
    if (hash.list) {
      ponymail_list = hash.list;
    }
    if (hash.query) {
      ponymail_query = hash.query;
    }
  }

  /* First, check that we have a list to view! */
  if (!(ponymail_list && ponymail_list.match(/.+@.+/))) {

    /* Do we at least have a domain part? */
    if (ponymail_list && ponymail_list.match(/.+?\..+/)) {

      /* Check if there's a $default list in this domain */
      d = ponymail_list;

      /* Do we have this domain listed? If not, redirect to front page */
      if (!ponymail_domains[d]) {
        location.href = "./";
        return;
      }
      if (ponymail_domains[d] && ponymail_domains[d][pm_config.default_list]) {

        /* Redirect to this list then ... */
        location.href = htmlfile + "?" + pm_config.default_list + "@" + d;
        return;
      }
    } else {

      /* No domain specified, redirect to front page */
      location.href = "./";
      return;
    }
  }

  /* Construct arg list for URL */
  args = "";
  if (ponymail_list && ponymail_list.length > 0) {
    args += ponymail_list;
  }
  if (ponymail_month && ponymail_month.length > 0) {
    args += ":" + ponymail_month;
  }
  if (ponymail_query && ponymail_query.length > 0) {
    args += ":" + ponymail_query;
  }

  /* Push a new history state using new args */
  window.history.pushState({}, "", htmlfile + "?" + args);

  /* Request month view from API, send to list view callback */
  return r = new HTTPRequest("api/stats.lua?list=" + ponymail_list + "&d=" + ponymail_month, {
    callback: renderListView
  });
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/**
 * Init: Test if localStorage is available or not
 * If not, fall back to plain global var storage (not effective, but meh)
 */

pm_storage_available = false;

pm_storage_globvar = {};

try {
  if (typeof window.localStorage !== "undefined") {
    window.localStorage.setItem("pm_test", "1");
    pm_storage_available = true;
  }
} catch (_error) {
  e = _error;
  pm_storage_available = false;
}


/**
 * dbWrite: Store a key/val pair
 * Example: dbWrite("ponies", "They are awesome!")
 */

dbWrite = function(key, value) {

  /* Can we use localStorage? */
  if (pm_storage_available) {
    return window.localStorage.setItem(key, value);
  } else {

    /* Guess not, fall back to (ineffective) global var */
    pm_storage_globvar[key] = value;
    return true;
  }
};


/* dbRead: Given a key, read the corresponding value from storage */

dbRead = function(key) {

  /* Do we have localStorage? */
  if (pm_storage_available) {
    return window.localStorage.getItem(key);
  } else {

    /* Nope, try global var */
    return pm_storage_globvar[key];
  }
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/**
 * Number prettification prototype:
 * Converts 1234567 into 1,234,567 etc
 */

Number.prototype.pretty = function(fix) {
  if (fix) {
    return String(this.toFixed(fix)).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
  }
  return String(this.toFixed(0)).replace(/(\d)(?=(\d{3})+$)/g, '$1,');
};


/**
 * Number padding
 * usage: 123.pad(6) -> 000123
 */

Number.prototype.pad = function(n) {
  var str;
  str = String(this);

  /* Do we need to pad? if so, do it using String.repeat */
  if (str.length < n) {
    str = "0".repeat(n - str.length) + str;
  }
  return str;
};


/* isArray: function to detect if an object is an array */

isArray = function(value) {
  return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number' && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
};


/* isHash: function to detect if an object is a hash */

isHash = function(value) {
  return value && typeof value === 'object' && !isArray(value);
};


/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


/* This is the basic scaffolding for all pages */

listviewScaffolding = function() {

  /* Start off by making the top menu */
  var cal, calHolder, header, item, j, len, li, listDiv, logo, mainDiv, menu, ref, ul;
  menu = new HTML('div', {
    id: "topMenu"
  });
  document.body.inject(menu);
  ul = new HTML('ul');
  logo = new HTML('li', {
    "class": 'logo'
  }, new HTML('a', {
    href: "./"
  }, new HTML('img', {
    src: "images/logo.png",
    style: {
      paddingRight: "10px",
      height: "38px",
      width: "auto"
    }
  })));
  ul.inject(logo);
  ref = ['Home', 'Lists', 'Third item'];
  for (j = 0, len = ref.length; j < len; j++) {
    item = ref[j];
    li = new HTML('li', {}, item);
    ul.inject(li);
  }
  menu.inject(ul);

  /* Now, make the base div */
  mainDiv = new HTML('div', {
    id: "contents"
  });
  document.body.inject(mainDiv);

  /* Make the title */
  header = new HTML('h2', {
    id: "header"
  }, "Loading list data...");
  mainDiv.inject(header);

  /* Then make the calendar placeholder */
  calHolder = new HTML('div', {
    id: "calendar"
  });
  mainDiv.inject(calHolder);

  /* TEST: Insert fake calendar */
  cal = new Calendar(2010);
  calHolder.inject(cal);

  /* Finally, make the list view placeholder */
  listDiv = new HTML('div', {
    id: "listview",
    "class": "sbox"
  });
  return mainDiv.inject(listDiv);
};

testCoffee = function() {

  /* Get main div from HTML */
  var cal, div, hider, item, j, len, li, logo, menu, p, parent, ref, ul;
  parent = get('testdiv');
  menu = new HTML('div', {
    id: "topMenu"
  });
  parent.inject(menu);
  ul = new HTML('ul');
  logo = new HTML('li', {
    "class": 'logo'
  }, new HTML('a', {
    href: "./"
  }, new HTML('img', {
    src: "images/logo.png",
    style: {
      paddingRight: "10px",
      height: "38px",
      width: "auto"
    }
  })));
  ul.inject(logo);
  ref = ['Home', 'Lists', 'Third item'];
  for (j = 0, len = ref.length; j < len; j++) {
    item = ref[j];
    li = new HTML('li', {}, item);
    ul.inject(li);
  }
  menu.inject(ul);
  div = new HTML('div', {
    "class": "sbox"
  });
  parent.inject(div);
  cal = new Calendar(2010, '2016-9');
  div.inject(cal);
  p = new HTML('p', {
    "class": "foo",
    style: {
      textAlign: 'center'
    }
  }, "Text goes here");
  div.inject(p);
  p.inject([". Here's a textNode added afterwards", new HTML('br')]);
  hider = new HTML('b', {
    onclick: 'testToggle(this);'
  }, "Click here to hide this text for a second!");
  return p.inject(hider);
};

testToggle = function(div) {
  div.show();
  return window.setTimeout(function() {
    return div.show();
  }, 1000);
};
