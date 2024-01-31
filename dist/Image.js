var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _createClass = require("@babel/runtime/helpers/createClass");
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.number.to-fixed.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.array.join.js");
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
var Image = /*#__PURE__*/function () {
  "use strict";

  function Image(hippo, info) {
    var imageInfo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    _classCallCheck(this, Image);
    _defineProperty(this, "hippo", void 0);
    _defineProperty(this, "info", void 0);
    _defineProperty(this, "operations", void 0);
    _defineProperty(this, "imageInfo", void 0);
    _defineProperty(this, "isExternal", void 0);
    _defineProperty(this, "externalSrc", void 0);
    Object.defineProperty(this, 'hippo', {
      value: hippo,
      writable: false
    });
    this.info = info;
    this.imageInfo = imageInfo;
    this.operations = [];
    this.isExternal = false;
  }
  _createClass(Image, [{
    key: "clone",
    value: function clone() {
      return new Image(this.hippo, this.info, this.imageInfo || {});
    }
  }, {
    key: "reset",
    value: function reset() {
      this.operations = [];
      return this;
    }
  }, {
    key: "external",
    value: function external(src) {
      this.isExternal = true;
      this.externalSrc = src;
      return this;
    }
  }, {
    key: "greyscale",
    value: function greyscale() {
      this.operations.push("filter=greyscale");
      return this;
    }
  }, {
    key: "brighter",
    value: function brighter() {
      var times = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      for (var idx = 0; idx < times; ++idx) {
        this.operations.push('filter=brighter');
      }
      return this;
    }
  }, {
    key: "darker",
    value: function darker() {
      var times = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      for (var idx = 0; idx < times; ++idx) {
        this.operations.push('filter=darker');
      }
      return this;
    }
  }, {
    key: "quality",
    value: function quality() {
      var qParam = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.8;
      this.operations.push("quality=".concat(qParam));
      return this;
    }
  }, {
    key: "scaleWidth",
    value: function scaleWidth(width) {
      this.operations.push("scale=".concat(width, ",_"));
      return this;
    }
  }, {
    key: "scaleHeight",
    value: function scaleHeight(height) {
      this.operations.push("scale=_,".concat(height));
      return this;
    }
  }, {
    key: "getFocusValue",
    value: function getFocusValue() {
      if (this.imageInfo && this.imageInfo.items && this.imageInfo.items.focus) {
        return JSON.parse(this.imageInfo.items.focus);
      }
      return {
        x: 0,
        y: 0
      };
    }
  }, {
    key: "crop",
    value: function crop(width, height) {
      var focus = this.getFocusValue();
      this.operations.push("crop=".concat(width, ",").concat(height, ",").concat(focus.x.toFixed(4), ",").concat(focus.y.toFixed(4)));
      return this;
    }
  }, {
    key: "toUrl",
    value: function toUrl() {
      var lastMod = this.imageInfo.items && this.imageInfo.items.original ? new Date(this.imageInfo.items.original.lastModified).getTime() : null;

      // don't do anything to the image?
      if (this.operations.length === 0) {
        if (this.hippo.options.cdnUrl) {
          return "".concat(this.hippo.options.cdnUrl, "/binaries").concat(this.info.path, "?v=").concat(lastMod);
        } else {
          return "".concat(this.hippo.host).concat(this.hippo.options.assetPath).concat(this.info.path, "?v=").concat(lastMod);
        }
      }

      // based on whether it is an external or internal request, build a different url
      var path = this.isExternal ? "external/".concat(this.externalSrc) : "binaries".concat(this.info.path);
      var opsStr = this.operations.join("/");
      if (this.hippo.options.cdnUrl) {
        return "".concat(this.hippo.options.cdnUrl).concat(this.hippo.options.assetModPath, "/").concat(opsStr, "/v=").concat(lastMod, "/").concat(path);
      }
      return "".concat(this.hippo.host).concat(this.hippo.options.assetModPath, "/").concat(opsStr, "/v=").concat(lastMod, "/").concat(path);
    }
  }]);
  return Image;
}();
module.exports = Image;