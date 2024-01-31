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

var HippoConnection = require('./HippoConnection.js');
var Image = require('./Image.js');
module.exports = {
  /**
   * Create a connection object for hippo operations.
   *
   * @param url	the url to connect to
   * @param user	the username to authentication with
   * @param password the password to use for authentication
   * @param options misc options that might have something later.
   *
   * @returns {HippoConnection}
   */
  connectTo: function connectTo(url, user, password) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    return new HippoConnection(url, user, password, options);
  },
  Image: Image
};