/*
	 ___                              ____        _ _     _
	|_ _|_ __ ___   __ _  __ _  ___  | __ ) _   _(_) | __| | ___ _ __
	 | || '_ ` _ \ / _` |/ _` |/ _ \ |  _ \| | | | | |/ _` |/ _ \ '__|
	 | || | | | | | (_| | (_| |  __/ | |_) | |_| | | | (_| |  __/ |
	|___|_| |_| |_|\__,_|\__, |\___| |____/ \__,_|_|_|\__,_|\___|_|
	                     |___/

     Purpose:

        To interpret image information and apply asset modification instructions to them.
        Things that can be done to them currently:

            * crop
            * scale (x, y, or both)
            * filters: greyscale, brighter, darker
 */

class Image {

	hippo;
	info;
	operations;

	constructor(hippo, info) {
		this.hippo = hippo;
		this.info = info;
		this.operations = [];
	}

	clone() {
		return new Image(this.hippo, this.info);
	}

	reset() {
		this.operations = [];
		return this;
	}

	greyscale() {
		this.operations.push("filter=greyscale");
		return this;
	}

	brighter(times = 1) {
		for (let idx = 0; idx < times; ++idx) {
			this.operations.push('filter=brighter');
		}
		return this;
	}

	darker(times = 1) {
		for (let idx = 0; idx < times; ++idx) {
			this.operations.push('filter=darker');
		}
		return this;
	}

	quality(qParam = 0.8) {
	    this.operations.push(`quality=${qParam}`);
	    return this;
    }

	scaleWidth(width) {
		this.operations.push(`scale=${width},_`);
		return this;
	}

	scaleHeight(height) {
		this.operations.push(`scale=_,${height}`);
		return this;
	}

	crop(width, height) {
		this.operations.push(`crop=${width},${height}`);
		return this;
	}


	toUrl() {
		// don't do anything to the image?
		if (this.operations.length === 0) {
			return `${this.hippo.host}${this.hippo.options.assetPath}${this.info.path}`
		}

		const opsStr = this.operations.join("/");
		return `${this.hippo.host}${this.hippo.options.assetModPath}/${opsStr}/binaries${this.info.path}`;
	}

}

module.exports = Image;
