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

const SimpleCache = require('./SimpleCache.js');
const Image = require('./Image.js');
const QueryBuilder = require('./QueryBuilder.js');

const DefaultOptions = {

	hippoApi: '/site/api',
	xinApi: '/site/custom-api',
	assetPath: '/site/binaries',
	assetModPath: '/site/assetmod',
    cdnUrl: null,

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
 *
 * @typedef DocumentLocation
 * @property {boolean} success - true if something useful was returned
 * @property {string} message - the message that came back
 * @property {string} path - the path we've retrieved
 * @property {string} type - the type of the node that lives there
 * @property {string} uuid - the uuid of the node
 */

const DefaultCacheOptions = {
    enabled: false,
    ttl: 360,
    cacheName: 'hippo-cache'
};

class HippoConnection {

	host;
	user;
	password;
	options;
	axios;

	/** @type {SimpleCache} */
	cache;

	cacheOptions;



	/**
	 * Initialise the hippo connection.
	 *
	 * @param host	{string} the host to connect to
	 * @param user	{string} the user to connect with
	 * @param password {string} the password to connect with
	 * @param options {object} options that we might use.
     * @param options.cache {object} contains caching options
     * @param options.cache.enabled {boolean} cache the results if set to true
     * @param options.cache.ttl {number} ttl for cache elements
     * @param options.cache.cacheName {string} name of the cache to use
	 */
	constructor(host, user, password, options = {}) {

	    this.cacheOptions = Object.assign({}, DefaultCacheOptions, options.cache || {});

		this.host = host;
		this.user = user;
		this.password = password;
		this.cache = new SimpleCache(this.cacheOptions.cacheName, this.cacheOptions.enabled);

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
	 * @param clauseType {string} the type of clause we're creating.
	 * @returns {ClauseExpression}
	 */
	newClause(clauseType) {
		return new QueryBuilder(this).newClause(clauseType);
	}

	newExternalImage(src) {
	    return new Image(this, {}, {}).external(src);
    }

	/**
	 * Convenience methods for creating 'and' clause expression
	 * @returns {ClauseExpression}
	 */
	andClause() {
		return this.newClause('and');
	}

	/**
	 * Convenience methods for creating 'or' clause expression
	 * @returns {ClauseExpression}
	 */
	orClause() {
		return this.newClause('or');
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

	    return this.cache.namedMethod('executeQuery', arguments, async () => {
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
                        const doc = await this.getDocumentByUuid(uuid, opts);
                        response.data.documents[uuid] = doc;
                    }
                }

                return response.data;
            }
            catch (ex) {

                if (!ex.response) {
                    console.error("Something happened (perhaps backend is down?) ", ex);
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
        }, this.cacheOptions.ttl);


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
	    return this.cache.namedMethod('getDocuments', arguments, async () => {

            try {

                const response = await this.axios.get(`${this.options.hippoApi}/documents`, {
                    params: {
                        _offset: options.offset,
                        _max: options.max,
                        _orderBy: options.orderBy,
                        _sortOrder: options.sortOrder,
                        _nodetype: options.nodeType,
                        _query: options.query
                    }
                });

                if (!response || !response.data) {
                    return null;
                }

                const returnData = response.data;
                returnData.hippo = this;
                return returnData;
            }
            catch (ex) {
                if (!ex.response) {
                    console.error("Something happened (perhaps backend is down?)", ex);
                }
                if (ex.response.status === 401) {
                    throw new Error("Unauthorized request", ex);
                }
            }
        }, this.cacheOptions.ttl);

	}

	/**
	 * @returns {boolean} true if the date was set.
	 */
	hasDate(value) {
		return value.indexOf("0001") !== 0
	}

	/**
	 * Determine whether a link was set.
	 * @param link the link object
	 * @returns {boolean} true if the link was set
	 */
	isLinkSpecified(link) {
		return link && link.link && link.link.type === 'local';
	}

	/**
	 * Retrieve an asset url from a linked asset.
	 *
	 * @param link	the link object
	 * @returns {Promise<null|*>}
	 */
	async getAssetUrlFromLink(link) {
        if (!link || !link.link || link.link.type !== "local" || !link.link.id) {
			return null;
		}

		const asset = await this.getDocumentByUuid(link.link.id);
		const uri = asset? asset.items.asset.link.url : null;
		if (!uri) {
		    return null;
        }

		const lastMod = new Date(asset.items.asset.lastModified).getTime();
        if (this.options.cdnUrl) {
            return `${this.options.cdnUrl}${uri}?v=${lastMod}`;
        }
        else {
            return `${this.host}${uri}?v=${lastMod}`;
        }
	}

	/**
	 * Retrieve the image object for an image link object
	 * @param link  the link object
	 * @returns {Promise<null|Image>}
	 */
	async getImageFromLink(link) {
        if (!link || !link.link || !link.link.id) {
			return null;
		}

		const imageUuid = link.link.id
		return this.getImageFromUuid(imageUuid);
	}

	/**
	 * Retrieve an image by its UUID
	 *
	 * @param imageUuid
	 * @returns {Promise<Image|null>}
	 */
	async getImageFromUuid(imageUuid) {
        try {
			const pathInfo = await this.uuidToPath(imageUuid);
			if (pathInfo === null) {
				return null;
			}

			const imageInfo = await this.getDocumentByUuid(imageUuid);
			return new Image(this, pathInfo, imageInfo);
		}
		catch (ex) {
			console.error("Something happened while grabbing the image uuid, caused by:", ex);
			return null;
		}
	}

	/**
	 * Retrieve a document from Hippo by its UUID
	 * @param uuid	{string} the uuid to retrieve
	 * @returns {object?}
	 */
	async getDocumentByUuid(uuid, options = {}) {
	    return this.cache.namedMethod('getDocumentByUuid', arguments, async () => {

            const defaults = {
                namespace: false
            };

            const opts = Object.assign({}, defaults, options);

            try {
                const response = await this.axios.get(`${this.options.hippoApi}/documents/${uuid}`);

                if (!response || !response.data) {
                    return null;
                }

                const doc = response.data;
                const returnDoc = (opts.namespace ? doc : this.sanitiseDocument(doc));
                returnDoc.hippo = this;
                return returnDoc;
            }
            catch (ex) {
                if (!ex.response) {
                    throw new Error("Backend didn't respond", ex);
                }
                if (ex.response.status === 401) {
                    throw new Error("Unauthorized request", ex);
                }
            }
        }, this.cacheOptions.ttl);


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
	    return this.cache.namedMethod('listDocuments', arguments, async () => {
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
                if (!ex.response) {
                    throw new Error("Backend didn't respond", ex);
                }
                if (ex.response.status === 401) {
                    throw new Error("Unauthorized request", ex);
                }
            }
        }, this.cacheOptions.ttl);

	}


	/**
	 * Convert a UUID to a path.
	 *
	 * @param uuid	{string} the uuid to convert to a path
	 * @returns {Promise<DocumentLocation>} the path it represents.
	 */
	async uuidToPath(uuid) {
        return this.cache.namedMethod('uuidToPath', arguments, async () => {
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
                if (!ex.response) {
                    throw new Error("Backend didn't respond", ex);
                }
                if (ex.response.status === 401) {
                    throw new Error("Unauthorized request", ex);
                }
            }
        }, this.cacheOptions.ttl);


	}

	/**
	 * Convert a path to a UUID
	 *
	 * @param path {string} is the path to convert
	 * @returns {Promise<DocumentLocation>} is the uuid it represents.
	 */
	async pathToUuid(path) {
	    return this.cache.namedMethod('pathToUuid', arguments, async () => {
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
                if (!ex.response) {
                    throw new Error("Backend didn't respond", ex);
                }
                if (ex.response.status === 401) {
                    throw new Error("Unauthorized request", ex);
                }
            }
        }, this.cacheOptions.ttl);

	}

}


module.exports = HippoConnection;
