class PackageCommands {

	constructor(hippo) {

	}


	/**
	 * List all packages
	 * @returns {string[]} a list of package identifiers
	 */
	listPackages() {

	}

	/**
	 * Export a package to disk
	 *
	 * @param pkgId {string} the package identifier to export
	 * @param destination {string} where to store the package
	 */
	exportPackage(pkgId, destination) {

	}

	/**
	 * Import a package
	 * @param pkgId {string} package to import
	 * @aram source {string} the filename.
	 */
	importPackage(pkgId, source) {

	}


	/**
	 * Delete the package
	 * @param pkgId {string} Package identifier
	 */
	deletePackage(pkgId) {

	}

	/**
	 * Update the package identifier
	 *
	 * @param pkgId	{string} package id to update
	 * @param definition {object} the package definition.
	 */
	updatePackageDefinition(pkgId, definition) {

	}

	/**
	 * Get the package definition
	 * @param pkgId {string} package identifier to retrieve the definition for.
	 */
	getPackage(pkgId) {

	}


}


module.exports = PackageCommands;
