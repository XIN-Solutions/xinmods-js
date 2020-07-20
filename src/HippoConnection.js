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


const AxiosModule = require('axios');
const qs = require('qs');

const QueryBuilder = require('./QueryBuilder.js');

const DefaultOptions = {

	hippoApi: '/site/api',
	xinApi: '/site/custom-api',

};

/**
 * @typedef QueryResult
 * @property {boolean} success - true if successful
 * @property {string} message - the message from the query
 * @property {QueryResultUUID[]} uuids - a list of uuid information, one for each result
 * @property {number} totalSize - the number of results
 * @property {object} documents - map with uuid as key and
 *
 * @typedef QueryResultUUID
 * @property {string} uuid - the uuid of this document
 * @property {stirng} path - full JCR path for this document
 * @property {string} url - the local URL document details
 * @property {string} type - the type of this result
 */



class HippoConnection {

	host;
	user;
	password;
	options;
	axios;
	pathCache;

	/**
	 * Initialise the hippo connection.
	 *
	 * @param host	{string} the host to connect to
	 * @param user	{string} the user to connect with
	 * @param password {string} the password to connect with
	 * @param options {object} options that we might use.
	 */
	constructor(host, user, password, options = {}) {

		this.host = host;
		this.user = user;
		this.password = password;
		this.pathCache = {};

		this.axios = AxiosModule.create({
			timeout: 1000,
			baseURL: this.host,
			paramsSerializer(params) {
				return qs.stringify(params, {
					indices: false,
				});
			},
			auth: {
				username: this.user,
				password: this.password
			}
		});

		this.options = Object.assign({}, DefaultOptions, options || {});
	}

	/**
	 * Query builder instance returned
	 * @returns {Query}
	 */
	newQuery() {
		return new QueryBuilder(this).newQuery();
	}
	
	/**
	 * Creates starting point for where clause expression.
	 * @returns {ClauseExpression}
	 */
	newClause() {
		return new QueryBuilder(this).newClause();
	}
	
	
	/**
	 * Execute the query in `query`. Depending on the options that are provided we might have
	 * to do additional things.
	 *
	 * @param query     {string} the query to execute
	 * @param options   {object}
	 * @param options.documents {boolean} if set to true transform the uuid results into documents (default: true).
	 * @param options.namespace {boolean} keep the namespace information in the documents? (default: false)
	 * @returns {Promise<QueryResult>}
	 */
	async executeQuery(query, options = {}) {
		
		const defaultOptions = {
			namespace: true,
			documents: true
		};
		
		const opts = Object.assign({}, defaultOptions, options);
		
		try {
			
			const response = await this.axios.get(`${this.options.xinApi}/content/query?query=${encodeURIComponent(query)}`);
			
			if (!response || !response.data) {
				return null;
			}
			
			// if set to true, let's go get the actual documents for this result.
			if (opts.documents) {
				
				response.data.documents = {};
				
				for (const resultRow of response.data.uuids) {
					const {uuid} = resultRow;
					const doc = await this.getDocumentByUuid(uuid);
					
					response.data.documents[uuid] = opts.namespace ? doc : this.sanitiseDocument(doc);
				}
			}
			
			return response.data;
		}
		catch (ex) {
			
			if (!ex.response) {
				console.error("Something happened: ", ex);
			}
			
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
			
			if (ex.response.status === 501) {
				console.log("Something wrong with the query, check Hippo CMS server logs for a detailed report.");
				throw new Error(ex.response.data.message);
			}

			throw ex;
		}
	}
	
	
	/**
	 * Remove the namespace from objects
	 *
	 * @param object    the object to adapt
	 */
	sanitiseDocument(object) {
		const newObj = {};
		
		for (const prop in object) {
		
			const val = object[prop];
			const cleanKey = prop.indexOf(":") === -1 ? prop : prop.split(":")[1];
			const type = typeof(val);
			
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
	async getDocuments(options = {}) {

		try {

			const response = await this.axios.get(`${this.options.hippoApi}/documents`, {
				params: {
					_offset: options.offset,
					_max: options.max,
					_orderBy: options.orderBy,
					_sortOrder: options.sortOrder,
					_nodeType: options.nodeType,
					_query: options.query
				}
			});

			if (!response || !response.data) {
				return null;
			}

			return response.data;
		}
		catch (ex) {
			if (!ex.response) {
				console.error("Something happened: ", ex);
			}
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
		}
	}


	/**
	 * Retrieve a document from Hippo by its UUID
	 * @param uuid	{string} the uuid to retrieve
	 * @returns {object?}
	 */
	async getDocumentByUuid(uuid) {

		try {
			const response = await this.axios.get(`${this.options.hippoApi}/documents/${uuid}`);

			if (!response || !response.data) {
				return null;
			}

			return response.data;
		}
		catch (ex) {
			if (!ex.response) {
				throw ex;
			}
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
		}

	}

	/**
	 * Get a document by its path.
	 *
	 * @param path	{string} the path
	 * @returns {null|*}
	 */
	async getDocumentByPath(path) {
		const {uuid} = await this.pathToUuid(path);
		if (!uuid) {
			return null;
		}
		return await this.getDocumentByUuid(uuid);
	}

	/**
	 * List all documents at a certain path.
	 *
	 * @param path	{string} CMS path.
	 * @returns {*[]}
	 */
	async listDocuments(path) {
		try {
			const response = await this.axios.get(`${this.options.xinApi}/content/documents-list`, {
				params: {
					path
				}
			});

			if (!response || !response.data) {
				return null;
			}

			if (!response.data.success) {
				return null;
			}

			return response.data;
		}
		catch (ex) {
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
		}
	}


	/**
	 * Convert a UUID to a path.
	 *
	 * @param uuid	{string} the uuid to convert
	 * @returns {string} the path it represents.
	 */
	async uuidToPath(uuid) {

		try {
			const response = await this.axios.get(`${this.options.xinApi}/content/uuid-to-path`, {
				params: {
					uuid
				}
			});

			if (!response || !response.data) {
				return null;
			}

			return response.data;
		}
		catch (ex) {
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
		}

	}

	/**
	 * Convert a path to a UUID
	 *
	 * @param path {string} is the path to convert
	 * @returns {string} is the uuid it represents.
	 */
	async pathToUuid(path) {
		try {
			const response = await this.axios.get(`${this.options.xinApi}/content/path-to-uuid`, {
				params: {
					path
				}
			});

			if (!response || !response.data) {
				return null;
			}

			return response.data;
		}
		catch (ex) {
			if (ex.response.status === 401) {
				throw new Error("Unauthorized request", ex);
			}
		}
	}

}


module.exports = HippoConnection;
