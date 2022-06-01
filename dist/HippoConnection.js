require("core-js/modules/es.array.slice.js");

require("core-js/modules/es.function.name.js");

require("core-js/modules/es.array.from.js");

require("core-js/modules/es.string.iterator.js");

require("core-js/modules/es.symbol.js");

require("core-js/modules/es.symbol.description.js");

require("core-js/modules/es.symbol.iterator.js");

require("core-js/modules/es.array.is-array.js");

var _typeof = require("@babel/runtime/helpers/typeof");

var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var _defineProperty = require("@babel/runtime/helpers/defineProperty");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

require("core-js/modules/es.object.assign.js");

require("core-js/modules/es.array.iterator.js");

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.array.index-of.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.split.js");

require("core-js/modules/es.array.map.js");

require("core-js/modules/es.string.link.js");

require("core-js/modules/es.array.join.js");

require("core-js/modules/es.date.to-string.js");

require("core-js/modules/es.array.concat.js");

/*
	 _   _ _                      ____                            _   _
	| | | (_)_ __  _ __   ___    / ___|___  _ __  _ __   ___  ___| |_(_) ___  _ __
	| |_| | | '_ \| '_ \ / _ \  | |   / _ \| '_ \| '_ \ / _ \/ __| __| |/ _ \| '_ \
	|  _  | | |_) | |_) | (_) | | |__| (_) | | | | | | |  __/ (__| |_| | (_) | | | |
	|_| |_|_| .__/| .__/ \___/   \____\___/|_| |_|_| |_|\___|\___|\__|_|\___/|_| |_|
			|_|   |_|

	Purpose:

		To be able to connect to basic Hippo REST endpoints in both the normal
		and XIN additions APIs.

 */
var AxiosModule = require('axios');

var AxiosRetry = require('axios-retry');

var AxiosCachedDnsResolve = require('axios-cached-dns-resolve');

var qs = require('qs');

var SimpleCache = require('./SimpleCache.js');

var Image = require('./Image.js');

var QueryBuilder = require('./QueryBuilder.js');

var Collections = require('./Collections.js');

var DefaultOptions = {
  hippoApi: '/site/api',
  xinApi: '/site/custom-api',
  assetPath: '/site/binaries',
  assetModPath: '/site/assetmod',
  cdnUrl: null
};
/**
 * @typedef QueryResult
 * @property {boolean} success - true if successful
 * @property {string} message - the message from the query
 * @property {QueryResultUUID[]} uuids - a list of uuid information, one for each result
 * @property {number} totalSize - the number of results
 * @property {object} documents - map with uuid as key and
 */

/**
 * @typedef QueryResultUUID
 * @property {string} uuid - the uuid of this document
 * @property {string} path - full JCR path for this document
 * @property {string} url - the local URL document details
 * @property {string} type - the type of this result
 */

/**
 * @typedef DocumentLocation
 * @property {boolean} success - true if something useful was returned
 * @property {string} message - the message that came back
 * @property {string} path - the path we've retrieved
 * @property {string} type - the type of the node that lives there
 * @property {string} uuid - the uuid of the node
 */

/**
 * @typedef FacetResponse
 * @property {boolean} success - true if all went well
 * @property {string} message - describes how everything went
 * @property {FacetItem} facet - the facet result
 */

/**
 * @typedef FacetItem
 * @property {HippoConnection} hippo - the connection used to retrieve the information
 * @property {string} sourceFacet - the base node of this facet
 * @property {string} facetPath - the path we've queried for
 * @property {string} displayName - the name of the current facet
 * @property {number} totalCount - the total number of elements in this facet.
 * @property {object} childFacets - association of child facets as keys with their result count as the value
 * @property {object[]} results - the documents part of this facet item.
 */

var DefaultCacheOptions = {
  enabled: false,
  ttl: 360,
  cacheName: 'hippo-cache'
};

var HippoConnection = /*#__PURE__*/function () {
  "use strict";

  /** @type {SimpleCache} */

  /**
   * Initialise the hippo connection.
   *
   * @param host	{string} the host to connect to
   * @param userOrJwt	{string} the user to connect with, if password is null, this will have a JWT token.
   * @param password {?string} the password to connect with, if null `user` is sent as Bearer token.
   * @param options {object} options that we might use.
      * @param options.cache {object} contains caching options
      * @param options.cache.enabled {boolean} cache the results if set to true
      * @param options.cache.ttl {number} ttl for cache elements
      * @param options.cache.cacheName {string} name of the cache to use
   */
  function HippoConnection(host, userOrJwt, password) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, HippoConnection);

    _defineProperty(this, "host", void 0);

    _defineProperty(this, "user", void 0);

    _defineProperty(this, "password", void 0);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "axios", void 0);

    _defineProperty(this, "cache", void 0);

    _defineProperty(this, "cacheOptions", void 0);

    this.cacheOptions = Object.assign({}, DefaultCacheOptions, options.cache || {});
    this.host = host;
    this.user = userOrJwt;
    this.password = password;
    this.cache = new SimpleCache(this.cacheOptions.cacheName, this.cacheOptions.enabled); // setup axios settings based on the type of credentials that were provided.

    var axiosSettings = Object.assign({
      baseURL: this.host,
      paramsSerializer: function paramsSerializer(params) {
        return qs.stringify(params, {
          indices: false
        });
      }
    }, this.password ? {
      auth: {
        username: this.user,
        password: this.password
      }
    } : {}, !this.password ? {
      headers: {
        "Authorization": "Bearer " + this.user
      }
    } : {});
    this.axios = AxiosModule.create(axiosSettings); // add dns.lookup cache mechanism

    AxiosCachedDnsResolve.registerInterceptor(this.axios); // add retry behaviours

    AxiosRetry(this.axios, {
      retries: 3,
      retryDelay: AxiosRetry.exponentialDelay
    });
    this.options = Object.assign({}, DefaultOptions, options || {});
  }
  /**
   * Query builder instance returned
   * @returns {Query}
   */


  _createClass(HippoConnection, [{
    key: "newQuery",
    value: function newQuery() {
      return new QueryBuilder(this).newQuery();
    }
  }, {
    key: "collection",
    value: function collection(name) {
      if (!name) {
        throw Error("Require a collection name to be specified");
      }

      return new Collections(this, name);
    }
    /**
     * Create a query for a collection
     * @param collectionName	{string} the collection to query
     * @returns {Query} a query prepped for use in collection querying.
     */

  }, {
    key: "newCollectionQuery",
    value: function newCollectionQuery() {
      var collectionName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (!collectionName) {
        throw Error("Require a collection name to be specified");
      } // return


      return new QueryBuilder(this).newQuery().type("xinmods:collectionitem").includePath("/content/collections/".concat(collectionName));
    }
    /**
     * Creates starting point for where clause expression.
     * @param clauseType {string} the type of clause we're creating.
     * @returns {ClauseExpression}
     */

  }, {
    key: "newClause",
    value: function newClause(clauseType) {
      return new QueryBuilder(this).newClause(clauseType);
    }
  }, {
    key: "newExternalImage",
    value: function newExternalImage(src) {
      return new Image(this, {}, {}).external(src);
    }
    /**
     * Convenience methods for creating 'and' clause expression
     * @returns {ClauseExpression}
     */

  }, {
    key: "andClause",
    value: function andClause() {
      return this.newClause('and');
    }
    /**
     * Convenience methods for creating 'or' clause expression
     * @returns {ClauseExpression}
     */

  }, {
    key: "orClause",
    value: function orClause() {
      return this.newClause('or');
    }
    /**
     * List all collections currently available in the Bloomreach repository
     */

  }, {
    key: "listCollections",
    value: function () {
      var _listCollections = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", this.cache.namedMethod('listCollections', [], /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                  var response;
                  return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.prev = 0;
                          _context.next = 3;
                          return _this.axios.get("".concat(_this.options.xinApi, "/collections/list"));

                        case 3:
                          response = _context.sent;
                          return _context.abrupt("return", response.data.collections);

                        case 7:
                          _context.prev = 7;
                          _context.t0 = _context["catch"](0);
                          console.error("couldn't retrieve list of collections", _context.t0);
                          return _context.abrupt("return", null);

                        case 11:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, null, [[0, 7]]);
                }))));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function listCollections() {
        return _listCollections.apply(this, arguments);
      }

      return listCollections;
    }()
    /**
     * Execute the query in `query`. Depending on the options that are provided we might have
     * to do additional things.
     *
     * @param query     {string} the query to execute
     *
     * @param options   {object}
     * @param options.documents {boolean} if set to true transform the uuid results into documents (default: true).
     * @param options.namespace {boolean} keep the namespace information in the documents? (default: false)
     * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
     *
     * @returns {Promise<QueryResult>}
     */

  }, {
    key: "executeQuery",
    value: function () {
      var _executeQuery = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(query) {
        var _this2 = this;

        var options,
            _args4 = arguments;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : {};
                return _context4.abrupt("return", this.cache.namedMethod('executeQuery', _args4, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
                  var defaultOptions, opts, response, _iterator, _step, resultRow, uuid, doc, docIdx;

                  return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          defaultOptions = {
                            namespace: false,
                            documents: true,
                            fetch: []
                          };
                          opts = Object.assign({}, defaultOptions, options);
                          _context3.prev = 2;
                          _context3.next = 5;
                          return _this2.axios.get("".concat(_this2.options.xinApi, "/content/query"), {
                            params: {
                              query: query,
                              fetch: opts.fetch
                            }
                          });

                        case 5:
                          response = _context3.sent;

                          if (!(!response || !response.data)) {
                            _context3.next = 8;
                            break;
                          }

                          return _context3.abrupt("return", null);

                        case 8:
                          if (!(opts.documents && !response.data.documents)) {
                            _context3.next = 32;
                            break;
                          }

                          response.data.documents = [];
                          _iterator = _createForOfIteratorHelper(response.data.uuids);
                          _context3.prev = 11;

                          _iterator.s();

                        case 13:
                          if ((_step = _iterator.n()).done) {
                            _context3.next = 22;
                            break;
                          }

                          resultRow = _step.value;
                          uuid = resultRow.uuid;
                          _context3.next = 18;
                          return _this2.getDocumentByUuid(uuid, opts);

                        case 18:
                          doc = _context3.sent;
                          response.data.documents.push(doc);

                        case 20:
                          _context3.next = 13;
                          break;

                        case 22:
                          _context3.next = 27;
                          break;

                        case 24:
                          _context3.prev = 24;
                          _context3.t0 = _context3["catch"](11);

                          _iterator.e(_context3.t0);

                        case 27:
                          _context3.prev = 27;

                          _iterator.f();

                          return _context3.finish(27);

                        case 30:
                          _context3.next = 42;
                          break;

                        case 32:
                          if (!opts.documents) {
                            _context3.next = 42;
                            break;
                          }

                          _context3.t1 = _regeneratorRuntime.keys(response.data.documents);

                        case 34:
                          if ((_context3.t2 = _context3.t1()).done) {
                            _context3.next = 42;
                            break;
                          }

                          docIdx = _context3.t2.value;

                          if (response.data.documents.hasOwnProperty(docIdx)) {
                            _context3.next = 38;
                            break;
                          }

                          return _context3.abrupt("continue", 34);

                        case 38:
                          if (!opts.namespace) {
                            response.data.documents[docIdx] = _this2.sanitiseDocument(response.data.documents[docIdx]);
                          }

                          response.data.documents[docIdx].hippo = _this2;
                          _context3.next = 34;
                          break;

                        case 42:
                          return _context3.abrupt("return", response.data);

                        case 45:
                          _context3.prev = 45;
                          _context3.t3 = _context3["catch"](2);

                          if (_context3.t3.response) {
                            _context3.next = 50;
                            break;
                          }

                          console.error("Something happened (perhaps backend is down?) ", _context3.t3);
                          return _context3.abrupt("return");

                        case 50:
                          if (!(_context3.t3.response.status === 401)) {
                            _context3.next = 52;
                            break;
                          }

                          throw new Error("Unauthorized request", _context3.t3);

                        case 52:
                          if (!(_context3.t3.response.status === 501)) {
                            _context3.next = 55;
                            break;
                          }

                          console.log("Something wrong with the query, check Hippo CMS server logs for a detailed report.");
                          throw new Error(_context3.t3.response.data.message);

                        case 55:
                          throw _context3.t3;

                        case 56:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, null, [[2, 45], [11, 24, 27, 30]]);
                })), this.cacheOptions.ttl));

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function executeQuery(_x) {
        return _executeQuery.apply(this, arguments);
      }

      return executeQuery;
    }()
    /**
     * Remove the namespace from objects
     *
     * @param object    the object to adapt
     */

  }, {
    key: "sanitiseDocument",
    value: function sanitiseDocument(object) {
      var newObj = {};

      for (var prop in object) {
        var val = object[prop];
        var cleanKey = prop.indexOf(":") === -1 ? prop : prop.split(":")[1];

        var type = _typeof(val);

        if (type === 'object') {
          newObj[cleanKey] = this.sanitiseDocument(val);
        } else {
          newObj[cleanKey] = val;
        }
      }

      return newObj;
    }
    /**
     * Simple document query:
     * https://documentation.bloomreach.com/14/library/concepts/rest/content-rest-api/document-collection-resource.html
     *
     * @param options {object} information
     * @param options.offset {number?} offset of result set
     * @param options.max {number?} the limit to the query
     * @param options.orderBy {string?|string[]?} field name
     * @param options.sortOrder {boolean?|boolean[]?} asc or desc
     * @param options.nodeType {string?} a node type to filter by
     * @param options.query {string?} freetext query
     * @param options.attributes {string[]?} the attributes to retrieve
     */

  }, {
    key: "getDocuments",
    value: function () {
      var _getDocuments = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
        var _this3 = this;

        var options,
            _args6 = arguments;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = _args6.length > 0 && _args6[0] !== undefined ? _args6[0] : {};
                return _context6.abrupt("return", this.cache.namedMethod('getDocuments', _args6, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
                  var response, returnData;
                  return _regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          _context5.prev = 0;
                          _context5.next = 3;
                          return _this3.axios.get("".concat(_this3.options.hippoApi, "/documents"), {
                            params: {
                              _offset: options.offset,
                              _max: options.max,
                              _orderBy: options.orderBy,
                              _sortOrder: options.sortOrder,
                              _nodetype: options.nodeType,
                              _query: options.query
                            }
                          });

                        case 3:
                          response = _context5.sent;

                          if (!(!response || !response.data)) {
                            _context5.next = 6;
                            break;
                          }

                          return _context5.abrupt("return", null);

                        case 6:
                          returnData = response.data;
                          returnData.hippo = _this3;
                          return _context5.abrupt("return", returnData);

                        case 11:
                          _context5.prev = 11;
                          _context5.t0 = _context5["catch"](0);

                          if (!_context5.t0.response) {
                            console.error("Something happened (perhaps backend is down?)", _context5.t0);
                          }

                          if (!(_context5.t0.response.status === 401)) {
                            _context5.next = 16;
                            break;
                          }

                          throw new Error("Unauthorized request", _context5.t0);

                        case 16:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, null, [[0, 11]]);
                })), this.cacheOptions.ttl));

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getDocuments() {
        return _getDocuments.apply(this, arguments);
      }

      return getDocuments;
    }()
    /**
     * @returns {boolean} true if the date was set.
     */

  }, {
    key: "hasDate",
    value: function hasDate(value) {
      return value.indexOf("0001") !== 0;
    }
    /**
     * Retrieve information about a faceted navigation sub node.
     *
     * @param facetPath {string} the content path to the facet we're navigating
     * @param childPath {?string} the child nav path inside the facet
     *
     * @param options {object} option object
     * @param options.namespace {boolean} if true, retain namespace information in results.
     * @param options.fetch {string[]} list of prefetched paths
     * @param options.limit {number} max number of elements
     * @param options.offset {number} where to start reading results from
     * @param options.sorted {boolean} true if using the facet nav sorting options, otherwise ordered by lucene score.
     *
     * @returns {Promise<?FacetItem>}
     */

  }, {
    key: "getFacetAtPath",
    value: function () {
      var _getFacetAtPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee8(facetPath) {
        var _this4 = this;

        var childPath,
            options,
            _args8 = arguments;
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                childPath = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : null;
                options = _args8.length > 2 && _args8[2] !== undefined ? _args8[2] : {};
                return _context8.abrupt("return", this.cache.namedMethod('getFacetAtPath', _args8, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7() {
                  var defaults, opts, _opts$offset, _opts$limit, _opts$sorted, response, result;

                  return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          defaults = {
                            namespace: false,
                            fetch: []
                          };
                          opts = Object.assign({}, defaults, options);
                          _context7.prev = 2;
                          _context7.next = 5;
                          return _this4.axios.get("".concat(_this4.options.xinApi, "/facets/get"), {
                            params: {
                              facetPath: facetPath,
                              childPath: childPath,
                              offset: (_opts$offset = opts.offset) !== null && _opts$offset !== void 0 ? _opts$offset : 0,
                              limit: (_opts$limit = opts.limit) !== null && _opts$limit !== void 0 ? _opts$limit : 50,
                              sorted: (_opts$sorted = opts.sorted) !== null && _opts$sorted !== void 0 ? _opts$sorted : false,
                              fetch: opts.fetch
                            }
                          });

                        case 5:
                          response = _context7.sent;

                          if (!(!response || !response.data)) {
                            _context7.next = 8;
                            break;
                          }

                          return _context7.abrupt("return", null);

                        case 8:
                          /** @type {FacetResponse} */
                          result = response.data;

                          if (!opts.namespace) {
                            result.facet.results = (result.facet.results || []).map(function (doc) {
                              var convert = _this4.sanitiseDocument(doc);

                              convert.hippo = _this4;
                              return convert;
                            });
                          }

                          return _context7.abrupt("return", result.facet);

                        case 13:
                          _context7.prev = 13;
                          _context7.t0 = _context7["catch"](2);
                          console.log("Error: ", _context7.t0.message);

                          if (_context7.t0.response) {
                            _context7.next = 18;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context7.t0);

                        case 18:
                          if (!(_context7.t0.response.status === 401)) {
                            _context7.next = 20;
                            break;
                          }

                          throw new Error("Unauthorized request", _context7.t0);

                        case 20:
                        case "end":
                          return _context7.stop();
                      }
                    }
                  }, _callee7, null, [[2, 13]]);
                })), this.cacheOptions.ttl));

              case 3:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function getFacetAtPath(_x2) {
        return _getFacetAtPath.apply(this, arguments);
      }

      return getFacetAtPath;
    }()
    /**
     * Determine whether a link was set.
     * @param link the link object
     * @returns {boolean} true if the link was set
     */

  }, {
    key: "isLinkSpecified",
    value: function isLinkSpecified(link) {
      return link && link.link && link.link.type === 'local';
    }
    /**
     * Retrieve an asset url from a linked asset.
     *
     * @param link	the link object
     * @returns {Promise<null|*>}
     */

  }, {
    key: "getAssetUrlFromLink",
    value: function () {
      var _getAssetUrlFromLink = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee9(link) {
        var asset;
        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (!(!link || !link.link || link.link.type !== "local" || !link.link.id)) {
                  _context9.next = 2;
                  break;
                }

                return _context9.abrupt("return", null);

              case 2:
                if (!link.link.ref) {
                  _context9.next = 6;
                  break;
                }

                _context9.t0 = link.link.ref;
                _context9.next = 9;
                break;

              case 6:
                _context9.next = 8;
                return this.getDocumentByUuid(link.link.id);

              case 8:
                _context9.t0 = _context9.sent;

              case 9:
                asset = _context9.t0;
                return _context9.abrupt("return", this._retrieveAssetLink(asset));

              case 11:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getAssetUrlFromLink(_x3) {
        return _getAssetUrlFromLink.apply(this, arguments);
      }

      return getAssetUrlFromLink;
    }()
    /**
     * Retrieve an asset url from a linked asset.
     *
     * @param link	the link object
     * @returns {?string} the url for this asset.
     */

  }, {
    key: "getAssetUrlFromLinkSync",
    value: function getAssetUrlFromLinkSync(link) {
      if (!link || !link.link || link.link.type !== "local" || !link.link.id) {
        return null;
      }

      if (!link.link.ref) {
        console.error("error: cannot determine asset link synchronously without pre-populated references.");
        return null;
      }

      var asset = link.link.ref;
      return this._retrieveAssetLink(asset);
    }
    /**
     * Logic to retrieve the asset url for.
     * @param asset {object} the asset object returned by brxm.
     * @returns {string|null}
     * @private
     */

  }, {
    key: "_retrieveAssetLink",
    value: function _retrieveAssetLink(asset) {
      var uri = asset ? asset.items.asset.link.url : null;

      if (!uri) {
        return null;
      } // pop last two elements off of the asset url if hippogallery is part of the url.


      var uriParts = uri.split("/");

      if (uri.indexOf("/hippogallery") !== -1) {
        uriParts.pop();
        uriParts.pop();
      }

      var normalisedUri = uriParts.join("/");
      var lastMod = new Date(asset.items.asset.lastModified).getTime();

      if (this.options.cdnUrl) {
        return "".concat(this.options.cdnUrl).concat(normalisedUri, "?v=").concat(lastMod);
      } else {
        return "".concat(normalisedUri, "?v=").concat(lastMod);
      }
    }
    /**
     * Retrieve the image object for an image link object
     * @param imageLink  the link object
     * @returns {?Image}
     */

  }, {
    key: "getImageFromLinkSync",
    value: function getImageFromLinkSync(imageLink) {
      if (!imageLink || !imageLink.link || !imageLink.link.id) {
        return null;
      } // if the link was prefetched use the `ref` object to populate the Image instance


      if (imageLink.link.ref) {
        return new Image(this, imageLink.link.ref, imageLink.link.ref);
      }

      console.error("error: could not load image link without pre-populated reference.");
      return null;
    }
    /**
     * Retrieve the image object for an image link object
     * @param imageLink  the link object
     * @returns {Promise<null|Image>}
     */

  }, {
    key: "getImageFromLink",
    value: function () {
      var _getImageFromLink = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee10(imageLink) {
        var imageUuid;
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (!(!imageLink || !imageLink.link || !imageLink.link.id)) {
                  _context10.next = 2;
                  break;
                }

                return _context10.abrupt("return", null);

              case 2:
                if (!imageLink.link.ref) {
                  _context10.next = 4;
                  break;
                }

                return _context10.abrupt("return", new Image(this, imageLink.link.ref, imageLink.link.ref));

              case 4:
                imageUuid = imageLink.link.id;
                return _context10.abrupt("return", this.getImageFromUuid(imageUuid));

              case 6:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getImageFromLink(_x4) {
        return _getImageFromLink.apply(this, arguments);
      }

      return getImageFromLink;
    }()
    /**
     * Retrieve an image by its UUID
     *
     * @param imageUuid
     * @returns {Promise<Image|null>}
     */

  }, {
    key: "getImageFromUuid",
    value: function () {
      var _getImageFromUuid = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee11(imageUuid) {
        var pathInfo, imageInfo;
        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.prev = 0;
                _context11.next = 3;
                return this.uuidToPath(imageUuid);

              case 3:
                pathInfo = _context11.sent;

                if (!(pathInfo === null)) {
                  _context11.next = 6;
                  break;
                }

                return _context11.abrupt("return", null);

              case 6:
                _context11.next = 8;
                return this.getDocumentByUuid(imageUuid);

              case 8:
                imageInfo = _context11.sent;
                return _context11.abrupt("return", new Image(this, pathInfo, imageInfo));

              case 12:
                _context11.prev = 12;
                _context11.t0 = _context11["catch"](0);
                console.error("Something happened while grabbing the image uuid, caused by:", _context11.t0);
                return _context11.abrupt("return", null);

              case 16:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this, [[0, 12]]);
      }));

      function getImageFromUuid(_x5) {
        return _getImageFromUuid.apply(this, arguments);
      }

      return getImageFromUuid;
    }()
    /**
     * Retrieve a document from Hippo by its UUID
     * @param uuid	{string} the uuid to retrieve
     * @param options {object} the options object
     * @param options.namespace {boolean} set to true if you'd like to get the namespace labels in the results
     * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
     * @returns {object?}
     */

  }, {
    key: "getDocumentByUuid",
    value: function () {
      var _getDocumentByUuid = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee13(uuid) {
        var _this5 = this;

        var options,
            _args13 = arguments;
        return _regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                options = _args13.length > 1 && _args13[1] !== undefined ? _args13[1] : {};
                return _context13.abrupt("return", this.cache.namedMethod('getDocumentByUuid', _args13, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee12() {
                  var defaults, opts, response, doc, returnDoc;
                  return _regeneratorRuntime.wrap(function _callee12$(_context12) {
                    while (1) {
                      switch (_context12.prev = _context12.next) {
                        case 0:
                          defaults = {
                            namespace: false,
                            fetch: []
                          };
                          opts = Object.assign({}, defaults, options);
                          _context12.prev = 2;
                          _context12.next = 5;
                          return _this5.axios.get("".concat(_this5.options.xinApi, "/content/document-with-uuid"), {
                            params: {
                              uuid: uuid,
                              fetch: opts.fetch
                            }
                          });

                        case 5:
                          response = _context12.sent;

                          if (!(!response || !response.data)) {
                            _context12.next = 8;
                            break;
                          }

                          return _context12.abrupt("return", null);

                        case 8:
                          doc = response.data.document;
                          returnDoc = opts.namespace ? doc : _this5.sanitiseDocument(doc);
                          returnDoc.hippo = _this5;
                          return _context12.abrupt("return", returnDoc);

                        case 14:
                          _context12.prev = 14;
                          _context12.t0 = _context12["catch"](2);

                          if (_context12.t0.response) {
                            _context12.next = 18;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context12.t0);

                        case 18:
                          if (!(_context12.t0.response.status === 401)) {
                            _context12.next = 20;
                            break;
                          }

                          throw new Error("Unauthorized request", _context12.t0);

                        case 20:
                        case "end":
                          return _context12.stop();
                      }
                    }
                  }, _callee12, null, [[2, 14]]);
                })), this.cacheOptions.ttl));

              case 2:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function getDocumentByUuid(_x6) {
        return _getDocumentByUuid.apply(this, arguments);
      }

      return getDocumentByUuid;
    }()
    /**
     * Get a document by its path.
     *
     * @param path	{string} the path
     * @param options {object} the options object
     * @param options.namespace {boolean} set to true if you'd like to get the namespace labels in the results
     * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
     * @returns {null|*}
     */

  }, {
    key: "getDocumentByPath",
    value: function () {
      var _getDocumentByPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee15(path) {
        var _this6 = this;

        var options,
            _args15 = arguments;
        return _regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                options = _args15.length > 1 && _args15[1] !== undefined ? _args15[1] : {};
                return _context15.abrupt("return", this.cache.namedMethod('getDocumentByPath', _args15, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee14() {
                  var defaults, opts, response, doc, returnDoc;
                  return _regeneratorRuntime.wrap(function _callee14$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          _context14.prev = 0;
                          defaults = {
                            namespace: false,
                            fetch: []
                          };
                          opts = Object.assign({}, defaults, options);
                          _context14.next = 5;
                          return _this6.axios.get("".concat(_this6.options.xinApi, "/content/document-at-path"), {
                            params: {
                              path: path,
                              fetch: opts.fetch
                            }
                          });

                        case 5:
                          response = _context14.sent;

                          if (!(!response || !response.data || !response.data.document)) {
                            _context14.next = 8;
                            break;
                          }

                          return _context14.abrupt("return", null);

                        case 8:
                          doc = response.data.document;
                          returnDoc = opts.namespace ? doc : _this6.sanitiseDocument(doc);
                          returnDoc.hippo = _this6;
                          return _context14.abrupt("return", returnDoc);

                        case 14:
                          _context14.prev = 14;
                          _context14.t0 = _context14["catch"](0);

                          if (_context14.t0.response) {
                            _context14.next = 18;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context14.t0);

                        case 18:
                          if (!(_context14.t0.response.status === 401)) {
                            _context14.next = 20;
                            break;
                          }

                          throw new Error("Unauthorized request", _context14.t0);

                        case 20:
                        case "end":
                          return _context14.stop();
                      }
                    }
                  }, _callee14, null, [[0, 14]]);
                })), this.cacheOptions.ttl));

              case 2:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function getDocumentByPath(_x7) {
        return _getDocumentByPath.apply(this, arguments);
      }

      return getDocumentByPath;
    }()
    /**
     * List all documents at a certain path.
     *
     * @param path	{string} CMS path.
     * @param options {object} options
     * @param options.keepNamespace {boolean} if true don't scrub namespace from result.
     * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
     * @returns {Promise<*[]>}
     */

  }, {
    key: "listDocuments",
    value: function () {
      var _listDocuments = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee17(path) {
        var _this7 = this;

        var options,
            _args17 = arguments;
        return _regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                options = _args17.length > 1 && _args17[1] !== undefined ? _args17[1] : {};
                return _context17.abrupt("return", this.cache.namedMethod('listDocuments', _args17, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee16() {
                  var response, _iterator2, _step2, docHandle;

                  return _regeneratorRuntime.wrap(function _callee16$(_context16) {
                    while (1) {
                      switch (_context16.prev = _context16.next) {
                        case 0:
                          _context16.prev = 0;
                          _context16.next = 3;
                          return _this7.axios.get("".concat(_this7.options.xinApi, "/content/documents-list"), {
                            params: {
                              path: path,
                              fetch: options.fetch
                            }
                          });

                        case 3:
                          response = _context16.sent;

                          if (!(!response || !response.data)) {
                            _context16.next = 6;
                            break;
                          }

                          return _context16.abrupt("return", null);

                        case 6:
                          if (response.data.success) {
                            _context16.next = 8;
                            break;
                          }

                          return _context16.abrupt("return", null);

                        case 8:
                          // add hippo
                          if (response.data.documents) {
                            _iterator2 = _createForOfIteratorHelper(response.data.documents);

                            try {
                              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                                docHandle = _step2.value;

                                // clean up namespaces
                                if (!options.keepNamespace) {
                                  docHandle.document = _this7.sanitiseDocument(docHandle.document);
                                } // put hippo instance in document


                                // put hippo instance in document
                                docHandle.document.hippo = _this7;
                              }
                            } catch (err) {
                              _iterator2.e(err);
                            } finally {
                              _iterator2.f();
                            }
                          }

                          return _context16.abrupt("return", response.data);

                        case 12:
                          _context16.prev = 12;
                          _context16.t0 = _context16["catch"](0);

                          if (_context16.t0.response) {
                            _context16.next = 16;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context16.t0);

                        case 16:
                          if (!(_context16.t0.response.status === 401)) {
                            _context16.next = 18;
                            break;
                          }

                          throw new Error("Unauthorized request", _context16.t0);

                        case 18:
                        case "end":
                          return _context16.stop();
                      }
                    }
                  }, _callee16, null, [[0, 12]]);
                })), this.cacheOptions.ttl));

              case 2:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function listDocuments(_x8) {
        return _listDocuments.apply(this, arguments);
      }

      return listDocuments;
    }()
    /**
     * Convert a UUID to a path.
     *
     * @param uuid	{string} the uuid to convert to a path
     * @returns {Promise<DocumentLocation>} the path it represents.
     */

  }, {
    key: "uuidToPath",
    value: function () {
      var _uuidToPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee19(uuid) {
        var _this8 = this;

        var _args19 = arguments;
        return _regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                return _context19.abrupt("return", this.cache.namedMethod('uuidToPath', _args19, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee18() {
                  var response;
                  return _regeneratorRuntime.wrap(function _callee18$(_context18) {
                    while (1) {
                      switch (_context18.prev = _context18.next) {
                        case 0:
                          _context18.prev = 0;
                          _context18.next = 3;
                          return _this8.axios.get("".concat(_this8.options.xinApi, "/content/uuid-to-path"), {
                            params: {
                              uuid: uuid
                            }
                          });

                        case 3:
                          response = _context18.sent;

                          if (!(!response || !response.data)) {
                            _context18.next = 6;
                            break;
                          }

                          return _context18.abrupt("return", null);

                        case 6:
                          return _context18.abrupt("return", response.data);

                        case 9:
                          _context18.prev = 9;
                          _context18.t0 = _context18["catch"](0);

                          if (_context18.t0.response) {
                            _context18.next = 13;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context18.t0);

                        case 13:
                          if (!(_context18.t0.response.status === 401)) {
                            _context18.next = 15;
                            break;
                          }

                          throw new Error("Unauthorized request", _context18.t0);

                        case 15:
                        case "end":
                          return _context18.stop();
                      }
                    }
                  }, _callee18, null, [[0, 9]]);
                })), this.cacheOptions.ttl));

              case 1:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function uuidToPath(_x9) {
        return _uuidToPath.apply(this, arguments);
      }

      return uuidToPath;
    }()
    /**
     * Convert a path to a UUID
     *
     * @param path {string} is the path to convert
     * @returns {Promise<DocumentLocation>} is the uuid it represents.
     */

  }, {
    key: "pathToUuid",
    value: function () {
      var _pathToUuid = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee21(path) {
        var _this9 = this;

        var _args21 = arguments;
        return _regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                return _context21.abrupt("return", this.cache.namedMethod('pathToUuid', _args21, /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee20() {
                  var response;
                  return _regeneratorRuntime.wrap(function _callee20$(_context20) {
                    while (1) {
                      switch (_context20.prev = _context20.next) {
                        case 0:
                          _context20.prev = 0;
                          _context20.next = 3;
                          return _this9.axios.get("".concat(_this9.options.xinApi, "/content/path-to-uuid"), {
                            params: {
                              path: path
                            }
                          });

                        case 3:
                          response = _context20.sent;

                          if (!(!response || !response.data)) {
                            _context20.next = 6;
                            break;
                          }

                          return _context20.abrupt("return", null);

                        case 6:
                          return _context20.abrupt("return", response.data);

                        case 9:
                          _context20.prev = 9;
                          _context20.t0 = _context20["catch"](0);

                          if (_context20.t0.response) {
                            _context20.next = 13;
                            break;
                          }

                          throw new Error("Backend didn't respond", _context20.t0);

                        case 13:
                          if (!(_context20.t0.response.status === 401)) {
                            _context20.next = 15;
                            break;
                          }

                          throw new Error("Unauthorized request", _context20.t0);

                        case 15:
                        case "end":
                          return _context20.stop();
                      }
                    }
                  }, _callee20, null, [[0, 9]]);
                })), this.cacheOptions.ttl));

              case 1:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function pathToUuid(_x10) {
        return _pathToUuid.apply(this, arguments);
      }

      return pathToUuid;
    }()
  }]);

  return HippoConnection;
}();

module.exports = HippoConnection;