/*
	 ___           _
	|_ _|_ __   __| | _____  __
	 | || '_ \ / _` |/ _ \ \/ /
	 | || | | | (_| |  __/>  <
	|___|_| |_|\__,_|\___/_/\_\

	Purpose:

		To provide access into Hippo CMS instance that uses XIN Mods. It exposes
		a set of functions that allow you to interact with the REST API.
 */

import { BloomreachConnection} from "./src/BloomreachConnection.js";

export {Image} from "./src/Image.js";

export const LocalOptions = {
	
	enabled: false,
	ttl: 360,
	cacheName: 'hippo-cache',
	
	apiType: 'axios',
	
	hippoApi: '/site/api',
	xinApi: '/site/custom-api',
	assetPath: '/site/binaries',
	assetModPath: '/site/assetmod',
	cdnUrl: null,
	
};

export const DeployedOptions = {
	
	enabled: false,
	ttl: 360,
	cacheName: 'hippo-cache',
	apiType: 'axios',
	
	hippoApi: '/api',
	xinApi: '/api/xin',
	assetPath: '/binaries',
	assetModPath: '/assetmod',
	cdnUrl: null,
	
};

export function xinmodsReplacer(key, val) {
	if (key === 'hippo') {
		return undefined;
	}
	return val;
}


/**
 * Create a connection object for hippo operations.
 *
 * @param url	the url to connect to
 * @param user	the username to authentication with
 * @param password the password to use for authentication
 * @param options misc options that might have something later.
 * @param options.apiType {'fetch'|'axios'} which API to use to connect to the API.
 * @returns {BloomreachConnection}
 */
export function connectTo(url, user, password, options = LocalOptions) {
	return new BloomreachConnection(url, user, password, options);
}
