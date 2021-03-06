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

 * @method initializeDefaultPlugins
	 * @returns {Boolean} True if a plugin was initialized, false otherwise.
	 * @since 0.4.0
	 * @static
	 */
	s.initializeDefaultPlugins = function () {
		if (s.activePlugin != null) {return true;}
		if (s._pluginsRegistered) {return false;}
		if (s.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin])) {return true;}
		return false;
	};


* @method _registerSound
	 * @param {Object} src The object to load, containing src property and optionally containing id and data.
	 * @return {Object} An object with the modified values that were passed in, which defines the sound.
	 * Returns false if the source cannot be parsed or no plugins can be initialized.
	 * Returns true if the source is already loaded.
	 * @static
	 * @private
	 * @since 0.6.0
	 */

	s._registerSound = function (loadItem) {
		if (!s.initializeDefaultPlugins()) {return false;}

		var details;
		if (loadItem.src instanceof Object) {
			details = s._parseSrc(loadItem.src);
			details.src = loadItem.path + details.src;
		} else {
			details = s._parsePath(loadItem.src);
		}
		if (details == null) {return false;}
		loadItem.src = details.src;
		loadItem.type = "sound";

		var data = loadItem.data;
		var numChannels = null;
		if (data != null) {
			if (!isNaN(data.channels)) {
				numChannels = parseInt(data.channels);
			} else if (!isNaN(data)) {
				numChannels = parseInt(data);
			}
			
			if(data.audioSprite) {
				var sp;
				for(var i = data.audioSprite.length; i--; ) {
					sp = data.audioSprite[i];
					s._idHash[sp.id] = {src: loadItem.src, startTime: parseInt(sp.startTime), duration: parseInt(sp.duration)};

					if (sp.defaultPlayProps) {
						s._defaultPlayPropsHash[sp.id] = createjs.PlayPropsConfig.create(sp.defaultPlayProps);
					}
				}
			}
		}

		
		if (loadItem.id != null) {s._idHash[loadItem.id] = {src: loadItem.src}};
		var loader = s.activePlugin.register(loadItem);

		SoundChannel.create(loadItem.src, numChannels);

		// return the number of instances to the user.  This will also be returned in the load event.
		if (data == null || !isNaN(data)) {
			loadItem.data = numChannels || SoundChannel.maxPerChannel();
		} else {
			loadItem.data.channels = numChannels || SoundChannel.maxPerChannel();
		}

		if (loader.type) {loadItem.type = loader.type;}

		if (loadItem.defaultPlayProps) {
			s._defaultPlayPropsHash[loadItem.src] = createjs.PlayPropsConfig.create(loadItem.defaultPlayProps);
		}
		return loader;
	};

* @method removeSound
	 * @param {String | Object} src The src or ID of the audio, or an Object with a "src" property, or an Object with multiple extension labeled src properties.
	 * @param {string} basePath Set a path that will be prepended to each src when removing.
	 * @return {Boolean} True if sound is successfully removed.
	 * @static
	 * @since 0.4.1
	 */
	s.removeSound = function(src, basePath) {
		if (s.activePlugin == null) {return false;}

		if (src instanceof Object && src.src) {src = src.src;}

		var details;
		if (src instanceof Object) {
			details = s._parseSrc(src);
		} else {
			src = s._getSrcById(src).src;
			details = s._parsePath(src);
		}
		if (details == null) {return false;}
		src = details.src;
		if (basePath != null) {src = basePath + src;}

		for(var prop in s._idHash){
			if(s._idHash[prop].src == src) {
				delete(s._idHash[prop]);
			}
		}

		// clear from SoundChannel, which also stops and deletes all instances
		SoundChannel.removeSrc(src);

		delete(s._preloadHash[src]);

		s.activePlugin.removeSound(src);

		return true;
	};

* @event fileload
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {String} src The source of the sound that was loaded.
	 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
	 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
	 * @since 0.4.1

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

* @method _handleLoadComplete
	 * @param event A loader event.
	 * @private
	 * @static
	 * @since 0.6.0
* @event fileload
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {String} src The source of the sound that was loaded.
	 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
	 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
