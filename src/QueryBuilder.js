/**
 * @callback IfExpression
 * @param {ClauseExpression} clause
 */

/**
 * A query builder class with some functions that hand off to other classes
 */
export class QueryBuilder {

	hippo;

	/**
	 * Initialise the query builder
	 *
	 * @param hippo {BloomreachConnection} connection instance
	 */
	constructor(hippo) {
		Object.defineProperty(this, 'hippo', {value: hippo, writable: false});
	}

	/**
 	 * @returns {Query} a new query instance
	 */
	newQuery() {
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
	newClause(clauseType) {
		return new ClauseExpression(clauseType || 'where')
	}


}

/**
 * Helper function to build a little operator map
 * @param op        the operator name
 * @param field     the field it applies to
 * @param value     the value to set
 *
 * @returns {{op: *, field: *, value: *}}
 */
function operator(op, field, value) {
	if (typeof(value) === 'string') {
		value = value.replace(/'/g, "\\'");
	}
	return {op, field, value};
}

/**
 * An object that contains information about clauses in the where clause, this
 * can be the first level, or a deeper down compound expression (like OR and AND).
 */
export class ClauseExpression {

	parent;
	prefix;
	expressions;
	level;

	constructor(prefix, stack, level = 1) {
		this.prefix = prefix;
		this.parent = stack;
		this.expressions = [];
		this.level = level;
	}

	nop() {
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
    if(expr, thenCond, elseCond) {
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
	equals(field, value) {
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
	equalsIgnoreCase(field, value) {
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
	notEquals(field, value) {
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
	notEqualsIgnoreCase(field, value) {
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
	contains(field, value) {
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
	notContains(field, value) {
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
	isNull(field, value) {
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
	isNotNull(field, value) {
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
	gt(field, value) {
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
	gte(field, value) {
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
	lt(field, value) {
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
	lte(field, value) {
		this.expressions.push(operator('lte', field, value));
		return this;
	}


	/**
	 * Creates a new compound expression for 'and'
	 * @returns {ClauseExpression}
	 */
	and(...elements) {
		const expr = new ClauseExpression('and', this, this.level + 1);

		// specified clauses already? just push those and return `this` (shortcutting the fluid api)
		if (elements.length > 0) {
			this.expressions.push(expr);
			for (const el of elements) {
                if (!el) {
                    continue;
                }

                el.parent = expr;
				expr.expressions.push(el);
			}
		}
		else {
			this.expressions.push(expr);
		}
		return expr;
	}

	/**
	 * Creates a new compound expression for 'or'
	 * @returns {ClauseExpression}
	 */
	or(...elements) {
		const expr = new ClauseExpression('or', this, this.level + 1);

		// specified clauses already? just push those and return `this` (shortcutting the fluid api)
		if (elements.length > 0) {
			this.expressions.push(expr);
			for (const el of elements) {
			    if (!el) {
			        continue;
                }
				el.parent = expr;
				expr.expressions.push(el);
			}
		}
		else {
			this.expressions.push(expr);
		}
		return expr;
	}

	/**
	 * Call this function to return back up a level.
	 * @returns {ClauseExpression} the parent instance.
	 */
	end() {
		return this.parent;
	}

	/**
	 * Turn the clause expression into a string that will be a valid query string
	 * for the XIN Mods API.
	 *
	 * @returns {string} the string that expresses the clause expression
	 */
	toQuery() {
		if (this.expressions.length === 0) {
			return '';
		}

		const indent = "\t".repeat(this.level);
		let qPart = `${indent}(${this.prefix} \n`;

		const toValue = (val) => {
			if (typeof val === "undefined") {
				return '';
			}
			if (typeof val === 'string') {
				return ` '${val}'`;
			}
			return ` ${val}`;
		}

		for (const expr of this.expressions) {
			if (expr instanceof ClauseExpression) {
				qPart += expr.toQuery();
			}
			else {
				qPart += `${indent}\t(${expr.op} [${expr.field}]${toValue(expr.value)})\n`;
			}
		}

		qPart += `${indent})\n`;
		return qPart;
	}

}


/**
 * The query class
 */
export class Query {

	hippo;

	data = {
		scopes: {
			include: [],
			exclude: []
		}
	};

	/**
	 * Initialise the query object.
	 * @param hippo the hippo connector.
	 */
	constructor(hippo) {
		Object.defineProperty(this, 'hippo', {value: this, writable: false});
	}

	/**
	 * The type of node we're looking for.
	 *
	 * @param typeName
	 * @returns {Query}
	 */
	type(typeName) {
		this.data.typeName = typeName;
		return this;
	}

	/**
	 * If called, we also want to get the subtypes of previously defined typename
	 * @returns {Query}
	 */
	withSubtypes() {
		this.data.withSubtypes = true;
		return this;
	}

	/**
	 * The offset to start returning results for
	 *
	 * @param offset {number} the offset.
	 * @returns {Query}
	 */
	offset(offset) {
		this.data.offset = offset;
		return this;
	}

	/**
	 * The maximum number results to get.
	 *
	 * @param limit {number} the limit
	 * @returns {Query}
	 */
	limit(limit) {
		this.data.limit = limit;
		return this;
	}

	/**
	 * The path scope to include.
	 * @param path the path to include
	 * @returns {Query}
	 */
	includePath(path) {
		this.data.scopes.include.push(path);
		return this;
	}

	excludePath(path) {
		this.data.scopes.exclude.push(path);
		return this;
	}

	where(clause = null) {
		if (clause === null) {
			return (this.data.whereClause = new ClauseExpression('where', this));
		}

		this.data.whereClause = clause;
		return this;
	}

	orderBy(field, direction = 'asc') {
		this.data.orderBy = field;
		this.data.direction = direction;
		return this;
	}

	build() {
		let qStr = "(query \n";

		if (this.data.typeName) {
			qStr += `\t(type ${this.data.withSubtypes? 'with-subtypes' : ''} '${this.data.typeName}')\n`;
		}

		if (this.data.offset) {
			qStr += `\t(offset ${this.data.offset})\n`;
		}

		if (this.data.limit) {
			qStr += `\t(limit ${this.data.limit})\n`;
		}

		if (this.data.scopes.include.length > 0 || this.data.scopes.exclude.length > 0) {
			qStr += `\t(scopes\n`;

			this.data.scopes.include.forEach((scope) => qStr += `\t\t(include '${scope}')\n`);
			this.data.scopes.exclude.forEach((scope) => qStr += `\t\t(exclude '${scope}')\n`);

			qStr += `\t)\n`;
		}

		if (this.data.whereClause) {
			qStr += this.data.whereClause.toQuery();
		}

		if (this.data.orderBy) {
			qStr += `\t(sortby [${this.data.orderBy}] ${this.data.direction})\n`;
		}


		qStr += ")";

		return qStr;
	}

}
