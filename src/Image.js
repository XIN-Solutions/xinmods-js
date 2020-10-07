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
	imageInfo;

	constructor(hippo, info, imageInfo = {}) {
		this.hippo = hippo;
		this.info = info;
		this.imageInfo = imageInfo;
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

	getFocusValue() {
        if (this.imageInfo && this.imageInfo.items && this.imageInfo.items.focus) {
            return JSON.parse(this.imageInfo.items.focus);
        }
        return {x: 0, y: 0};
    }

	crop(width, height) {
	    const focus = this.getFocusValue();
		this.operations.push(`crop=${width},${height},${focus.x},${focus.y}`);
		return this;
	}


	toUrl() {
	    const lastMod = (
	        this.imageInfo.items && this.imageInfo.items.original
                ? new Date(this.imageInfo.items.original.lastModified).getTime()
                : null
        );

		// don't do anything to the image?
		if (this.operations.length === 0) {
            if (this.hippo.options.cdnUrl) {
                return `${this.hippo.options.cdnUrl}/binaries${this.info.path}?v=${lastMod}`;
            }
            else {
                return `${this.hippo.host}${this.hippo.options.assetPath}${this.info.path}?v=${lastMod}`;
            }
		}

		const opsStr = this.operations.join("/");
		if (this.hippo.options.cdnUrl) {
            return `${this.hippo.options.cdnUrl}${this.hippo.options.assetModPath}/${opsStr}/v=${lastMod}/binaries${this.info.path}`;
        }
		return `${this.hippo.host}${this.hippo.options.assetModPath}/${opsStr}/v=${lastMod}/binaries${this.info.path}`;
	}

}

module.exports = Image;
