function operator(op, field, value) {
	return {op, field, value};
}

/**
 * Hippo
 */
class QueryBuilder {

	hippo;

	constructor(hippo) {
		this.hippo = hippo;
	}

	newQuery() {
		return new Query(this.hippo);
	}

	newClause() {
		return new ClauseExpression('where')
	}
	
	
}


class ClauseExpression {
	
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
	
	equals(field, value) {
		this.expressions.push(operator('=', field, value));
		return this;
	}
	
	equalsIgnoreCase(field, value) {
		this.expressions.push(operator('i=', field, value));
		return this;
	}
	
	notEquals(field, value) {
		this.expressions.push(operator('!=', field, value));
		return this;
	}
	
	notEqualsIgnoreCase(field, value) {
		this.expressions.push(operator('i!=', field, value));
		return this;
	}
	
	contains(field, value) {
		this.expressions.push(operator('contains', field, value));
		return this;
	}
	
	notContains(field, value) {
		this.expressions.push(operator('!contains', field, value));
		return this;
	}
	
	isNull(field, value) {
		this.expressions.push(operator('null', field, value));
		return this;
	}
	
	isNotNull(field, value) {
		this.expressions.push(operator('notnull', field));
		return this;
	}
	
	
	gt(field, value) {
		this.expressions.push(operator('>', field, value));
		return this;
	}
	
	gte(field, value) {
		this.expressions.push(operator('>=', field, value));
		return this;
	}
	
	
	lt(field, value) {
		this.expressions.push(operator('<', field, value));
		return this;
	}

	
	lte(field, value) {
		this.expressions.push(operator('<=', field, value));
		return this;
	}


	and() {
		const expr = new ClauseExpression('and', this, this.level + 1);
		this.expressions.push(expr);
		return expr;
	}
	
	or() {
		const expr = new ClauseExpression('or', this, this.level + 1);
		this.expressions.push(expr);
		return expr;
	}
	
	end() {
		return this.parent;
	}

	
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

class Query {

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
		this.hippo = hippo;
	}

	type(typeName) {
		this.data.typeName = typeName;
		return this;
	}

	withSubtypes() {
		this.data.withSubtypes = true;
		return this;
	}

	offset(offset) {
		this.data.offset = offset;
		return this;
	}

	limit(limit) {
		this.data.limit = limit;
		return this;
	}

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

		if (this.data.orderBy) {
			qStr += `\t(sortby [${this.data.orderBy}] ${this.data.direction})\n`;
		}

		if (this.data.whereClause) {
			qStr += this.data.whereClause.toQuery();
		}
		
		qStr += ")";
		
		return qStr;
	}

}


module.exports = QueryBuilder;
