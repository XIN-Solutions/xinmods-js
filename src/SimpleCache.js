import pkg from 'node-cache';
const NodeCache = pkg;

/**
 * The default options for in the cache configuration (https://www.npmjs.com/package/node-cache)
 */
const DefaultOptions = {
    stdTTL: process.env.CACHE_TTL || 60
};

const debug = process.env.CACHE_DEBUG === 'true' || false;
const caches = {};

/**
 * Cache service that caches information on a per/customer basis.
 */
export class SimpleCache {

    name;
    enabled;

    /**
     * Initialise data-member
     *
     * @param cacheName {string|object} the cacheName information
     * @param enabled {boolean} true if the cache mechanism should function
     */
    constructor(cacheName, enabled) {
        this.enabled = enabled;

        if (typeof(cacheName) === 'string') {
            this.name = cacheName;
        }
        else {
            this.name = cacheName.name;
        }

        if (!caches[this.name]) {
            caches[this.name] = new NodeCache(DefaultOptions);
        }
    }

    /**
     * Flush the cache
     */
    flushCache() {
        debug && console.log(`[${this.name}] Stats before flushing: `, caches[this.name].getStats());
        caches[this.name].flushAll();
    }

    /**
     * Use this function to cache output of valFn against the arguments passed into
     * the `args` object. It detects the method name by creating a temporary error object
     * and grabbing the name from the stack trace.
     *
     * @param args      {Arguments|object} the arguments object
     * @param valFn     {Function<Promise<*>>} the object to save
     * @param ttl       {number?} the TTL to store result for
     *
     * @returns {Promise<*>} either the cached version
     */
    async method(args, valFn, ttl = null) {
        const lastMethodLine = new Error().stack.split("\n")[2];
        const lastMethod = lastMethodLine.match(/\s+at\s+([^\s]+)/);
        return this.namedMethod(lastMethod[1], args, valFn, ttl);
    }

    /**
     * Use this function to cache output of valFn against the arguments passed into
     * the `args` object. It detects the method name by creating a temporary error object
     * and grabbing the name from the stack trace.
     *
     * @param name      {string} name to cache under
     * @param args      {Arguments|object} the arguments object
     * @param valFn     {Function<Promise<*>>} the object to save
     * @param ttl       {number?} the TTL to store result for
     *
     * @returns {Promise<*>} either the cached version
     */
    async namedMethod(name, args, valFn, ttl = null) {

        if (!this.enabled) {
            return await valFn.call(args);
        }

        const methodCacheKey = `${name}_${JSON.stringify(args)}`;

        const existing = caches[this.name].get(methodCacheKey);
        if (typeof(existing) !== "undefined") {
            debug && console.log(`[${this.name}] hit '${methodCacheKey}'`, caches[this.name].getStats());
            return existing;
        }

        // async call into value function
        try {
            const output = await valFn.call(args);
            caches[this.name].set(methodCacheKey, output, ttl);
            debug && console.log(`[${this.name}] stored '${methodCacheKey}'`, caches[this.name].getStats());
            return output;
        }
        catch (ex) {
            console.error(`[${this.name}] error executing value function:`, ex);
            return null;
        }

    }

    /**
     * Get the cache proxy for easy interactions.
     *
     * @returns {Proxy} returns the cache proxy so we can pretend it's a normal object.
     */
    data() {
        const cName = this.name;

        return new Proxy({}, {
            get(obj, prop) {
                return caches[cName].get(prop);
            },

            set(obj, prop, value) {
                return caches[cName].set(prop, value);
            }
        })
    }

}

