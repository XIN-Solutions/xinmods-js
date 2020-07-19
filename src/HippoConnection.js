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
const http = require('http');
const https = require('http');
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const PackageCommands = require('./PackageCommands.js');
const QueryBuilder = require('./QueryBuilder.js');

const DefaultOptions = {

	hippoApi: '/site/api',
	xinApi: '/site/custom-api',

};

class HippoConnection {

	host;
	user;
	password;
	options;
	axios;

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

		this.axios = AxiosModule.create({
			httpAgent,
			httpsAgent,
			timeout: 1000,
			baseURL: this.host,
			paramsSerializer(params) {
				return qs.stringify(params, {
					indices: false
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
	 * Commands to deal with the package manager.
	 *
	 * @returns {PackageCommands}
	 */
	// packages() {
	// 	return new PackageCommands(this);
	// }

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

	
	async executeQuery(query) {
		try {
			
			const response = await this.axios.get(`${this.options.xinApi}/content/query`, {
				params: {
					query
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
			throw ex;
		}
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
