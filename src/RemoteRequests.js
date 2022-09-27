import AxiosRetry from 'axios-retry';
import AxiosModule from 'axios';
import * as qs from 'qs';
import base64 from 'base-64';


/**
 * A simple abstraction that can use either `axios` or the fetch API
 */
export class RemoteRequests {
	
	/**
	 * @type {'fetch'|'axios'}
	 */
	apiType;
	
	/**
	 * Axios instance
	 */
	axios;
	
	/**
	 * @type {RequestInit}
	 */
	fetchOptions;
	
	host;
	user;
	password;
	
	/**
	 * Initialise the hippo connection.
	 *
	 * @param apiType {'fetch'|'axios'} which API to use to connect to the API.
	 * @param host	{string} the host to connect to
	 * @param user {string} the user to connect with.
	 * @param password {?string} the password to connect with, if null `user` is sent as Bearer token.
	 * @param options {object} options that we might use.
	 * @param options.hippoApi {string} path to built-in APIs
	 * @param options.xinApi {string} path to custom APIs
	 * @param options.assetPath {string} where to find images and assets
	 * @param options.assetModPath {string} the prefix for modifying assets
	 * @param options.cdnUrl {?string} custom URL for binaries (so it can go through something like CloudFront)
	 * @param options.apiType {'fetch'|'axios'} which API to use to connect to the API.
	 */
	constructor(apiType, host, user, password, options) {
		
		this.apiType = apiType;
		this.host = host;
		this.user = user;
		this.password = password;
		
		this.initialiseAxios();
		this.initialiseFetchOptions();
	}
	
	
	/**
	 * Initialise the fetch options
	 */
	initialiseFetchOptions() {
		this.fetchOptions = {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': "Basic " + base64.encode(`${this.user}:${this.password}`),
			}
		};
	}
	
	/**
	 * Initialise Axios module
	 */
	initialiseAxios() {
		
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
		
	}
	
	
	/**
	 * Call into axios or 'fetch' depending on the apiType setting.
	 *
	 * @param url {string} the URL to invoke
	 * @param options {?object} options object
	 * @param options.params {?object} parameters to pass in.
	 * @returns {Promise<{data: any}|*>}
	 */
	async get(url, options) {
		switch (this.apiType) {
			case 'axios':
				return await this.axios.get(url, options);
				
			case 'fetch':
				const fetchUrl = this._fetchUrl(url, options);
				const getResult = await fetch(fetchUrl, this.fetchOptions);
				const jsonResponse = await getResult?.json();
				return {data: jsonResponse};
		}
	}
	
	/**
	 *
	 * @param url {string}
	 * @param body {object}
	 * @returns {Promise<*|AxiosResponse<any>>}
	 */
	async post(url, body) {
		switch (this.apiType) {
			case 'axios':
				return await this.axios.post(url, body);
				
			case 'fetch':
				const fetchUrl = this._fetchUrl(url);
				const postResult = await fetch(fetchUrl, {
					...this.fetchOptions,
					method: "POST",
					body: JSON.stringify(body)
				});
				const jsonResponse = await postResult?.json();
				return {data: jsonResponse};
		}
	}
	
	/**
	 *
	 * @param url {string} the URL to call 'delete' on.
	 * @returns {Promise<{data: any}|*>}
	 */
	async delete(url) {
		switch (this.apiType) {
			case 'axios':
				return await this.axios.delete(url);
				
			case 'fetch':
				const fetchUrl = this._fetchUrl(url);
				const deleteResult = await fetch(fetchUrl, {
					...this.fetchOptions,
					method: "DELETE",
				});
				const jsonResponse = await deleteResult?.json();
				return {data: jsonResponse};
		}
	}
	
	
	/**
	 * @param url {string} the url to convert
	 * @param options {object}
	 * @returns {string} the url prefixed with the selected host.
	 * @private
	 */
	_fetchUrl(url, options = {}) {
		const params =
			qs.stringify(options?.params ?? {}, {
				indices: false,
			})
		;
		
		// has parameters?
		if (params) {
			return `${this.host}${url}?${params}`;
		}
		return `${this.host}${url}`;
	}
	
}
