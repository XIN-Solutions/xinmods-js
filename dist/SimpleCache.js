var _regeneratorRuntime = require("@babel/runtime/regenerator");
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _createClass = require("@babel/runtime/helpers/createClass");
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.split.js");
require("core-js/modules/es.string.match.js");
require("core-js/modules/es.array.concat.js");
var NodeCache = require('node-cache');

/**
 * The default options for in the cache configuration (https://www.npmjs.com/package/node-cache)
 */
var DefaultOptions = {
  stdTTL: process.env.CACHE_TTL || 60
};
var debug = process.env.CACHE_DEBUG === 'true' || false;
var caches = {};

/**
 * Cache service that caches information on a per/customer basis.
 */
var SimpleCache = /*#__PURE__*/function () {
  "use strict";

  /**
   * Initialise data-member
   *
   * @param cacheName {string|object} the cacheName information
   * @param enabled {boolean} true if the cache mechanism should function
   */
  function SimpleCache(cacheName, enabled) {
    _classCallCheck(this, SimpleCache);
    _defineProperty(this, "name", void 0);
    _defineProperty(this, "enabled", void 0);
    this.enabled = enabled;
    if (typeof cacheName === 'string') {
      this.name = cacheName;
    } else {
      this.name = cacheName.name;
    }
    if (!caches[this.name]) {
      caches[this.name] = new NodeCache(DefaultOptions);
    }
  }

  /**
   * Flush the cache
   */
  _createClass(SimpleCache, [{
    key: "flushCache",
    value: function flushCache() {
      debug && console.log("[".concat(this.name, "] Stats before flushing: "), caches[this.name].getStats());
      caches[this.name].flushAll();
    }

    /**
     * Use this function to cache output of valFn against the arguments passed into
     * the `args` object. It detects the method name by creating a temporary error object
     * and grabbing the name from the stack trace.
     *
     * @param args      {Arguments|object} the arguments object
     * @param valFn     {Function<Promise<*>>} the object to save
     * @param ttl       {number?} the TTL to store result for
     *
     * @returns {Promise<*>} either the cached version
     */
  }, {
    key: "method",
    value: (function () {
      var _method = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(args, valFn) {
        var ttl,
          lastMethodLine,
          lastMethod,
          _args = arguments;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                ttl = _args.length > 2 && _args[2] !== undefined ? _args[2] : null;
                lastMethodLine = new Error().stack.split("\n")[2];
                lastMethod = lastMethodLine.match(/\s+at\s+([^\s]+)/);
                return _context.abrupt("return", this.namedMethod(lastMethod[1], args, valFn, ttl));
              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function method(_x, _x2) {
        return _method.apply(this, arguments);
      }
      return method;
    }()
    /**
     * Use this function to cache output of valFn against the arguments passed into
     * the `args` object. It detects the method name by creating a temporary error object
     * and grabbing the name from the stack trace.
     *
     * @param name      {string} name to cache under
     * @param args      {Arguments|object} the arguments object
     * @param valFn     {Function<Promise<*>>} the object to save
     * @param ttl       {number?} the TTL to store result for
     *
     * @returns {Promise<*>} either the cached version
     */
    )
  }, {
    key: "namedMethod",
    value: (function () {
      var _namedMethod = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(name, args, valFn) {
        var ttl,
          methodCacheKey,
          existing,
          output,
          _args2 = arguments;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                ttl = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : null;
                if (this.enabled) {
                  _context2.next = 5;
                  break;
                }
                _context2.next = 4;
                return valFn.call(args);
              case 4:
                return _context2.abrupt("return", _context2.sent);
              case 5:
                methodCacheKey = "".concat(name, "_").concat(JSON.stringify(args));
                existing = caches[this.name].get(methodCacheKey);
                if (!(typeof existing !== "undefined")) {
                  _context2.next = 10;
                  break;
                }
                debug && console.log("[".concat(this.name, "] hit '").concat(methodCacheKey, "'"), caches[this.name].getStats());
                return _context2.abrupt("return", existing);
              case 10:
                _context2.prev = 10;
                _context2.next = 13;
                return valFn.call(args);
              case 13:
                output = _context2.sent;
                caches[this.name].set(methodCacheKey, output, ttl);
                debug && console.log("[".concat(this.name, "] stored '").concat(methodCacheKey, "'"), caches[this.name].getStats());
                return _context2.abrupt("return", output);
              case 19:
                _context2.prev = 19;
                _context2.t0 = _context2["catch"](10);
                console.error("[".concat(this.name, "] error executing value function:"), _context2.t0);
                return _context2.abrupt("return", null);
              case 23:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[10, 19]]);
      }));
      function namedMethod(_x3, _x4, _x5) {
        return _namedMethod.apply(this, arguments);
      }
      return namedMethod;
    }()
    /**
     * Get the cache proxy for easy interactions.
     *
     * @returns {Proxy} returns the cache proxy so we can pretend it's a normal object.
     */
    )
  }, {
    key: "data",
    value: function data() {
      var cName = this.name;
      return new Proxy({}, {
        get: function get(obj, prop) {
          return caches[cName].get(prop);
        },
        set: function set(obj, prop, value) {
          return caches[cName].set(prop, value);
        }
      });
    }
  }]);
  return SimpleCache;
}();
module.exports = SimpleCache;