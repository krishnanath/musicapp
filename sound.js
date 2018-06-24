// EventDispatcher methods:
	s.addEventListener = null;
	s.removeEventListener = null;
	s.removeAllEventListeners = null;
	s.dispatchEvent = null;
	s.hasEventListener = null;
	s._listeners = null;

	createjs.EventDispatcher.initialize(s); // inject EventDispatcher methods.


// Events
	/**
	 * This event is fired when a file finishes loading internally. This event is fired for each loaded sound,
	 * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
	 * @event fileload
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {String} src The source of the sound that was loaded.
	 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
	 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
	 * @since 0.4.1
	 */

	/**
	 * This event is fired when a file fails loading internally. This event is fired for each loaded sound,
	 * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
	 * @event fileerror
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {String} src The source of the sound that was loaded.
	 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
	 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
	 * @since 0.6.0
	 */


// Class Public Methods
	/**
	 * Get the preload rules to allow Sound to be used as a plugin by <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
	 * Any load calls that have the matching type or extension will fire the callback method, and use the resulting
	 * object, which is potentially modified by Sound. This helps when determining the correct path, as well as
	 * registering the audio instance(s) with Sound. This method should not be called, except by PreloadJS.
	 * @method getPreloadHandlers
	 * @return {Object} An object containing:
	 * <ul><li>callback: A preload callback that is fired when a file is added to PreloadJS, which provides
	 *      Sound a mechanism to modify the load parameters, select the correct file format, register the sound, etc.</li>
	 *      <li>types: A list of file types that are supported by Sound (currently supports "sound").</li>
	 *      <li>extensions: A list of file extensions that are supported by Sound (see {{#crossLink "Sound/SUPPORTED_EXTENSIONS:property"}}{{/crossLink}}).</li></ul>
	 * @static
	 * @private
	 */
	s.getPreloadHandlers = function () {
		return {
			callback:createjs.proxy(s.initLoad, s),
			types:["sound"],
			extensions:s.SUPPORTED_EXTENSIONS
		};
	};

	/**
	 * Used to dispatch fileload events from internal loading.
	 * @method _handleLoadComplete
	 * @param event A loader event.
	 * @private
	 * @static
	 * @since 0.6.0
	 */
	s._handleLoadComplete = function(event) {
		var src = event.target.getItem().src;
		if (!s._preloadHash[src]) {return;}

		for (var i = 0, l = s._preloadHash[src].length; i < l; i++) {
			var item = s._preloadHash[src][i];
			s._preloadHash[src][i] = true;

			if (!s.hasEventListener("fileload")) { continue; }

			var event = new createjs.Event("fileload");
			event.src = item.src;
			event.id = item.id;
			event.data = item.data;
			event.sprite = item.sprite;

			s.dispatchEvent(event);
		}
	};

	/**
	 * Used to dispatch error events from internal preloading.
	 * @param event
	 * @private
	 * @since 0.6.0
	 * @static
	 */
	s._handleLoadError = function(event) {
		var src = event.target.getItem().src;
		if (!s._preloadHash[src]) {return;}

		for (var i = 0, l = s._preloadHash[src].length; i < l; i++) {
			var item = s._preloadHash[src][i];
			s._preloadHash[src][i] = false;

			if (!s.hasEventListener("fileerror")) { continue; }

			var event = new createjs.Event("fileerror");
			event.src = item.src;
			event.id = item.id;
			event.data = item.data;
			event.sprite = item.sprite;

			s.dispatchEvent(event);
		}
	};

	/**
	 * Used by {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} to register a Sound plugin.
	 *
	 * @method _registerPlugin
	 * @param {Object} plugin The plugin class to install.
	 * @return {Boolean} Whether the plugin was successfully initialized.
	 * @static
	 * @private
	 */
	s._registerPlugin = function (plugin) {
		// Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instance
		if (plugin.isSupported()) {
			s.activePlugin = new plugin();
			return true;
		}
		return false;
	};


* @method registerPlugins
	 * @param {Array} plugins An array of plugins classes to install.
	 * @return {Boolean} Whether a plugin was successfully initialized.
	 * @static
	 */
	s.registerPlugins = function (plugins) {
		s._pluginsRegistered = true;
		for (var i = 0, l = plugins.length; i < l; i++) {
			if (s._registerPlugin(plugins[i])) {
				return true;
			}
		}
		return false;
	};
