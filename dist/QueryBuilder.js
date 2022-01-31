require("core-js/modules/es.array.slice.js");

require("core-js/modules/es.function.name.js");

require("core-js/modules/es.array.from.js");

require("core-js/modules/es.string.iterator.js");

require("core-js/modules/es.symbol.js");

require("core-js/modules/es.symbol.description.js");

require("core-js/modules/es.symbol.iterator.js");

require("core-js/modules/es.array.iterator.js");

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.array.is-array.js");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var _defineProperty = require("@babel/runtime/helpers/defineProperty");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

require("core-js/modules/es.object.define-property.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.replace.js");

require("core-js/modules/es.string.repeat.js");

require("core-js/modules/es.array.concat.js");

require("core-js/modules/es.array.for-each.js");

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/web.dom-collections.for-each.js");

/**
 * @callback IfExpression
 * @param {ClauseExpression} clause
 */

/**
 * A query builder class with some functions that hand off to other classes
 */
var QueryBuilder = /*#__PURE__*/function () {
  "use strict";

  /**
   * Initialise the query builder
   *
   * @param hippo {HippoConnection} connection instance
   */
  function QueryBuilder(hippo) {
    _classCallCheck(this, QueryBuilder);

    _defineProperty(this, "hippo", void 0);

    Object.defineProperty(this, 'hippo', {
      value: hippo,
      writable: false
    });
  }
  /**
  	 * @returns {Query} a new query instance
   */


  _createClass(QueryBuilder, [{
    key: "newQuery",
    value: function newQuery() {
      return new Query(this.hippo);
    }
    /**
     * Returns a new WHERE clause, you might want to use this when you're building
     * a clause dynamically. You can then set it in `.where()` of the query builder.
     * If clausetype is specified you could build partial query elements to add in .and() and .or() as parameters.
     *
     * @param clauseType {string} the type of clause we're writing
     * @returns {ClauseExpression} a new WHERE expression clause
     */

  }, {
    key: "newClause",
    value: function newClause(clauseType) {
      return new ClauseExpression(clauseType || 'where');
    }
  }]);

  return QueryBuilder;
}();
/**
 * Helper function to build a little operator map
 * @param op        the operator name
 * @param field     the field it applies to
 * @param value     the value to set
 *
 * @returns {{op: *, field: *, value: *}}
 */


function operator(op, field, value) {
  if (typeof value === 'string') {
    value = value.replace(/'/g, "\\'");
  }

  return {
    op: op,
    field: field,
    value: value
  };
}
/**
 * An object that contains information about clauses in the where clause, this
 * can be the first level, or a deeper down compound expression (like OR and AND).
 */


var ClauseExpression = /*#__PURE__*/function () {
  "use strict";

  function ClauseExpression(prefix, stack) {
    var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    _classCallCheck(this, ClauseExpression);

    _defineProperty(this, "parent", void 0);

    _defineProperty(this, "prefix", void 0);

    _defineProperty(this, "expressions", void 0);

    _defineProperty(this, "level", void 0);

    this.prefix = prefix;
    this.parent = stack;
    this.expressions = [];
    this.level = level;
  }

  _createClass(ClauseExpression, [{
    key: "nop",
    value: function nop() {
      return this;
    }
    /**
     * Add a part of the query given a certain condition being true.
     *
     * @param expr {boolean}  the expression that should be true
     * @param thenCond {IfExpression} the condition to run if expr is true
     * @param elseCond {IfExpression?} the condition to run if expr is false
     * @returns {ClauseExpression}
     */

  }, {
    key: "if",
    value: function _if(expr, thenCond, elseCond) {
      if (expr) {
        thenCond(this);
      } else if (elseCond) {
        elseCond(this);
      }

      return this;
    }
    /**
     * Field equals a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "equals",
    value: function equals(field, value) {
      this.expressions.push(operator('eq', field, value));
      return this;
    }
    /**
     * Field equals a certain value and we don't care about the case
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "equalsIgnoreCase",
    value: function equalsIgnoreCase(field, value) {
      this.expressions.push(operator('ieq', field, value));
      return this;
    }
    /**
     * Field does not equal a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "notEquals",
    value: function notEquals(field, value) {
      this.expressions.push(operator('neq', field, value));
      return this;
    }
    /**
     * Field does not equal a certain value  and we don't care about the case
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "notEqualsIgnoreCase",
    value: function notEqualsIgnoreCase(field, value) {
      this.expressions.push(operator('ineq', field, value));
      return this;
    }
    /**
     * Field contains a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "contains",
    value: function contains(field, value) {
      this.expressions.push(operator('contains', field, value));
      return this;
    }
    /**
     * Field does not contain a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "notContains",
    value: function notContains(field, value) {
      this.expressions.push(operator('!contains', field, value));
      return this;
    }
    /**
     * Field is null
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "isNull",
    value: function isNull(field, value) {
      this.expressions.push(operator('null', field, value));
      return this;
    }
    /**
     * Field is not null
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "isNotNull",
    value: function isNotNull(field, value) {
      this.expressions.push(operator('notnull', field));
      return this;
    }
    /**
     * Field greater than
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "gt",
    value: function gt(field, value) {
      this.expressions.push(operator('gt', field, value));
      return this;
    }
    /**
     * Field greater than or equal to
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "gte",
    value: function gte(field, value) {
      this.expressions.push(operator('gte', field, value));
      return this;
    }
    /**
     * Field lower than a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "lt",
    value: function lt(field, value) {
      this.expressions.push(operator('lt', field, value));
      return this;
    }
    /**
     * Field lower than or equal to a certain value
     *
     * @param field the field to check
     * @param value the value to check for
     *
     * @returns {ClauseExpression}
     */

  }, {
    key: "lte",
    value: function lte(field, value) {
      this.expressions.push(operator('lte', field, value));
      return this;
    }
    /**
     * Creates a new compound expression for 'and'
     * @returns {ClauseExpression}
     */

  }, {
    key: "and",
    value: function and() {
      var expr = new ClauseExpression('and', this, this.level + 1); // specified clauses already? just push those and return `this` (shortcutting the fluid api)

      for (var _len = arguments.length, elements = new Array(_len), _key = 0; _key < _len; _key++) {
        elements[_key] = arguments[_key];
      }

      if (elements.length > 0) {
        this.expressions.push(expr);

        var _iterator = _createForOfIteratorHelper(elements),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var el = _step.value;

            if (!el) {
              continue;
            }

            el.parent = expr;
            expr.expressions.push(el);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      } else {
        this.expressions.push(expr);
      }

      return expr;
    }
    /**
     * Creates a new compound expression for 'or'
     * @returns {ClauseExpression}
     */

  }, {
    key: "or",
    value: function or() {
      var expr = new ClauseExpression('or', this, this.level + 1); // specified clauses already? just push those and return `this` (shortcutting the fluid api)

      for (var _len2 = arguments.length, elements = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        elements[_key2] = arguments[_key2];
      }

      if (elements.length > 0) {
        this.expressions.push(expr);

        var _iterator2 = _createForOfIteratorHelper(elements),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var el = _step2.value;

            if (!el) {
              continue;
            }

            el.parent = expr;
            expr.expressions.push(el);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      } else {
        this.expressions.push(expr);
      }

      return expr;
    }
    /**
     * Call this function to return back up a level.
     * @returns {ClauseExpression} the parent instance.
     */

  }, {
    key: "end",
    value: function end() {
      return this.parent;
    }
    /**
     * Turn the clause expression into a string that will be a valid query string
     * for the XIN Mods API.
     *
     * @returns {string} the string that expresses the clause expression
     */

  }, {
    key: "toQuery",
    value: function toQuery() {
      if (this.expressions.length === 0) {
        return '';
      }

      var indent = "\t".repeat(this.level);
      var qPart = "".concat(indent, "(").concat(this.prefix, " \n");

      var toValue = function toValue(val) {
        if (typeof val === "undefined") {
          return '';
        }

        if (typeof val === 'string') {
          return " '".concat(val, "'");
        }

        return " ".concat(val);
      };

      var _iterator3 = _createForOfIteratorHelper(this.expressions),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var expr = _step3.value;

          if (expr instanceof ClauseExpression) {
            qPart += expr.toQuery();
          } else {
            qPart += "".concat(indent, "\t(").concat(expr.op, " [").concat(expr.field, "]").concat(toValue(expr.value), ")\n");
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      qPart += "".concat(indent, ")\n");
      return qPart;
    }
  }]);

  return ClauseExpression;
}();
/**
 * The query class
 */


var Query = /*#__PURE__*/function () {
  "use strict";

  /**
   * Initialise the query object.
   * @param hippo the hippo connector.
   */
  function Query(hippo) {
    _classCallCheck(this, Query);

    _defineProperty(this, "hippo", void 0);

    _defineProperty(this, "data", {
      scopes: {
        include: [],
        exclude: []
      }
    });

    Object.defineProperty(this, 'hippo', {
      value: this,
      writable: false
    });
  }
  /**
   * The type of node we're looking for.
   *
   * @param typeName
   * @returns {Query}
   */


  _createClass(Query, [{
    key: "type",
    value: function type(typeName) {
      this.data.typeName = typeName;
      return this;
    }
    /**
     * If called, we also want to get the subtypes of previously defined typename
     * @returns {Query}
     */

  }, {
    key: "withSubtypes",
    value: function withSubtypes() {
      this.data.withSubtypes = true;
      return this;
    }
    /**
     * The offset to start returning results for
     *
     * @param offset {number} the offset.
     * @returns {Query}
     */

  }, {
    key: "offset",
    value: function offset(_offset) {
      this.data.offset = _offset;
      return this;
    }
    /**
     * The maximum number results to get.
     *
     * @param limit {number} the limit
     * @returns {Query}
     */

  }, {
    key: "limit",
    value: function limit(_limit) {
      this.data.limit = _limit;
      return this;
    }
    /**
     * The path scope to include.
     * @param path the path to include
     * @returns {Query}
     */

  }, {
    key: "includePath",
    value: function includePath(path) {
      this.data.scopes.include.push(path);
      return this;
    }
  }, {
    key: "excludePath",
    value: function excludePath(path) {
      this.data.scopes.exclude.push(path);
      return this;
    }
  }, {
    key: "where",
    value: function where() {
      var clause = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (clause === null) {
        return this.data.whereClause = new ClauseExpression('where', this);
      }

      this.data.whereClause = clause;
      return this;
    }
  }, {
    key: "orderBy",
    value: function orderBy(field) {
      var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'asc';
      this.data.orderBy = field;
      this.data.direction = direction;
      return this;
    }
  }, {
    key: "build",
    value: function build() {
      var qStr = "(query \n";

      if (this.data.typeName) {
        qStr += "\t(type ".concat(this.data.withSubtypes ? 'with-subtypes' : '', " '").concat(this.data.typeName, "')\n");
      }

      if (this.data.offset) {
        qStr += "\t(offset ".concat(this.data.offset, ")\n");
      }

      if (this.data.limit) {
        qStr += "\t(limit ".concat(this.data.limit, ")\n");
      }

      if (this.data.scopes.include.length > 0 || this.data.scopes.exclude.length > 0) {
        qStr += "\t(scopes\n";
        this.data.scopes.include.forEach(function (scope) {
          return qStr += "\t\t(include '".concat(scope, "')\n");
        });
        this.data.scopes.exclude.forEach(function (scope) {
          return qStr += "\t\t(exclude '".concat(scope, "')\n");
        });
        qStr += "\t)\n";
      }

      if (this.data.whereClause) {
        qStr += this.data.whereClause.toQuery();
      }

      if (this.data.orderBy) {
        qStr += "\t(sortby [".concat(this.data.orderBy, "] ").concat(this.data.direction, ")\n");
      }

      qStr += ")";
      return qStr;
    }
  }]);

  return Query;
}();

module.exports = QueryBuilder;