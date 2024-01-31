var _typeof = require("@babel/runtime/helpers/typeof");
var _regeneratorRuntime = require("@babel/runtime/regenerator");
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _createClass = require("@babel/runtime/helpers/createClass");
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.number.is-integer.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.date.to-iso-string.js");
/**
 * Collections class
 */
var Collections = /*#__PURE__*/function () {
  "use strict";

  /**
   * @type {string}
   */

  /**
   * Initialise data-members
   *
   * @param hippo	{HippoConnection} the hippo connection instance
   * @param name {string} the collection name we're working with
   */
  function Collections(hippo, name) {
    _classCallCheck(this, Collections);
    _defineProperty(this, "name", void 0);
    Object.defineProperty(this, 'hippo', {
      value: hippo,
      writable: false
    });
    this.cache = hippo.cache;
    this.name = name;
  }

  /**
   * @returns {Query} the query object for querying this collection
   */
  _createClass(Collections, [{
    key: "query",
    value: function query() {
      return this.hippo.newCollectionQuery(this.name);
    }

    /**
     * Get an item from the collection
     *
     * @param path		{string} the path to retrieve.
     * @returns {Promise<*>}
     */
  }, {
    key: "get",
    value: (function () {
      var _get = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(path) {
        var _this = this;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", this.cache.namedMethod('collectionsGet', [this.name, path], /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                  var response;
                  return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.prev = 0;
                          _context.next = 3;
                          return _this.hippo.axios.get("".concat(_this.hippo.options.xinApi, "/collections/").concat(_this.name, "/item?path=").concat(encodeURIComponent(path)));
                        case 3:
                          response = _context.sent;
                          if (response.data.success) {
                            _context.next = 6;
                            break;
                          }
                          return _context.abrupt("return", null);
                        case 6:
                          return _context.abrupt("return", response.data.item);
                        case 9:
                          _context.prev = 9;
                          _context.t0 = _context["catch"](0);
                          console.error("couldn't retrieve this item", _context.t0);
                          return _context.abrupt("return", null);
                        case 13:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, null, [[0, 9]]);
                }))));
              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function get(_x) {
        return _get.apply(this, arguments);
      }
      return get;
    }()
    /**
     * Delete an item.
     *
     * @param path			{string} the path to delete the item from
     * @param forceDelete	{boolean} if set to true, can delete a part of the tree recursively.
     * @returns {Promise<null|*>}
     */
    )
  }, {
    key: "delete",
    value: (function () {
      var _delete2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(path) {
        var forceDelete,
          response,
          _args3 = arguments;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                forceDelete = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : false;
                _context3.prev = 1;
                _context3.next = 4;
                return this.hippo.axios["delete"]("".concat(this.hippo.options.xinApi, "/collections/").concat(this.name, "/item?path=").concat(encodeURIComponent(path), "&forceDelete=").concat(forceDelete ? 'true' : 'false'));
              case 4:
                response = _context3.sent;
                return _context3.abrupt("return", response.data.success);
              case 8:
                _context3.prev = 8;
                _context3.t0 = _context3["catch"](1);
                console.error("couldn't retrieve this item", _context3.t0.message);
                return _context3.abrupt("return", false);
              case 12:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 8]]);
      }));
      function _delete(_x2) {
        return _delete2.apply(this, arguments);
      }
      return _delete;
    }()
    /**
     * Put a new item into the collections
     *
     * @param path 		{string} the path to push into
     * @param object	{object} the object to serialize
     * @param saveMode {'Merge'|'Overwrite'|'FailIfExists'} the save mode to write the content with.
     */
    )
  }, {
    key: "put",
    value: (function () {
      var _put = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(path, object) {
        var saveMode,
          values,
          result,
          _args4 = arguments;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                saveMode = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : 'Merge';
                _context4.prev = 1;
                values = this.serialise(object);
                _context4.next = 5;
                return this.hippo.axios.post("".concat(this.hippo.options.xinApi, "/collections/").concat(this.name, "/item?path=").concat(encodeURIComponent(path)), {
                  saveMode: saveMode,
                  values: values
                });
              case 5:
                result = _context4.sent;
                return _context4.abrupt("return", result.data.success);
              case 9:
                _context4.prev = 9;
                _context4.t0 = _context4["catch"](1);
                console.error("Something happened when putting a new item:", _context4.t0);
                return _context4.abrupt("return", false);
              case 13:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[1, 9]]);
      }));
      function put(_x3, _x4) {
        return _put.apply(this, arguments);
      }
      return put;
    }()
    /**
     * Serialise a javascript object into an object that can be ingested by the `post` item endpoint.
     * @param object {object} object to convert
     * @returns {{}}
     */
    )
  }, {
    key: "serialise",
    value: function serialise(object) {
      var values = {};
      for (var key in object) {
        var val = object[key];
        var type = _typeof(val);
        switch (type) {
          case 'boolean':
            values[key] = {
              value: val,
              type: "Boolean"
            };
            break;
          case 'string':
            values[key] = {
              value: val,
              type: 'String'
            };
            break;
          case 'number':
            values[key] = {
              value: val,
              type: Number.isInteger(val) ? "Long" : "Double"
            };
            break;
          case 'object':
            if (val instanceof Date) {
              values[key] = {
                value: val.toISOString(),
                type: "Date"
              };
              break;
            }
            console.error("Don't know how to serialise object for key: " + key);
            break;
          default:
            console.error("Don't know how to serialise key '".concat(key, "' of type '").concat(type, "'"));
        }
      }
      return values;
    }

    /**
     * Convenience method for put with Overwrite save mode
     * @param object
     * @returns {*}
     */
  }, {
    key: "putAndOverwrite",
    value: (function () {
      var _putAndOverwrite = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(path, object) {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.put(path, object, 'Overwrite');
              case 2:
                return _context5.abrupt("return", _context5.sent);
              case 3:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));
      function putAndOverwrite(_x5, _x6) {
        return _putAndOverwrite.apply(this, arguments);
      }
      return putAndOverwrite;
    }())
  }, {
    key: "putAndMerge",
    value: function () {
      var _putAndMerge = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(path, object) {
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.put(path, object, 'Merge');
              case 2:
                return _context6.abrupt("return", _context6.sent);
              case 3:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));
      function putAndMerge(_x7, _x8) {
        return _putAndMerge.apply(this, arguments);
      }
      return putAndMerge;
    }()
  }, {
    key: "putIfNotExists",
    value: function () {
      var _putIfNotExists = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(path, object) {
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.put(path, object, 'FailIfExists');
              case 2:
                return _context7.abrupt("return", _context7.sent);
              case 3:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));
      function putIfNotExists(_x9, _x10) {
        return _putIfNotExists.apply(this, arguments);
      }
      return putIfNotExists;
    }()
  }]);
  return Collections;
}();
module.exports = Collections;