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
const AxiosRetry = require('axios-retry');
const qs = require('qs');

const SimpleCache = require('./SimpleCache.js');
const Image = require('./Image.js');
const QueryBuilder = require('./QueryBuilder.js');
const Collections = require('./Collections.js');

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
 */

/**
 * @typedef QueryResultUUID
 * @property {string} uuid - the uuid of this document
 * @property {stirng} path - full JCR path for this document
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
	 * @param userOrJwt	{string} the user to connect with, if password is null, this will have a JWT token.
	 * @param password {?string} the password to connect with, if null `user` is sent as Bearer token.
	 * @param options {object} options that we might use.
     * @param options.cache {object} contains caching options
     * @param options.cache.enabled {boolean} cache the results if set to true
     * @param options.cache.ttl {number} ttl for cache elements
     * @param options.cache.cacheName {string} name of the cache to use
	 */
	constructor(host, userOrJwt, password, options = {}) {

	    this.cacheOptions = Object.assign({}, DefaultCacheOptions, options.cache || {});

		this.host = host;
		this.user = userOrJwt;
		this.password = password;
		this.cache = new SimpleCache(this.cacheOptions.cacheName, this.cacheOptions.enabled);

		// setup axios settings based on the type of credentials that were provided.
		const axiosSettings = Object.assign(
			{
				baseURL: this.host,
				paramsSerializer(params) {
					return qs.stringify(params, {
						indices: false,
					});
				}
			},
			this.password? { auth: { username: this.user, password: this.password } } : {},
			!this.password? { headers: { "Authorization" : "Bearer " + this.user } } : {}
		)

		this.axios = AxiosModule.create(axiosSettings);

		// add retry behaviours
		AxiosRetry(this.axios, { retries: 3, retryDelay: AxiosRetry.exponentialDelay });

		this.options = Object.assign({}, DefaultOptions, options || {});
	}

	/**
	 * Query builder instance returned
	 * @returns {Query}
	 */
	newQuery() {
		return new QueryBuilder(this).newQuery();
	}

	collection(name) {
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
	newCollectionQuery(collectionName = null) {
		if (!collectionName) {
			throw Error("Require a collection name to be specified");
		}

		// return
		return (
			new QueryBuilder(this).newQuery()
				.type("xinmods:collectionitem")
				.includePath(`/content/collections/${collectionName}`)
		);
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
	 * List all collections currently available in the Bloomreach repository
	 */
	async listCollections() {
		return this.cache.namedMethod('listCollections', [], async () => {
			try {
				const response = await this.axios.get(`${this.options.xinApi}/collections/list`);
				return response.data.collections;
			}
			catch (err) {
				console.error("couldn't retrieve list of collections", err);
				return null;
			}
		});
	}


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
	async executeQuery(query, options = {}) {

	    return this.cache.namedMethod('executeQuery', arguments, async () => {
            const defaultOptions = {
                namespace: false,
                documents: true,
				fetch: []
            };

            const opts = Object.assign({}, defaultOptions, options);

            try {

                const response =
					await this.axios.get(`${this.options.xinApi}/content/query`, {
							params: {
								query,
								fetch: opts.fetch
							}
						}
					);

                if (!response || !response.data) {
                    return null;
                }

                // if set to true and the response doesn't have any documents yet (old behaviour),
				// let's go get the actual documents for this result.
                if (opts.documents && !response.data.documents) {

                    response.data.documents = [];

                    for (const resultRow of response.data.uuids) {
                        const {uuid} = resultRow;
                        const doc = await this.getDocumentByUuid(uuid, opts);
                        response.data.documents.push(doc);
                    }
                }
                else if (opts.documents) {

                	for (const docIdx in response.data.documents) {

                		if (!response.data.documents.hasOwnProperty(docIdx)) {
                			continue;
						}

						if (!opts.namespace) {
							response.data.documents[docIdx] = this.sanitiseDocument(response.data.documents[docIdx]);
						}

						response.data.documents[docIdx].hippo = this;
					}

				}

                return response.data;
            }
            catch (ex) {

                if (!ex.response) {
                    console.error("Something happened (perhaps backend is down?) ", ex);
                    return;
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
	async getFacetAtPath(facetPath, childPath = null, options = {}) {

		return this.cache.namedMethod('getFacetAtPath', arguments, async () => {

			const defaults = {
				namespace: false,
				fetch: []
			};

			const opts = Object.assign({}, defaults, options);

			try {
				const response =
					await this.axios.get(`${this.options.xinApi}/facets/get`, {
						params: {
							facetPath,
							childPath,
							offset: opts.offset ?? 0,
							limit: opts.limit ?? 50,
							sorted: opts.sorted ?? false,
							fetch: opts.fetch
						}
					});

				if (!response || !response.data) {
					return null;
				}

				/** @type {FacetResponse} */
				const result = response.data;

				if (!opts.namespace) {
					result.facet.results = (result.facet.results || []).map(doc => {
						const convert = this.sanitiseDocument(doc);
						convert.hippo = this;
						return convert;
					});
				}

				return result.facet;
			}
			catch (ex) {
				console.log("Error: ", ex.message);
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

		const asset = link.link.ref ? link.link.ref : await this.getDocumentByUuid(link.link.id);
		return this._retrieveAssetLink(asset);
	}


	/**
	 * Retrieve an asset url from a linked asset.
	 *
	 * @param link	the link object
	 * @returns {?string} the url for this asset.
	 */
	getAssetUrlFromLinkSync(link) {
		if (!link || !link.link || link.link.type !== "local" || !link.link.id) {
			return null;
		}

		if (!link.link.ref) {
			console.error("error: cannot determine asset link synchronously without pre-populated references.");
			return null;
		}

		const asset = link.link.ref;
		return this._retrieveAssetLink(asset);
	}


	/**
	 * Logic to retrieve the asset url for.
	 * @param asset {object} the asset object returned by brxm.
	 * @returns {string|null}
	 * @private
	 */
	_retrieveAssetLink(asset) {
		const uri = asset ? asset.items.asset.link.url : null;
		if (!uri) {
			return null;
		}

		// pop last two elements off of the asset url if hippogallery is part of the url.
		const uriParts = uri.split("/");
		if (uri.indexOf("/hippogallery") !== -1) {
			uriParts.pop(); uriParts.pop();
		}
		const normalisedUri = uriParts.join("/");
		const lastMod = new Date(asset.items.asset.lastModified).getTime();
		if (this.options.cdnUrl) {
			return `${this.options.cdnUrl}${normalisedUri}?v=${lastMod}`;
		}
		else {
			return `${normalisedUri}?v=${lastMod}`;
		}
	}

	/**
	 * Retrieve the image object for an image link object
	 * @param imageLink  the link object
	 * @returns {?Image}
	 */
	getImageFromLinkSync(imageLink) {
		if (!imageLink || !imageLink.link || !imageLink.link.id) {
			return null;
		}

		// if the link was prefetched use the `ref` object to populate the Image instance
		if (imageLink.link.ref) {
			return new Image(this, imageLink.link.ref, imageLink.link.ref);
		}

		console.error("error: could not load image link without pre-populated reference.")
		return null;
	}

	/**
	 * Retrieve the image object for an image link object
	 * @param imageLink  the link object
	 * @returns {Promise<null|Image>}
	 */
	async getImageFromLink(imageLink) {
        if (!imageLink || !imageLink.link || !imageLink.link.id) {
			return null;
		}

        // if the link was prefetched use the `ref` object to populate the Image instance
        if (imageLink.link.ref) {
        	return new Image(this, imageLink.link.ref, imageLink.link.ref);
		}

		const imageUuid = imageLink.link.id
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
	 * @param options {object} the options object
	 * @param options.namespace {boolean} set to true if you'd like to get the namespace labels in the results
	 * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
	 * @returns {object?}
	 */
	async getDocumentByUuid(uuid, options = {}) {
	    return this.cache.namedMethod('getDocumentByUuid', arguments, async () => {

            const defaults = {
                namespace: false,
				fetch: []
            };

            const opts = Object.assign({}, defaults, options);

            try {
                const response =
					await this.axios.get(`${this.options.xinApi}/content/document-with-uuid`, {
                		params: {
                			uuid,
							fetch: opts.fetch
						}
					});

                if (!response || !response.data) {
                    return null;
                }

                const doc = response.data.document;
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
	 * @param options {object} the options object
	 * @param options.namespace {boolean} set to true if you'd like to get the namespace labels in the results
	 * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
	 * @returns {null|*}
	 */
	async getDocumentByPath(path, options = {}) {
		return this.cache.namedMethod('getDocumentByPath', arguments, async () => {

			try {
				const defaults = {
					namespace: false,
					fetch: []
				};

				const opts = Object.assign({}, defaults, options);
				const response = await this.axios.get(
					`${this.options.xinApi}/content/document-at-path`, {
						params: {
							path,
							fetch: opts.fetch
						}
					}
				);

				if (!response || !response.data || !response.data.document) {
					return null;
				}

				const doc = response.data.document;
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
	 * List all documents at a certain path.
	 *
	 * @param path	{string} CMS path.
	 * @param options {object} options
	 * @param options.keepNamespace {boolean} if true don't scrub namespace from result.
	 * @param options.fetch {string[]} a list of elements to fetch during the request so we don't have to do roundtrips
	 * @returns {Promise<*[]>}
	 */
	async listDocuments(path, options = {}) {
	    return this.cache.namedMethod('listDocuments', arguments, async () => {
            try {
                const response = await this.axios.get(`${this.options.xinApi}/content/documents-list`, {
                    params: {
                        path,
						fetch: options.fetch
                    }
                });

                if (!response || !response.data) {
                    return null;
                }

                if (!response.data.success) {
                    return null;
                }

                // add hippo
                if (response.data.documents) {
                	for (const docHandle of response.data.documents) {
                		// clean up namespaces
                		if (!options.keepNamespace) {
                			docHandle.document = this.sanitiseDocument(docHandle.document);
						}

                		// put hippo instance in document
						docHandle.document.hippo = this;
					}
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
