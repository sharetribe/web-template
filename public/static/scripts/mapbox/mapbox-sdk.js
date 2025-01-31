// version 0.6.0
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.mapboxSdk = factory());
}(this, (function () { 'use strict';

  // Like https://github.com/thlorenz/lib/parse-link-header but without any
  // additional dependencies.

  function parseParam(param) {
    var parts = param.match(/\s*(.+)\s*=\s*"?([^"]+)"?/);
    if (!parts) return null;

    return {
      key: parts[1],
      value: parts[2]
    };
  }

  function parseLink(link) {
    var parts = link.match(/<?([^>]*)>(.*)/);
    if (!parts) return null;

    var linkUrl = parts[1];
    var linkParams = parts[2].split(';');
    var rel = null;
    var parsedLinkParams = linkParams.reduce(function(result, param) {
      var parsed = parseParam(param);
      if (!parsed) return result;
      if (parsed.key === 'rel') {
        if (!rel) {
          rel = parsed.value;
        }
        return result;
      }
      result[parsed.key] = parsed.value;
      return result;
    }, {});
    if (!rel) return null;

    return {
      url: linkUrl,
      rel: rel,
      params: parsedLinkParams
    };
  }

  /**
   * Parse a Link header.
   *
   * @param {string} linkHeader
   * @returns {{
   *   [string]: {
   *     url: string,
   *     params: { [string]: string }
   *   }
   * }}
   */
  function parseLinkHeader(linkHeader) {
    if (!linkHeader) return {};

    return linkHeader.split(/,\s*</).reduce(function(result, link) {
      var parsed = parseLink(link);
      if (!parsed) return result;
      // rel value can be multiple whitespace-separated rels.
      var splitRel = parsed.rel.split(/\s+/);
      splitRel.forEach(function(rel) {
        if (!result[rel]) {
          result[rel] = {
            url: parsed.url,
            params: parsed.params
          };
        }
      });
      return result;
    }, {});
  }

  var parseLinkHeader_1 = parseLinkHeader;

  /**
   * A Mapbox API response.
   *
   * @class MapiResponse
   * @property {Object} body - The response body, parsed as JSON.
   * @property {string} rawBody - The raw response body.
   * @property {number} statusCode - The response's status code.
   * @property {Object} headers - The parsed response headers.
   * @property {Object} links - The parsed response links.
   * @property {MapiRequest} request - The response's originating `MapiRequest`.
   */

  /**
   * @ignore
   * @param {MapiRequest} request
   * @param {Object} responseData
   * @param {Object} responseData.headers
   * @param {string} responseData.body
   * @param {number} responseData.statusCode
   */
  function MapiResponse(request, responseData) {
    this.request = request;
    this.headers = responseData.headers;
    this.rawBody = responseData.body;
    this.statusCode = responseData.statusCode;
    try {
      this.body = JSON.parse(responseData.body || '{}');
    } catch (parseError) {
      this.body = responseData.body;
    }
    this.links = parseLinkHeader_1(this.headers.link);
  }

  /**
   * Check if there is a next page that you can fetch.
   *
   * @returns {boolean}
   */
  MapiResponse.prototype.hasNextPage = function hasNextPage() {
    return !!this.links.next;
  };

  /**
   * Create a request for the next page, if there is one.
   * If there is no next page, returns `null`.
   *
   * @returns {MapiRequest | null}
   */
  MapiResponse.prototype.nextPage = function nextPage() {
    if (!this.hasNextPage()) return null;
    return this.request._extend({
      path: this.links.next.url
    });
  };

  var mapiResponse = MapiResponse;

  var constants = {
    API_ORIGIN: 'https://api.mapbox.com',
    EVENT_PROGRESS_DOWNLOAD: 'downloadProgress',
    EVENT_PROGRESS_UPLOAD: 'uploadProgress',
    EVENT_ERROR: 'error',
    EVENT_RESPONSE: 'response',
    ERROR_HTTP: 'HttpError',
    ERROR_REQUEST_ABORTED: 'RequestAbortedError'
  };

  /**
   * A Mapbox API error.
   *
   * If there's an error during the API transaction,
   * the Promise returned by `MapiRequest`'s [`send`](#send)
   * method should reject with a `MapiError`.
   *
   * @class MapiError
   * @hideconstructor
   * @property {MapiRequest} request - The errored request.
   * @property {string} type - The type of error. Usually this is `'HttpError'`.
   *   If the request was aborted, so the error was
   *   not sent from the server, the type will be
   *   `'RequestAbortedError'`.
   * @property {number} [statusCode] - The numeric status code of
   *   the HTTP response.
   * @property {Object | string} [body] - If the server sent a response body,
   *   this property exposes that response, parsed as JSON if possible.
   * @property {string} [message] - Whatever message could be derived from the
   *   call site and HTTP response.
   *
   * @param {MapiRequest} options.request
   * @param {number} [options.statusCode]
   * @param {string} [options.body]
   * @param {string} [options.message]
   * @param {string} [options.type]
   */
  function MapiError(options) {
    var errorType = options.type || constants.ERROR_HTTP;

    var body;
    if (options.body) {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    } else {
      body = null;
    }

    var message = options.message || null;
    if (!message) {
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body.message === 'string') {
        message = body.message;
      } else if (errorType === constants.ERROR_REQUEST_ABORTED) {
        message = 'Request aborted';
      }
    }

    this.message = message;
    this.type = errorType;
    this.statusCode = options.statusCode || null;
    this.request = options.request;
    this.body = body;
  }

  var mapiError = MapiError;

  function parseSingleHeader(raw) {
    var boundary = raw.indexOf(':');
    var name = raw
      .substring(0, boundary)
      .trim()
      .toLowerCase();
    var value = raw.substring(boundary + 1).trim();
    return {
      name: name,
      value: value
    };
  }

  /**
   * Parse raw headers into an object with lowercase properties.
   * Does not fully parse headings into more complete data structure,
   * as larger libraries might do. Also does not deal with duplicate
   * headers because Node doesn't seem to deal with those well, so
   * we shouldn't let the browser either, for consistency.
   *
   * @param {string} raw
   * @returns {Object}
   */
  function parseHeaders(raw) {
    var headers = {};
    if (!raw) {
      return headers;
    }

    raw
      .trim()
      .split(/[\r|\n]+/)
      .forEach(function(rawHeader) {
        var parsed = parseSingleHeader(rawHeader);
        headers[parsed.name] = parsed.value;
      });

    return headers;
  }

  var parseHeaders_1 = parseHeaders;

  // Keys are request IDs, values are XHRs.
  var requestsUnderway = {};

  function browserAbort(request) {
    var xhr = requestsUnderway[request.id];
    if (!xhr) return;
    xhr.abort();
    delete requestsUnderway[request.id];
  }

  function createResponse(request, xhr) {
    return new mapiResponse(request, {
      body: xhr.response,
      headers: parseHeaders_1(xhr.getAllResponseHeaders()),
      statusCode: xhr.status
    });
  }

  function normalizeBrowserProgressEvent(event) {
    var total = event.total;
    var transferred = event.loaded;
    var percent = (100 * transferred) / total;
    return {
      total: total,
      transferred: transferred,
      percent: percent
    };
  }

  function sendRequestXhr(request, xhr) {
    return new Promise(function(resolve, reject) {
      xhr.onprogress = function(event) {
        request.emitter.emit(
          constants.EVENT_PROGRESS_DOWNLOAD,
          normalizeBrowserProgressEvent(event)
        );
      };

      var file = request.file;
      if (file) {
        xhr.upload.onprogress = function(event) {
          request.emitter.emit(
            constants.EVENT_PROGRESS_UPLOAD,
            normalizeBrowserProgressEvent(event)
          );
        };
      }

      xhr.onerror = function(error) {
        reject(error);
      };

      xhr.onabort = function() {
        var mapiError$$1 = new mapiError({
          request: request,
          type: constants.ERROR_REQUEST_ABORTED
        });
        reject(mapiError$$1);
      };

      xhr.onload = function() {
        delete requestsUnderway[request.id];
        if (xhr.status < 200 || xhr.status >= 400) {
          var mapiError$$1 = new mapiError({
            request: request,
            body: xhr.response,
            statusCode: xhr.status
          });
          reject(mapiError$$1);
          return;
        }
        resolve(xhr);
      };

      var body = request.body;

      // matching service needs to send a www-form-urlencoded request
      if (typeof body === 'string') {
        xhr.send(body);
      } else if (body) {
        xhr.send(JSON.stringify(body));
      } else if (file) {
        xhr.send(file);
      } else {
        xhr.send();
      }

      requestsUnderway[request.id] = xhr;
    }).then(function(xhr) {
      return createResponse(request, xhr);
    });
  }

  // The accessToken argument gives this function flexibility
  // for Mapbox's internal client.
  function createRequestXhr(request, accessToken) {
    var url = request.url(accessToken);
    var xhr = new window.XMLHttpRequest();
    xhr.open(request.method, url);
    Object.keys(request.headers).forEach(function(key) {
      xhr.setRequestHeader(key, request.headers[key]);
    });
    return xhr;
  }

  function browserSend(request) {
    return Promise.resolve().then(function() {
      var xhr = createRequestXhr(request, request.client.accessToken);
      return sendRequestXhr(request, xhr);
    });
  }

  var browserLayer = {
    browserAbort: browserAbort,
    sendRequestXhr: sendRequestXhr,
    browserSend: browserSend,
    createRequestXhr: createRequestXhr
  };

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var base64 = createCommonjsModule(function (module, exports) {
  (function(root) {

    // Detect free variables `exports`.
    var freeExports = exports;

    // Detect free variable `module`.
    var freeModule = module &&
      module.exports == freeExports && module;

    // Detect free variable `global`, from Node.js or Browserified code, and use
    // it as `root`.
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
    if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
      root = freeGlobal;
    }

    /*--------------------------------------------------------------------------*/

    var InvalidCharacterError = function(message) {
      this.message = message;
    };
    InvalidCharacterError.prototype = new Error;
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    var error = function(message) {
      // Note: the error messages used throughout this file match those used by
      // the native `atob`/`btoa` implementation in Chromium.
      throw new InvalidCharacterError(message);
    };

    var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // http://whatwg.org/html/common-microsyntaxes.html#space-character
    var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

    // `decode` is designed to be fully compatible with `atob` as described in the
    // HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
    // The optimized base64-decoding algorithm used is based on @atk’s excellent
    // implementation. https://gist.github.com/atk/1020396
    var decode = function(input) {
      input = String(input)
        .replace(REGEX_SPACE_CHARACTERS, '');
      var length = input.length;
      if (length % 4 == 0) {
        input = input.replace(/==?$/, '');
        length = input.length;
      }
      if (
        length % 4 == 1 ||
        // http://whatwg.org/C#alphanumeric-ascii-characters
        /[^+a-zA-Z0-9/]/.test(input)
      ) {
        error(
          'Invalid character: the string to be decoded is not correctly encoded.'
        );
      }
      var bitCounter = 0;
      var bitStorage;
      var buffer;
      var output = '';
      var position = -1;
      while (++position < length) {
        buffer = TABLE.indexOf(input.charAt(position));
        bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
        // Unless this is the first of a group of 4 characters…
        if (bitCounter++ % 4) {
          // …convert the first 8 bits to a single ASCII character.
          output += String.fromCharCode(
            0xFF & bitStorage >> (-2 * bitCounter & 6)
          );
        }
      }
      return output;
    };

    // `encode` is designed to be fully compatible with `btoa` as described in the
    // HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
    var encode = function(input) {
      input = String(input);
      if (/[^\0-\xFF]/.test(input)) {
        // Note: no need to special-case astral symbols here, as surrogates are
        // matched, and the input is supposed to only contain ASCII anyway.
        error(
          'The string to be encoded contains characters outside of the ' +
          'Latin1 range.'
        );
      }
      var padding = input.length % 3;
      var output = '';
      var position = -1;
      var a;
      var b;
      var c;
      var buffer;
      // Make sure any padding is handled outside of the loop.
      var length = input.length - padding;

      while (++position < length) {
        // Read three bytes, i.e. 24 bits.
        a = input.charCodeAt(position) << 16;
        b = input.charCodeAt(++position) << 8;
        c = input.charCodeAt(++position);
        buffer = a + b + c;
        // Turn the 24 bits into four chunks of 6 bits each, and append the
        // matching character for each of them to the output.
        output += (
          TABLE.charAt(buffer >> 18 & 0x3F) +
          TABLE.charAt(buffer >> 12 & 0x3F) +
          TABLE.charAt(buffer >> 6 & 0x3F) +
          TABLE.charAt(buffer & 0x3F)
        );
      }

      if (padding == 2) {
        a = input.charCodeAt(position) << 8;
        b = input.charCodeAt(++position);
        buffer = a + b;
        output += (
          TABLE.charAt(buffer >> 10) +
          TABLE.charAt((buffer >> 4) & 0x3F) +
          TABLE.charAt((buffer << 2) & 0x3F) +
          '='
        );
      } else if (padding == 1) {
        buffer = input.charCodeAt(position);
        output += (
          TABLE.charAt(buffer >> 2) +
          TABLE.charAt((buffer << 4) & 0x3F) +
          '=='
        );
      }

      return output;
    };

    var base64 = {
      'encode': encode,
      'decode': decode,
      'version': '0.1.0'
    };

    // Some AMD build optimizers, like r.js, check for specific condition patterns
    // like the following:
    if (freeExports && !freeExports.nodeType) {
      if (freeModule) { // in Node.js or RingoJS v0.8.0+
        freeModule.exports = base64;
      } else { // in Narwhal or RingoJS v0.7.0-
        for (var key in base64) {
          base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
        }
      }
    } else { // in Rhino or a web browser
      root.base64 = base64;
    }

  }(commonjsGlobal));
  });

  var tokenCache = {};

  function parseToken(token) {
    if (tokenCache[token]) {
      return tokenCache[token];
    }

    var parts = token.split('.');
    var usage = parts[0];
    var rawPayload = parts[1];
    if (!rawPayload) {
      throw new Error('Invalid token');
    }

    var parsedPayload = parsePaylod(rawPayload);

    var result = {
      usage: usage,
      user: parsedPayload.u
    };
    if (has(parsedPayload, 'a')) result.authorization = parsedPayload.a;
    if (has(parsedPayload, 'exp')) result.expires = parsedPayload.exp * 1000;
    if (has(parsedPayload, 'iat')) result.created = parsedPayload.iat * 1000;
    if (has(parsedPayload, 'scopes')) result.scopes = parsedPayload.scopes;
    if (has(parsedPayload, 'client')) result.client = parsedPayload.client;
    if (has(parsedPayload, 'll')) result.lastLogin = parsedPayload.ll;
    if (has(parsedPayload, 'iu')) result.impersonator = parsedPayload.iu;

    tokenCache[token] = result;
    return result;
  }

  function parsePaylod(rawPayload) {
    try {
      return JSON.parse(base64.decode(rawPayload));
    } catch (parseError) {
      throw new Error('Invalid token');
    }
  }

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  var parseMapboxToken = parseToken;

  var immutable = extend;

  var hasOwnProperty = Object.prototype.hasOwnProperty;

  function extend() {
      var target = {};

      for (var i = 0; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
              if (hasOwnProperty.call(source, key)) {
                  target[key] = source[key];
              }
          }
      }

      return target
  }

  var eventemitter3 = createCommonjsModule(function (module) {

  var has = Object.prototype.hasOwnProperty
    , prefix = '~';

  /**
   * Constructor to create a storage for our `EE` objects.
   * An `Events` instance is a plain object whose properties are event names.
   *
   * @constructor
   * @private
   */
  function Events() {}

  //
  // We try to not inherit from `Object.prototype`. In some engines creating an
  // instance in this way is faster than calling `Object.create(null)` directly.
  // If `Object.create(null)` is not supported we prefix the event names with a
  // character to make sure that the built-in object properties are not
  // overridden or used as an attack vector.
  //
  if (Object.create) {
    Events.prototype = Object.create(null);

    //
    // This hack is needed because the `__proto__` property is still inherited in
    // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
    //
    if (!new Events().__proto__) prefix = false;
  }

  /**
   * Representation of a single event listener.
   *
   * @param {Function} fn The listener function.
   * @param {*} context The context to invoke the listener with.
   * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
   * @constructor
   * @private
   */
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }

  /**
   * Add a listener for a given event.
   *
   * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} context The context to invoke the listener with.
   * @param {Boolean} once Specify if the listener is a one-time listener.
   * @returns {EventEmitter}
   * @private
   */
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    var listener = new EE(fn, context || emitter, once)
      , evt = prefix ? prefix + event : event;

    if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
    else emitter._events[evt] = [emitter._events[evt], listener];

    return emitter;
  }

  /**
   * Clear event by name.
   *
   * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
   * @param {(String|Symbol)} evt The Event name.
   * @private
   */
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new Events();
    else delete emitter._events[evt];
  }

  /**
   * Minimal `EventEmitter` interface that is molded against the Node.js
   * `EventEmitter` interface.
   *
   * @constructor
   * @public
   */
  function EventEmitter() {
    this._events = new Events();
    this._eventsCount = 0;
  }

  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   *
   * @returns {Array}
   * @public
   */
  EventEmitter.prototype.eventNames = function eventNames() {
    var names = []
      , events
      , name;

    if (this._eventsCount === 0) return names;

    for (name in (events = this._events)) {
      if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
    }

    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
  };

  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Array} The registered listeners.
   * @public
   */
  EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event
      , handlers = this._events[evt];

    if (!handlers) return [];
    if (handlers.fn) return [handlers.fn];

    for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
      ee[i] = handlers[i].fn;
    }

    return ee;
  };

  /**
   * Return the number of listeners listening to a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Number} The number of listeners.
   * @public
   */
  EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event
      , listeners = this._events[evt];

    if (!listeners) return 0;
    if (listeners.fn) return 1;
    return listeners.length;
  };

  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Boolean} `true` if the event had listeners, else `false`.
   * @public
   */
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;

    if (!this._events[evt]) return false;

    var listeners = this._events[evt]
      , len = arguments.length
      , args
      , i;

    if (listeners.fn) {
      if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

      switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }

      for (i = 1, args = new Array(len -1); i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length
        , j;

      for (i = 0; i < length; i++) {
        if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

        switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
          default:
            if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
              args[j - 1] = arguments[j];
            }

            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }

    return true;
  };

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };

  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };

  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {Boolean} once Only remove one-time listeners.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;

    if (!this._events[evt]) return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }

    var listeners = this._events[evt];

    if (listeners.fn) {
      if (
        listeners.fn === fn &&
        (!once || listeners.once) &&
        (!context || listeners.context === context)
      ) {
        clearEvent(this, evt);
      }
    } else {
      for (var i = 0, events = [], length = listeners.length; i < length; i++) {
        if (
          listeners[i].fn !== fn ||
          (once && !listeners[i].once) ||
          (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }

      //
      // Reset the array, or remove it completely if we have no more listeners.
      //
      if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
      else clearEvent(this, evt);
    }

    return this;
  };

  /**
   * Remove all listeners, or those of the specified event.
   *
   * @param {(String|Symbol)} [event] The event name.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;

    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt]) clearEvent(this, evt);
    } else {
      this._events = new Events();
      this._eventsCount = 0;
    }

    return this;
  };

  //
  // Alias methods names because people roll like that.
  //
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  //
  // Expose the prefix.
  //
  EventEmitter.prefixed = prefix;

  //
  // Allow `EventEmitter` to be imported as module namespace.
  //
  EventEmitter.EventEmitter = EventEmitter;

  //
  // Expose the module.
  //
  {
    module.exports = EventEmitter;
  }
  });

  // Encode each item of an array individually. The comma
  // delimiters should not themselves be encoded.
  function encodeArray(arrayValue) {
    return arrayValue.map(encodeURIComponent).join(',');
  }

  function encodeValue(value) {
    if (Array.isArray(value)) {
      return encodeArray(value);
    }
    return encodeURIComponent(String(value));
  }

  /**
   * Append a query parameter to a URL.
   *
   * @param {string} url
   * @param {string} key
   * @param {string|number|boolean|Array<*>>} [value] - Provide an array
   *   if the value is a list and commas between values need to be
   *   preserved, unencoded.
   * @returns {string} - Modified URL.
   */
  function appendQueryParam(url, key, value) {
    if (value === false || value === null) {
      return url;
    }
    var punctuation = /\?/.test(url) ? '&' : '?';
    var query = encodeURIComponent(key);
    if (value !== undefined && value !== '' && value !== true) {
      query += '=' + encodeValue(value);
    }
    return '' + url + punctuation + query;
  }

  /**
   * Derive a query string from an object and append it
   * to a URL.
   *
   * @param {string} url
   * @param {Object} [queryObject] - Values should be primitives.
   * @returns {string} - Modified URL.
   */
  function appendQueryObject(url, queryObject) {
    if (!queryObject) {
      return url;
    }

    var result = url;
    Object.keys(queryObject).forEach(function(key) {
      var value = queryObject[key];
      if (value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        value = value
          .filter(function(v) {
            return !!v;
          })
          .join(',');
      }
      result = appendQueryParam(result, key, value);
    });
    return result;
  }

  /**
   * Prepend an origin to a URL. If the URL already has an
   * origin, do nothing.
   *
   * @param {string} url
   * @param {string} origin
   * @returns {string} - Modified URL.
   */
  function prependOrigin(url, origin) {
    if (!origin) {
      return url;
    }

    if (url.slice(0, 4) === 'http') {
      return url;
    }

    var delimiter = url[0] === '/' ? '' : '/';
    return '' + origin.replace(/\/$/, '') + delimiter + url;
  }

  /**
   * Interpolate values into a route with express-style,
   * colon-prefixed route parameters.
   *
   * @param {string} route
   * @param {Object} [params] - Values should be primitives
   *   or arrays of primitives. Provide an array if the value
   *   is a list and commas between values need to be
   *   preserved, unencoded.
   * @returns {string} - Modified URL.
   */
  function interpolateRouteParams(route, params) {
    if (!params) {
      return route;
    }
    return route.replace(/\/:([a-zA-Z0-9]+)/g, function(_, paramId) {
      var value = params[paramId];
      if (value === undefined) {
        throw new Error('Unspecified route parameter ' + paramId);
      }
      var preppedValue = encodeValue(value);
      return '/' + preppedValue;
    });
  }

  var urlUtils = {
    appendQueryObject: appendQueryObject,
    appendQueryParam: appendQueryParam,
    prependOrigin: prependOrigin,
    interpolateRouteParams: interpolateRouteParams
  };

  var requestId = 1;

  /**
   * A Mapbox API request.
   *
   * Note that creating a `MapiRequest` does *not* send the request automatically.
   * Use the request's `send` method to send it off and get a `Promise`.
   *
   * The `emitter` property is an `EventEmitter` that emits the following events:
   *
   * - `'response'` - Listeners will be called with a `MapiResponse`.
   * - `'error'` - Listeners will be called with a `MapiError`.
   * - `'downloadProgress'` - Listeners will be called with `ProgressEvents`.
   * - `'uploadProgress'` - Listeners will be called with `ProgressEvents`.
   *   Upload events are only available when the request includes a file.
   *
   * @class MapiRequest
   * @property {EventEmitter} emitter - An event emitter. See above.
   * @property {MapiClient} client - This request's `MapiClient`.
   * @property {MapiResponse|null} response - If this request has been sent and received
   *   a response, the response is available on this property.
   * @property {MapiError|Error|null} error - If this request has been sent and
   *   received an error in response, the error is available on this property.
   * @property {boolean} aborted - If the request has been aborted
   *   (via [`abort`](#abort)), this property will be `true`.
   * @property {boolean} sent - If the request has been sent, this property will
   *   be `true`. You cannot send the same request twice, so if you need to create
   *   a new request that is the equivalent of an existing one, use
   *   [`clone`](#clone).
   * @property {string} path - The request's path, including colon-prefixed route
   *   parameters.
   * @property {string} origin - The request's origin.
   * @property {string} method - The request's HTTP method.
   * @property {Object} query - A query object, which will be transformed into
   *   a URL query string.
   * @property {Object} params - A route parameters object, whose values will
   *   be interpolated the path.
   * @property {Object} headers - The request's headers.
   * @property {Object|string|null} body - Data to send with the request.
   *   If the request has a body, it will also be sent with the header
   *   `'Content-Type: application/json'`.
   * @property {Blob|ArrayBuffer|string|ReadStream} file - A file to
   *   send with the request. The browser client accepts Blobs and ArrayBuffers;
   *   the Node client accepts strings (filepaths) and ReadStreams.
   * @property {string} encoding - The encoding of the response.
   * @property {string} sendFileAs - The method to send the `file`. Options are
   * `data` (x-www-form-urlencoded) or `form` (multipart/form-data).
   */

  /**
   * @ignore
   * @param {MapiClient} client
   * @param {Object} options
   * @param {string} options.method
   * @param {string} options.path
   * @param {Object} [options.query={}]
   * @param {Object} [options.params={}]
   * @param {string} [options.origin]
   * @param {Object} [options.headers]
   * @param {Object} [options.body=null]
   * @param {Blob|ArrayBuffer|string|ReadStream} [options.file=null]
   * @param {string} [options.encoding=utf8]
   */
  function MapiRequest(client, options) {
    if (!client) {
      throw new Error('MapiRequest requires a client');
    }
    if (!options || !options.path || !options.method) {
      throw new Error(
        'MapiRequest requires an options object with path and method properties'
      );
    }

    var defaultHeaders = {};
    if (options.body) {
      defaultHeaders['content-type'] = 'application/json';
    }

    var headersWithDefaults = immutable(defaultHeaders, options.headers);

    // Disallows duplicate header names of mixed case,
    // e.g. Content-Type and content-type.
    var headers = Object.keys(headersWithDefaults).reduce(function(memo, name) {
      memo[name.toLowerCase()] = headersWithDefaults[name];
      return memo;
    }, {});

    this.id = requestId++;
    this._options = options;

    this.emitter = new eventemitter3();
    this.client = client;
    this.response = null;
    this.error = null;
    this.sent = false;
    this.aborted = false;
    this.path = options.path;
    this.method = options.method;
    this.origin = options.origin || client.origin;
    this.query = options.query || {};
    this.params = options.params || {};
    this.body = options.body || null;
    this.file = options.file || null;
    this.encoding = options.encoding || 'utf8';
    this.sendFileAs = options.sendFileAs || null;
    this.headers = headers;
  }

  /**
   * Get the URL of the request.
   *
   * @param {string} [accessToken] - By default, the access token of the request's
   *   client is used.
   * @return {string}
   */
  MapiRequest.prototype.url = function url(accessToken) {
    var url = urlUtils.prependOrigin(this.path, this.origin);
    url = urlUtils.appendQueryObject(url, this.query);
    var routeParams = this.params;
    if (accessToken) {
      url = urlUtils.appendQueryParam(url, 'access_token', accessToken);
      var accessTokenOwnerId = parseMapboxToken(accessToken).user;
      routeParams = immutable({ ownerId: accessTokenOwnerId }, routeParams);
    }
    url = urlUtils.interpolateRouteParams(url, routeParams);
    return url;
  };

  /**
   * Send the request. Returns a Promise that resolves with a `MapiResponse`.
   * You probably want to use `response.body`.
   *
   * `send` only retrieves the first page of paginated results. You can get
   * the next page by using the `MapiResponse`'s [`nextPage`](#nextpage)
   * function, or iterate through all pages using [`eachPage`](#eachpage)
   * instead of `send`.
   *
   * @returns {Promise<MapiResponse>}
   */
  MapiRequest.prototype.send = function send() {
    var self = this;

    if (self.sent) {
      throw new Error(
        'This request has already been sent. Check the response and error properties. Create a new request with clone().'
      );
    }
    self.sent = true;

    return self.client.sendRequest(self).then(
      function(response) {
        self.response = response;
        self.emitter.emit(constants.EVENT_RESPONSE, response);
        return response;
      },
      function(error) {
        self.error = error;
        self.emitter.emit(constants.EVENT_ERROR, error);
        throw error;
      }
    );
  };

  /**
   * Abort the request.
   *
   * Any pending `Promise` returned by [`send`](#send) will be rejected with
   * an error with `type: 'RequestAbortedError'`. If you've created a request
   * that might be aborted, you need to catch and handle such errors.
   *
   * This method will also abort any requests created while fetching subsequent
   * pages via [`eachPage`](#eachpage).
   *
   * If the request has not been sent or has already been aborted, nothing
   * will happen.
   */
  MapiRequest.prototype.abort = function abort() {
    if (this._nextPageRequest) {
      this._nextPageRequest.abort();
      delete this._nextPageRequest;
    }

    if (this.response || this.error || this.aborted) return;

    this.aborted = true;
    this.client.abortRequest(this);
  };

  /**
   * Invoke a callback for each page of a paginated API response.
   *
   * The callback should have the following signature:
   *
   * ```js
   * (
   *   error: MapiError,
   *   response: MapiResponse,
   *   next: () => void
   * ) => void
   * ```
   *
   * **The next page will not be fetched until you've invoked the
   * `next` callback**, indicating that you're ready for it.
   *
   * @param {Function} callback
   */
  MapiRequest.prototype.eachPage = function eachPage(callback) {
    var self = this;

    function handleResponse(response) {
      function getNextPage() {
        delete self._nextPageRequest;
        var nextPageRequest = response.nextPage();
        if (nextPageRequest) {
          self._nextPageRequest = nextPageRequest;
          getPage(nextPageRequest);
        }
      }
      callback(null, response, getNextPage);
    }

    function handleError(error) {
      callback(error, null, function() {});
    }

    function getPage(request) {
      request.send().then(handleResponse, handleError);
    }
    getPage(this);
  };

  /**
   * Clone this request.
   *
   * Each request can only be sent *once*. So if you'd like to send the
   * same request again, clone it and send away.
   *
   * @returns {MapiRequest} - A new `MapiRequest` configured just like this one.
   */
  MapiRequest.prototype.clone = function clone() {
    return this._extend();
  };

  /**
   * @ignore
   */
  MapiRequest.prototype._extend = function _extend(options) {
    var extendedOptions = immutable(this._options, options);
    return new MapiRequest(this.client, extendedOptions);
  };

  var mapiRequest = MapiRequest;

  /**
   * A low-level Mapbox API client. Use it to create service clients
   * that share the same configuration.
   *
   * Services and `MapiRequest`s use the underlying `MapiClient` to
   * determine how to create, send, and abort requests in a way
   * that is appropriate to the configuration and environment
   * (Node or the browser).
   *
   * @class MapiClient
   * @property {string} accessToken - The Mapbox access token assigned
   *   to this client.
   * @property {string} [origin] - The origin
   *   to use for API requests. Defaults to https://api.mapbox.com.
   */

  function MapiClient(options) {
    if (!options || !options.accessToken) {
      throw new Error('Cannot create a client without an access token');
    }
    // Try parsing the access token to determine right away if it's valid.
    parseMapboxToken(options.accessToken);

    this.accessToken = options.accessToken;
    this.origin = options.origin || constants.API_ORIGIN;
  }

  MapiClient.prototype.createRequest = function createRequest(requestOptions) {
    return new mapiRequest(this, requestOptions);
  };

  var mapiClient = MapiClient;

  function BrowserClient(options) {
    mapiClient.call(this, options);
  }
  BrowserClient.prototype = Object.create(mapiClient.prototype);
  BrowserClient.prototype.constructor = BrowserClient;

  BrowserClient.prototype.sendRequest = browserLayer.browserSend;
  BrowserClient.prototype.abortRequest = browserLayer.browserAbort;

  /**
   * Create a client for the browser.
   *
   * @param {Object} options
   * @param {string} options.accessToken
   * @param {string} [options.origin]
   * @returns {MapiClient}
   */
  function createBrowserClient(options) {
    return new BrowserClient(options);
  }

  var browserClient = createBrowserClient;

  var toString = Object.prototype.toString;

  var isPlainObj = function (x) {
    var prototype;
    return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
  };

  /**
   * Validators are functions which assert certain type.
   * They can return a string which can then be used
   * to display a helpful error message.
   * They can also return a function for a custom error message.
   */



  var DEFAULT_ERROR_PATH = 'value';
  var NEWLINE_INDENT = '\n  ';

  var v = {};

  /**
   * Runners
   *
   * Take root validators and run assertion
   */
  v.assert = function(rootValidator, options) {
    options = options || {};
    if (typeof options === 'string') {
      options = { description: options };
    }
    var description = options.description || options.apiName;
    return function(value) {
      var message = validate(rootValidator, value);
      // all good
      if (!message) {
        return;
      }

      var errorMessage = processMessage(message, options);

      if (description) {
        errorMessage = description + ': ' + errorMessage;
      }

      throw new Error(errorMessage);
    };
  };

  /**
   * Higher Order Validators
   *
   * validators which take other validators as input
   * and output a new validator
   */
  v.shape = function shape(validatorObj) {
    var validators = objectEntries(validatorObj);
    return function shapeValidator(value) {
      var validationResult = validate(v.plainObject, value);

      if (validationResult) {
        return validationResult;
      }

      var key, validator;
      var errorMessages = [];

      for (var i = 0; i < validators.length; i++) {
        key = validators[i].key;
        validator = validators[i].value;
        validationResult = validate(validator, value[key]);

        if (validationResult) {
          // return [key].concat(validationResult);
          errorMessages.push([key].concat(validationResult));
        }
      }

      return renderObjectErrorMessages(errorMessages);
    };
  };

  function renderObjectErrorMessages(errorMessages) {
    if (errorMessages.length < 2) {
      return errorMessages[0];
    }

    return function(options) {
      const list = errorMessages.map(function(message) {
        var key = message[0];
        var renderedMessage = processMessage(message, options)
          .split('\n')
          .join(NEWLINE_INDENT); // indents any inner nesting
        return '- ' + key + ': ' + renderedMessage;
      });

      var objectId = options.path.join('.');
      var ofPhrase = objectId === DEFAULT_ERROR_PATH ? '' : ' of ' + objectId;

      return (
        'The following properties' +
        ofPhrase +
        ' have invalid values:' +
        NEWLINE_INDENT +
        list.join(NEWLINE_INDENT)
      );
    };
  };

  v.strictShape = function strictShape(validatorObj) {
    var shapeValidator = v.shape(validatorObj);
    return function strictShapeValidator(value) {
      var shapeResult = shapeValidator(value);
      if (shapeResult) {
        return shapeResult;
      }

      var invalidKeys = Object.keys(value).reduce(function(memo, valueKey) {
        if (validatorObj[valueKey] === undefined) {
          memo.push(valueKey);
        }
        return memo;
      }, []);

      if (invalidKeys.length !== 0) {
        return function() {
          return 'The following keys are invalid: ' + invalidKeys.join(', ');
        };
      }
    };
  };

  v.arrayOf = function arrayOf(validator) {
    return createArrayValidator(validator);
  };

  v.tuple = function tuple() {
    var validators = Array.isArray(arguments[0])
      ? arguments[0]
      : Array.prototype.slice.call(arguments);
    return createArrayValidator(validators);
  };

  // Currently array validation fails when the first invalid item is found.
  function createArrayValidator(validators) {
    var validatingTuple = Array.isArray(validators);
    var getValidator = function(index) {
      if (validatingTuple) {
        return validators[index];
      }
      return validators;
    };

    return function arrayValidator(value) {
      var validationResult = validate(v.plainArray, value);
      if (validationResult) {
        return validationResult;
      }

      if (validatingTuple && value.length !== validators.length) {
        return 'an array with ' + validators.length + ' items';
      }

      for (var i = 0; i < value.length; i++) {
        validationResult = validate(getValidator(i), value[i]);
        if (validationResult) {
          return [i].concat(validationResult);
        }
      }
    };
  }

  v.required = function required(validator) {
    function requiredValidator(value) {
      if (value == null) {
        return function(options) {
          return formatErrorMessage(
            options,
            isArrayCulprit(options.path)
              ? 'cannot be undefined/null.'
              : 'is required.'
          );
        };
      }
      return validator.apply(this, arguments);
    }
    requiredValidator.__required = true;

    return requiredValidator;
  };

  v.oneOfType = function oneOfType() {
    var validators = Array.isArray(arguments[0])
      ? arguments[0]
      : Array.prototype.slice.call(arguments);
    return function oneOfTypeValidator(value) {
      var messages = validators
        .map(function(validator) {
          return validate(validator, value);
        })
        .filter(Boolean);

      // If we don't have as many messages as no. of validators,
      // then at least one validator was ok with the value.
      if (messages.length !== validators.length) {
        return;
      }

      // check primitive type
      if (
        messages.every(function(message) {
          return message.length === 1 && typeof message[0] === 'string';
        })
      ) {
        return orList(
          messages.map(function(m) {
            return m[0];
          })
        );
      }

      // Complex oneOfTypes like
      // `v.oneOftypes(v.shape({name: v.string})`, `v.shape({name: v.number}))`
      // are complex ¯\_(ツ)_/¯. For the current scope only returning the longest message.
      return messages.reduce(function(max, arr) {
        return arr.length > max.length ? arr : max;
      });
    };
  };

  /**
   * Meta Validators
   * which take options as argument (not validators)
   * and return a new primitive validator
   */
  v.equal = function equal(compareWith) {
    return function equalValidator(value) {
      if (value !== compareWith) {
        return JSON.stringify(compareWith);
      }
    };
  };

  v.oneOf = function oneOf() {
    var options = Array.isArray(arguments[0])
      ? arguments[0]
      : Array.prototype.slice.call(arguments);
    var validators = options.map(function(value) {
      return v.equal(value);
    });

    return v.oneOfType.apply(this, validators);
  };

  v.range = function range(compareWith) {
    var min = compareWith[0];
    var max = compareWith[1];
    return function rangeValidator(value) {
      var validationResult = validate(v.number, value);

      if (validationResult || value < min || value > max) {
        return 'number between ' + min + ' & ' + max + ' (inclusive)';
      }
    };
  };

  v.instanceOf = function instanceOf(compareWith) {
    return function instaceOfValidator(value) {
      if (value instanceof compareWith === false) {
        return 'instance of ' + (compareWith.name || '<<anonymous>>');
      }
    };
  };

  /**
   * Primitive validators
   *
   * simple validators which return a string or undefined
   */
  v.any = function any() {
    return;
  };

  v.boolean = function boolean(value) {
    if (typeof value !== 'boolean') {
      return 'boolean';
    }
  };

  v.number = function number(value) {
    if (typeof value !== 'number') {
      return 'number';
    }
  };

  v.finite = function finite(value) {
    if (!Number.isFinite(value)) {
      return 'finite';
    }
  };

  v.plainArray = function plainArray(value) {
    if (!Array.isArray(value)) {
      return 'array';
    }
  };

  v.plainObject = function plainObject(value) {
    if (!isPlainObj(value)) {
      return 'object';
    }
  };

  v.string = function string(value) {
    if (typeof value !== 'string') {
      return 'string';
    }
  };

  v.nonEmptyString = function nonEmptyString(value) {
    if (typeof value !== 'string' || value === '') {
      return 'non-empty string';
    }
  };

  v.func = function func(value) {
    if (typeof value !== 'function') {
      return 'function';
    }
  };

  v.date = function date(value) {
    if (value instanceof Date === false || value.toString() === 'Invalid Date') {
      return 'valid date';
    }
  };

  function validate(validator, value) {
    // assertions are optional by default unless wrapped in v.require
    if (value == null && !validator.hasOwnProperty('__required')) {
      return;
    }

    var result = validator(value);

    if (result) {
      return Array.isArray(result) ? result : [result];
    }
  }

  function processMessage(message, options) {
    // message array follows the convention
    // [...path, result]
    // path is an array of object keys / array indices
    // result is output of the validator
    var len = message.length;

    var result = message[len - 1];
    var path = message.slice(0, len - 1);

    if (path.length === 0) {
      path = [DEFAULT_ERROR_PATH];
    }
    options = immutable(options, { path: path });

    return typeof result === 'function'
      ? result(options) // allows customization of result
      : formatErrorMessage(options, prettifyResult(result));
  }

  function orList(list) {
    if (list.length < 2) {
      return list[0];
    }
    if (list.length === 2) {
      return list.join(' or ');
    }
    return list.slice(0, -1).join(', ') + ', or ' + list.slice(-1);
  }

  function prettifyResult(result) {
    return 'must be ' + addArticle(result) + '.';
  }

  function addArticle(nounPhrase) {
    if (/^an? /.test(nounPhrase)) {
      return nounPhrase;
    }
    if (/^[aeiou]/i.test(nounPhrase)) {
      return 'an ' + nounPhrase;
    }
    if (/^[a-z]/i.test(nounPhrase)) {
      return 'a ' + nounPhrase;
    }
    return nounPhrase;
  }

  function formatErrorMessage(options, prettyResult) {
    var arrayCulprit = isArrayCulprit(options.path);
    var output = options.path.join('.') + ' ' + prettyResult;
    var prepend = arrayCulprit ? 'Item at position ' : '';

    return prepend + output;
  }

  function isArrayCulprit(path) {
    return typeof path[path.length - 1] == 'number' || typeof path[0] == 'number';
  }

  function objectEntries(obj) {
    return Object.keys(obj || {}).map(function(key) {
      return { key: key, value: obj[key] };
    });
  }

  v.validate = validate;
  v.processMessage = processMessage;

  var lib = v;

  function file(value) {
    // If we're in a browser so Blob is available, the file must be that.
    // In Node, however, it could be a filepath or a pipeable (Readable) stream.
    if (typeof window !== 'undefined') {
      if (value instanceof commonjsGlobal.Blob || value instanceof commonjsGlobal.ArrayBuffer) {
        return;
      }
      return 'Blob or ArrayBuffer';
    }
    if (typeof value === 'string' || value.pipe !== undefined) {
      return;
    }
    return 'Filename or Readable stream';
  }

  function assertShape(validatorObj, apiName) {
    return lib.assert(lib.strictShape(validatorObj), apiName);
  }

  function date(value) {
    var msg = 'date';
    if (typeof value === 'boolean') {
      return msg;
    }
    try {
      var date = new Date(value);
      if (date.getTime && isNaN(date.getTime())) {
        return msg;
      }
    } catch (e) {
      return msg;
    }
  }

  function coordinates(value) {
    return lib.tuple(lib.number, lib.number)(value);
  }

  var validator = immutable(lib, {
    file: file,
    date: date,
    coordinates: coordinates,
    assertShape: assertShape
  });

  /**
   * Create a new object by picking properties off an existing object.
   * The second param can be overloaded as a callback for
   * more fine grained picking of properties.
   * @param {Object} source
   * @param {Array<string>|function(string, Object):boolean} keys
   * @returns {Object}
   */
  function pick(source, keys) {
    var filter = function(key, val) {
      return keys.indexOf(key) !== -1 && val !== undefined;
    };

    if (typeof keys === 'function') {
      filter = keys;
    }

    return Object.keys(source)
      .filter(function(key) {
        return filter(key, source[key]);
      })
      .reduce(function(result, key) {
        result[key] = source[key];
        return result;
      }, {});
  }

  var pick_1 = pick;

  // This will create the environment-appropriate client.


  function createServiceFactory(ServicePrototype) {
    return function(clientOrConfig) {
      var client;
      if (mapiClient.prototype.isPrototypeOf(clientOrConfig)) {
        client = clientOrConfig;
      } else {
        client = browserClient(clientOrConfig);
      }
      var service = Object.create(ServicePrototype);
      service.client = client;
      return service;
    };
  }

  var createServiceFactory_1 = createServiceFactory;

  /**
   * Datasets API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#datasets).
   */
  var Datasets = {};

  /**
   * List datasets in your account.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#list-datasets).
   *
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.listDatasets()
   *   .send()
   *   .then(response => {
   *     const datasets = response.body;
   *   });
   *
   * @example
   * datasetsClient.listDatasets()
   *   .eachPage((error, response, next) => {
   *     // Handle error or response and call next.
   *   });
   */
  Datasets.listDatasets = function(config) {
    validator.assertShape({
      sortby: validator.oneOf('created', 'modified')
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/datasets/v1/:ownerId',
      query: config ? pick_1(config, ['sortby']) : {}
    });
  };

  /**
   * Create a new, empty dataset.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#create-a-dataset).
   *
   * @param {Object} config
   * @param {string} [config.name]
   * @param {string} [config.description]
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.createDataset({
   *   name: 'example',
   *   description: 'An example dataset'
   * })
   *   .send()
   *   .then(response => {
   *     const datasetMetadata = response.body;
   *   });
   */
  Datasets.createDataset = function(config) {
    validator.assertShape({
      name: validator.string,
      description: validator.string
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/datasets/v1/:ownerId',
      body: config
    });
  };

  /**
   * Get metadata about a dataset.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-a-dataset).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.getMetadata({
   *   datasetId: 'dataset-id'
   * })
   *   .send()
   *   .then(response => {
   *     const datasetMetadata = response.body;
   *   })
   */
  Datasets.getMetadata = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      description: validator.string
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/datasets/v1/:ownerId/:datasetId',
      params: config
    });
  };

  /**
   * Update user-defined properties of a dataset's metadata.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#update-a-dataset).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @param {string} [config.name]
   * @param {string} [config.description]
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.updateMetadata({
   *   datasetId: 'dataset-id',
   *   name: 'foo'
   * })
   *   .send()
   *   .then(response => {
   *     const datasetMetadata = response.body;
   *   });
   */
  Datasets.updateMetadata = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      name: validator.string,
      description: validator.string
    })(config);

    return this.client.createRequest({
      method: 'PATCH',
      path: '/datasets/v1/:ownerId/:datasetId',
      params: pick_1(config, ['datasetId']),
      body: pick_1(config, ['name', 'description'])
    });
  };

  /**
   * Delete a dataset, including all features it contains.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#delete-a-dataset).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.deleteDataset({
   *   datasetId: 'dataset-id'
   * })
   *   .send()
   *   .then(response => {
   *     // Dataset is successfully deleted.
   *   });
   */
  Datasets.deleteDataset = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/datasets/v1/:ownerId/:datasetId',
      params: config
    });
  };

  /**
   * List features in a dataset.
   *
   * This endpoint supports pagination. Use `MapiRequest#eachPage` or manually specify
   * the `limit` and `start` options.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#list-features).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @param {number} [config.limit] - Only list this number of features.
   * @param {string} [config.start] - The ID of the feature from which the listing should
   *   start.
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.listFeatures({
   *   datasetId: 'dataset-id'
   * })
   *   .send()
   *   .then(response => {
   *     const features = response.body;
   *   });
   */
  Datasets.listFeatures = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      limit: validator.number,
      start: validator.string
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/datasets/v1/:ownerId/:datasetId/features',
      params: pick_1(config, ['datasetId']),
      query: pick_1(config, ['limit', 'start'])
    });
  };

  /**
   * Add a feature to a dataset or update an existing one.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#insert-or-update-a-feature).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @param {string} config.featureId
   * @param {Object} config.feature - Valid GeoJSON that is not a `FeatureCollection`.
   *   If the feature has a top-level `id` property, it must match the `featureId` you specify.
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.putFeature({
   *   datasetId: 'dataset-id',
   *   featureId: 'null-island',
   *   feature: {
   *     "type": "Feature",
   *     "properties": { "name": "Null Island" },
   *     "geometry": {
   *       "type": "Point",
   *       "coordinates": [0, 0]
   *     }
   *   }
   * })
   *   .send()
   *   .then(response => {
   *     const feature = response.body;
   *   });
   */
  Datasets.putFeature = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      featureId: validator.required(validator.string),
      feature: validator.required(validator.plainObject)
    })(config);

    if (
      config.feature.id !== undefined &&
      config.feature.id !== config.featureId
    ) {
      throw new Error('featureId must match the id property of the feature');
    }

    return this.client.createRequest({
      method: 'PUT',
      path: '/datasets/v1/:ownerId/:datasetId/features/:featureId',
      params: pick_1(config, ['datasetId', 'featureId']),
      body: config.feature
    });
  };

  /**
   * Get a feature in a dataset.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-a-feature).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @param {string} config.featureId
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.getFeature({
   *   datasetId: 'dataset-id',
   *   featureId: 'feature-id'
   * })
   *   .send()
   *   .then(response => {
   *     const feature = response.body;
   *   });
   */
  Datasets.getFeature = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      featureId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/datasets/v1/:ownerId/:datasetId/features/:featureId',
      params: config
    });
  };

  /**
   * Delete a feature in a dataset.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#delete-a-feature).
   *
   * @param {Object} config
   * @param {string} config.datasetId
   * @param {string} config.featureId
   * @return {MapiRequest}
   *
   * @example
   * datasetsClient.deleteFeature({
   *   datasetId: 'dataset-id',
   *   featureId: 'feature-id'
   * })
   *   .send()
   *   .then(response => {
   *     // Feature is successfully deleted.
   *   });
   */
  Datasets.deleteFeature = function(config) {
    validator.assertShape({
      datasetId: validator.required(validator.string),
      featureId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/datasets/v1/:ownerId/:datasetId/features/:featureId',
      params: config
    });
  };

  var datasets = createServiceFactory_1(Datasets);

  function objectClean(obj) {
    return pick_1(obj, function(_, val) {
      return val != null;
    });
  }

  var objectClean_1 = objectClean;

  function objectMap(obj, cb) {
    return Object.keys(obj).reduce(function(result, key) {
      result[key] = cb(key, obj[key]);
      return result;
    }, {});
  }

  var objectMap_1 = objectMap;

  /**
   * Stringify all the boolean values in an object, so true becomes "true".
   *
   * @param {Object} obj
   * @returns {Object}
   */
  function stringifyBoolean(obj) {
    return objectMap_1(obj, function(_, value) {
      return typeof value === 'boolean' ? JSON.stringify(value) : value;
    });
  }

  var stringifyBooleans = stringifyBoolean;

  /**
   * Directions API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#directions).
   */
  var Directions = {};

  /**
   * Get directions.
   *
   * Please read [the full HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#directions)
   * to understand all of the available options.
   *
   * @param {Object} config
   * @param {'driving-traffic'|'driving'|'walking'|'cycling'} [config.profile="driving"]
   * @param {Array<DirectionsWaypoint>} config.waypoints - An ordered array of [`DirectionsWaypoint`](#directionswaypoint) objects, between 2 and 25 (inclusive).
   * @param {boolean} [config.alternatives=false] - Whether to try to return alternative routes.
   * @param {Array<'duration'|'distance'|'speed'|'congestion'>} [config.annotations] - Specify additional metadata that should be returned.
   * @param {boolean} [config.bannerInstructions=false] - Should be used in conjunction with `steps`.
   * @param {boolean} [config.continueStraight] - Sets the allowed direction of travel when departing intermediate waypoints.
   * @param {string} [config.exclude] - Exclude certain road types from routing. See HTTP service documentation for options.
   * @param {'geojson'|'polyline'|'polyline6'} [config.geometries="polyline"] - Format of the returned geometry.
   * @param {string} [config.language="en"] - Language of returned turn-by-turn text instructions.
   *   See options listed in [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#instructions-languages).
   * @param {'simplified'|'full'|'false'} [config.overview="simplified"] - Type of returned overview geometry.
   * @param {boolean} [config.roundaboutExits=false] - Emit insbtructions at roundabout exits.
   * @param {boolean} [config.steps=false] - Whether to return steps and turn-by-turn instructions.
   * @param {boolean} [config.voiceInstructions=false] - Whether or not to return SSML marked-up text for voice guidance along the route.
   * @param {'imperial'|'metric'} [config.voiceUnits="imperial"] - Which type of units to return in the text for voice instructions.
   * @param {'electric_no_recharge'|'electric'} [config.engine="electric_no_recharge"] - Set to electric to enable electric vehicle routing.
   * @param {number} [config.ev_initial_charge] - Optional parameter to specify initial charge of vehicle in Wh (watt-hours) at the beginning of the route.
   * @param {number} [config.ev_max_charge] - Required parameter that defines the maximum possible charge of vehicle in Wh (watt-hours).
   * @param {'ccs_combo_type1'|'ccs_combo_type1'|'tesla'} [config.ev_connector_types] - Required parameter that defines the compatible connector-types for the vehicle.
   * @param {String} [config.energy_consumption_curve] - Required parameter that specifies in pairs the energy consumption in watt-hours per kilometer at a certain speed in kph.
   * @param {String} [config.ev_charging_curve] - Required parameter that specifies the maximum battery charging rate (W) at a given charge level (Wh) in a list of pairs.
   * @param {String} [config.ev_unconditioned_charging_curve] - Optional parameter that specifies the maximum battery charging rate (W) at a given charge level (Wh) in a list of pairs when the battery is in an unconditioned state (eg: cold).
   * @param {number} [config.ev_pre_conditioning_time] - Optional parameter that defines the time in minutes it would take for the vehicle's battery to condition.
   * @param {number} [config.ev_max_ac_charging_power] - Optional parameter to specify maximum AC charging power(W) that can be delivered by the onboard vehicle charger.
   * @param {number} [config.ev_min_charge_at_destination] - Optional parameter to define the minimum battery charge required at the final route destination (Wh).
   * @param {number} [config.ev_min_charge_at_charging_station] - Optional parameter to define the minimum charge when arriving at the charging station (Wh).
   * @param {number} [config.auxiliary_consumption] - Optional parameter to define the measure of the continuous power draw of the auxiliary systems in watts (E.G heating or AC).
   * @param {number} [config.maxHeight=1.6] - Optional parameter to define the max vehicle height in meters.
   * @param {number} [config.maxWidth=1.9] - Optional parameter to define the max vehicle width in meters.
   * @param {number} [config.maxWeight=2.5] - Optional parameter to define the max vehicle weight in metric tons.
   * @param {String} [config.notifications="all"] - Returns notification metadata associated with the route leg of the route object.
   * @param {String} [config.departAt] - Optional parameter to define the departure time, formatted as a timestamp in ISO-8601 format in the local time at the route origin.
   * @param {String} [config.arriveBy] - Optional parameter to define the desired arrival time, formatted as a timestamp in ISO-8601 format in the local time at the route destination.
   * @return {MapiRequest}
   *
   * @example
   * directionsClient.getDirections({
   *   profile: 'driving-traffic',
   *   waypoints: [
   *     {
   *       coordinates: [13.4301, 52.5109],
   *       approach: 'unrestricted'
   *     },
   *     {
   *       coordinates: [13.4265, 52.508]
   *     },
   *     {
   *       coordinates: [13.4194, 52.5072],
   *       bearing: [100, 60]
   *     }
   *   ]
   * })
   *   .send()
   *   .then(response => {
   *     const directions = response.body;
   *   });
   */
  Directions.getDirections = function(config) {
    validator.assertShape({
      profile: validator.oneOf('driving-traffic', 'driving', 'walking', 'cycling'),
      waypoints: validator.required(
        validator.arrayOf(
          validator.shape({
            coordinates: validator.required(validator.coordinates),
            approach: validator.oneOf('unrestricted', 'curb'),
            bearing: validator.arrayOf(validator.range([0, 360])),
            radius: validator.oneOfType(validator.number, validator.equal('unlimited')),
            waypointName: validator.string
          })
        )
      ),
      alternatives: validator.boolean,
      annotations: validator.arrayOf(
        validator.oneOf(
          'duration',
          'distance',
          'speed',
          'congestion',
          'congestion_numeric',
          'maxspeed',
          'closure',
          'state_of_charge'
        )
      ),
      bannerInstructions: validator.boolean,
      continueStraight: validator.boolean,
      exclude: validator.string,
      geometries: validator.string,
      language: validator.string,
      overview: validator.string,
      roundaboutExits: validator.boolean,
      steps: validator.boolean,
      voiceInstructions: validator.boolean,
      voiceUnits: validator.string,
      engine: validator.string,
      ev_initial_charge: validator.number,
      ev_max_charge: validator.number,
      ev_connector_types: validator.string,
      energy_consumption_curve: validator.string,
      ev_charging_curve: validator.string,
      ev_unconditioned_charging_curve: validator.string,
      ev_pre_conditioning_time: validator.number,
      ev_max_ac_charging_power: validator.number,
      ev_min_charge_at_destination: validator.number,
      ev_min_charge_at_charging_station: validator.number,
      auxiliary_consumption: validator.number,
      maxHeight: validator.number,
      maxWidth: validator.number,
      maxWeight: validator.number,
      notifications: validator.string,
      departAt: validator.string,
      arriveBy: validator.string
    })(config);

    config.profile = config.profile || 'driving';

    var path = {
      coordinates: [],
      approach: [],
      bearing: [],
      radius: [],
      waypointName: []
    };

    var waypointCount = config.waypoints.length;
    if (waypointCount < 2 || waypointCount > 25) {
      throw new Error(
        'waypoints must include between 2 and 25 DirectionsWaypoints'
      );
    }

    /**
     * @typedef {Object} DirectionsWaypoint
     * @property {Coordinates} coordinates
     * @property {'unrestricted'|'curb'} [approach="unrestricted"] - Used to indicate how requested routes consider from which side of the road to approach the waypoint.
     * @property {[number, number]} [bearing] - Used to filter the road segment the waypoint will be placed on by direction and dictates the angle of approach.
     *   This option should always be used in conjunction with a `radius`. The first value is an angle clockwise from true north between 0 and 360,
     *   and the second is the range of degrees the angle can deviate by.
     * @property {number|'unlimited'} [radius] - Maximum distance in meters that the coordinate is allowed to move when snapped to a nearby road segment.
     * @property {string} [waypointName] - Custom name for the waypoint used for the arrival instruction in banners and voice instructions.
     */
    config.waypoints.forEach(function(waypoint) {
      path.coordinates.push(
        waypoint.coordinates[0] + ',' + waypoint.coordinates[1]
      );

      // join props which come in pairs
      ['bearing'].forEach(function(prop) {
        if (waypoint.hasOwnProperty(prop) && waypoint[prop] != null) {
          waypoint[prop] = waypoint[prop].join(',');
        }
      });

      ['approach', 'bearing', 'radius', 'waypointName'].forEach(function(prop) {
        if (waypoint.hasOwnProperty(prop) && waypoint[prop] != null) {
          path[prop].push(waypoint[prop]);
        } else {
          path[prop].push('');
        }
      });
    });

    ['approach', 'bearing', 'radius', 'waypointName'].forEach(function(prop) {
      // avoid sending params which are all `;`
      if (
        path[prop].every(function(char) {
          return char === '';
        })
      ) {
        delete path[prop];
      } else {
        path[prop] = path[prop].join(';');
      }
    });

    var query = stringifyBooleans({
      alternatives: config.alternatives,
      annotations: config.annotations,
      banner_instructions: config.bannerInstructions,
      continue_straight: config.continueStraight,
      exclude: config.exclude,
      geometries: config.geometries,
      language: config.language,
      overview: config.overview,
      roundabout_exits: config.roundaboutExits,
      steps: config.steps,
      voice_instructions: config.voiceInstructions,
      voice_units: config.voiceUnits,
      approaches: path.approach,
      bearings: path.bearing,
      radiuses: path.radius,
      waypoint_names: path.waypointName,
      engine: config.engine,
      ev_initial_charge: config.ev_initial_charge,
      ev_max_charge: config.ev_max_charge,
      ev_connector_types: config.ev_connector_types,
      energy_consumption_curve: config.energy_consumption_curve,
      ev_charging_curve: config.ev_charging_curve,
      ev_unconditioned_charging_curve: config.ev_unconditioned_charging_curve,
      ev_pre_conditioning_time: config.ev_pre_conditioning_time,
      ev_max_ac_charging_power: config.ev_max_ac_charging_power,
      ev_min_charge_at_destination: config.ev_min_charge_at_destination,
      ev_min_charge_at_charging_station: config.ev_min_charge_at_charging_station,
      auxiliary_consumption: config.auxiliary_consumption,
      max_height: config.maxHeight,
      max_width: config.maxWidth,
      max_weight: config.maxWeight,
      notifications: config.notifications,
      depart_at: config.departAt,
      arrive_by: config.arriveBy
    });

    return this.client.createRequest({
      method: 'GET',
      path: '/directions/v5/mapbox/:profile/:coordinates',
      params: {
        profile: config.profile,
        coordinates: path.coordinates.join(';')
      },
      query: objectClean_1(query)
    });
  };

  var directions = createServiceFactory_1(Directions);

  /**
   * Geocoding API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/search/#geocoding).
   */
  var Geocoding = {};

  var featureTypes = [
    'country',
    'region',
    'postcode',
    'district',
    'place',
    'locality',
    'neighborhood',
    'address',
    'poi',
    'poi.landmark'
  ];

  /**
   * Search for a place.
   *
   * See the [public documentation](https://www.mapbox.com/api-documentation/search/#forward-geocoding).
   *
   * @param {Object} config
   * @param {string} config.query - A place name.
   * @param {'mapbox.places'|'mapbox.places-permanent'} [config.mode="mapbox.places"] - Either `mapbox.places` for ephemeral geocoding, or `mapbox.places-permanent` for storing results and batch geocoding.
   * @param {Array<string>} [config.countries] - Limits results to the specified countries.
   *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
   * @param {Coordinates} [config.proximity] - Bias local results based on a provided location.
   * @param {Array<'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'|'poi'|'poi.landmark'>} [config.types] - Filter results by feature types.
   * @param {boolean} [config.autocomplete=true] - Return autocomplete results or not.
   * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
   * @param {number} [config.limit=5] - Limit the number of results returned.
   * @param {Array<string>} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
   *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
   *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
   * @param {boolean} [config.routing=false] - Specify whether to request additional metadata about the recommended navigation destination. Only applicable for address features.
   * @param {boolean} [config.fuzzyMatch=true] - Specify whether the Geocoding API should attempt approximate, as well as exact, matching.
   * @param {String} [config.worldview="us"] - Filter results to geographic features whose characteristics are defined differently by audiences belonging to various regional, cultural, or political groups.
   * @param {String} [config.session_token] - A unique session identifier generated by the client.
   * 
   * @return {MapiRequest}
   *
   * @example
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   limit: 2
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * @example
   * // geocoding with proximity
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   proximity: [-95.4431142, 33.6875431]
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * // geocoding with countries
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   countries: ['fr']
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * // geocoding with bounding box
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   bbox: [2.14, 48.72, 2.55, 48.96]
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   */
  Geocoding.forwardGeocode = function(config) {
    validator.assertShape({
      query: validator.required(validator.string),
      mode: validator.oneOf('mapbox.places', 'mapbox.places-permanent'),
      countries: validator.arrayOf(validator.string),
      proximity: validator.coordinates,
      types: validator.arrayOf(validator.oneOf(featureTypes)),
      autocomplete: validator.boolean,
      bbox: validator.arrayOf(validator.number),
      limit: validator.number,
      language: validator.arrayOf(validator.string),
      routing: validator.boolean,
      fuzzyMatch: validator.boolean,
      worldview: validator.string,
      session_token: validator.string
    })(config);

    config.mode = config.mode || 'mapbox.places';

    var query = stringifyBooleans(
      immutable(
        { country: config.countries },
        pick_1(config, [
          'proximity',
          'types',
          'autocomplete',
          'bbox',
          'limit',
          'language',
          'routing',
          'fuzzyMatch',
          'worldview',
          'session_token'
        ])
      )
    );

    return this.client.createRequest({
      method: 'GET',
      path: '/geocoding/v5/:mode/:query.json',
      params: pick_1(config, ['mode', 'query']),
      query: query
    });
  };

  /**
   * Search for places near coordinates.
   *
   * See the [public documentation](https://www.mapbox.com/api-documentation/search/#reverse-geocoding).
   *
   * @param {Object} config
   * @param {Coordinates} config.query - Coordinates at which features will be searched.
   * @param {'mapbox.places'|'mapbox.places-permanent'} [config.mode="mapbox.places"] - Either `mapbox.places` for ephemeral geocoding, or `mapbox.places-permanent` for storing results and batch geocoding.
   * @param {Array<string>} [config.countries] - Limits results to the specified countries.
   *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
   * @param {Array<'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'|'poi'|'poi.landmark'>} [config.types] - Filter results by feature types.
   * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
   * @param {number} [config.limit=1] - Limit the number of results returned. If using this option, you must provide a single item for `types`.
   * @param {Array<string>} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
   *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
   *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
   * @param {'distance'|'score'} [config.reverseMode='distance'] - Set the factors that are used to sort nearby results.
   * @return {MapiRequest}
   *
   * @example
   * geocodingClient.reverseGeocode({
   *   query: [-95.4431142, 33.6875431],
   *   limit: 2
   * })
   *   .send()
   *   .then(response => {
   *     // GeoJSON document with geocoding matches
   *     const match = response.body;
   *   });
   */
  Geocoding.reverseGeocode = function(config) {
    validator.assertShape({
      query: validator.required(validator.coordinates),
      mode: validator.oneOf('mapbox.places', 'mapbox.places-permanent'),
      countries: validator.arrayOf(validator.string),
      types: validator.arrayOf(validator.oneOf(featureTypes)),
      bbox: validator.arrayOf(validator.number),
      limit: validator.number,
      language: validator.arrayOf(validator.string),
      reverseMode: validator.oneOf('distance', 'score'),
      routing: validator.boolean,
      worldview: validator.string,
      session_token: validator.string
    })(config);

    config.mode = config.mode || 'mapbox.places';

    var query = stringifyBooleans(
      immutable(
        { country: config.countries },
        pick_1(config, [
          'country',
          'types',
          'bbox',
          'limit',
          'language',
          'reverseMode',
          'reverseMode',
          'routing',
          'worldview',
          'session_token'
        ])
      )
    );

    return this.client.createRequest({
      method: 'GET',
      path: '/geocoding/v5/:mode/:query.json',
      params: pick_1(config, ['mode', 'query']),
      query: query
    });
  };

  var geocoding = createServiceFactory_1(Geocoding);

  /**
   * Geocoding API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://docs.mapbox.com/api/search/geocoding-v6/).
   */
  var GeocodingV6 = {};

  var featureTypesV6 = [
    'street',
    'country',
    'region',
    'postcode',
    'district',
    'place',
    'locality',
    'neighborhood',
    'address',
    'secondary_address'
  ];

  /**
   * Search for a place.
   *
   * See the [public documentation](https://docs.mapbox.com/api/search/geocoding-v6/#forward-geocoding).
   *
   * @param {Object} config
   * @param {string} config.query - A place name.
   * @param {'standard'|'structured'} [config.mode="standard"] - Either `standard` for common forward geocoding, or `structured` for increasing the accuracy of results. To use Structured Input, the query parameter must be dropped in favor of a separate parameter for individual feature components.
   * @param {Array<string>|string} [config.countries] - Limits results to the specified countries.
   *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
   *   [OR] if used with input mode="structured" denotes single country in free form.
   * @param {Coordinates|'ip'} [config.proximity] - Bias local results based on a provided coordinate location or a user's IP address.
   * @param {Array<'street'|'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'|'secondary_address'>} [config.types] - Filter results by feature types.
   * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
   * @param {number} [config.limit=5] - Limit the number of results returned.
   * @param {'geojson'|'v5'} [config.format='geojson'] - Specify the desired response format of results (geojson, default) or for backwards compatibility (v5).
   * @param {String} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
   *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
   *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
   * @param {String} [config.address_line1] - A string including address_number and street. These values can alternatively be provided as separate parameters. (Stuctured Input specific field)
   * @param {String} [config.address_number] - The number associated with the house (Stuctured Input specific field)
   * @param {String} [config.street] - The name of the street in the address (Stuctured Input specific field)
   * @param {String} [config.block] - In some countries like Japan, the block is a component in the address (Stuctured Input specific field)
   * @param {String} [config.place] - Typically these are cities, villages, municipalities, etc. (Stuctured Input specific field)
   * @param {String} [config.region] - Top-level sub-national administrative features, such as states in the United States or provinces in Canada or China. (Stuctured Input specific field)
   * @param {String} [config.neighborhood] - Colloquial sub-city features often referred to in local parlance (Stuctured Input specific field)
   * @param {String} [config.postcode] - Postal codes used in country-specific national addressing systems. (Stuctured Input specific field)
   * @param {String} [config.locality] - Official sub-city features (Stuctured Input specific field)
   * @param {boolean} [config.autocomplete=true] - Return autocomplete results or not.
   * @param {boolean} [config.permanent=false] - Specify whether you intend to store the results of the query (true) or not (false, default). Temporary results are not allowed to be cached, while Permanent results are allowed to be cached and stored indefinitely.
   * @param {String} [config.worldview="us"] - Filter results to geographic features whose characteristics are defined differently by audiences belonging to various regional, cultural, or political groups.
   * @param {String} [config.session_token] - A unique session identifier generated by the client.
   * @return {MapiRequest}
   *
   * @example
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   limit: 2
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * @example
   * // geocoding in structured input mode
   * geocodingClient.forwardGeocode({
   *   mode: 'structured',
   *   address_number: '12',
   *   street: 'Main str.'
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * @example
   * // geocoding with proximity
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   proximity: [-95.4431142, 33.6875431]
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * // geocoding with countries
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   countries: ['fr']
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   *
   * // geocoding with bounding box
   * geocodingClient.forwardGeocode({
   *   query: 'Paris, France',
   *   bbox: [2.14, 48.72, 2.55, 48.96]
   * })
   *   .send()
   *   .then(response => {
   *     const match = response.body;
   *   });
   */
  GeocodingV6.forwardGeocode = function(config) {
    config.mode = config.mode || 'standard';

    validator.assertShape(
      immutable(config.mode === 'standard' ? { query: validator.required(validator.string) } : {}, {
        mode: validator.oneOf('standard', 'structured'),
        countries: config.mode === 'standard' ? validator.arrayOf(validator.string) : validator.string,
        proximity: validator.oneOf(validator.coordinates, 'ip'),
        types: validator.arrayOf(validator.oneOf(featureTypesV6)),
        bbox: validator.arrayOf(validator.number),
        format: validator.oneOf('geojson', 'v5'),
        language: validator.string,
        limit: validator.number,
        worldview: validator.string,
        autocomplete: validator.boolean,
        permanent: validator.boolean,
        session_token: validator.string,

        // structured input fields
        address_line1: validator.string,
        address_number: validator.string,
        street: validator.string,
        block: validator.string,
        place: validator.string,
        region: validator.string,
        neighborhood: validator.string,
        postcode: validator.string,
        locality: validator.string
      })
    )(config);

    var query = stringifyBooleans(
      immutable(
        config.mode === 'standard'
          ? { q: config.query }
          : pick_1(config, [
              'address_line1',
              'address_number',
              'street',
              'block',
              'place',
              'region',
              'neighborhood',
              'postcode',
              'locality'
            ]),
        { country: config.countries },
        pick_1(config, [
          'proximity',
          'types',
          'bbox',
          'format',
          'language',
          'limit',
          'worldview',
          'autocomplete',
          'permanent',
          'session_token'
        ])
      )
    );

    return this.client.createRequest({
      method: 'GET',
      path: '/search/geocode/v6/forward',
      query: query
    });
  };

  var geocodingv6 = createServiceFactory_1(GeocodingV6);

  /**
   * Search for places near coordinates.
   *
   * See the [public documentation](https://docs.mapbox.com/api/search/geocoding-v6/#reverse-geocoding).
   *
   * @param {Object} config
   * @param {number} config.longitude - longitude coordinate at which features will be searched.
   * @param {number} config.latitude - latitude coordinate at which features will be searched.
   * @param {Array<string>} [config.countries] - Limits results to the specified countries.
   *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
   * @param {Array<'street'|'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'>} [config.types] - Filter results by feature types.
   * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
   * @param {number} [config.limit=1] - Limit the number of results returned. If using this option, you must provide a single item for `types`.
   * @param {string} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
   *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
   *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
   * @param {boolean} [config.permanent=false] - Specify whether you intend to store the results of the query (true) or not (false, default). Temporary results are not allowed to be cached, while Permanent results are allowed to be cached and stored indefinitely.
   * @param {String} [config.worldview="us"] - Filter results to geographic features whose characteristics are defined differently by audiences belonging to various regional, cultural, or political groups.
   * @param {String} [config.session_token] - A unique session identifier generated by the client.
   * @return {MapiRequest}
   *
   * @example
   * geocodingClient.reverseGeocode({
   *   longitude: -73.990593,
   *   latitude: 40.740121
   * })
   *   .send()
   *   .then(response => {
   *     // GeoJSON document with geocoding matches
   *     const match = response.body;
   *   });
   */
  GeocodingV6.reverseGeocode = function(config) {
    validator.assertShape({
      longitude: validator.required(validator.number),
      latitude: validator.required(validator.number),
      countries: validator.arrayOf(validator.string),
      types: validator.arrayOf(validator.oneOf(featureTypes)),
      limit: validator.number,
      language: validator.string,
      worldview: validator.string,
      permanent: validator.boolean,
      session_token: validator.string
    })(config);

    var query = stringifyBooleans(
      immutable(
        { country: config.countries },
        pick_1(config, [
          'longitude',
          'latitude',
          'types',
          'limit',
          'language',
          'worldview',
          'permanent',
          'session_token'
        ])
      )
    );

    return this.client.createRequest({
      method: 'GET',
      path: '/search/geocode/v6/reverse',
      query: query
    });
  };

  /**
   * Map Matching API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#map-matching).
   */
  var MapMatching = {};

  /**
   * Snap recorded location traces to roads and paths.
   *
   * @param {Object} config
   * @param {Array<MapMatchingPoint>} config.points - An ordered array of [`MapMatchingPoint`](#mapmatchingpoint)s, between 2 and 100 (inclusive).
   * @param {'driving-traffic'|'driving'|'walking'|'cycling'} [config.profile=driving] - A directions profile ID.
   * @param {Array<'duration'|'distance'|'speed'>} [config.annotations] - Specify additional metadata that should be returned.
   * @param {'geojson'|'polyline'|'polyline6'} [config.geometries="polyline"] - Format of the returned geometry.
   * @param {string} [config.language="en"] - Language of returned turn-by-turn text instructions.
   *   See [supported languages](https://www.mapbox.com/api-documentation/navigation/#instructions-languages).
   * @param {'simplified'|'full'|'false'} [config.overview="simplified"] - Type of returned overview geometry.
   * @param {boolean} [config.steps=false] - Whether to return steps and turn-by-turn instructions.
   * @param {boolean} [config.tidy=false] - Whether or not to transparently remove clusters and re-sample traces for improved map matching results.
   * @return {MapiRequest}
   *
   * @example
   * mapMatchingClient.getMatch({
   *   points: [
   *     {
   *       coordinates: [-117.17283, 32.712041],
   *       approach: 'curb'
   *     },
   *     {
   *       coordinates: [-117.17291, 32.712256],
   *       isWaypoint: false
   *     },
   *     {
   *       coordinates: [-117.17292, 32.712444]
   *     },
   *     {
   *       coordinates: [-117.172922, 32.71257],
   *       waypointName: 'point-a',
   *       approach: 'unrestricted'
   *     },
   *     {
   *       coordinates: [-117.172985, 32.7126]
   *     },
   *     {
   *       coordinates: [-117.173143, 32.712597]
   *     },
   *     {
   *       coordinates: [-117.173345, 32.712546]
   *     }
   *   ],
   *   tidy: false,
   * })
   *   .send()
   *   .then(response => {
   *     const matching = response.body;
   *   })
   */
  MapMatching.getMatch = function(config) {
    validator.assertShape({
      points: validator.required(
        validator.arrayOf(
          validator.shape({
            coordinates: validator.required(validator.coordinates),
            approach: validator.oneOf('unrestricted', 'curb'),
            radius: validator.range([0, 50]),
            isWaypoint: validator.boolean,
            waypointName: validator.string,
            timestamp: validator.date
          })
        )
      ),
      profile: validator.oneOf('driving-traffic', 'driving', 'walking', 'cycling'),
      annotations: validator.arrayOf(validator.oneOf('duration', 'distance', 'speed')),
      geometries: validator.oneOf('geojson', 'polyline', 'polyline6'),
      language: validator.string,
      overview: validator.oneOf('full', 'simplified', 'false'),
      steps: validator.boolean,
      tidy: validator.boolean
    })(config);

    var pointCount = config.points.length;
    if (pointCount < 2 || pointCount > 100) {
      throw new Error('points must include between 2 and 100 MapMatchingPoints');
    }

    config.profile = config.profile || 'driving';

    var path = {
      coordinates: [],
      approach: [],
      radius: [],
      isWaypoint: [],
      waypointName: [],
      timestamp: []
    };

    /**
     * @typedef {Object} MapMatchingPoint
     * @property {Coordinates} coordinates
     * @property {'unrestricted'|'curb'} [approach="unrestricted"] - Used to indicate how requested routes consider from which side of the road to approach a waypoint.
     * @property {number} [radius=5] - A number in meters indicating the assumed precision of the used tracking device.
     * @property {boolean} [isWaypoint=true] - Whether this coordinate is waypoint or not. The first and last coordinates will always be waypoints.
     * @property {string} [waypointName] - Custom name for the waypoint used for the arrival instruction in banners and voice instructions. Will be ignored unless `isWaypoint` is `true`.
     * @property {string | number | Date} [timestamp] - Datetime corresponding to the coordinate.
     */
    config.points.forEach(function(obj) {
      path.coordinates.push(obj.coordinates[0] + ',' + obj.coordinates[1]);

      // isWaypoint
      if (obj.hasOwnProperty('isWaypoint') && obj.isWaypoint != null) {
        path.isWaypoint.push(obj.isWaypoint);
      } else {
        path.isWaypoint.push(true); // default value
      }

      if (obj.hasOwnProperty('timestamp') && obj.timestamp != null) {
        path.timestamp.push(Number(new Date(obj.timestamp)));
      } else {
        path.timestamp.push('');
      }

      ['approach', 'radius', 'waypointName'].forEach(function(prop) {
        if (obj.hasOwnProperty(prop) && obj[prop] != null) {
          path[prop].push(obj[prop]);
        } else {
          path[prop].push('');
        }
      });
    });

    ['coordinates', 'approach', 'radius', 'waypointName', 'timestamp'].forEach(
      function(prop) {
        // avoid sending params which are all `;`
        if (
          path[prop].every(function(value) {
            return value === '';
          })
        ) {
          delete path[prop];
        } else {
          path[prop] = path[prop].join(';');
        }
      }
    );

    // the api requires the first and last items to be true.
    path.isWaypoint[0] = true;
    path.isWaypoint[path.isWaypoint.length - 1] = true;

    if (
      path.isWaypoint.every(function(value) {
        return value === true;
      })
    ) {
      delete path.isWaypoint;
    } else {
      // the api requires the indexes to be sent
      path.isWaypoint = path.isWaypoint
        .map(function(val, i) {
          return val === true ? i : '';
        })
        .filter(function(x) {
          return x === 0 || Boolean(x);
        })
        .join(';');
    }

    var body = stringifyBooleans(
      objectClean_1({
        annotations: config.annotations,
        geometries: config.geometries,
        language: config.language,
        overview: config.overview,
        steps: config.steps,
        tidy: config.tidy,
        approaches: path.approach,
        radiuses: path.radius,
        waypoints: path.isWaypoint,
        timestamps: path.timestamp,
        waypoint_names: path.waypointName,
        coordinates: path.coordinates
      })
    );

    // the matching api expects a form-urlencoded
    // post request.
    return this.client.createRequest({
      method: 'POST',
      path: '/matching/v5/mapbox/:profile',
      params: {
        profile: config.profile
      },
      body: urlUtils.appendQueryObject('', body).substring(1), // need to remove the char`?`
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });
  };

  var mapMatching = createServiceFactory_1(MapMatching);

  /**
   * Map Matching API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#matrix).
   */
  var Matrix = {};

  /**
   * Get a duration and/or distance matrix showing travel times and distances between coordinates.
   *
   * @param {Object} config
   * @param {Array<MatrixPoint>} config.points - An ordered array of [`MatrixPoint`](#matrixpoint)s, between 2 and 100 (inclusive).
   * @param {'driving-traffic'|'driving'|'walking'|'cycling'} [config.profile=driving] - A Mapbox Directions routing profile ID.
   * @param {'all'|Array<number>} [config.sources] - Use coordinates with given index as sources.
   * @param {'all'|Array<number>} [config.destinations] - Use coordinates with given index as destinations.
   * @param {Array<'distance'|'duration'>} [config.annotations] - Used to specify resulting matrices.
   * @return {MapiRequest}
   *
   * @example
   * matrixClient.getMatrix({
   *   points: [
   *     {
   *       coordinates: [2.2, 1.1]
   *     },
   *     {
   *       coordinates: [2.2, 1.1],
   *       approach: 'curb'
   *     },
   *     {
   *       coordinates: [3.2, 1.1]
   *     },
   *     {
   *       coordinates: [4.2, 1.1]
   *     }
   *   ],
   *   profile: 'walking'
   * })
   *   .send()
   *   .then(response => {
   *       const matrix = response.body;
   *   });
   */
  Matrix.getMatrix = function(config) {
    validator.assertShape({
      points: validator.required(
        validator.arrayOf(
          validator.shape({
            coordinates: validator.required(validator.coordinates),
            approach: validator.oneOf('unrestricted', 'curb')
          })
        )
      ),
      profile: validator.oneOf('driving-traffic', 'driving', 'walking', 'cycling'),
      annotations: validator.arrayOf(validator.oneOf('duration', 'distance')),
      sources: validator.oneOfType(validator.equal('all'), validator.arrayOf(validator.number)),
      destinations: validator.oneOfType(validator.equal('all'), validator.arrayOf(validator.number))
    })(config);

    var pointCount = config.points.length;
    if (pointCount < 2 || pointCount > 100) {
      throw new Error('points must include between 2 and 100 MatrixPoints');
    }

    config.profile = config.profile || 'driving';

    var path = {
      coordinates: [],
      approach: []
    };
    /**
     * @typedef {Object} MatrixPoint
     * @property {Coordinates} coordinates - `[longitude, latitude]`
     * @property {'unrestricted'|'curb'} [approach="unrestricted"] - Used to indicate how requested routes consider from which side of the road to approach the point.
     */
    config.points.forEach(function(obj) {
      path.coordinates.push(obj.coordinates[0] + ',' + obj.coordinates[1]);

      if (obj.hasOwnProperty('approach') && obj.approach != null) {
        path.approach.push(obj.approach);
      } else {
        path.approach.push(''); // default value
      }
    });

    if (
      path.approach.every(function(value) {
        return value === '';
      })
    ) {
      delete path.approach;
    } else {
      path.approach = path.approach.join(';');
    }

    var query = {
      sources: Array.isArray(config.sources)
        ? config.sources.join(';')
        : config.sources,
      destinations: Array.isArray(config.destinations)
        ? config.destinations.join(';')
        : config.destinations,
      approaches: path.approach,
      annotations: config.annotations && config.annotations.join(',')
    };

    return this.client.createRequest({
      method: 'GET',
      path: '/directions-matrix/v1/mapbox/:profile/:coordinates',
      params: {
        profile: config.profile,
        coordinates: path.coordinates.join(';')
      },
      query: objectClean_1(query)
    });
  };

  var matrix = createServiceFactory_1(Matrix);

  /**
   * Optimization API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#optimization).
   */
  var Optimization = {};

  /**
   * Get a duration-optimized route.
   *
   * Please read [the full HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#optimization)
   * to understand all of the available options.
   *
   * @param {Object} config
   * @param {'driving'|'walking'|'cycling'} [config.profile="driving"]
   * @param {Array<OptimizationWaypoint>} config.waypoints - An ordered array of [`OptimizationWaypoint`](#optimizationwaypoint) objects, between 2 and 12 (inclusive).
   * @param {Array<'duration'|'distance'|'speed'>} [config.annotations] - Specify additional metadata that should be returned.
   * @param {'any'|'last'} [config.destination="any"] - Returned route ends at `any` or `last` coordinate.
   * @param {Array<Distribution>} [config.distributions] - An ordered array of [`Distribution`](#distribution) objects, each of which includes a `pickup` and `dropoff` property. `pickup` and `dropoff` properties correspond to an index in the OptimizationWaypoint array.
   * @param {'geojson'|'polyline'|'polyline6'} [config.geometries="polyline"] - Format of the returned geometries.
   * @param {string} [config.language="en"] - Language of returned turn-by-turn text instructions.
   *   See options listed in [the HTTP service documentation](https://www.mapbox.com/api-documentation/navigation/#instructions-languages).
   * @param {'simplified'|'full'|'false'} [config.overview="simplified"] - Type of returned overview geometry.
   * @param {boolean} [config.roundtrip=true] - Specifies whether the trip should complete by returning to the first location.
   * @param {'any'|'first'} [config.source="any"] - To begin the route, start either from the first coordinate or let the Optimization API choose.
   * @param {boolean} [config.steps=false] - Whether to return steps and turn-by-turn instructions.
   * @return {MapiRequest}
   */
  Optimization.getOptimization = function(config) {
    validator.assertShape({
      profile: validator.oneOf('driving', 'driving-traffic', 'walking', 'cycling'),
      waypoints: validator.required(
        validator.arrayOf(
          validator.shape({
            coordinates: validator.required(validator.coordinates),
            approach: validator.oneOf('unrestricted', 'curb'),
            bearing: validator.arrayOf(validator.range([0, 360])),
            radius: validator.oneOfType(validator.number, validator.equal('unlimited'))
          })
        )
      ),
      annotations: validator.arrayOf(validator.oneOf('duration', 'distance', 'speed')),
      geometries: validator.oneOf('geojson', 'polyline', 'polyline6'),
      language: validator.string,
      overview: validator.oneOf('simplified', 'full', 'false'),
      roundtrip: validator.boolean,
      steps: validator.boolean,
      source: validator.oneOf('any', 'first'),
      destination: validator.oneOf('any', 'last'),
      distributions: validator.arrayOf(
        validator.shape({
          pickup: validator.number,
          dropoff: validator.number
        })
      )
    })(config);

    var path = {
      coordinates: [],
      approach: [],
      bearing: [],
      radius: [],
      distributions: []
    };

    var waypointCount = config.waypoints.length;
    if (waypointCount < 2) {
      throw new Error(
        'waypoints must include at least 2 OptimizationWaypoints'
      );
    }

    /**
     * @typedef {Object} OptimizationWaypoint
     * @property {Coordinates} coordinates
     * @property {'unrestricted'|'curb'} [approach="unrestricted"] - Used to indicate how requested routes consider from which side of the road to approach the waypoint.
     * @property {[number, number]} [bearing] - Used to filter the road segment the waypoint will be placed on by direction and dictates the angle of approach.
     *   This option should always be used in conjunction with a `radius`. The first value is an angle clockwise from true north between 0 and 360,
     *   and the second is the range of degrees the angle can deviate by.
     * @property {number|'unlimited'} [radius] - Maximum distance in meters that the coordinate is allowed to move when snapped to a nearby road segment.
     */
    config.waypoints.forEach(function(waypoint) {
      path.coordinates.push(
        waypoint.coordinates[0] + ',' + waypoint.coordinates[1]
      );

      // join props which come in pairs
      ['bearing'].forEach(function(prop) {
        if (waypoint.hasOwnProperty(prop) && waypoint[prop] != null) {
          waypoint[prop] = waypoint[prop].join(',');
        }
      });

      ['approach', 'bearing', 'radius'].forEach(function(prop) {
        if (waypoint.hasOwnProperty(prop) && waypoint[prop] != null) {
          path[prop].push(waypoint[prop]);
        } else {
          path[prop].push('');
        }
      });
    });

    /**
     * @typedef {Object} Distribution
     * @property {number} pickup - Array index of the item containing coordinates for the pick-up location in the OptimizationWaypoint array.
     * @property {number} dropoff - Array index of the item containing coordinates for the drop-off location in the OptimizationWaypoint array.
     */
    // distributions aren't a property of OptimizationWaypoint, so join them separately
    if (config.distributions) {
      config.distributions.forEach(function(dist) {
        path.distributions.push(dist.pickup + ',' + dist.dropoff);
      });
    }

    ['approach', 'bearing', 'radius', 'distributions'].forEach(function(prop) {
      // avoid sending params which are all `;`
      if (
        path[prop].every(function(char) {
          return char === '';
        })
      ) {
        delete path[prop];
      } else {
        path[prop] = path[prop].join(';');
      }
    });

    var query = stringifyBooleans({
      geometries: config.geometries,
      language: config.language,
      overview: config.overview,
      roundtrip: config.roundtrip,
      steps: config.steps,
      source: config.source,
      destination: config.destination,
      distributions: path.distributions,
      approaches: path.approach,
      bearings: path.bearing,
      radiuses: path.radius
    });

    return this.client.createRequest({
      method: 'GET',
      path: '/optimized-trips/v1/mapbox/:profile/:coordinates',
      params: {
        profile: config.profile || 'driving',
        coordinates: path.coordinates.join(';')
      },
      query: objectClean_1(query)
    });
  };

  var optimization = createServiceFactory_1(Optimization);

  var polyline_1 = createCommonjsModule(function (module) {

  /**
   * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
   *
   * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
   * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
   *
   * @module polyline
   */

  var polyline = {};

  function py2_round(value) {
      // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
      return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
  }

  function encode(current, previous, factor) {
      current = py2_round(current * factor);
      previous = py2_round(previous * factor);
      var coordinate = current - previous;
      coordinate <<= 1;
      if (current - previous < 0) {
          coordinate = ~coordinate;
      }
      var output = '';
      while (coordinate >= 0x20) {
          output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
          coordinate >>= 5;
      }
      output += String.fromCharCode(coordinate + 63);
      return output;
  }

  /**
   * Decodes to a [latitude, longitude] coordinates array.
   *
   * This is adapted from the implementation in Project-OSRM.
   *
   * @param {String} str
   * @param {Number} precision
   * @returns {Array}
   *
   * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
   */
  polyline.decode = function(str, precision) {
      var index = 0,
          lat = 0,
          lng = 0,
          coordinates = [],
          shift = 0,
          result = 0,
          byte = null,
          latitude_change,
          longitude_change,
          factor = Math.pow(10, precision || 5);

      // Coordinates have variable length when encoded, so just keep
      // track of whether we've hit the end of the string. In each
      // loop iteration, a single coordinate is decoded.
      while (index < str.length) {

          // Reset shift, result, and byte
          byte = null;
          shift = 0;
          result = 0;

          do {
              byte = str.charCodeAt(index++) - 63;
              result |= (byte & 0x1f) << shift;
              shift += 5;
          } while (byte >= 0x20);

          latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

          shift = result = 0;

          do {
              byte = str.charCodeAt(index++) - 63;
              result |= (byte & 0x1f) << shift;
              shift += 5;
          } while (byte >= 0x20);

          longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

          lat += latitude_change;
          lng += longitude_change;

          coordinates.push([lat / factor, lng / factor]);
      }

      return coordinates;
  };

  /**
   * Encodes the given [latitude, longitude] coordinates array.
   *
   * @param {Array.<Array.<Number>>} coordinates
   * @param {Number} precision
   * @returns {String}
   */
  polyline.encode = function(coordinates, precision) {
      if (!coordinates.length) { return ''; }

      var factor = Math.pow(10, precision || 5),
          output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

      for (var i = 1; i < coordinates.length; i++) {
          var a = coordinates[i], b = coordinates[i - 1];
          output += encode(a[0], b[0], factor);
          output += encode(a[1], b[1], factor);
      }

      return output;
  };

  function flipped(coords) {
      var flipped = [];
      for (var i = 0; i < coords.length; i++) {
          flipped.push(coords[i].slice().reverse());
      }
      return flipped;
  }

  /**
   * Encodes a GeoJSON LineString feature/geometry.
   *
   * @param {Object} geojson
   * @param {Number} precision
   * @returns {String}
   */
  polyline.fromGeoJSON = function(geojson, precision) {
      if (geojson && geojson.type === 'Feature') {
          geojson = geojson.geometry;
      }
      if (!geojson || geojson.type !== 'LineString') {
          throw new Error('Input must be a GeoJSON LineString');
      }
      return polyline.encode(flipped(geojson.coordinates), precision);
  };

  /**
   * Decodes to a GeoJSON LineString geometry.
   *
   * @param {String} str
   * @param {Number} precision
   * @returns {Object}
   */
  polyline.toGeoJSON = function(str, precision) {
      var coords = polyline.decode(str, precision);
      return {
          type: 'LineString',
          coordinates: flipped(coords)
      };
  };

  if (module.exports) {
      module.exports = polyline;
  }
  });

  /**
   * Static API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#static).
   */
  var Static = {};

  /**
   * Get a static map image.
   *
   * **If you just want the URL for the static map image, create a request
   * and get it's URL with `MapiRequest#url`.** This is what prior versions of the
   * SDK returned.
   *
   * @param {Object} config
   * @param {string} config.ownerId - The owner of the map style.
   * @param {string} config.styleId - The map's style ID.
   * @param {number} config.width - Width of the image in pixels, between 1 and 1280.
   * @param {number} config.height - Height of the image in pixels, between 1 and 1280.
   * @param {'auto'|Object} config.position - If `"auto"`, the viewport will fit the
   *   bounds of the overlay(s). Otherwise, the maps' position is described by an object
   *   with the following properties:
   *   `coordinates` (required): [`coordinates`](#coordinates) for the center of image.
   *   `zoom` (required): Between 0 and 20.
   *   `bearing` (optional): Between 0 and 360.
   *   `pitch` (optional): Between 0 and 60.
   * @param {string} config.padding - A string value that denotes the minimum padding per side of the image. 
   *   This can only be used with auto or bbox. The value resembles the CSS specification for padding and accepts 1-4 integers without units
   *
   * @param {Array<Overlay>} [config.overlays] - Overlays should be in z-index
   *   order: the first in the array will be on the bottom; the last will be on
   *   the top. Overlays are objects that match one of the following types:
   *   [`SimpleMarkerOverlay`](#simplemarkeroverlay),
   *   [`CustomMarkerOverlay`](#custommarkeroverlay),
   *   [`PathOverlay`](#pathoverlay),
   *   [`GeoJsonOverlay`](#geojsonoverlay)
   *
   * @param {boolean} [config.highRes=false]
   * @param {string} [config.before_layer] - The ID of the style layer
   *   that overlays should be inserted *before*.
   * @param {Object} [config.addlayer] - Adds a Mapbox style layer to the map's style at render time. Can be combined with before_layer.
   * @param {Array} [config.setfilter] - Applies a filter to an existing layer in a style using Mapbox's expression syntax. Must be used with layer_id.
   * @param {string} [config.layer_id] - Denotes the layer in the style that the filter specified in setfilter is applied to.
   * @param {boolean} [config.attribution=true] - Whether there is attribution
   *   on the map image.
   * @param {boolean} [config.logo=true] - Whether there is a Mapbox logo
   *   on the map image.
   * @return {MapiRequest}
   *
   * @example
   * staticClient.getStaticImage({
   *   ownerId: 'mapbox',
   *   styleId: 'streets-v11',
   *   width: 200,
   *   height: 300,
   *   position: {
   *     coordinates: [12, 13],
   *     zoom: 4
   *   }
   * })
   *   .send()
   *   .then(response => {
   *     const image = response.body;
   *   });
   *
   * @example
   * staticClient.getStaticImage({
   *   ownerId: 'mapbox',
   *   styleId: 'streets-v11',
   *   width: 200,
   *   height: 300,
   *   position: {
   *     coordinates: [12, 13],
   *     zoom: 3
   *   },
   *   overlays: [
   *     // Simple markers.
   *     {
   *       marker: {
   *         coordinates: [12.2, 12.8]
   *       }
   *     },
   *     {
   *       marker: {
   *         size: 'large',
   *         coordinates: [14, 13.2],
   *         label: 'm',
   *         color: '#000'
   *       }
   *     },
   *     {
   *       marker: {
   *         coordinates: [15, 15.2],
   *         label: 'airport',
   *         color: '#ff0000'
   *       }
   *     },
   *     // Custom marker
   *     {
   *       marker: {
   *         coordinates: [10, 11],
   *         url:  'https://upload.wikimedia.org/wikipedia/commons/6/6f/0xff_timetracker.png'
   *       }
   *     }
   *   ]
   * })
   *   .send()
   *   .then(response => {
   *     const image = response.body;
   *   });
   *
   * @example
   * // To get the URL instead of the image, create a request
   * // and get its URL without sending it.
   * const request = staticClient
   *   .getStaticImage({
   *     ownerId: 'mapbox',
   *     styleId: 'streets-v11',
   *     width: 200,
   *     height: 300,
   *     position: {
   *       coordinates: [12, 13],
   *       zoom: 4
   *     }
   *   });
   * const staticImageUrl = request.url();
   * // Now you can open staticImageUrl in a browser.
   *  * @example
   * // Filter all buildings that have a height value that is less than 300 meters
   * const request = staticClient
   *   .getStaticImage({
   *     ownerId: 'mapbox',
   *     styleId: 'streets-v11',
   *     width: 200,
   *     height: 300,
   *     position: {
   *       coordinates: [12, 13],
   *       zoom: 4
   *     },
   *     setfilter: [">","height",300],
   *     layer_id: 'building',
   *   });
   * const staticImageUrl = request.url();
   * // Now you can open staticImageUrl in a browser.
   *
   * @example
   * // Paint all the state and province level boundaries associated with the US worldview with a dashed line and insert it below the road-label layer
   * const request = staticClient
   *   .getStaticImage({
   *     ownerId: 'mapbox',
   *     styleId: 'streets-v11',
   *     width: 200,
   *     height: 300,
   *     position: {
   *       coordinates: [12, 13],
   *       zoom: 4
   *     },
   *     addlayer: {"id":"better-boundary","type":"line","source":"composite","source-layer":"admin","filter":["all",["==",["get","admin_level"],1],["==",["get","maritime"],"false"],["match",["get","worldview"],["all","US"],true,false]],"layout":{"line-join":"bevel"},"paint":{"line-color":"%236898B3","line-width":1.5,"line-dasharray":[1.5,1]}},
   *    before_layer: 'road-label',
   *   });
   * const staticImageUrl = request.url();
   * // Now you can open staticImageUrl in a browser.
   */
  Static.getStaticImage = function(config) {
    validator.assertShape({
      ownerId: validator.required(validator.string),
      styleId: validator.required(validator.string),
      width: validator.required(validator.range([1, 1280])),
      height: validator.required(validator.range([1, 1280])),
      position: validator.required(
        validator.oneOfType(
          validator.oneOf('auto'),
          validator.strictShape({
            coordinates: validator.required(validator.coordinates),
            zoom: validator.required(validator.range([0, 20])),
            bearing: validator.range([0, 360]),
            pitch: validator.range([0, 60])
          })
        )
      ),
      padding: validator.string,
      overlays: validator.arrayOf(validator.plainObject),
      highRes: validator.boolean,
      before_layer: v.string,
      addlayer: v.plainObject,
      setfilter: v.plainArray,
      layer_id: v.string,
      attribution: validator.boolean,
      logo: validator.boolean
    })(config);

    var encodedOverlay = (config.overlays || [])
      .map(function(overlayItem) {
        if (overlayItem.marker) {
          return encodeMarkerOverlay(overlayItem.marker);
        }
        if (overlayItem.path) {
          return encodePathOverlay(overlayItem.path);
        }
        return encodeGeoJsonOverlay(overlayItem.geoJson);
      })
      .join(',');

    var encodedPosition = encodePosition(config.position);
    var encodedDimensions = config.width + 'x' + config.height;
    if (config.highRes) {
      encodedDimensions += '@2x';
    }

    var preEncodedUrlParts = [encodedOverlay, encodedPosition, encodedDimensions]
      .filter(Boolean)
      .join('/');

    var query = {};
    if (config.attribution !== undefined) {
      query.attribution = String(config.attribution);
    }
    if (config.logo !== undefined) {
      query.logo = String(config.logo);
    }
    if (config.insertOverlayBeforeLayer !== undefined) {
      query.before_layer = config.insertOverlayBeforeLayer;
    }
    if (config.before_layer !== undefined) {
      query.before_layer = config.before_layer;
    }
    if (config.addlayer !== undefined) {
      query.addlayer = JSON.stringify(config.addlayer); // stringify to retain object shape
    }
    if (config.setfilter !== undefined) {
      query.setfilter = JSON.stringify(config.setfilter); // stringify to retain array shape
    }
    if (config.layer_id !== undefined) {
      query.layer_id = config.layer_id;
    }
    if (config.padding !== undefined) {
      query.padding = config.padding;
    }
  
    if (config.setfilter !== undefined && config.layer_id === undefined) {
      throw new Error('Must include layer_id in setfilter request');
    }
  
    if (
      (config.setfilter !== undefined || config.addlayer !== undefined) &&
      config.position === 'auto' &&
      config.overlays === undefined
    ) {
      throw new Error(
        'Auto extent cannot be used with style parameters and no overlay'
      );
    }
  
    if (config.addlayer !== undefined && config.setfilter !== undefined) {
      throw new Error(
        'addlayer and setfilter cannot be used in the same request'
      );
    }
  
    if (
      config.padding !== undefined &&
      config.position !== 'auto' &&
      config.position.bbox === undefined
    ) {
      throw new Error(
        'Padding can only be used with auto or bbox as the position.'
      );
    }
  
    if (config.position.bbox !== undefined && config.position.bbox.length !== 4) {
      throw new Error('bbox must be four coordinates');
    }

    return this.client.createRequest({
      method: 'GET',
      path: '/styles/v1/:ownerId/:styleId/static/' + preEncodedUrlParts,
      params: pick_1(config, ['ownerId', 'styleId']),
      query: query,
      encoding: 'binary',
    });
  };

  function encodePosition(position) {
    if (position === 'auto') return 'auto';
    if (position.bbox) return JSON.stringify(position.bbox);

    return position.coordinates
      .concat([
        position.zoom,
        position.pitch && !position.bearing ? 0 : position.bearing, // if pitch is set, but bearing is not, bearing must be 0
        position.pitch === 0 ? undefined : position.pitch
      ])
      .filter(function(el) {
        return el === 0 || el; // filter out undefined and allow 0 values
      })
      .join(',');
  }

  function encodeMarkerOverlay(o) {
    if (o.url) {
      return encodeCustomMarkerOverlay(o);
    }
    return encodeSimpleMarkerOverlay(o);
  }

  /**
   * A simple marker overlay.
   * @typedef {Object} SimpleMarkerOverlay
   * @property {Object} marker
   * @property {[number, number]} marker.coordinates - `[longitude, latitude]`
   * @property {'large'|'small'} [marker.size='small']
   * @property {string} [marker.label] - Marker symbol. Options are an alphanumeric label `a`
   *   through `z`, `0` through `99`, or a valid [Maki](https://www.mapbox.com/maki/)
   *   icon. If a letter is requested, it will be rendered in uppercase only.
   * @property {string} [marker.color] - A 3- or 6-digit hexadecimal color code.
   */

  function encodeSimpleMarkerOverlay(o) {
    validator.assertShape({
      coordinates: validator.required(validator.coordinates),
      size: validator.oneOf('large', 'small'),
      label: validator.string,
      color: validator.string
    })(o);

    var result = o.size === 'large' ? 'pin-l' : 'pin-s';
    if (o.label) {
      result += '-' + String(o.label).toLowerCase();
    }
    if (o.color) {
      result += '+' + sanitizeHexColor(o.color);
    }
    result += '(' + o.coordinates.join(',') + ')';
    return result;
  }

  /**
   * A marker overlay with a custom image.
   * @typedef {Object} CustomMarkerOverlay
   * @property {Object} marker
   * @property {[number, number]} marker.coordinates - `[longitude, latitude]`
   * @property {string} marker.url
   */

  function encodeCustomMarkerOverlay(o) {
    validator.assertShape({
      coordinates: validator.required(validator.coordinates),
      url: validator.required(validator.string)
    })(o);

    var result = 'url-' + encodeURIComponent(o.url);
    result += '(' + o.coordinates.join(',') + ')';
    return result;
  }

  /**
   * A stylable line.
   * @typedef {Object} PathOverlay
   * @property {Object} path
   * @property {Array<Coordinates>} path.coordinates - An array of coordinates
   *   describing the path.
   * @property {number} [path.strokeWidth]
   * @property {string} [path.strokeColor]
   * @property {number} [path.strokeOpacity] - Must be paired with strokeColor.
   * @property {string} [path.fillColor] - Must be paired with strokeColor.
   * @property {number} [path.fillOpacity] - Must be paired with fillColor.
   */

  function encodePathOverlay(o) {
    validator.assertShape({
      coordinates: validator.required(validator.arrayOf(validator.coordinates)),
      strokeWidth: validator.number,
      strokeColor: validator.string,
      strokeOpacity: validator.number,
      fillColor: validator.string,
      fillOpacity: validator.number
    })(o);

    if (o.strokeOpacity !== undefined && o.strokeColor === undefined) {
      throw new Error('strokeOpacity requires strokeColor');
    }
    if (o.fillColor !== undefined && o.strokeColor === undefined) {
      throw new Error('fillColor requires strokeColor');
    }
    if (o.fillOpacity !== undefined && o.fillColor === undefined) {
      throw new Error('fillOpacity requires fillColor');
    }

    var result = 'path';
    if (o.strokeWidth) {
      result += '-' + o.strokeWidth;
    }
    if (o.strokeColor) {
      result += '+' + sanitizeHexColor(o.strokeColor);
    }
    if (o.strokeOpacity) {
      result += '-' + o.strokeOpacity;
    }
    if (o.fillColor) {
      result += '+' + sanitizeHexColor(o.fillColor);
    }
    if (o.fillOpacity) {
      result += '-' + o.fillOpacity;
    }
    // polyline expects each coordinate to be in reversed order: [lat, lng]
    var reversedCoordinates = o.coordinates.map(function(c) {
      return c.reverse();
    });
    var encodedPolyline = polyline_1.encode(reversedCoordinates);
    result += '(' + encodeURIComponent(encodedPolyline) + ')';
    return result;
  }

  /**
   * GeoJSON to overlay the map.
   * @typedef {Object} GeoJsonOverlay
   * @property {Object} geoJson - Valid GeoJSON.
   */

  function encodeGeoJsonOverlay(o) {
    validator.assert(validator.required(validator.plainObject))(o);

    return 'geojson(' + encodeURIComponent(JSON.stringify(o)) + ')';
  }

  function sanitizeHexColor(color) {
    return color.replace(/^#/, '');
  }

  var _static = createServiceFactory_1(Static);

  /**
   * Styles API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#styles).
   */
  var Styles = {};

  /**
   * Get a style.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-a-style).
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {string} [config.ownerId]
   * @param {boolean} [config.metadata=false] - If true, `mapbox:` specific metadata will be preserved
   * @param {boolean} [config.draft=false] - If `true` will retrieve the draft style, otherwise will retrieve the published style.
   * @param {boolean} [config.fresh=false] - If `true`, will bypass the cached version of the style. Fresh style requests have a lower rate limit than cached requests and may have a higher latency. `fresh=true` should never be used in production or high concurrency environments.
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.getStyle({
   *   styleId: 'style-id'
   * })
   *   .send()
   *   .then(response => {
   *     const style = response.body;
   *   });
   */
  Styles.getStyle = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      ownerId: validator.string,
      metadata: validator.boolean,
      draft: validator.boolean,
      fresh: validator.boolean
    })(config);

    var query = {};
    if (config.metadata) {
      query.metadata = config.metadata;
    }
    if (config.fresh) {
      query.fresh = 'true';
    }

    return this.client.createRequest({
      method: 'GET',
      path: '/styles/v1/:ownerId/:styleId',
      params: config,
      query: query
    });
  };

  /**
   * Create a style.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#create-a-style).
   *
   * @param {Object} config
   * @param {Object} config.style - Stylesheet JSON object.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.createStyle({
   *   style: {
   *     version: 8,
   *     name: "My Awesome Style",
   *     metadata: {},
   *     sources: {},
   *     layers: [],
   *     glyphs: "mapbox://fonts/{owner}/{fontstack}/{range}.pbf"
   *   }
   * })
   *   .send()
   *   .then(response => {
   *     const style = response.body;
   *   });
   */
  Styles.createStyle = function(config) {
    validator.assertShape({
      style: validator.plainObject,
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/styles/v1/:ownerId',
      params: pick_1(config, ['ownerId']),
      body: config.style
    });
  };

  /**
   * Update a style.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#update-a-style).
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {Object} config.style - Stylesheet JSON object.
   * @param {string | number | Date} [config.lastKnownModification] - Datetime of last
   *   known update. Passed as 'If-Unmodified-Since' HTTP header.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.updateStyle({
   *   styleId: 'style-id',
   *   style: {
   *     version: 8,
   *     name: 'My Awesome Style',
   *     metadata: {},
   *     sources: {},
   *     layers: [],
   *     glyphs: 'mapbox://fonts/{owner}/{fontstack}/{range}.pbf'
   *   }
   * })
   *   .send()
   *   .then(response => {
   *     const style = response.body;
   *   });
   */
  Styles.updateStyle = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      style: validator.required(validator.plainObject),
      lastKnownModification: validator.date,
      ownerId: validator.string
    })(config);

    var headers = {};
    if (config.lastKnownModification) {
      headers['If-Unmodified-Since'] = new Date(
        config.lastKnownModification
      ).toUTCString();
    }
    return this.client.createRequest({
      method: 'PATCH',
      path: '/styles/v1/:ownerId/:styleId',
      params: pick_1(config, ['styleId', 'ownerId']),
      headers: headers,
      body: config.style
    });
  };

  /**
   * Delete a style.
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.deleteStyle({
   *   styleId: 'style-id'
   * })
   *   .send()
   *   .then(response => {
   *     // delete successful
   *   });
   */
  Styles.deleteStyle = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/styles/v1/:ownerId/:styleId',
      params: config
    });
  };

  /**
   * List styles in your account.
   *
   * @param {Object} [config]
   * @param {string} [config.start] - The style ID to start at, for paginated results.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.listStyles()
   *   .send()
   *   .then(response => {
   *     const styles = response.body;
   *   });
   */
  Styles.listStyles = function(config) {
    config = config || {};
    validator.assertShape({
      start: validator.string,
      ownerId: validator.string,
      fresh: validator.boolean
    })(config);

    var query = {};
    if (config.start) {
      query.start = config.start;
    }
    if (config.fresh) {
      query.fresh = 'true';
    }
    return this.client.createRequest({
      method: 'GET',
      path: '/styles/v1/:ownerId',
      params: pick_1(config, ['ownerId']),
      query: query
    });
  };

  /**
   * Add an icon to a style, or update an existing one.
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {string} config.iconId
   * @param {UploadableFile} config.file - An SVG file.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.putStyleIcon({
   *   styleId: 'foo',
   *   iconId: 'bar',
   *   // The string filename value works in Node.
   *   // In the browser, provide a Blob.
   *   file: 'path/to/file.svg'
   * })
   *   .send()
   *   .then(response => {
   *     const newSprite = response.body;
   *   });
   */
  Styles.putStyleIcon = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      iconId: validator.required(validator.string),
      file: validator.file,
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'PUT',
      path: '/styles/v1/:ownerId/:styleId/sprite/:iconId',
      params: pick_1(config, ['ownerId', 'styleId', 'iconId']),
      file: config.file
    });
  };

  /**
   * Remove an icon from a style.
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {string} config.iconId
   * @param {string} [config.ownerId]
   * @param {boolean} [config.draft=false] - If `true` will remove the icon from the draft style, otherwise will remove the icon from the published style.
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.deleteStyleIcon({
   *   styleId: 'foo',
   *   iconId: 'bar'
   * })
   *   .send()
   *   .then(response => {
   *     // delete successful
   *   });
   */
  Styles.deleteStyleIcon = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      iconId: validator.required(validator.string),
      ownerId: validator.string,
      draft: v.boolean
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path:
        '/styles/v1/:ownerId/:styleId' +
        (config.draft ? '/draft' : '') +
        '/sprite/:iconId',
      params: config
    });
  };

  /**
   * Get a style sprite's image or JSON document.
   *
   * See [the corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-a-sprite-image-or-json).
   *
   * @param {Object} config
   * @param {string} config.styleId
   * @param {'json' | 'png'} [config.format="json"]
   * @param {boolean} [config.highRes] - If true, returns spritesheet with 2x
   *   resolution.
   * @param {string} [config.ownerId]
   * @param {boolean} [config.draft=false] - If `true` will retrieve the draft style sprite, otherwise will retrieve the published style sprite.
   * @param {boolean} [config.fresh=false] - If `true`, will bypass the cached resource. Fresh requests have a lower rate limit than cached requests and may have a higher latency. `fresh=true` should never be used in high concurrency environments.
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.getStyleSprite({
   *   format: 'json',
   *   styleId: 'foo',
   *   highRes: true
   * })
   *   .send()
   *   .then(response => {
   *     const sprite = response.body;
   *   });
   * 
   * @example
   * stylesClient.getStyleSprite({
   *   format: 'png',
   *   styleId: 'foo',
   *   highRes: true
   * })
   *   .send()
   *   .then(response => {
   *     const sprite = response.body;
   *     fs.writeFileSync('sprite.png', sprite, 'binary');
   *   });
   */
  Styles.getStyleSprite = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      format: validator.oneOf('json', 'png'),
      highRes: validator.boolean,
      ownerId: validator.string,
      draft: validator.boolean,
      fresh: validator.boolean
    })(config);

    var format = config.format || 'json';
    var fileName = 'sprite' + (config.highRes ? '@2x' : '') + '.' + format;

    var query = {};
    if (config.fresh) {
      query.fresh = 'true';
    }  

    return this.client.createRequest(
      immutable(
        {
          method: 'GET',
          path:
            '/styles/v1/:ownerId/:styleId' +
            (config.draft ? '/draft' : '') +
            fileName,
          params: pick(config, ['ownerId', 'styleId']),
          query: query
        },
        format === 'png' ? { encoding: 'binary' } : {}
      )
    );
  };

  /**
   * Get a font glyph range.
   *
   * See [the corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-font-glyph-ranges).
   *
   * @param {Object} config
   * @param {string|Array<string>} config.fonts - An array of font names.
   * @param {number} config.start - Character code of the starting glyph.
   * @param {number} config.end - Character code of the last glyph,
   *   typically equivalent to`config.start + 255`.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * stylesClient.getFontGlyphRange({
   *   fonts: 'Arial Unicode',
   *   start: 0,
   *   end: 255
   * })
   *   .send()
   *   .then(response => {
   *     const glyph = response.body;
   *   });
   */
  Styles.getFontGlyphRange = function(config) {
    validator.assertShape({
      fonts: validator.required(validator.oneOfType(validator.string, validator.arrayOf(validator.string))),
      start: validator.required(validator.number),
      end: validator.required(validator.number),
      ownerId: validator.string
    })(config);

    var fileName = config.start + '-' + config.end + '.pbf';

    return this.client.createRequest({
      method: 'GET',
      path: '/fonts/v1/:ownerId/:fontList/:fileName',
      params: immutable(pick_1(config, ['ownerId']), {
        fontList: [].concat(config.fonts),
        fileName: fileName
      }),
      encoding: 'binary'
    });
  };

  /**
   * Get embeddable HTML displaying a map.
   *
   * See [the corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#request-embeddable-html).
   *
   * @param {Object} config
   * @param {string} styleId
   * @param {boolean} [scrollZoom=true] - If `false`, zooming the map by scrolling will
   *   be disabled.
   * @param {boolean} [title=false] - If `true`, the map's title and owner is displayed
   *   in the upper right corner of the map.
   * @param {boolean} [config.fallback=false] - If `true`, serve a fallback raster map.
   * @param {string} [config.mapboxGLVersion] - Specify a version of [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) to use to render the map.
   * @param {string} [config.mapboxGLGeocoderVersion] - Specify a version of the [Mapbox GL geocoder plugin](https://github.com/mapbox/mapbox-gl-geocoder) to use to render the map search box.
   * @param {string} [config.ownerId]
   * @param {boolean} [config.draft=false] - If `true` will retrieve the draft style, otherwise will retrieve the published style.   */
  Styles.getEmbeddableHtml = function(config) {
    validator.assertShape({
      styleId: validator.required(validator.string),
      scrollZoom: validator.boolean,
      title: validator.boolean,
      fallback: validator.boolean,
      mapboxGLVersion: validator.string,
      mapboxGLGeocoderVersion: validator.string,
      ownerId: validator.string,
      draft: validator.boolean
    })(config);

    var fileName = config.styleId + (config.draft ? '/draft' : '') + '.html';
    var query = {};
    if (config.scrollZoom !== undefined) {
      query.zoomwheel = String(config.scrollZoom);
    }
    if (config.title !== undefined) {
      query.title = String(config.title);
    }
    if (config.fallback !== undefined) {
      query.fallback = String(config.fallback);
    }
    if (config.mapboxGLVersion !== undefined) {
      query.mapboxGLVersion = String(config.mapboxGLVersion);
    }
    if (config.mapboxGLGeocoderVersion !== undefined) {
      query.mapboxGLGeocoderVersion = String(config.mapboxGLGeocoderVersion);
    }
  

    return this.client.createRequest({
      method: 'GET',
      path: '/styles/v1/:ownerId/' + fileName,
      params: pick_1(config, ['ownerId']),
      query: query
    });
  };

  var styles = createServiceFactory_1(Styles);

  /**
   * Tilequery API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#tilequery).
   */
  var Tilequery = {};

  /**
   * List features within a radius of a point on a map (or several maps).
   *
   * @param {Object} config
   * @param {Array<string>} config.mapIds - The maps being queried.
   *   If you need to composite multiple layers, provide multiple map IDs.
   * @param {Coordinates} config.coordinates - The longitude and latitude to be queried.
   * @param {number} [config.radius=0] - The approximate distance in meters to query for features.
   * @param {number} [config.limit=5] - The number of features to return, between 1 and 50.
   * @param {boolean} [config.dedupe=true] - Whether or not to deduplicate results.
   * @param {'polygon'|'linestring'|'point'} [config.geometry] - Queries for a specific geometry type.
   * @param {Array<string>} [config.layers] - IDs of vector layers to query.
   * @return {MapiRequest}
   *
   * @example
   * tilequeryClient.listFeatures({
   *   mapIds: ['mapbox.mapbox-streets-v8'],
   *   coordinates: [-122.42901, 37.80633],
   *   radius: 10
   * })
   *   .send()
   *   .then(response => {
   *     const features = response.body;
   *   });
   */
  Tilequery.listFeatures = function(config) {
    validator.assertShape({
      mapIds: validator.required(validator.arrayOf(validator.string)),
      coordinates: validator.required(validator.coordinates),
      radius: validator.number,
      limit: validator.range([1, 50]),
      dedupe: validator.boolean,
      geometry: validator.oneOf('polygon', 'linestring', 'point'),
      layers: validator.arrayOf(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/v4/:mapIds/tilequery/:coordinates.json',
      params: {
        mapIds: config.mapIds,
        coordinates: config.coordinates
      },
      query: pick_1(config, ['radius', 'limit', 'dedupe', 'layers', 'geometry'])
    });
  };

  var tilequery = createServiceFactory_1(Tilequery);

  /**
   * Tilesets API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#tilesets).
   */
  var Tilesets = {};

  /**
   * List a user's tilesets.
   *
   * @param {Object} [config]
   * @param {string} [config.ownerId]
   * @param {'raster'|'vector'} [config.type] - Filter results by tileset type, either `raster` or `vector`.
   * @param {number} [config.limit=100] - The maximum number of tilesets to return, from 1 to 500.
   * @param {'created'|'modified'} [config.sortBy] - Sort the listings by their `created` or `modified` timestamps.
   * @param {string} [config.start] - The tileset after which to start the listing.
   * @param {'public'|'private'} [config.visibility] - Filter results by visibility, either `public` or `private`

   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.listTilesets()
   *   .then(response => {
   *     const tilesets = response.body;
   *   });
   *
   * @example
   * tilesetsClient.listTilesets()
   *   .eachPage((error, response, next) => {
   *     // Handle error or response and call next.
   *   });
   */
  Tilesets.listTilesets = function(config) {
    validator.assertShape({
      ownerId: validator.string,
      limit: validator.range([1, 500]),
      sortBy: validator.oneOf('created', 'modified'),
      start: validator.string,
      type: validator.oneOf('raster', 'vector'),
      visibility: validator.oneOf('public', 'private')
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/:ownerId',
      params: config ? pick_1(config, ['ownerId']) : {},
      query: config
      ? pick_1(config, ['limit', 'sortBy', 'start', 'type', 'visibility'])
      : {}
    });
  };

  /**
   * Delete a tileset
   * 
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset to be deleted in the form `username.tileset_id`.
   * @return {MapiRequest}
   * 
   * @example
   * tilesetsClient.deleteTileset({
   *     tilesetId: 'username.tileset_id'
   *   })
   * .send()
   * .then(response => {
   *   const deleted = response.statusCode === 204;
   * });
   */
  Tilesets.deleteTileset = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/tilesets/v1/:tilesetId',
      params: pick_1(config, ['tilesetId'])
    });
  };


  /**
   * Retrieve metadata about a tileset.
   * 
   * @param {Object} [config]
   * @param {string} [config.tilesetId] - Unique identifier for the tileset in the format `username.id`.
   * 
   * @return {MapiRequest}
   */
  Tilesets.tileJSONMetadata = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/v4/:tilesetId.json',
      params: pick_1(config, ['tilesetId'])
    });
  };


  /**
   * Create a tileset source
   * 
   * @param {Object} config
   * @param {string} config.id ID of the tileset source to be created.
   * @param {UploadableFile} config.file Line-delimeted GeoJSON file.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   * 
   * @example
   * tilesetsClient.createTilesetSource({
   *      id: 'tileset_source_id',
   *      // The string filename value works in Node.
   *      // In the browser, provide a Blob.
   *      file: 'path/to/file.geojson.ld'
   *   })
   *   .send()
   *   .then(response => {
   *     const tilesetSource = response.body;
   *   });
   */
  Tilesets.createTilesetSource = function(config) {
    validator.assertShape({
      id: validator.required(validator.string),
      file: validator.required(validator.file),
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/tilesets/v1/sources/:ownerId/:id',
      params: pick_1(config, ['ownerId', 'id']),
      file: config.file,
      sendFileAs: 'form'
    });
  };

  /**
   * Retrieve a tileset source information
   *
   * @param {Object} config
   * @param {string} config.id ID of the tileset source.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.getTilesetSource({
   *      id: 'tileset_source_id'
   *   })
   *   .send()
   *   .then(response => {
   *     const tilesetSource = response.body;
   *   });
   */
  Tilesets.getTilesetSource = function(config) {
    validator.assertShape({
      id: validator.required(validator.string),
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/sources/:ownerId/:id',
      params: pick_1(config, ['ownerId', 'id'])
    });
  };

  /**
   * List tileset sources
   *
   * @param {Object} [config]
   * @param {string} [config.ownerId]
   * @param {number} [config.limit=100] - The maximum number of tilesets to return, from 1 to 500.
   * @param {string} [config.start] - The tileset after which to start the listing.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.listTilesetSources()
   *   .send()
   *   .then(response => {
   *     const tilesetSources = response.body;
   *   });
   */
  Tilesets.listTilesetSources = function(config) {
    validator.assertShape({
      ownerId: validator.string,
      limit: validator.range([1, 500]),
      start: validator.string
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/sources/:ownerId',
      params: config ? pick_1(config, ['ownerId']) : {},
      query: config ? pick_1(config, ['limit', 'start']) : {}
    });
  };


  /**
   * Delete a tileset source
   *
   * @param {Object} config
   * @param {string} config.id ID of the tileset source to be deleted.
   * @param {string} [config.ownerId]
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.deleteTilesetSource({
   *     id: 'tileset_source_id'
   *   })
   *   .send()
   *   .then(response => {
   *     const deleted = response.statusCode === 201;
   *   });
   */
  Tilesets.deleteTilesetSource = function(config) {
    validator.assertShape({
      id: validator.required(validator.string),
      ownerId: validator.string
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/tilesets/v1/sources/:ownerId/:id',
      params: pick_1(config, ['ownerId', 'id'])
    });
  };

  /**
   * Create a tileset
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset to be created in the form `username.tileset_name`.
   * @param {Object} config.recipe The [tileset recipe](https://docs.mapbox.com/help/troubleshooting/tileset-recipe-reference/) to use in JSON format.
   * @param {string} config.name Name of the tileset.
   * @param {boolean} [config.private=true] A private tileset must be used with an access token from your account.
   * @param {string} [config.description] Description of the tileset.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.createTileset({
   *     tilesetId: 'username.tileset_id',
   *     recipe: {
   *       version: 1,
   *       layers: {
   *         my_new_layer: {
   *           source: "mapbox://tileset-source/{username}/{id}",
   *           minzoom: 0,
   *           maxzoom: 8
   *         }
   *       }
   *     },
   *     name: 'My Tileset'
   *   })
   *   .send()
   *   .then(response => {
   *     const message = response.body.message;
   *   });
   */
  Tilesets.createTileset = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string),
      recipe: validator.required(validator.plainObject),
      name: validator.required(validator.string),
      private: validator.boolean,
      description: validator.string
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/tilesets/v1/:tilesetId',
      params: pick_1(config, ['tilesetId']),
      body: pick_1(config, ['recipe', 'name', 'private', 'description'])
    });
  };

  /**
   * Publish a tileset
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset to publish in the form `username.tileset_name`.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.publishTileset({
   *     tilesetId: 'username.tileset_id'
   *   })
   *   .send()
   *   .then(response => {
   *     const tilesetPublishJob = response.body;
   *   });
   */
  Tilesets.publishTileset = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/tilesets/v1/:tilesetId/publish',
      params: pick_1(config, ['tilesetId'])
    });
  };

  /**
   * Update a tileset
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @param {string} [config.name]
   * @param {string} [config.description]
   * @param {boolean} [config.private]
   * @param {Array} [config.attribution]
   * @param {string} [config.attribution[].text]
   * @param {string} [config.attribution[].link]
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.updateTileset({
   *     tilesetId: 'username.tileset_name',
   *     name: 'Tileset Name',
   *     private: true,
   *     attribution: [
   *      {
   *        text: 'Source Name',
   *        link: 'https://example.com'
   *      }
   *     ]
   *   })
   *   .send()
   *   .then(response => {
   *     const updated = response.statusCode === 204;
   *   });
   */
  Tilesets.updateTileset = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string),
      name: validator.string,
      description: validator.string,
      private: validator.boolean,
      attribution: validator.arrayOf(
        validator.strictShape({
          text: validator.required(validator.string),
          link: validator.required(validator.string)
        })
      )
    })(config);

    return this.client.createRequest({
      method: 'PATCH',
      path: '/tilesets/v1/:tilesetId',
      params: pick_1(config, ['tilesetId']),
      body: config
        ? pick_1(config, ['name', 'description', 'private', 'attribution'])
        : {}
    });
  };
  
  /**
   * Retrieve the status of a tileset
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.tilesetStatus({
   *     tilesetId: 'username.tileset_name'
   *   })
   *   .send()
   *   .then(response => {
   *     const tilesetStatus = response.body;
   *   });
   */
  Tilesets.tilesetStatus = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/:tilesetId/status',
      params: pick_1(config, ['tilesetId'])
    });
  };
  
  /**
   * Retrieve information about a single tileset job
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @param {string} config.jobId The publish job's ID.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.tilesetJob({
   *     tilesetId: 'username.tileset_name'
   *     jobId: 'job_id'
   *   })
   *   .send()
   *   .then(response => {
   *     const tilesetJob = response.body;
   *   });
   */
  Tilesets.tilesetJob = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string),
      jobId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/:tilesetId/jobs/:jobId',
      params: pick_1(config, ['tilesetId', 'jobId'])
    });
  };
  
  /**
   * List information about all jobs for a tileset
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @param {'processing'|'queued'|'success'|'failed'} [config.stage]
   * @param {number} [config.limit=100] - The maximum number of tilesets to return, from 1 to 500.
   * @param {string} [config.start] - The tileset after which to start the listing.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.listTilesetJobs({
   *     tilesetId: 'username.tileset_name'
   *   })
   *   .send()
   *   .then(response => {
   *     const jobs = response.body;
   *   });
   */
  Tilesets.listTilesetJobs = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string),
      stage: validator.oneOf('processing', 'queued', 'success', 'failed'),
      limit: validator.range([1, 500]),
      start: validator.string
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/:tilesetId/jobs',
      params: pick_1(config, ['tilesetId']),
      query: pick_1(config, ['stage', 'limit', 'start'])
    });
  };
  
  /**
   * View Tilesets API global queue
   *
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.getTilesetsQueue()
   *   .send()
   *   .then(response => {
   *     const queue = response.body;
   *   });
   */
  Tilesets.getTilesetsQueue = function() {
    return this.client.createRequest({
      method: 'PUT',
      path: '/tilesets/v1/queue'
    });
  };

  /**
   * Validate a recipe
   *
   * @param {Object} config
   * @param {Object} config.recipe The [tileset recipe](https://docs.mapbox.com/help/troubleshooting/tileset-recipe-reference/) to validate in JSON format.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.validateRecipe({
   *     recipe: {
   *       version: 1,
   *       layers: {
   *         my_new_layer: {
   *           source: "mapbox://tileset-source/{username}/{id}",
   *           minzoom: 0,
   *           maxzoom: 8
   *         }
   *       }
   *     }
   *   })
   *   .send()
   *   .then(response => {
   *     const validation = response.body;
   *   });
   */
  Tilesets.validateRecipe = function(config) {
    v.assertShape({
      recipe: v.required(v.plainObject)
    })(config);

    return this.client.createRequest({
      method: 'PUT',
      path: '/tilesets/v1/validateRecipe',
      body: config.recipe
    });
  };

  /**
   * Retrieve a recipe
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.getRecipe({
   *     tilesetId: 'username.tileset_name'
   *   })
   *   .send()
   *   .then(response => {
   *     const recipe = response.body;
   *   });
   */
  Tilesets.getRecipe = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/tilesets/v1/:tilesetId/recipe',
      params: pick_1(config, ['tilesetId'])
    });
  };

  /**
   * Update a tileset recipe
   *
   * @param {Object} config
   * @param {string} config.tilesetId ID of the tileset in the form `username.tileset_name`.
   * @param {Object} config.recipe The [tileset recipe](https://docs.mapbox.com/help/troubleshooting/tileset-recipe-reference/) in JSON format.
   * @return {MapiRequest}
   *
   * @example
   * tilesetsClient.updateRecipe({
   *     tilesetId: 'username.tileset_name',
   *     recipe: {
   *       version: 1,
   *       layers: {
   *         my_new_layer: {
   *           source: "mapbox://tileset-source/{username}/{id}",
   *           minzoom: 0,
   *           maxzoom: 8
   *         }
   *       }
   *     }
   *   })
   *   .send()
   *   .then(response => {
   *     const updated = response.statusCode === 204;
   *   });
   */
  Tilesets.updateRecipe = function(config) {
    validator.assertShape({
      tilesetId: validator.required(validator.string),
      recipe: validator.required(validator.plainObject)
    })(config);

    return this.client.createRequest({
      method: 'PATCH',
      path: '/tilesets/v1/:tilesetId/recipe',
      params: pick_1(config, ['tilesetId']),
      body: config.recipe
    });
  };

  var tilesets = createServiceFactory_1(Tilesets);

  /**
   * Tokens API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#tokens).
   */
  var Tokens = {};

  /**
   * List your access tokens.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#list-tokens).
   *
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.listTokens()
   *   .send()
   *   .then(response => {
   *     const tokens = response.body;
   *   });
   */
  Tokens.listTokens = function() {
    return this.client.createRequest({
      method: 'GET',
      path: '/tokens/v2/:ownerId'
    });
  };

  /**
   * Create a new access token.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#create-a-token).
   *
   * @param {Object} [config]
   * @param {string} [config.note]
   * @param {Array<string>} [config.scopes]
   * @param {Array<string>} [config.resources]
   * @param {Array<string>} [config.allowedUrls]
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.createToken({
   *   note: 'datasets-token',
   *   scopes: ['datasets:write', 'datasets:read']
   * })
   *   .send()
   *   .then(response => {
   *     const token = response.body;
   *   });
   */
  Tokens.createToken = function(config) {
    config = config || {};
    validator.assertShape({
      note: validator.string,
      scopes: validator.arrayOf(validator.string),
      resources: validator.arrayOf(validator.string),
      allowedUrls: validator.arrayOf(validator.string)
    })(config);

    var body = {};
    body.scopes = config.scopes || [];
    if (config.note !== undefined) {
      body.note = config.note;
    }
    if (config.resources) {
      body.resources = config.resources;
    }
    if (config.allowedUrls) {
      body.allowedUrls = config.allowedUrls;
    }

    return this.client.createRequest({
      method: 'POST',
      path: '/tokens/v2/:ownerId',
      params: pick_1(config, ['ownerId']),
      body: body
    });
  };

  /**
   * Create a new temporary access token.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#create-a-temporary-token).
   *
   * @param {Object} config
   * @param {string} config.expires
   * @param {Array<string>} config.scopes
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.createTemporaryToken({
   *   scopes: ['datasets:write', 'datasets:read']
   * })
   *   .send()
   *   .then(response => {
   *     const token = response.body;
   *   });
   */
  Tokens.createTemporaryToken = function(config) {
    validator.assertShape({
      expires: validator.required(validator.date),
      scopes: validator.required(validator.arrayOf(validator.string))
    })(config);

    return this.client.createRequest({
      method: 'POST',
      path: '/tokens/v2/:ownerId',
      params: pick_1(config, ['ownerId']),
      body: {
        expires: new Date(config.expires).toISOString(),
        scopes: config.scopes
      }
    });
  };

  /**
   * Update an access token.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#update-a-token).
   *
   * @param {Object} config
   * @param {string} config.tokenId
   * @param {string} [config.note]
   * @param {Array<string>} [config.scopes]
   * @param {Array<string>} [config.resources]
   * @param {Array<string>} [config.allowedUrls]
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.updateToken({
   *   tokenId: 'cijucimbe000brbkt48d0dhcx',
   *   note: 'datasets-token',
   *   scopes: ['datasets:write', 'datasets:read']
   * })
   *   .send()
   *   .then(response => {
   *     const token = response.body;
   *   });
   */
  Tokens.updateToken = function(config) {
    validator.assertShape({
      tokenId: validator.required(validator.string),
      note: validator.string,
      scopes: validator.arrayOf(validator.string),
      resources: validator.arrayOf(validator.string),
      allowedUrls: validator.arrayOf(validator.string)
    })(config);

    var body = {};
    if (config.scopes) {
      body.scopes = config.scopes;
    }
    if (config.note !== undefined) {
      body.note = config.note;
    }
    if (config.resources || config.resources === null) {
      body.resources = config.resources;
    }
    if (config.allowedUrls || config.allowedUrls === null) {
      body.allowedUrls = config.allowedUrls;
    }

    return this.client.createRequest({
      method: 'PATCH',
      path: '/tokens/v2/:ownerId/:tokenId',
      params: pick_1(config, ['ownerId', 'tokenId']),
      body: body
    });
  };

  /**
   * Get data about the client's access token.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#retrieve-a-token).
   *
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.getToken()
   *   .send()
   *   .then(response => {
   *     const token = response.body;
   *   });
   */
  Tokens.getToken = function() {
    return this.client.createRequest({
      method: 'GET',
      path: '/tokens/v2'
    });
  };

  /**
   * Delete an access token.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#delete-a-token).
   *
   * @param {Object} config
   * @param {string} config.tokenId
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.deleteToken({
   *   tokenId: 'cijucimbe000brbkt48d0dhcx'
   * })
   *   .send()
   *   .then(response => {
   *     // Token successfully deleted.
   *   });
   */
  Tokens.deleteToken = function(config) {
    validator.assertShape({
      tokenId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/tokens/v2/:ownerId/:tokenId',
      params: pick_1(config, ['ownerId', 'tokenId'])
    });
  };

  /**
   * List your available scopes. Each item is a metadata
   * object about the scope, not just the string scope.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/accounts/#list-scopes).
   *
   * @return {MapiRequest}
   *
   * @example
   * tokensClient.listScopes()
   *   .send()
   *   .then(response => {
   *     const scopes = response.body;
   *   });
   */
  Tokens.listScopes = function() {
    return this.client.createRequest({
      method: 'GET',
      path: '/scopes/v1/:ownerId'
    });
  };

  var tokens = createServiceFactory_1(Tokens);

  /**
   * Uploads API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#uploads).
   */
  var Uploads = {};

  /**
   * List the statuses of all recent uploads.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-recent-upload-statuses).
   *
   * @param {Object} [config]
   * @param {boolean} [config.reverse] - List uploads in chronological order, rather than reverse chronological order.
   * @return {MapiRequest}
   *
   * @example
   * uploadsClient.listUploads()
   *   .send()
   *   .then(response => {
   *     const uploads = response.body;
   *   });
   */
  Uploads.listUploads = function(config) {
    validator.assertShape({
      reverse: validator.boolean
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/uploads/v1/:ownerId',
      query: config
    });
  };

  /**
   * Create S3 credentials.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-s3-credentials).
   *
   * @return {MapiRequest}
   *
   * @example
   * const AWS = require('aws-sdk');
   * const getCredentials = () => {
   *   return uploadsClient
   *     .createUploadCredentials()
   *     .send()
   *     .then(response => response.body);
   * }
   * const putFileOnS3 = (credentials) => {
   *   const s3 = new AWS.S3({
   *     accessKeyId: credentials.accessKeyId,
   *     secretAccessKey: credentials.secretAccessKey,
   *     sessionToken: credentials.sessionToken,
   *     region: 'us-east-1'
   *   });
   *   return s3.putObject({
   *     Bucket: credentials.bucket,
   *     Key: credentials.key,
   *     Body: fs.createReadStream('/path/to/file.mbtiles')
   *   }).promise();
   * };
   *
   * getCredentials().then(putFileOnS3);
   */
  Uploads.createUploadCredentials = function() {
    return this.client.createRequest({
      method: 'POST',
      path: '/uploads/v1/:ownerId/credentials'
    });
  };

  /**
   * Create an upload.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#create-an-upload).
   *
   * @param {Object} config
   * @param {string} config.tileset - The tileset ID to create or replace, in the format `username.nameoftileset`.
   *   Limited to 32 characters (only `-` and `_` special characters allowed; limit does not include username).
   * @param {string} config.url - HTTPS URL of the S3 object provided by [`createUploadCredentials`](#createuploadcredentials)
   * @param {string} [config.name] - The name of the tileset. Limited to 64 characters.
   * @return {MapiRequest}
   *
   * @example
   *  // Response from a call to createUploadCredentials
   * const credentials = {
   *   accessKeyId: '{accessKeyId}',
   *   bucket: '{bucket}',
   *   key: '{key}',
   *   secretAccessKey: '{secretAccessKey}',
   *   sessionToken: '{sessionToken}',
   *   url: '{s3 url}'
   * };
   * uploadsClient.createUpload({
   *   tileset: `${myUsername}.${myTileset}`,
   *   url: credentials.url,
   *   name: 'my uploads name',
   * })
   *   .send()
   *   .then(response => {
   *     const upload = response.body;
   *   });
   */
  Uploads.createUpload = function(config) {
    validator.assertShape({
      url: validator.required(validator.string),
      tileset: validator.string,
      name: validator.string,
      mapId: validator.string,
      tilesetName: validator.string
    })(config);

    if (!config.tileset && !config.mapId) {
      throw new Error('tileset or mapId must be defined');
    }
  
    if (!config.name && !config.tilesetName) {
      throw new Error('name or tilesetName must be defined');
    }
  
    // Support old mapId option
    if (config.mapId) {
      config.tileset = config.mapId;
    }
  
    // Support old tilesetName option
    if (config.tilesetName) {
      config.name = config.tilesetName;
    }

    return this.client.createRequest({
      method: 'POST',
      path: '/uploads/v1/:ownerId',
      body: pick_1(config, ['tileset', 'url', 'name'])

    });
  };

  /**
   * Get an upload's status.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#retrieve-upload-status).
   *
   * @param {Object} config
   * @param {string} config.uploadId
   * @return {MapiRequest}
   *
   * @example
   * uploadsClient.getUpload({
   *   uploadId: '{upload_id}'
   * })
   *   .send()
   *   .then(response => {
   *     const status = response.body;
   *   });
   */
  Uploads.getUpload = function(config) {
    validator.assertShape({
      uploadId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'GET',
      path: '/uploads/v1/:ownerId/:uploadId',
      params: config
    });
  };

  /**
   * Delete an upload.
   *
   * See the [corresponding HTTP service documentation](https://www.mapbox.com/api-documentation/maps/#remove-an-upload-status).
   *
   * @param {Object} config
   * @param {string} config.uploadId
   * @return {MapiRequest}
   *
   * @example
   * uploadsClient.deleteUpload({
   *   uploadId: '{upload_id}'
   * })
   * .send()
   * .then(response => {
   *   // Upload successfully deleted.
   * });
   */
  Uploads.deleteUpload = function(config) {
    validator.assertShape({
      uploadId: validator.required(validator.string)
    })(config);

    return this.client.createRequest({
      method: 'DELETE',
      path: '/uploads/v1/:ownerId/:uploadId',
      params: config
    });
  };

  var uploads = createServiceFactory_1(Uploads);

  /**
   * Isochrone API service.
   *
   * Learn more about this service and its responses in
   * [the HTTP service documentation](https://docs.mapbox.com/api/navigation/#isochrone).
   */
  var Isochrone = {};

  /**
   * Given a location and a routing profile, retrieve up to four isochrone contours
   * @param {Object} config
   * @param {'driving'|'driving-traffic'|'walking'|'cycling'} [config.profile="driving"] - 	A Mapbox Directions routing profile ID.
   * @param {Coordinates} config.coordinates - A  {longitude,latitude} coordinate pair around which to center the isochrone lines.
   * @param {Array<number>} [config.minutes] - The times in minutes to use for each isochrone contour. You can specify up to four contours. Times must be in increasing order. The maximum time that can be specified is 60 minutes. Setting minutes and meters in the same time is an error.
   * @param {Array<number>} [config.meters] - The distances in meters to use for each isochrone contour. You can specify up to four contours. Distances must be in increasing order. The maximum distance that can be specified is 100000 meters. Setting minutes and meters in the same time is an error.
   * @param {Array<string>} [config.colors] - The colors to use for each isochrone contour, specified as hex values without a leading # (for example, ff0000 for red). If this parameter is used, there must be the same number of colors as there are entries in contours_minutes or contours_meters. If no colors are specified, the Isochrone API will assign a default rainbow color scheme to the output.
   * @param {boolean} [config.polygons] - Specify whether to return the contours as GeoJSON polygons (true) or linestrings (false, default). When polygons=true, any contour that forms a ring is returned as a polygon.
   * @param {number} [config.denoise] - A floating point value from 0.0 to 1.0 that can be used to remove smaller contours. The default is 1.0. A value of 1.0 will only return the largest contour for a given time value. A value of 0.5 drops any contours that are less than half the area of the largest contour in the set of contours for that same time value.
   * @param {number} [config.generalize] - A positive floating point value in meters used as the tolerance for Douglas-Peucker generalization. There is no upper bound. If no value is specified in the request, the Isochrone API will choose the most optimized generalization to use for the request. Note that the generalization of contours can lead to self-intersections, as well as intersections of adjacent contours.

   * @return {MapiRequest}
   */
  Isochrone.getContours = function(config) {
    validator.assertShape({
      profile: validator.oneOf('driving', 'driving-traffic', 'walking', 'cycling'),
      coordinates: validator.coordinates,
      minutes: validator.arrayOf(validator.number),
      meters: validator.arrayOf(validator.number),
      colors: validator.arrayOf(validator.string),
      polygons: validator.boolean,
      denoise: validator.number,
      generalize: validator.number,
      depart_at: validator.string
    })(config);

    config.profile = config.profile || 'driving';

    if (config.minutes !== undefined && config.meters !== undefined) {
      throw new Error("minutes and meters can't be specified at the same time");
    }
    var contours = config.minutes ? config.minutes : config.meters;
    var contours_name = config.minutes ? 'minutes' : 'meters';
    var contoursCount = contours.length;

    if (contoursCount < 1 || contoursCount > 4) {
      throw new Error(
        contours_name + ' must contain between 1 and 4 contour values'
      );
    }

    if (
      config.colors !== undefined &&
      contours !== undefined &&
      config.colors.length !== contoursCount
    ) {
      throw new Error(
        'colors should have the same number of entries as ' + contours_name
      );
    }

    if (
      config.minutes !== undefined &&
      !config.minutes.every(function(minute) {
        return minute <= 60;
      })
    ) {
      throw new Error('minutes must be less than 60');
    }

    var MAX_METERS = 100000;
    if (
      config.meters !== undefined &&
      !config.meters.every(function(meter) {
        return meter <= MAX_METERS;
      })
    ) {
      throw new Error('meters must be less than ' + MAX_METERS);
    }

    if (config.generalize && config.generalize < 0) {
      throw new Error('generalize tolerance must be a positive number');
    }

    // Strip "#" from colors.
    if (config.colors) {
      config.colors = config.colors.map(function(color) {
        if (color[0] === '#') return color.substring(1);
        return color;
      });
    }

    var query = stringifyBooleans({
      contours_minutes: config.minutes ? config.minutes.join(',') : null,
      contours_meters: config.meters ? config.meters.join(',') : null,
      contours_colors: config.colors ? config.colors.join(',') : null,
      polygons: config.polygons,
      denoise: config.denoise,
      generalize: config.generalize,
      depart_at: config.depart_at
    });

    return this.client.createRequest({
      method: 'GET',
      path: '/isochrone/v1/mapbox/:profile/:coordinates',
      params: {
        profile: config.profile,
        coordinates: config.coordinates.join(',')
      },
      query: objectClean(query)
    });
  };

  var isochrone = createServiceFactory_1(Isochrone);

  function mapboxSdk(options) {
    var client = browserClient(options);

    client.datasets = datasets(client);
    client.directions = directions(client);
    client.geocoding = geocoding(client);
    client.geocodingV6 = geocodingv6(client);
    client.mapMatching = mapMatching(client);
    client.matrix = matrix(client);
    client.optimization = optimization(client);
    client.static = _static(client);
    client.styles = styles(client);
    client.tilequery = tilequery(client);
    client.tilesets = tilesets(client);
    client.tokens = tokens(client);
    client.uploads = uploads(client);
    client.isochrone = isochrone(client);

    return client;
  }

  var bundle = mapboxSdk;

  return bundle;

})));
