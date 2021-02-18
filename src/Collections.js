/**
 * Collections class
 */
class Collections {
	
	/**
	 * @type {HippoConnection}
	 */
	hippo;
	
	/**
	 * @type {string}
	 */
	name;
	
	/**
	 * Initialise data-members
	 *
	 * @param hippo	{HippoConnection} the hippo connection instance
	 * @param name {string} the collection name we're working with
	 */
	constructor(hippo, name) {
		this.hippo = hippo;
		this.cache = hippo.cache;
		this.name = name;
	}
	
	/**
	 * @returns {Query} the query object for querying this collection
	 */
	query() {
		return this.hippo.newCollectionQuery(this.name);
	}
	
	/**
	 * Get an item from the collection
	 *
	 * @param path		{string} the path to retrieve.
	 * @returns {Promise<*>}
	 */
	async get(path) {
		return this.cache.namedMethod('collectionsGet', [this.name, path], async () => {
			try {
				const response = (
					await this.hippo.axios.get(`${this.hippo.options.xinApi}/collections/${this.name}/item?path=${encodeURIComponent(path)}`)
				);
				
				if (!response.data.success) {
					return null;
				}
				return response.data.item;
			}
			catch (err) {
				console.error("couldn't retrieve this item", err);
				return null;
			}
		});
	}
	
	/**
	 * Delete an item.
	 *
	 * @param path			{string} the path to delete the item from
	 * @param forceDelete	{boolean} if set to true, can delete a part of the tree recursively.
	 * @returns {Promise<null|*>}
	 */
	async delete(path, forceDelete = false) {
		try {
			const response = (
				await this.hippo.axios.delete(
					`${this.hippo.options.xinApi}/collections/${this.name}/item?path=${encodeURIComponent(path)}&forceDelete=${forceDelete ? 'true': 'false'}`
				)
			);
			
			return response.data.success;
		}
		catch (err) {
			console.error("couldn't retrieve this item", err.message);
			return false;
		}
	}
	
	/**
	 * Put a new item into the collections
	 *
	 * @param path 		{string} the path to push into
	 * @param object	{object} the object to serialize
	 * @param saveMode {'Merge'|'Overwrite'|'FailIfExists'} the save mode to write the content with.
	 */
	async put(path, object, saveMode = 'Merge') {
		
		try {
			const values = this.serialise(object);
			
			const result = await this.hippo.axios.post(
				`${this.hippo.options.xinApi}/collections/${this.name}/item?path=${encodeURIComponent(path)}`, {
					saveMode,
					values
				});
			
			return result.data.success;
		}
		catch (err) {
			console.error("Something happened when putting a new item:", err);
			return false;
		}
		
		
	}
	
	/**
	 * Serialise a javascript object into an object that can be ingested by the `post` item endpoint.
	 * @param object {object} object to convert
	 * @returns {{}}
	 */
	serialise(object) {
		const values = {};
		for (const key in object) {
			const val = object[key];
			const type = typeof(val);
			
			switch (type) {
				case 'boolean':
					values[key] = {
						value: val,
						type: "Boolean"
					};
					break;
				
				case 'string':
					values[key] = {
						value: val,
						type: 'String'
					};
					break;
				
				case 'number':
					values[key] = {
						value: val,
						type: Number.isInteger(val) ? "Long" : "Double"
					};
					break;
				
				case 'object':
					if (val instanceof Date) {
						values[key] = {
							value: val.toISOString(),
							type: "Date"
						};
						break;
					}
					
					console.error("Don't know how to serialise object for key: " + key);
					break;
				
				default:
					console.error(`Don't know how to serialise key '${key}' of type '${type}'`);
				
			}
			
		}
		
		return values;
	}
	
	/**
	 * Convenience method for put with Overwrite save mode
	 * @param object
	 * @returns {*}
	 */
	async putAndOverwrite(object) {
		return await this.put(object, 'Overwrite');
	}
	
	async putAndMerge(object) {
		return await this.put(object, 'Merge');
	}
	
	async putIfNotExists(object) {
		return await this.put(object, 'FailIfExists');
	}
	
	
}

module.exports = Collections;
