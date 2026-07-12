// hls.js worker
// https://github.com/video-dev/hls.js
/* eslint-disable */
(function () {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var eventemitter3 = {exports: {}};

	var hasRequiredEventemitter3;

	function requireEventemitter3 () {
		if (hasRequiredEventemitter3) return eventemitter3.exports;
		hasRequiredEventemitter3 = 1;
		(function (module) {

			var has = Object.prototype.hasOwnProperty
			  , prefix = '~';

			/**
			 * Constructor to create a storage for our `EE` objects.
			 * An `Events` instance is a plain object whose properties are event names.
			 *
			 * @constructor
			 * @private
			 */
			function Events() {}

			//
			// We try to not inherit from `Object.prototype`. In some engines creating an
			// instance in this way is faster than calling `Object.create(null)` directly.
			// If `Object.create(null)` is not supported we prefix the event names with a
			// character to make sure that the built-in object properties are not
			// overridden or used as an attack vector.
			//
			if (Object.create) {
			  Events.prototype = Object.create(null);

			  //
			  // This hack is needed because the `__proto__` property is still inherited in
			  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
			  //
			  if (!new Events().__proto__) prefix = false;
			}

			/**
			 * Representation of a single event listener.
			 *
			 * @param {Function} fn The listener function.
			 * @param {*} context The context to invoke the listener with.
			 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
			 * @constructor
			 * @private
			 */
			function EE(fn, context, once) {
			  this.fn = fn;
			  this.context = context;
			  this.once = once || false;
			}

			/**
			 * Add a listener for a given event.
			 *
			 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} context The context to invoke the listener with.
			 * @param {Boolean} once Specify if the listener is a one-time listener.
			 * @returns {EventEmitter}
			 * @private
			 */
			function addListener(emitter, event, fn, context, once) {
			  if (typeof fn !== 'function') {
			    throw new TypeError('The listener must be a function');
			  }

			  var listener = new EE(fn, context || emitter, once)
			    , evt = prefix ? prefix + event : event;

			  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
			  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
			  else emitter._events[evt] = [emitter._events[evt], listener];

			  return emitter;
			}

			/**
			 * Clear event by name.
			 *
			 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
			 * @param {(String|Symbol)} evt The Event name.
			 * @private
			 */
			function clearEvent(emitter, evt) {
			  if (--emitter._eventsCount === 0) emitter._events = new Events();
			  else delete emitter._events[evt];
			}

			/**
			 * Minimal `EventEmitter` interface that is molded against the Node.js
			 * `EventEmitter` interface.
			 *
			 * @constructor
			 * @public
			 */
			function EventEmitter() {
			  this._events = new Events();
			  this._eventsCount = 0;
			}

			/**
			 * Return an array listing the events for which the emitter has registered
			 * listeners.
			 *
			 * @returns {Array}
			 * @public
			 */
			EventEmitter.prototype.eventNames = function eventNames() {
			  var names = []
			    , events
			    , name;

			  if (this._eventsCount === 0) return names;

			  for (name in (events = this._events)) {
			    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
			  }

			  if (Object.getOwnPropertySymbols) {
			    return names.concat(Object.getOwnPropertySymbols(events));
			  }

			  return names;
			};

			/**
			 * Return the listeners registered for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Array} The registered listeners.
			 * @public
			 */
			EventEmitter.prototype.listeners = function listeners(event) {
			  var evt = prefix ? prefix + event : event
			    , handlers = this._events[evt];

			  if (!handlers) return [];
			  if (handlers.fn) return [handlers.fn];

			  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
			    ee[i] = handlers[i].fn;
			  }

			  return ee;
			};

			/**
			 * Return the number of listeners listening to a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Number} The number of listeners.
			 * @public
			 */
			EventEmitter.prototype.listenerCount = function listenerCount(event) {
			  var evt = prefix ? prefix + event : event
			    , listeners = this._events[evt];

			  if (!listeners) return 0;
			  if (listeners.fn) return 1;
			  return listeners.length;
			};

			/**
			 * Calls each of the listeners registered for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Boolean} `true` if the event had listeners, else `false`.
			 * @public
			 */
			EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
			  var evt = prefix ? prefix + event : event;

			  if (!this._events[evt]) return false;

			  var listeners = this._events[evt]
			    , len = arguments.length
			    , args
			    , i;

			  if (listeners.fn) {
			    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

			    switch (len) {
			      case 1: return listeners.fn.call(listeners.context), true;
			      case 2: return listeners.fn.call(listeners.context, a1), true;
			      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
			      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
			      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
			      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
			    }

			    for (i = 1, args = new Array(len -1); i < len; i++) {
			      args[i - 1] = arguments[i];
			    }

			    listeners.fn.apply(listeners.context, args);
			  } else {
			    var length = listeners.length
			      , j;

			    for (i = 0; i < length; i++) {
			      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

			      switch (len) {
			        case 1: listeners[i].fn.call(listeners[i].context); break;
			        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
			        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
			        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
			        default:
			          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
			            args[j - 1] = arguments[j];
			          }

			          listeners[i].fn.apply(listeners[i].context, args);
			      }
			    }
			  }

			  return true;
			};

			/**
			 * Add a listener for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} [context=this] The context to invoke the listener with.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.on = function on(event, fn, context) {
			  return addListener(this, event, fn, context, false);
			};

			/**
			 * Add a one-time listener for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} [context=this] The context to invoke the listener with.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.once = function once(event, fn, context) {
			  return addListener(this, event, fn, context, true);
			};

			/**
			 * Remove the listeners of a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn Only remove the listeners that match this function.
			 * @param {*} context Only remove the listeners that have this context.
			 * @param {Boolean} once Only remove one-time listeners.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
			  var evt = prefix ? prefix + event : event;

			  if (!this._events[evt]) return this;
			  if (!fn) {
			    clearEvent(this, evt);
			    return this;
			  }

			  var listeners = this._events[evt];

			  if (listeners.fn) {
			    if (
			      listeners.fn === fn &&
			      (!once || listeners.once) &&
			      (!context || listeners.context === context)
			    ) {
			      clearEvent(this, evt);
			    }
			  } else {
			    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
			      if (
			        listeners[i].fn !== fn ||
			        (once && !listeners[i].once) ||
			        (context && listeners[i].context !== context)
			      ) {
			        events.push(listeners[i]);
			      }
			    }

			    //
			    // Reset the array, or remove it completely if we have no more listeners.
			    //
			    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
			    else clearEvent(this, evt);
			  }

			  return this;
			};

			/**
			 * Remove all listeners, or those of the specified event.
			 *
			 * @param {(String|Symbol)} [event] The event name.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
			  var evt;

			  if (event) {
			    evt = prefix ? prefix + event : event;
			    if (this._events[evt]) clearEvent(this, evt);
			  } else {
			    this._events = new Events();
			    this._eventsCount = 0;
			  }

			  return this;
			};

			//
			// Alias methods names because people roll like that.
			//
			EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
			EventEmitter.prototype.addListener = EventEmitter.prototype.on;

			//
			// Expose the prefix.
			//
			EventEmitter.prefixed = prefix;

			//
			// Allow `EventEmitter` to be imported as module namespace.
			//
			EventEmitter.EventEmitter = EventEmitter;

			//
			// Expose the module.
			//
			{
			  module.exports = EventEmitter;
			} 
		} (eventemitter3));
		return eventemitter3.exports;
	}

	var eventemitter3Exports = requireEventemitter3();
	var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

	function _defineProperty(e, r, t) {
	  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
	    value: t,
	    enumerable: true,
	    configurable: true,
	    writable: true
	  }) : e[r] = t, e;
	}
	function _extends() {
	  return _extends = Object.assign ? Object.assign.bind() : function (n) {
	    for (var e = 1; e < arguments.length; e++) {
	      var t = arguments[e];
	      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
	    }
	    return n;
	  }, _extends.apply(null, arguments);
	}
	function _inheritsLoose(t, o) {
	  t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
	}
	function ownKeys(e, r) {
	  var t = Object.keys(e);
	  if (Object.getOwnPropertySymbols) {
	    var o = Object.getOwnPropertySymbols(e);
	    r && (o = o.filter(function (r) {
	      return Object.getOwnPropertyDescriptor(e, r).enumerable;
	    })), t.push.apply(t, o);
	  }
	  return t;
	}
	function _objectSpread2(e) {
	  for (var r = 1; r < arguments.length; r++) {
	    var t = null != arguments[r] ? arguments[r] : {};
	    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
	      _defineProperty(e, r, t[r]);
	    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
	      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
	    });
	  }
	  return e;
	}
	function _setPrototypeOf(t, e) {
	  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
	    return t.__proto__ = e, t;
	  }, _setPrototypeOf(t, e);
	}
	function _toPrimitive(t, r) {
	  if ("object" != typeof t || !t) return t;
	  var e = t[Symbol.toPrimitive];
	  if (void 0 !== e) {
	    var i = e.call(t, r);
	    if ("object" != typeof i) return i;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return ("string" === r ? String : Number)(t);
	}
	function _toPropertyKey(t) {
	  var i = _toPrimitive(t, "string");
	  return "symbol" == typeof i ? i : i + "";
	}

	/**
	 * Returns true if an ID3 footer can be found at offset in data
	 *
	 * @param data - The data to search in
	 * @param offset - The offset at which to start searching
	 *
	 * @returns `true` if an ID3 footer is found
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function isId3Footer(data, offset) {
	  /*
	   * The footer is a copy of the header, but with a different identifier
	   */
	  if (offset + 10 <= data.length) {
	    // look for '3DI' identifier
	    if (data[offset] === 0x33 && data[offset + 1] === 0x44 && data[offset + 2] === 0x49) {
	      // check version is within range
	      if (data[offset + 3] < 0xff && data[offset + 4] < 0xff) {
	        // check size is within range
	        if (data[offset + 6] < 0x80 && data[offset + 7] < 0x80 && data[offset + 8] < 0x80 && data[offset + 9] < 0x80) {
	          return true;
	        }
	      }
	    }
	  }
	  return false;
	}

	/**
	 * Returns true if an ID3 header can be found at offset in data
	 *
	 * @param data - The data to search in
	 * @param offset - The offset at which to start searching
	 *
	 * @returns `true` if an ID3 header is found
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function isId3Header(data, offset) {
	  /*
	   * http://id3.org/id3v2.3.0
	   * [0]     = 'I'
	   * [1]     = 'D'
	   * [2]     = '3'
	   * [3,4]   = {Version}
	   * [5]     = {Flags}
	   * [6-9]   = {ID3 Size}
	   *
	   * An ID3v2 tag can be detected with the following pattern:
	   *  $49 44 33 yy yy xx zz zz zz zz
	   * Where yy is less than $FF, xx is the 'flags' byte and zz is less than $80
	   */
	  if (offset + 10 <= data.length) {
	    // look for 'ID3' identifier
	    if (data[offset] === 0x49 && data[offset + 1] === 0x44 && data[offset + 2] === 0x33) {
	      // check version is within range
	      if (data[offset + 3] < 0xff && data[offset + 4] < 0xff) {
	        // check size is within range
	        if (data[offset + 6] < 0x80 && data[offset + 7] < 0x80 && data[offset + 8] < 0x80 && data[offset + 9] < 0x80) {
	          return true;
	        }
	      }
	    }
	  }
	  return false;
	}

	/**
	 * Read ID3 size
	 *
	 * @param data - The data to read from
	 * @param offset - The offset at which to start reading
	 *
	 * @returns The size
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function readId3Size(data, offset) {
	  var size = 0;
	  size = (data[offset] & 0x7f) << 21;
	  size |= (data[offset + 1] & 0x7f) << 14;
	  size |= (data[offset + 2] & 0x7f) << 7;
	  size |= data[offset + 3] & 0x7f;
	  return size;
	}

	/**
	 * Returns any adjacent ID3 tags found in data starting at offset, as one block of data
	 *
	 * @param data - The data to search in
	 * @param offset - The offset at which to start searching
	 *
	 * @returns The block of data containing any ID3 tags found
	 * or `undefined` if no header is found at the starting offset
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function getId3Data(data, offset) {
	  var front = offset;
	  var length = 0;
	  while (isId3Header(data, offset)) {
	    // ID3 header is 10 bytes
	    length += 10;
	    var size = readId3Size(data, offset + 6);
	    length += size;
	    if (isId3Footer(data, offset + 10)) {
	      // ID3 footer is 10 bytes
	      length += 10;
	    }
	    offset += length;
	  }
	  if (length > 0) {
	    return data.subarray(front, front + length);
	  }
	  return undefined;
	}

	var ErrorTypes = /*#__PURE__*/function (ErrorTypes) {
	  // Identifier for a network error (loading error / timeout ...)
	  ErrorTypes["NETWORK_ERROR"] = "networkError";
	  // Identifier for a media Error (video/parsing/mediasource error)
	  ErrorTypes["MEDIA_ERROR"] = "mediaError";
	  // EME (encrypted media extensions) errors
	  ErrorTypes["KEY_SYSTEM_ERROR"] = "keySystemError";
	  // Identifier for a mux Error (demuxing/remuxing)
	  ErrorTypes["MUX_ERROR"] = "muxError";
	  // Identifier for all other errors
	  ErrorTypes["OTHER_ERROR"] = "otherError";
	  return ErrorTypes;
	}({});
	var ErrorDetails = /*#__PURE__*/function (ErrorDetails) {
	  ErrorDetails["KEY_SYSTEM_NO_KEYS"] = "keySystemNoKeys";
	  ErrorDetails["KEY_SYSTEM_NO_ACCESS"] = "keySystemNoAccess";
	  ErrorDetails["KEY_SYSTEM_NO_SESSION"] = "keySystemNoSession";
	  ErrorDetails["KEY_SYSTEM_NO_CONFIGURED_LICENSE"] = "keySystemNoConfiguredLicense";
	  ErrorDetails["KEY_SYSTEM_LICENSE_REQUEST_FAILED"] = "keySystemLicenseRequestFailed";
	  ErrorDetails["KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED"] = "keySystemServerCertificateRequestFailed";
	  ErrorDetails["KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED"] = "keySystemServerCertificateUpdateFailed";
	  ErrorDetails["KEY_SYSTEM_SESSION_UPDATE_FAILED"] = "keySystemSessionUpdateFailed";
	  ErrorDetails["KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED"] = "keySystemStatusOutputRestricted";
	  ErrorDetails["KEY_SYSTEM_STATUS_INTERNAL_ERROR"] = "keySystemStatusInternalError";
	  ErrorDetails["KEY_SYSTEM_DESTROY_MEDIA_KEYS_ERROR"] = "keySystemDestroyMediaKeysError";
	  ErrorDetails["KEY_SYSTEM_DESTROY_CLOSE_SESSION_ERROR"] = "keySystemDestroyCloseSessionError";
	  ErrorDetails["KEY_SYSTEM_DESTROY_REMOVE_SESSION_ERROR"] = "keySystemDestroyRemoveSessionError";
	  // Identifier for a manifest load error - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["MANIFEST_LOAD_ERROR"] = "manifestLoadError";
	  // Identifier for a manifest load timeout - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["MANIFEST_LOAD_TIMEOUT"] = "manifestLoadTimeOut";
	  // Identifier for a manifest parsing error - data: { url : faulty URL, reason : error reason}
	  ErrorDetails["MANIFEST_PARSING_ERROR"] = "manifestParsingError";
	  // Identifier for a manifest with only incompatible codecs error - data: { url : faulty URL, reason : error reason}
	  ErrorDetails["MANIFEST_INCOMPATIBLE_CODECS_ERROR"] = "manifestIncompatibleCodecsError";
	  // Identifier for a level which contains no fragments - data: { url: faulty URL, reason: "no fragments found in level", level: index of the bad level }
	  ErrorDetails["LEVEL_EMPTY_ERROR"] = "levelEmptyError";
	  // Identifier for a level load error - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["LEVEL_LOAD_ERROR"] = "levelLoadError";
	  // Identifier for a level load timeout - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["LEVEL_LOAD_TIMEOUT"] = "levelLoadTimeOut";
	  // Identifier for a level parse error - data: { url : faulty URL, error: Error, reason: error message }
	  ErrorDetails["LEVEL_PARSING_ERROR"] = "levelParsingError";
	  // Identifier for a level switch error - data: { level : faulty level Id, event : error description}
	  ErrorDetails["LEVEL_SWITCH_ERROR"] = "levelSwitchError";
	  // Identifier for an audio track load error - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["AUDIO_TRACK_LOAD_ERROR"] = "audioTrackLoadError";
	  // Identifier for an audio track load timeout - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["AUDIO_TRACK_LOAD_TIMEOUT"] = "audioTrackLoadTimeOut";
	  // Identifier for a subtitle track load error - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["SUBTITLE_LOAD_ERROR"] = "subtitleTrackLoadError";
	  // Identifier for a subtitle track load timeout - data: { url : faulty URL, response : { code: error code, text: error text }}
	  ErrorDetails["SUBTITLE_TRACK_LOAD_TIMEOUT"] = "subtitleTrackLoadTimeOut";
	  // Identifier for fragment load error - data: { frag : fragment object, response : { code: error code, text: error text }}
	  ErrorDetails["FRAG_LOAD_ERROR"] = "fragLoadError";
	  // Identifier for fragment load timeout error - data: { frag : fragment object}
	  ErrorDetails["FRAG_LOAD_TIMEOUT"] = "fragLoadTimeOut";
	  // Identifier for a fragment decryption error event - data: {id : demuxer Id,frag: fragment object, reason : parsing error description }
	  ErrorDetails["FRAG_DECRYPT_ERROR"] = "fragDecryptError";
	  // Identifier for a fragment parsing error event - data: { id : demuxer Id, reason : parsing error description }
	  // will be renamed DEMUX_PARSING_ERROR and switched to MUX_ERROR in the next major release
	  ErrorDetails["FRAG_PARSING_ERROR"] = "fragParsingError";
	  // Identifier for a fragment or part load skipped because of a GAP tag or attribute
	  ErrorDetails["FRAG_GAP"] = "fragGap";
	  // Identifier for a remux alloc error event - data: { id : demuxer Id, frag : fragment object, bytes : nb of bytes on which allocation failed , reason : error text }
	  ErrorDetails["REMUX_ALLOC_ERROR"] = "remuxAllocError";
	  // Identifier for decrypt key load error - data: { frag : fragment object, response : { code: error code, text: error text }}
	  ErrorDetails["KEY_LOAD_ERROR"] = "keyLoadError";
	  // Identifier for decrypt key load timeout error - data: { frag : fragment object}
	  ErrorDetails["KEY_LOAD_TIMEOUT"] = "keyLoadTimeOut";
	  // Triggered when an exception occurs while adding a sourceBuffer to MediaSource - data : { error : exception , mimeType : mimeType }
	  ErrorDetails["BUFFER_ADD_CODEC_ERROR"] = "bufferAddCodecError";
	  // Triggered when source buffer(s) could not be created using level (manifest CODECS attribute), parsed media, or best guess codec(s) - data: { reason : error reason }
	  ErrorDetails["BUFFER_INCOMPATIBLE_CODECS_ERROR"] = "bufferIncompatibleCodecsError";
	  // Identifier for a buffer append error - data: append error description
	  ErrorDetails["BUFFER_APPEND_ERROR"] = "bufferAppendError";
	  // Identifier for a buffer appending error event - data: appending error description
	  ErrorDetails["BUFFER_APPENDING_ERROR"] = "bufferAppendingError";
	  // Identifier for a buffer stalled error event
	  ErrorDetails["BUFFER_STALLED_ERROR"] = "bufferStalledError";
	  // Identifier for a buffer full event
	  ErrorDetails["BUFFER_FULL_ERROR"] = "bufferFullError";
	  // Identifier for a buffer seek over hole event
	  ErrorDetails["BUFFER_SEEK_OVER_HOLE"] = "bufferSeekOverHole";
	  // Identifier for a buffer nudge on stall (playback is stuck although currentTime is in a buffered area)
	  ErrorDetails["BUFFER_NUDGE_ON_STALL"] = "bufferNudgeOnStall";
	  // Identifier for a Interstitial Asset List load error - data: { url: faulty URL, response: { code: error code, text: error text } }
	  ErrorDetails["ASSET_LIST_LOAD_ERROR"] = "assetListLoadError";
	  // Identifier for a Interstitial Asset List load timeout - data: { url: faulty URL, response: { code: error code, text: error text } }
	  ErrorDetails["ASSET_LIST_LOAD_TIMEOUT"] = "assetListLoadTimeout";
	  // Identifier for a Interstitial Asset List parsing error - data: { url : faulty URL, reason : error reason, response : { code: error code, text: error text }}
	  ErrorDetails["ASSET_LIST_PARSING_ERROR"] = "assetListParsingError";
	  // Identifier for a Interstitial Asset List parsing error - data: { url : faulty URL, reason : error reason, response : { code: error code, text: error text }}
	  ErrorDetails["INTERSTITIAL_ASSET_ITEM_ERROR"] = "interstitialAssetItemError";
	  // Identifier for an internal exception happening inside hls.js while handling an event
	  ErrorDetails["INTERNAL_EXCEPTION"] = "internalException";
	  // Identifier for an internal call to abort a loader
	  ErrorDetails["INTERNAL_ABORTED"] = "aborted";
	  // Triggered when attachMedia fails
	  ErrorDetails["ATTACH_MEDIA_ERROR"] = "attachMediaError";
	  // Uncategorized error
	  ErrorDetails["UNKNOWN"] = "unknown";
	  return ErrorDetails;
	}({});

	var Events = /*#__PURE__*/function (Events) {
	  // Fired before MediaSource is attaching to media element
	  Events["MEDIA_ATTACHING"] = "hlsMediaAttaching";
	  // Fired when MediaSource has been successfully attached to media element
	  Events["MEDIA_ATTACHED"] = "hlsMediaAttached";
	  // Fired before detaching MediaSource from media element
	  Events["MEDIA_DETACHING"] = "hlsMediaDetaching";
	  // Fired when MediaSource has been detached from media element
	  Events["MEDIA_DETACHED"] = "hlsMediaDetached";
	  // Fired when HTMLMediaElement dispatches "ended" event, or stalls at end of VOD program
	  Events["MEDIA_ENDED"] = "hlsMediaEnded";
	  // Fired after playback stall is resolved with playing, seeked, or ended event following BUFFER_STALLED_ERROR
	  Events["STALL_RESOLVED"] = "hlsStallResolved";
	  // Fired when the buffer is going to be reset
	  Events["BUFFER_RESET"] = "hlsBufferReset";
	  // Fired when we know about the codecs that we need buffers for to push into - data: {tracks : { container, codec, levelCodec, initSegment, metadata }}
	  Events["BUFFER_CODECS"] = "hlsBufferCodecs";
	  // fired when sourcebuffers have been created - data: { tracks : tracks }
	  Events["BUFFER_CREATED"] = "hlsBufferCreated";
	  // fired when we append a segment to the buffer - data: { segment: segment object }
	  Events["BUFFER_APPENDING"] = "hlsBufferAppending";
	  // fired when we are done with appending a media segment to the buffer - data : { parent : segment parent that triggered BUFFER_APPENDING, pending : nb of segments waiting for appending for this segment parent}
	  Events["BUFFER_APPENDED"] = "hlsBufferAppended";
	  // fired when the stream is finished and we want to notify the media buffer that there will be no more data - data: { }
	  Events["BUFFER_EOS"] = "hlsBufferEos";
	  // fired when all buffers are full to the end of the program, after calling MediaSource.endOfStream() (unless restricted)
	  Events["BUFFERED_TO_END"] = "hlsBufferedToEnd";
	  // fired when the media buffer should be flushed - data { startOffset, endOffset }
	  Events["BUFFER_FLUSHING"] = "hlsBufferFlushing";
	  // fired when the media buffer has been flushed - data: { }
	  Events["BUFFER_FLUSHED"] = "hlsBufferFlushed";
	  // fired to signal that a manifest loading starts - data: { url : manifestURL}
	  Events["MANIFEST_LOADING"] = "hlsManifestLoading";
	  // fired after manifest has been loaded - data: { levels : [available quality levels], audioTracks : [ available audio tracks ], url : manifestURL, stats : LoaderStats }
	  Events["MANIFEST_LOADED"] = "hlsManifestLoaded";
	  // fired after manifest has been parsed - data: { levels : [available quality levels], firstLevel : index of first quality level appearing in Manifest}
	  Events["MANIFEST_PARSED"] = "hlsManifestParsed";
	  // fired when a level switch is requested - data: { level : id of new level }
	  Events["LEVEL_SWITCHING"] = "hlsLevelSwitching";
	  // fired when a level switch is effective - data: { level : id of new level }
	  Events["LEVEL_SWITCHED"] = "hlsLevelSwitched";
	  // fired when a level playlist loading starts - data: { url : level URL, level : id of level being loaded}
	  Events["LEVEL_LOADING"] = "hlsLevelLoading";
	  // fired when a level playlist loading finishes - data: { details : levelDetails object, level : id of loaded level, stats : LoaderStats }
	  Events["LEVEL_LOADED"] = "hlsLevelLoaded";
	  // fired when a level's details have been updated based on previous details, after it has been loaded - data: { details : levelDetails object, level : id of updated level }
	  Events["LEVEL_UPDATED"] = "hlsLevelUpdated";
	  // fired when a level's PTS information has been updated after parsing a fragment - data: { details : levelDetails object, level : id of updated level, drift: PTS drift observed when parsing last fragment }
	  Events["LEVEL_PTS_UPDATED"] = "hlsLevelPtsUpdated";
	  // fired to notify that levels have changed after removing a level - data: { levels : [available quality levels] }
	  Events["LEVELS_UPDATED"] = "hlsLevelsUpdated";
	  // fired to notify that audio track lists has been updated - data: { audioTracks : audioTracks }
	  Events["AUDIO_TRACKS_UPDATED"] = "hlsAudioTracksUpdated";
	  // fired when an audio track switching is requested - data: { id : audio track id }
	  Events["AUDIO_TRACK_SWITCHING"] = "hlsAudioTrackSwitching";
	  // fired when an audio track switch actually occurs - data: { id : audio track id }
	  Events["AUDIO_TRACK_SWITCHED"] = "hlsAudioTrackSwitched";
	  // fired when an audio track loading starts - data: { url : audio track URL, id : audio track id }
	  Events["AUDIO_TRACK_LOADING"] = "hlsAudioTrackLoading";
	  // fired when an audio track loading finishes - data: { details : levelDetails object, id : audio track id, stats : LoaderStats }
	  Events["AUDIO_TRACK_LOADED"] = "hlsAudioTrackLoaded";
	  // fired when an audio tracks's details have been updated based on previous details, after it has been loaded - data: { details : levelDetails object, id : track id }
	  Events["AUDIO_TRACK_UPDATED"] = "hlsAudioTrackUpdated";
	  // fired to notify that subtitle track lists has been updated - data: { subtitleTracks : subtitleTracks }
	  Events["SUBTITLE_TRACKS_UPDATED"] = "hlsSubtitleTracksUpdated";
	  // fired to notify that subtitle tracks were cleared as a result of stopping the media
	  Events["SUBTITLE_TRACKS_CLEARED"] = "hlsSubtitleTracksCleared";
	  // fired when an subtitle track switch occurs - data: { id : subtitle track id }
	  Events["SUBTITLE_TRACK_SWITCH"] = "hlsSubtitleTrackSwitch";
	  // fired when a subtitle track loading starts - data: { url : subtitle track URL, id : subtitle track id }
	  Events["SUBTITLE_TRACK_LOADING"] = "hlsSubtitleTrackLoading";
	  // fired when a subtitle track loading finishes - data: { details : levelDetails object, id : subtitle track id, stats : LoaderStats }
	  Events["SUBTITLE_TRACK_LOADED"] = "hlsSubtitleTrackLoaded";
	  // fired when a subtitle  racks's details have been updated based on previous details, after it has been loaded - data: { details : levelDetails object, id : track id }
	  Events["SUBTITLE_TRACK_UPDATED"] = "hlsSubtitleTrackUpdated";
	  // fired when a subtitle fragment has been processed - data: { success : boolean, frag : the processed frag }
	  Events["SUBTITLE_FRAG_PROCESSED"] = "hlsSubtitleFragProcessed";
	  // fired when a set of VTTCues to be managed externally has been parsed - data: { type: string, track: string, cues: [ VTTCue ] }
	  Events["CUES_PARSED"] = "hlsCuesParsed";
	  // fired when a text track to be managed externally is found - data: { tracks: [ { label: string, kind: string, default: boolean } ] }
	  Events["NON_NATIVE_TEXT_TRACKS_FOUND"] = "hlsNonNativeTextTracksFound";
	  // fired when the first timestamp is found - data: { id : demuxer id, initPTS: initPTS, timescale: timescale, frag : fragment object }
	  Events["INIT_PTS_FOUND"] = "hlsInitPtsFound";
	  // fired when a fragment loading starts - data: { frag : fragment object }
	  Events["FRAG_LOADING"] = "hlsFragLoading";
	  // fired when a fragment loading is progressing - data: { frag : fragment object, { trequest, tfirst, loaded } }
	  // FRAG_LOAD_PROGRESS = 'hlsFragLoadProgress',
	  // Identifier for fragment load aborting for emergency switch down - data: { frag : fragment object }
	  Events["FRAG_LOAD_EMERGENCY_ABORTED"] = "hlsFragLoadEmergencyAborted";
	  // fired when a fragment loading is completed - data: { frag : fragment object, payload : fragment payload, stats : LoaderStats }
	  Events["FRAG_LOADED"] = "hlsFragLoaded";
	  // fired when a fragment has finished decrypting - data: { id : demuxer id, frag: fragment object, payload : fragment payload, stats : { tstart, tdecrypt } }
	  Events["FRAG_DECRYPTED"] = "hlsFragDecrypted";
	  // fired when Init Segment has been extracted from fragment - data: { id : demuxer id, frag: fragment object, moov : moov MP4 box, codecs : codecs found while parsing fragment }
	  Events["FRAG_PARSING_INIT_SEGMENT"] = "hlsFragParsingInitSegment";
	  // fired when parsing sei text is completed - data: { id : demuxer id, frag: fragment object, samples : [ sei samples pes ] }
	  Events["FRAG_PARSING_USERDATA"] = "hlsFragParsingUserdata";
	  // fired when parsing id3 is completed - data: { id : demuxer id, frag: fragment object, samples : [ id3 samples pes ] }
	  Events["FRAG_PARSING_METADATA"] = "hlsFragParsingMetadata";
	  // fired when data have been extracted from fragment - data: { id : demuxer id, frag: fragment object, data1 : moof MP4 box or TS fragments, data2 : mdat MP4 box or null}
	  // FRAG_PARSING_DATA = 'hlsFragParsingData',
	  // fired when fragment parsing is completed - data: { id : demuxer id, frag: fragment object }
	  Events["FRAG_PARSED"] = "hlsFragParsed";
	  // fired when fragment remuxed MP4 boxes have all been appended into SourceBuffer - data: { id : demuxer id, frag : fragment object, stats : LoaderStats }
	  Events["FRAG_BUFFERED"] = "hlsFragBuffered";
	  // fired when fragment matching with current media position is changing - data : { id : demuxer id, frag : fragment object }
	  Events["FRAG_CHANGED"] = "hlsFragChanged";
	  // Identifier for a FPS drop event - data: { currentDropped, currentDecoded, totalDroppedFrames }
	  Events["FPS_DROP"] = "hlsFpsDrop";
	  // triggered when FPS drop triggers auto level capping - data: { level, droppedLevel }
	  Events["FPS_DROP_LEVEL_CAPPING"] = "hlsFpsDropLevelCapping";
	  // triggered when maxAutoLevel changes - data { autoLevelCapping, levels, maxAutoLevel, minAutoLevel, maxHdcpLevel }
	  Events["MAX_AUTO_LEVEL_UPDATED"] = "hlsMaxAutoLevelUpdated";
	  // Identifier for an error event - data: { type : error type, details : error details, fatal : if true, hls.js cannot/will not try to recover, if false, hls.js will try to recover,other error specific data }
	  Events["ERROR"] = "hlsError";
	  // fired when hls.js instance starts destroying. Different from MEDIA_DETACHED as one could want to detach and reattach a media to the instance of hls.js to handle mid-rolls for example - data: { }
	  Events["DESTROYING"] = "hlsDestroying";
	  // fired when a decrypt key loading starts - data: { frag : fragment object }
	  Events["KEY_LOADING"] = "hlsKeyLoading";
	  // fired when a decrypt key loading is completed - data: { frag : fragment object, keyInfo : KeyLoaderInfo }
	  Events["KEY_LOADED"] = "hlsKeyLoaded";
	  // deprecated; please use BACK_BUFFER_REACHED - data : { bufferEnd: number }
	  Events["LIVE_BACK_BUFFER_REACHED"] = "hlsLiveBackBufferReached";
	  // fired when the back buffer is reached as defined by the backBufferLength config option - data : { bufferEnd: number }
	  Events["BACK_BUFFER_REACHED"] = "hlsBackBufferReached";
	  // fired after steering manifest has been loaded - data: { steeringManifest: SteeringManifest object, url: steering manifest URL }
	  Events["STEERING_MANIFEST_LOADED"] = "hlsSteeringManifestLoaded";
	  // fired when asset list has begun loading
	  Events["ASSET_LIST_LOADING"] = "hlsAssetListLoading";
	  // fired when a valid asset list is loaded
	  Events["ASSET_LIST_LOADED"] = "hlsAssetListLoaded";
	  // fired when the list of Interstitial Events and Interstitial Schedule is updated
	  Events["INTERSTITIALS_UPDATED"] = "hlsInterstitialsUpdated";
	  // fired when the buffer reaches an Interstitial Schedule boundary (both Primary segments and Interstitial Assets)
	  Events["INTERSTITIALS_BUFFERED_TO_BOUNDARY"] = "hlsInterstitialsBufferedToBoundary";
	  // fired when a player instance for an Interstitial Asset has been created
	  Events["INTERSTITIAL_ASSET_PLAYER_CREATED"] = "hlsInterstitialAssetPlayerCreated";
	  // Interstitial playback started
	  Events["INTERSTITIAL_STARTED"] = "hlsInterstitialStarted";
	  // InterstitialAsset playback started
	  Events["INTERSTITIAL_ASSET_STARTED"] = "hlsInterstitialAssetStarted";
	  // InterstitialAsset playback ended
	  Events["INTERSTITIAL_ASSET_ENDED"] = "hlsInterstitialAssetEnded";
	  // InterstitialAsset playback errored
	  Events["INTERSTITIAL_ASSET_ERROR"] = "hlsInterstitialAssetError";
	  // Interstitial playback ended
	  Events["INTERSTITIAL_ENDED"] = "hlsInterstitialEnded";
	  // Interstitial schedule resumed primary playback
	  Events["INTERSTITIALS_PRIMARY_RESUMED"] = "hlsInterstitialsPrimaryResumed";
	  // Interstitial players dispatch this event when playout limit is reached
	  Events["PLAYOUT_LIMIT_REACHED"] = "hlsPlayoutLimitReached";
	  // Event DateRange cue "enter" event dispatched
	  Events["EVENT_CUE_ENTER"] = "hlsEventCueEnter";
	  return Events;
	}({});

	/**
	 * Defines each Event type and payload by Event name. Used in {@link hls.js#HlsEventEmitter} to strongly type the event listener API.
	 */

	var Logger = function Logger(label, logger) {
	  this.trace = void 0;
	  this.debug = void 0;
	  this.log = void 0;
	  this.warn = void 0;
	  this.info = void 0;
	  this.error = void 0;
	  var lb = "[" + label + "]:";
	  this.trace = noop;
	  this.debug = logger.debug.bind(null, lb);
	  this.log = logger.log.bind(null, lb);
	  this.warn = logger.warn.bind(null, lb);
	  this.info = logger.info.bind(null, lb);
	  this.error = logger.error.bind(null, lb);
	};
	var noop = function noop() {};
	var fakeLogger = {
	  trace: noop,
	  debug: noop,
	  log: noop,
	  warn: noop,
	  info: noop,
	  error: noop
	};
	function createLogger() {
	  return _extends({}, fakeLogger);
	}

	// let lastCallTime;
	// function formatMsgWithTimeInfo(type, msg) {
	//   const now = Date.now();
	//   const diff = lastCallTime ? '+' + (now - lastCallTime) : '0';
	//   lastCallTime = now;
	//   msg = (new Date(now)).toISOString() + ' | [' +  type + '] > ' + msg + ' ( ' + diff + ' ms )';
	//   return msg;
	// }

	function consolePrintFn(type, id) {
	  var func = self.console[type];
	  return func ? func.bind(self.console, ('') + "[" + type + "] >") : noop;
	}
	function getLoggerFn(key, debugConfig, id) {
	  return debugConfig[key] ? debugConfig[key].bind(debugConfig) : consolePrintFn(key);
	}
	var exportedLogger = createLogger();
	function enableLogs(debugConfig, context, id) {
	  // check that console is available
	  var newLogger = createLogger();
	  if (typeof console === 'object' && debugConfig === true || typeof debugConfig === 'object') {
	    var keys = [
	    // Remove out from list here to hard-disable a log-level
	    // 'trace',
	    'debug', 'log', 'info', 'warn', 'error'];
	    keys.forEach(function (key) {
	      newLogger[key] = getLoggerFn(key, debugConfig);
	    });
	    // Some browsers don't allow to use bind on console object anyway
	    // fallback to default if needed
	    try {
	      newLogger.log("Debug logs enabled for \"" + context + "\" in hls.js version " + undefined);
	    } catch (e) {
	      /* log fn threw an exception. All logger methods are no-ops. */
	      return createLogger();
	    }
	    // global exported logger uses the same functions as new logger without `id`
	    keys.forEach(function (key) {
	      exportedLogger[key] = getLoggerFn(key, debugConfig);
	    });
	  } else {
	    // Reset global exported logger
	    _extends(exportedLogger, newLogger);
	  }
	  return newLogger;
	}
	var logger = exportedLogger;

	function getAudioConfig(observer, data, offset, manifestCodec, userAgent) {
	  var adtsSamplingRates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
	  var byte2 = data[offset + 2];
	  var adtsSamplingIndex = byte2 >> 2 & 0xf;
	  if (adtsSamplingIndex > 12) {
	    var error = new Error("invalid ADTS sampling index:" + adtsSamplingIndex);
	    observer.emit(Events.ERROR, Events.ERROR, {
	      type: ErrorTypes.MEDIA_ERROR,
	      details: ErrorDetails.FRAG_PARSING_ERROR,
	      fatal: true,
	      error: error,
	      reason: error.message
	    });
	    return;
	  }
	  // MPEG-4 Audio Object Type (profile_ObjectType+1)
	  var adtsObjectType = (byte2 >> 6 & 0x3) + 1;
	  var channelCount = data[offset + 3] >> 6 & 0x3 | (byte2 & 1) << 2;
	  var codec = 'mp4a.40.' + adtsObjectType;
	  /* refer to http://wiki.multimedia.cx/index.php?title=MPEG-4_Audio#Audio_Specific_Config
	      ISO/IEC 14496-3 - Table 1.13 — Syntax of AudioSpecificConfig()
	    Audio Profile / Audio Object Type
	    0: Null
	    1: AAC Main
	    2: AAC LC (Low Complexity)
	    3: AAC SSR (Scalable Sample Rate)
	    4: AAC LTP (Long Term Prediction)
	    5: SBR (Spectral Band Replication)
	    6: AAC Scalable
	   sampling freq
	    0: 96000 Hz
	    1: 88200 Hz
	    2: 64000 Hz
	    3: 48000 Hz
	    4: 44100 Hz
	    5: 32000 Hz
	    6: 24000 Hz
	    7: 22050 Hz
	    8: 16000 Hz
	    9: 12000 Hz
	    10: 11025 Hz
	    11: 8000 Hz
	    12: 7350 Hz
	    13: Reserved
	    14: Reserved
	    15: frequency is written explictly
	    Channel Configurations
	    These are the channel configurations:
	    0: Defined in AOT Specifc Config
	    1: 1 channel: front-center
	    2: 2 channels: front-left, front-right
	  */
	  // audioObjectType = profile => profile, the MPEG-4 Audio Object Type minus 1
	  var samplerate = adtsSamplingRates[adtsSamplingIndex];
	  var aacSampleIndex = adtsSamplingIndex;
	  if (adtsObjectType === 5 || adtsObjectType === 29) {
	    // HE-AAC uses SBR (Spectral Band Replication) , high frequencies are constructed from low frequencies
	    // there is a factor 2 between frame sample rate and output sample rate
	    // multiply frequency by 2 (see table above, equivalent to substract 3)
	    aacSampleIndex -= 3;
	  }
	  var config = [adtsObjectType << 3 | (aacSampleIndex & 0x0e) >> 1, (aacSampleIndex & 0x01) << 7 | channelCount << 3];
	  logger.log("manifest codec:" + manifestCodec + ", parsed codec:" + codec + ", channels:" + channelCount + ", rate:" + samplerate + " (ADTS object type:" + adtsObjectType + " sampling index:" + adtsSamplingIndex + ")");
	  return {
	    config: config,
	    samplerate: samplerate,
	    channelCount: channelCount,
	    codec: codec,
	    parsedCodec: codec,
	    manifestCodec: manifestCodec
	  };
	}
	function isHeaderPattern$1(data, offset) {
	  return data[offset] === 0xff && (data[offset + 1] & 0xf6) === 0xf0;
	}
	function getHeaderLength(data, offset) {
	  return data[offset + 1] & 0x01 ? 7 : 9;
	}
	function getFullFrameLength(data, offset) {
	  return (data[offset + 3] & 0x03) << 11 | data[offset + 4] << 3 | (data[offset + 5] & 0xe0) >>> 5;
	}
	function canGetFrameLength(data, offset) {
	  return offset + 5 < data.length;
	}
	function isHeader$1(data, offset) {
	  // Look for ADTS header | 1111 1111 | 1111 X00X | where X can be either 0 or 1
	  // Layer bits (position 14 and 15) in header should be always 0 for ADTS
	  // More info https://wiki.multimedia.cx/index.php?title=ADTS
	  return offset + 1 < data.length && isHeaderPattern$1(data, offset);
	}
	function canParse$1(data, offset) {
	  return canGetFrameLength(data, offset) && isHeaderPattern$1(data, offset) && getFullFrameLength(data, offset) <= data.length - offset;
	}
	function probe$1(data, offset) {
	  // same as isHeader but we also check that ADTS frame follows last ADTS frame
	  // or end of data is reached
	  if (isHeader$1(data, offset)) {
	    // ADTS header Length
	    var headerLength = getHeaderLength(data, offset);
	    if (offset + headerLength >= data.length) {
	      return false;
	    }
	    // ADTS frame Length
	    var frameLength = getFullFrameLength(data, offset);
	    if (frameLength <= headerLength) {
	      return false;
	    }
	    var newOffset = offset + frameLength;
	    return newOffset === data.length || isHeader$1(data, newOffset);
	  }
	  return false;
	}
	function initTrackConfig(track, observer, data, offset, audioCodec, userAgent) {
	  if (!track.samplerate) {
	    var config = getAudioConfig(observer, data, offset, audioCodec);
	    if (!config) {
	      return;
	    }
	    _extends(track, config);
	  }
	}
	function getFrameDuration(samplerate) {
	  return 1024 * 90000 / samplerate;
	}
	function parseFrameHeader(data, offset) {
	  // The protection skip bit tells us if we have 2 bytes of CRC data at the end of the ADTS header
	  var headerLength = getHeaderLength(data, offset);
	  if (offset + headerLength <= data.length) {
	    // retrieve frame size
	    var frameLength = getFullFrameLength(data, offset) - headerLength;
	    if (frameLength > 0) {
	      // logger.log(`AAC frame, offset/length/total/pts:${offset+headerLength}/${frameLength}/${data.byteLength}`);
	      return {
	        headerLength: headerLength,
	        frameLength: frameLength
	      };
	    }
	  }
	}
	function appendFrame$1(track, data, offset, pts, frameIndex) {
	  var frameDuration = getFrameDuration(track.samplerate);
	  var stamp = pts + frameIndex * frameDuration;
	  var header = parseFrameHeader(data, offset);
	  var unit;
	  if (header) {
	    var frameLength = header.frameLength,
	      headerLength = header.headerLength;
	    var _length = headerLength + frameLength;
	    var missing = Math.max(0, offset + _length - data.length);
	    // logger.log(`AAC frame ${frameIndex}, pts:${stamp} length@offset/total: ${frameLength}@${offset+headerLength}/${data.byteLength} missing: ${missing}`);
	    if (missing) {
	      unit = new Uint8Array(_length - headerLength);
	      unit.set(data.subarray(offset + headerLength, data.length), 0);
	    } else {
	      unit = data.subarray(offset + headerLength, offset + _length);
	    }
	    var _sample = {
	      unit: unit,
	      pts: stamp
	    };
	    if (!missing) {
	      track.samples.push(_sample);
	    }
	    return {
	      sample: _sample,
	      length: _length,
	      missing: missing
	    };
	  }
	  // overflow incomplete header
	  var length = data.length - offset;
	  unit = new Uint8Array(length);
	  unit.set(data.subarray(offset, data.length), 0);
	  var sample = {
	    unit: unit,
	    pts: stamp
	  };
	  return {
	    sample: sample,
	    length: length,
	    missing: -1
	  };
	}

	// https://caniuse.com/mdn-javascript_builtins_number_isfinite
	var isFiniteNumber = Number.isFinite || function (value) {
	  return typeof value === 'number' && isFinite(value);
	};

	// https://caniuse.com/mdn-javascript_builtins_number_issafeinteger
	var isSafeInteger = Number.isSafeInteger || function (value) {
	  return typeof value === 'number' && Math.abs(value) <= MAX_SAFE_INTEGER;
	};
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

	/**
	 * Checks if the given data contains an ID3 tag.
	 *
	 * @param data - The data to check
	 * @param offset - The offset at which to start checking
	 *
	 * @returns `true` if an ID3 tag is found
	 *
	 * @group ID3
	 *
	 * @beta
	 */
	function canParseId3(data, offset) {
	  return isId3Header(data, offset) && readId3Size(data, offset + 6) + 10 <= data.length - offset;
	}

	// http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript/22373197
	// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
	/* utf.js - UTF-8 <=> UTF-16 convertion
	 *
	 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
	 * Version: 1.0
	 * LastModified: Dec 25 1999
	 * This library is free.  You can redistribute it and/or modify it.
	 */
	/**
	 * Converts a UTF-8 array to a string.
	 *
	 * @param array - The UTF-8 array to convert
	 *
	 * @returns The string
	 *
	 * @group Utils
	 *
	 * @beta
	 */
	function utf8ArrayToStr(array, exitOnNull) {
	  if (exitOnNull === void 0) {
	    exitOnNull = false;
	  }
	  if (typeof TextDecoder !== 'undefined') {
	    var decoder = new TextDecoder('utf-8');
	    var decoded = decoder.decode(array);
	    if (exitOnNull) {
	      // grab up to the first null
	      var idx = decoded.indexOf('\0');
	      return idx !== -1 ? decoded.substring(0, idx) : decoded;
	    }
	    // remove any null characters
	    return decoded.replace(/\0/g, '');
	  }
	  var len = array.length;
	  var c;
	  var char2;
	  var char3;
	  var out = '';
	  var i = 0;
	  while (i < len) {
	    c = array[i++];
	    if (c === 0x00 && exitOnNull) {
	      return out;
	    } else if (c === 0x00 || c === 0x03) {
	      // If the character is 3 (END_OF_TEXT) or 0 (NULL) then skip it
	      continue;
	    }
	    switch (c >> 4) {
	      case 0:
	      case 1:
	      case 2:
	      case 3:
	      case 4:
	      case 5:
	      case 6:
	      case 7:
	        // 0xxxxxxx
	        out += String.fromCharCode(c);
	        break;
	      case 12:
	      case 13:
	        // 110x xxxx   10xx xxxx
	        char2 = array[i++];
	        out += String.fromCharCode((c & 0x1f) << 6 | char2 & 0x3f);
	        break;
	      case 14:
	        // 1110 xxxx  10xx xxxx  10xx xxxx
	        char2 = array[i++];
	        char3 = array[i++];
	        out += String.fromCharCode((c & 0x0f) << 12 | (char2 & 0x3f) << 6 | (char3 & 0x3f) << 0);
	        break;
	    }
	  }
	  return out;
	}

	function toArrayBuffer(view) {
	  if (view instanceof ArrayBuffer) {
	    return view;
	  } else {
	    if (view.byteOffset == 0 && view.byteLength == view.buffer.byteLength) {
	      // This is a TypedArray over the whole buffer.
	      return view.buffer;
	    }
	    // This is a 'view' on the buffer.  Create a new buffer that only contains
	    // the data.  Note that since this isn't an ArrayBuffer, the 'new' call
	    // will allocate a new buffer to hold the copy.
	    return new Uint8Array(view).buffer;
	  }
	}

	function toUint8(data, offset, length) {
	  if (offset === void 0) {
	    offset = 0;
	  }
	  if (length === void 0) {
	    length = Infinity;
	  }
	  return view(data, offset, length, Uint8Array);
	}
	function view(data, offset, length, Type) {
	  var buffer = unsafeGetArrayBuffer(data);
	  var bytesPerElement = 1;
	  if ('BYTES_PER_ELEMENT' in Type) {
	    bytesPerElement = Type.BYTES_PER_ELEMENT;
	  }
	  // Absolute end of the |data| view within |buffer|.
	  var dataOffset = isArrayBufferView(data) ? data.byteOffset : 0;
	  var dataEnd = (dataOffset + data.byteLength) / bytesPerElement;
	  // Absolute start of the result within |buffer|.
	  var rawStart = (dataOffset + offset) / bytesPerElement;
	  var start = Math.floor(Math.max(0, Math.min(rawStart, dataEnd)));
	  // Absolute end of the result within |buffer|.
	  var end = Math.floor(Math.min(start + Math.max(length, 0), dataEnd));
	  return new Type(buffer, start, end - start);
	}
	function unsafeGetArrayBuffer(view) {
	  if (view instanceof ArrayBuffer) {
	    return view;
	  } else {
	    return view.buffer;
	  }
	}
	function isArrayBufferView(obj) {
	  return obj && obj.buffer instanceof ArrayBuffer && obj.byteLength !== undefined && obj.byteOffset !== undefined;
	}

	function decodeId3ImageFrame(frame) {
	  var metadataFrame = {
	    key: frame.type,
	    description: '',
	    data: '',
	    mimeType: null,
	    pictureType: null
	  };
	  var utf8Encoding = 0x03;
	  if (frame.size < 2) {
	    return undefined;
	  }
	  if (frame.data[0] !== utf8Encoding) {
	    console.log('Ignore frame with unrecognized character ' + 'encoding');
	    return undefined;
	  }
	  var mimeTypeEndIndex = frame.data.subarray(1).indexOf(0);
	  if (mimeTypeEndIndex === -1) {
	    return undefined;
	  }
	  var mimeType = utf8ArrayToStr(toUint8(frame.data, 1, mimeTypeEndIndex));
	  var pictureType = frame.data[2 + mimeTypeEndIndex];
	  var descriptionEndIndex = frame.data.subarray(3 + mimeTypeEndIndex).indexOf(0);
	  if (descriptionEndIndex === -1) {
	    return undefined;
	  }
	  var description = utf8ArrayToStr(toUint8(frame.data, 3 + mimeTypeEndIndex, descriptionEndIndex));
	  var data;
	  if (mimeType === '-->') {
	    data = utf8ArrayToStr(toUint8(frame.data, 4 + mimeTypeEndIndex + descriptionEndIndex));
	  } else {
	    data = toArrayBuffer(frame.data.subarray(4 + mimeTypeEndIndex + descriptionEndIndex));
	  }
	  metadataFrame.mimeType = mimeType;
	  metadataFrame.pictureType = pictureType;
	  metadataFrame.description = description;
	  metadataFrame.data = data;
	  return metadataFrame;
	}

	/**
	 * Decode an ID3 PRIV frame.
	 *
	 * @param frame - the ID3 PRIV frame
	 *
	 * @returns The decoded ID3 PRIV frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function decodeId3PrivFrame(frame) {
	  /*
	  Format: <text string>\0<binary data>
	  */
	  if (frame.size < 2) {
	    return undefined;
	  }
	  var owner = utf8ArrayToStr(frame.data, true);
	  var privateData = new Uint8Array(frame.data.subarray(owner.length + 1));
	  return {
	    key: frame.type,
	    info: owner,
	    data: privateData.buffer
	  };
	}

	/**
	 * Decodes an ID3 text frame
	 *
	 * @param frame - the ID3 text frame
	 *
	 * @returns The decoded ID3 text frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function decodeId3TextFrame(frame) {
	  if (frame.size < 2) {
	    return undefined;
	  }
	  if (frame.type === 'TXXX') {
	    /*
	    Format:
	    [0]   = {Text Encoding}
	    [1-?] = {Description}\0{Value}
	    */
	    var index = 1;
	    var description = utf8ArrayToStr(frame.data.subarray(index), true);
	    index += description.length + 1;
	    var value = utf8ArrayToStr(frame.data.subarray(index));
	    return {
	      key: frame.type,
	      info: description,
	      data: value
	    };
	  }
	  /*
	  Format:
	  [0]   = {Text Encoding}
	  [1-?] = {Value}
	  */
	  var text = utf8ArrayToStr(frame.data.subarray(1));
	  return {
	    key: frame.type,
	    info: '',
	    data: text
	  };
	}

	/**
	 * Decode a URL frame
	 *
	 * @param frame - the ID3 URL frame
	 *
	 * @returns The decoded ID3 URL frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function decodeId3UrlFrame(frame) {
	  if (frame.type === 'WXXX') {
	    /*
	    Format:
	    [0]   = {Text Encoding}
	    [1-?] = {Description}\0{URL}
	    */
	    if (frame.size < 2) {
	      return undefined;
	    }
	    var index = 1;
	    var description = utf8ArrayToStr(frame.data.subarray(index), true);
	    index += description.length + 1;
	    var value = utf8ArrayToStr(frame.data.subarray(index));
	    return {
	      key: frame.type,
	      info: description,
	      data: value
	    };
	  }
	  /*
	  Format:
	  [0-?] = {URL}
	  */
	  var url = utf8ArrayToStr(frame.data);
	  return {
	    key: frame.type,
	    info: '',
	    data: url
	  };
	}

	/**
	 * Decode an ID3 frame.
	 *
	 * @param frame - the ID3 frame
	 *
	 * @returns The decoded ID3 frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function decodeId3Frame(frame) {
	  if (frame.type === 'PRIV') {
	    return decodeId3PrivFrame(frame);
	  } else if (frame.type[0] === 'W') {
	    return decodeId3UrlFrame(frame);
	  } else if (frame.type === 'APIC') {
	    return decodeId3ImageFrame(frame);
	  }
	  return decodeId3TextFrame(frame);
	}

	/**
	 * Returns the data of an ID3 frame.
	 *
	 * @param data - The data to read from
	 *
	 * @returns The data of the ID3 frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function getId3FrameData(data) {
	  /*
	  Frame ID       $xx xx xx xx (four characters)
	  Size           $xx xx xx xx
	  Flags          $xx xx
	  */
	  var type = String.fromCharCode(data[0], data[1], data[2], data[3]);
	  var size = readId3Size(data, 4);
	  // skip frame id, size, and flags
	  var offset = 10;
	  return {
	    type: type,
	    size: size,
	    data: data.subarray(offset, offset + size)
	  };
	}

	var HEADER_FOOTER_SIZE = 10;
	var FRAME_SIZE = 10;
	/**
	 * Returns an array of ID3 frames found in all the ID3 tags in the id3Data
	 *
	 * @param id3Data - The ID3 data containing one or more ID3 tags
	 *
	 * @returns Array of ID3 frame objects
	 *
	 * @group ID3
	 *
	 * @beta
	 */
	function getId3Frames(id3Data) {
	  var offset = 0;
	  var frames = [];
	  while (isId3Header(id3Data, offset)) {
	    var size = readId3Size(id3Data, offset + 6);
	    if (id3Data[offset + 5] >> 6 & 1) {
	      // skip extended header
	      offset += HEADER_FOOTER_SIZE;
	    }
	    // skip past ID3 header
	    offset += HEADER_FOOTER_SIZE;
	    var end = offset + size;
	    // loop through frames in the ID3 tag
	    while (offset + FRAME_SIZE < end) {
	      var frameData = getId3FrameData(id3Data.subarray(offset));
	      var frame = decodeId3Frame(frameData);
	      if (frame) {
	        frames.push(frame);
	      }
	      // skip frame header and frame data
	      offset += frameData.size + HEADER_FOOTER_SIZE;
	    }
	    if (isId3Footer(id3Data, offset)) {
	      offset += HEADER_FOOTER_SIZE;
	    }
	  }
	  return frames;
	}

	/**
	 * Returns true if the ID3 frame is an Elementary Stream timestamp frame
	 *
	 * @param frame - the ID3 frame
	 *
	 * @returns `true` if the ID3 frame is an Elementary Stream timestamp frame
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function isId3TimestampFrame(frame) {
	  return frame && frame.key === 'PRIV' && frame.info === 'com.apple.streaming.transportStreamTimestamp';
	}

	/**
	 * Read a 33 bit timestamp from an ID3 frame.
	 *
	 * @param timeStampFrame - the ID3 frame
	 *
	 * @returns The timestamp
	 *
	 * @internal
	 *
	 * @group ID3
	 */
	function readId3Timestamp(timeStampFrame) {
	  if (timeStampFrame.data.byteLength === 8) {
	    var data = new Uint8Array(timeStampFrame.data);
	    // timestamp is 33 bit expressed as a big-endian eight-octet number,
	    // with the upper 31 bits set to zero.
	    var pts33Bit = data[3] & 0x1;
	    var timestamp = (data[4] << 23) + (data[5] << 15) + (data[6] << 7) + data[7];
	    timestamp /= 45;
	    if (pts33Bit) {
	      timestamp += 47721858.84;
	    } // 2^32 / 90
	    return Math.round(timestamp);
	  }
	  return undefined;
	}

	/**
	 * Searches for the Elementary Stream timestamp found in the ID3 data chunk
	 *
	 * @param data - Block of data containing one or more ID3 tags
	 *
	 * @returns The timestamp
	 *
	 * @group ID3
	 *
	 * @beta
	 */
	function getId3Timestamp(data) {
	  var frames = getId3Frames(data);
	  for (var i = 0; i < frames.length; i++) {
	    var frame = frames[i];
	    if (isId3TimestampFrame(frame)) {
	      return readId3Timestamp(frame);
	    }
	  }
	  return undefined;
	}

	var MetadataSchema = /*#__PURE__*/function (MetadataSchema) {
	  MetadataSchema["audioId3"] = "org.id3";
	  MetadataSchema["dateRange"] = "com.apple.quicktime.HLS";
	  MetadataSchema["emsg"] = "https://aomedia.org/emsg/ID3";
	  MetadataSchema["misbklv"] = "urn:misb:KLV:bin:1910.1";
	  return MetadataSchema;
	}({});

	/**
	 *  hex dump helper class
	 */

	var Hex = {
	  hexDump: function hexDump(array) {
	    var str = '';
	    for (var i = 0; i < array.length; i++) {
	      var h = array[i].toString(16);
	      if (h.length < 2) {
	        h = '0' + h;
	      }
	      str += h;
	    }
	    return str;
	  }
	};

	var urlToolkit = {exports: {}};

	var hasRequiredUrlToolkit;

	function requireUrlToolkit () {
		if (hasRequiredUrlToolkit) return urlToolkit.exports;
		hasRequiredUrlToolkit = 1;
		(function (module, exports) {
			// see https://tools.ietf.org/html/rfc1808

			(function (root) {
			  var URL_REGEX =
			    /^(?=((?:[a-zA-Z0-9+\-.]+:)?))\1(?=((?:\/\/[^\/?#]*)?))\2(?=((?:(?:[^?#\/]*\/)*[^;?#\/]*)?))\3((?:;[^?#]*)?)(\?[^#]*)?(#[^]*)?$/;
			  var FIRST_SEGMENT_REGEX = /^(?=([^\/?#]*))\1([^]*)$/;
			  var SLASH_DOT_REGEX = /(?:\/|^)\.(?=\/)/g;
			  var SLASH_DOT_DOT_REGEX = /(?:\/|^)\.\.\/(?!\.\.\/)[^\/]*(?=\/)/g;

			  var URLToolkit = {
			    // If opts.alwaysNormalize is true then the path will always be normalized even when it starts with / or //
			    // E.g
			    // With opts.alwaysNormalize = false (default, spec compliant)
			    // http://a.com/b/cd + /e/f/../g => http://a.com/e/f/../g
			    // With opts.alwaysNormalize = true (not spec compliant)
			    // http://a.com/b/cd + /e/f/../g => http://a.com/e/g
			    buildAbsoluteURL: function (baseURL, relativeURL, opts) {
			      opts = opts || {};
			      // remove any remaining space and CRLF
			      baseURL = baseURL.trim();
			      relativeURL = relativeURL.trim();
			      if (!relativeURL) {
			        // 2a) If the embedded URL is entirely empty, it inherits the
			        // entire base URL (i.e., is set equal to the base URL)
			        // and we are done.
			        if (!opts.alwaysNormalize) {
			          return baseURL;
			        }
			        var basePartsForNormalise = URLToolkit.parseURL(baseURL);
			        if (!basePartsForNormalise) {
			          throw new Error('Error trying to parse base URL.');
			        }
			        basePartsForNormalise.path = URLToolkit.normalizePath(
			          basePartsForNormalise.path
			        );
			        return URLToolkit.buildURLFromParts(basePartsForNormalise);
			      }
			      var relativeParts = URLToolkit.parseURL(relativeURL);
			      if (!relativeParts) {
			        throw new Error('Error trying to parse relative URL.');
			      }
			      if (relativeParts.scheme) {
			        // 2b) If the embedded URL starts with a scheme name, it is
			        // interpreted as an absolute URL and we are done.
			        if (!opts.alwaysNormalize) {
			          return relativeURL;
			        }
			        relativeParts.path = URLToolkit.normalizePath(relativeParts.path);
			        return URLToolkit.buildURLFromParts(relativeParts);
			      }
			      var baseParts = URLToolkit.parseURL(baseURL);
			      if (!baseParts) {
			        throw new Error('Error trying to parse base URL.');
			      }
			      if (!baseParts.netLoc && baseParts.path && baseParts.path[0] !== '/') {
			        // If netLoc missing and path doesn't start with '/', assume everthing before the first '/' is the netLoc
			        // This causes 'example.com/a' to be handled as '//example.com/a' instead of '/example.com/a'
			        var pathParts = FIRST_SEGMENT_REGEX.exec(baseParts.path);
			        baseParts.netLoc = pathParts[1];
			        baseParts.path = pathParts[2];
			      }
			      if (baseParts.netLoc && !baseParts.path) {
			        baseParts.path = '/';
			      }
			      var builtParts = {
			        // 2c) Otherwise, the embedded URL inherits the scheme of
			        // the base URL.
			        scheme: baseParts.scheme,
			        netLoc: relativeParts.netLoc,
			        path: null,
			        params: relativeParts.params,
			        query: relativeParts.query,
			        fragment: relativeParts.fragment,
			      };
			      if (!relativeParts.netLoc) {
			        // 3) If the embedded URL's <net_loc> is non-empty, we skip to
			        // Step 7.  Otherwise, the embedded URL inherits the <net_loc>
			        // (if any) of the base URL.
			        builtParts.netLoc = baseParts.netLoc;
			        // 4) If the embedded URL path is preceded by a slash "/", the
			        // path is not relative and we skip to Step 7.
			        if (relativeParts.path[0] !== '/') {
			          if (!relativeParts.path) {
			            // 5) If the embedded URL path is empty (and not preceded by a
			            // slash), then the embedded URL inherits the base URL path
			            builtParts.path = baseParts.path;
			            // 5a) if the embedded URL's <params> is non-empty, we skip to
			            // step 7; otherwise, it inherits the <params> of the base
			            // URL (if any) and
			            if (!relativeParts.params) {
			              builtParts.params = baseParts.params;
			              // 5b) if the embedded URL's <query> is non-empty, we skip to
			              // step 7; otherwise, it inherits the <query> of the base
			              // URL (if any) and we skip to step 7.
			              if (!relativeParts.query) {
			                builtParts.query = baseParts.query;
			              }
			            }
			          } else {
			            // 6) The last segment of the base URL's path (anything
			            // following the rightmost slash "/", or the entire path if no
			            // slash is present) is removed and the embedded URL's path is
			            // appended in its place.
			            var baseURLPath = baseParts.path;
			            var newPath =
			              baseURLPath.substring(0, baseURLPath.lastIndexOf('/') + 1) +
			              relativeParts.path;
			            builtParts.path = URLToolkit.normalizePath(newPath);
			          }
			        }
			      }
			      if (builtParts.path === null) {
			        builtParts.path = opts.alwaysNormalize
			          ? URLToolkit.normalizePath(relativeParts.path)
			          : relativeParts.path;
			      }
			      return URLToolkit.buildURLFromParts(builtParts);
			    },
			    parseURL: function (url) {
			      var parts = URL_REGEX.exec(url);
			      if (!parts) {
			        return null;
			      }
			      return {
			        scheme: parts[1] || '',
			        netLoc: parts[2] || '',
			        path: parts[3] || '',
			        params: parts[4] || '',
			        query: parts[5] || '',
			        fragment: parts[6] || '',
			      };
			    },
			    normalizePath: function (path) {
			      // The following operations are
			      // then applied, in order, to the new path:
			      // 6a) All occurrences of "./", where "." is a complete path
			      // segment, are removed.
			      // 6b) If the path ends with "." as a complete path segment,
			      // that "." is removed.
			      path = path.split('').reverse().join('').replace(SLASH_DOT_REGEX, '');
			      // 6c) All occurrences of "<segment>/../", where <segment> is a
			      // complete path segment not equal to "..", are removed.
			      // Removal of these path segments is performed iteratively,
			      // removing the leftmost matching pattern on each iteration,
			      // until no matching pattern remains.
			      // 6d) If the path ends with "<segment>/..", where <segment> is a
			      // complete path segment not equal to "..", that
			      // "<segment>/.." is removed.
			      while (
			        path.length !== (path = path.replace(SLASH_DOT_DOT_REGEX, '')).length
			      ) {}
			      return path.split('').reverse().join('');
			    },
			    buildURLFromParts: function (parts) {
			      return (
			        parts.scheme +
			        parts.netLoc +
			        parts.path +
			        parts.params +
			        parts.query +
			        parts.fragment
			      );
			    },
			  };

			  module.exports = URLToolkit;
			})(); 
		} (urlToolkit));
		return urlToolkit.exports;
	}

	requireUrlToolkit();

	var ElementaryStreamTypes = {
	  AUDIO: "audio",
	  VIDEO: "video"};

	var UINT32_MAX$1 = Math.pow(2, 32) - 1;
	var push = [].push;

	// We are using fixed track IDs for driving the MP4 remuxer
	// instead of following the TS PIDs.
	// There is no reason not to do this and some browsers/SourceBuffer-demuxers
	// may not like if there are TrackID "switches"
	// See https://github.com/video-dev/hls.js/issues/1331
	// Here we are mapping our internal track types to constant MP4 track IDs
	// With MSE currently one can only have one track of each, and we are muxing
	// whatever video/audio rendition in them.
	var RemuxerTrackIdConfig = {
	  video: 1,
	  audio: 2,
	  id3: 3,
	  text: 4
	};
	function bin2str(data) {
	  return String.fromCharCode.apply(null, data);
	}
	function readUint16(buffer, offset) {
	  var val = buffer[offset] << 8 | buffer[offset + 1];
	  return val < 0 ? 65536 + val : val;
	}
	function readUint32(buffer, offset) {
	  var val = readSint32(buffer, offset);
	  return val < 0 ? 4294967296 + val : val;
	}
	function readUint64(buffer, offset) {
	  var result = readUint32(buffer, offset);
	  result *= Math.pow(2, 32);
	  result += readUint32(buffer, offset + 4);
	  return result;
	}
	function readSint32(buffer, offset) {
	  return buffer[offset] << 24 | buffer[offset + 1] << 16 | buffer[offset + 2] << 8 | buffer[offset + 3];
	}

	// Find "moof" box
	function hasMoofData(data) {
	  var end = data.byteLength;
	  for (var i = 0; i < end;) {
	    var size = readUint32(data, i);
	    if (size > 8 && data[i + 4] === 0x6d && data[i + 5] === 0x6f && data[i + 6] === 0x6f && data[i + 7] === 0x66) {
	      return true;
	    }
	    i = size > 1 ? i + size : end;
	  }
	  return false;
	}

	// Find the data for a box specified by its path
	function findBox(data, path) {
	  var results = [];
	  if (!path.length) {
	    // short-circuit the search for empty paths
	    return results;
	  }
	  var end = data.byteLength;
	  for (var i = 0; i < end;) {
	    var size = readUint32(data, i);
	    var type = bin2str(data.subarray(i + 4, i + 8));
	    var endbox = size > 1 ? i + size : end;
	    if (type === path[0]) {
	      if (path.length === 1) {
	        // this is the end of the path and we've found the box we were
	        // looking for
	        results.push(data.subarray(i + 8, endbox));
	      } else {
	        // recursively search for the next box along the path
	        var subresults = findBox(data.subarray(i + 8, endbox), path.slice(1));
	        if (subresults.length) {
	          push.apply(results, subresults);
	        }
	      }
	    }
	    i = endbox;
	  }

	  // we've finished searching all of data
	  return results;
	}
	function parseSegmentIndex(sidx) {
	  var references = [];
	  var version = sidx[0];

	  // set initial offset, we skip the reference ID (not needed)
	  var index = 8;
	  var timescale = readUint32(sidx, index);
	  index += 4;
	  var earliestPresentationTime = 0;
	  var firstOffset = 0;
	  if (version === 0) {
	    earliestPresentationTime = readUint32(sidx, index);
	    firstOffset = readUint32(sidx, index + 4);
	    index += 8;
	  } else {
	    earliestPresentationTime = readUint64(sidx, index);
	    firstOffset = readUint64(sidx, index + 8);
	    index += 16;
	  }

	  // skip reserved
	  index += 2;
	  var startByte = sidx.length + firstOffset;
	  var referencesCount = readUint16(sidx, index);
	  index += 2;
	  for (var i = 0; i < referencesCount; i++) {
	    var referenceIndex = index;
	    var referenceInfo = readUint32(sidx, referenceIndex);
	    referenceIndex += 4;
	    var referenceSize = referenceInfo & 0x7fffffff;
	    var referenceType = (referenceInfo & 0x80000000) >>> 31;
	    if (referenceType === 1) {
	      logger.warn('SIDX has hierarchical references (not supported)');
	      return null;
	    }
	    var subsegmentDuration = readUint32(sidx, referenceIndex);
	    referenceIndex += 4;
	    references.push({
	      referenceSize: referenceSize,
	      subsegmentDuration: subsegmentDuration,
	      // unscaled
	      info: {
	        duration: subsegmentDuration / timescale,
	        start: startByte,
	        end: startByte + referenceSize - 1
	      }
	    });
	    startByte += referenceSize;

	    // Skipping 1 bit for |startsWithSap|, 3 bits for |sapType|, and 28 bits
	    // for |sapDelta|.
	    referenceIndex += 4;

	    // skip to next ref
	    index = referenceIndex;
	  }
	  return {
	    earliestPresentationTime: earliestPresentationTime,
	    timescale: timescale,
	    version: version,
	    referencesCount: referencesCount,
	    references: references
	  };
	}

	/**
	 * Parses an MP4 initialization segment and extracts stream type and
	 * timescale values for any declared tracks. Timescale values indicate the
	 * number of clock ticks per second to assume for time-based values
	 * elsewhere in the MP4.
	 *
	 * To determine the start time of an MP4, you need two pieces of
	 * information: the timescale unit and the earliest base media decode
	 * time. Multiple timescales can be specified within an MP4 but the
	 * base media decode time is always expressed in the timescale from
	 * the media header box for the track:
	 * ```
	 * moov > trak > mdia > mdhd.timescale
	 * moov > trak > mdia > hdlr
	 * ```
	 * @param initSegment the bytes of the init segment
	 * @returns a hash of track type to timescale values or null if
	 * the init segment is malformed.
	 */

	function parseInitSegment(initSegment) {
	  var result = [];
	  var traks = findBox(initSegment, ['moov', 'trak']);
	  for (var i = 0; i < traks.length; i++) {
	    var trak = traks[i];
	    var tkhd = findBox(trak, ['tkhd'])[0];
	    if (tkhd) {
	      var version = tkhd[0];
	      var trackId = readUint32(tkhd, version === 0 ? 12 : 20);
	      var mdhd = findBox(trak, ['mdia', 'mdhd'])[0];
	      if (mdhd) {
	        version = mdhd[0];
	        var timescale = readUint32(mdhd, version === 0 ? 12 : 20);
	        var hdlr = findBox(trak, ['mdia', 'hdlr'])[0];
	        if (hdlr) {
	          var hdlrType = bin2str(hdlr.subarray(8, 12));
	          var type = {
	            soun: ElementaryStreamTypes.AUDIO,
	            vide: ElementaryStreamTypes.VIDEO
	          }[hdlrType];
	          // Parse codec details
	          var stsdBox = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];
	          var stsd = parseStsd(stsdBox);
	          if (type) {
	            // Add 'audio', 'video', and 'audiovideo' track records that will map to SourceBuffers
	            result[trackId] = {
	              timescale: timescale,
	              type: type,
	              stsd: stsd
	            };
	            result[type] = _objectSpread2({
	              timescale: timescale,
	              id: trackId
	            }, stsd);
	          } else {
	            // Add 'meta' and other track records
	            result[trackId] = {
	              timescale: timescale,
	              type: hdlrType,
	              stsd: stsd
	            };
	          }
	        }
	      }
	    }
	  }
	  var trex = findBox(initSegment, ['moov', 'mvex', 'trex']);
	  trex.forEach(function (trex) {
	    var trackId = readUint32(trex, 4);
	    var track = result[trackId];
	    if (track) {
	      track.default = {
	        duration: readUint32(trex, 12),
	        flags: readUint32(trex, 20)
	      };
	    }
	  });
	  return result;
	}
	function parseStsd(stsd) {
	  var sampleEntries = stsd.subarray(8);
	  var sampleEntriesEnd = sampleEntries.subarray(8 + 78);
	  var fourCC = bin2str(sampleEntries.subarray(4, 8));
	  var codec = fourCC;
	  var supplemental;
	  var encrypted = fourCC === 'enca' || fourCC === 'encv';
	  if (encrypted) {
	    var encBox = findBox(sampleEntries, [fourCC])[0];
	    var encBoxChildren = encBox.subarray(fourCC === 'enca' ? 28 : 78);
	    var sinfs = findBox(encBoxChildren, ['sinf']);
	    sinfs.forEach(function (sinf) {
	      var schm = findBox(sinf, ['schm'])[0];
	      if (schm) {
	        var scheme = bin2str(schm.subarray(4, 8));
	        if (scheme === 'cbcs' || scheme === 'cenc') {
	          var frma = findBox(sinf, ['frma'])[0];
	          if (frma) {
	            // for encrypted content codec fourCC will be in frma
	            codec = bin2str(frma);
	          }
	        }
	      }
	    });
	  }
	  var codecFourCC = codec;
	  switch (codec) {
	    case 'avc1':
	    case 'avc2':
	    case 'avc3':
	    case 'avc4':
	      {
	        // extract profile + compatibility + level out of avcC box
	        var avcCBox = findBox(sampleEntriesEnd, ['avcC'])[0];
	        if (avcCBox && avcCBox.length > 3) {
	          codec += '.' + toHex(avcCBox[1]) + toHex(avcCBox[2]) + toHex(avcCBox[3]);
	          supplemental = parseSupplementalDoViCodec(codecFourCC === 'avc1' ? 'dva1' : 'dvav', sampleEntriesEnd);
	        }
	        break;
	      }
	    case 'mp4a':
	      {
	        var codecBox = findBox(sampleEntries, [fourCC])[0];
	        var esdsBox = findBox(codecBox.subarray(28), ['esds'])[0];
	        if (esdsBox && esdsBox.length > 7) {
	          var i = 4;
	          // ES Descriptor tag
	          if (esdsBox[i++] !== 0x03) {
	            break;
	          }
	          i = skipBERInteger(esdsBox, i);
	          i += 2; // skip es_id;
	          var flags = esdsBox[i++];
	          if (flags & 0x80) {
	            i += 2; // skip dependency es_id
	          }
	          if (flags & 0x40) {
	            i += esdsBox[i++]; // skip URL
	          }
	          // Decoder config descriptor
	          if (esdsBox[i++] !== 0x04) {
	            break;
	          }
	          i = skipBERInteger(esdsBox, i);
	          var objectType = esdsBox[i++];
	          if (objectType === 0x40) {
	            codec += '.' + toHex(objectType);
	          } else {
	            break;
	          }
	          i += 12;
	          // Decoder specific info
	          if (esdsBox[i++] !== 0x05) {
	            break;
	          }
	          i = skipBERInteger(esdsBox, i);
	          var firstByte = esdsBox[i++];
	          var audioObjectType = (firstByte & 0xf8) >> 3;
	          if (audioObjectType === 31) {
	            audioObjectType += 1 + ((firstByte & 0x7) << 3) + ((esdsBox[i] & 0xe0) >> 5);
	          }
	          codec += '.' + audioObjectType;
	        }
	        break;
	      }
	    case 'hvc1':
	    case 'hev1':
	      {
	        var hvcCBox = findBox(sampleEntriesEnd, ['hvcC'])[0];
	        if (hvcCBox && hvcCBox.length > 12) {
	          var profileByte = hvcCBox[1];
	          var profileSpace = ['', 'A', 'B', 'C'][profileByte >> 6];
	          var generalProfileIdc = profileByte & 0x1f;
	          var profileCompat = readUint32(hvcCBox, 2);
	          var tierFlag = (profileByte & 0x20) >> 5 ? 'H' : 'L';
	          var levelIDC = hvcCBox[12];
	          var constraintIndicator = hvcCBox.subarray(6, 12);
	          codec += '.' + profileSpace + generalProfileIdc;
	          codec += '.' + reverse32BitInt(profileCompat).toString(16).toUpperCase();
	          codec += '.' + tierFlag + levelIDC;
	          var constraintString = '';
	          for (var _i = constraintIndicator.length; _i--;) {
	            var _byte = constraintIndicator[_i];
	            if (_byte || constraintString) {
	              var encodedByte = _byte.toString(16).toUpperCase();
	              constraintString = '.' + encodedByte + constraintString;
	            }
	          }
	          codec += constraintString;
	        }
	        supplemental = parseSupplementalDoViCodec(codecFourCC == 'hev1' ? 'dvhe' : 'dvh1', sampleEntriesEnd);
	        break;
	      }
	    case 'dvh1':
	    case 'dvhe':
	    case 'dvav':
	    case 'dva1':
	    case 'dav1':
	      {
	        codec = parseSupplementalDoViCodec(codec, sampleEntriesEnd) || codec;
	        break;
	      }
	    case 'vp09':
	      {
	        var vpcCBox = findBox(sampleEntriesEnd, ['vpcC'])[0];
	        if (vpcCBox && vpcCBox.length > 6) {
	          var profile = vpcCBox[4];
	          var level = vpcCBox[5];
	          var bitDepth = vpcCBox[6] >> 4 & 0x0f;
	          codec += '.' + addLeadingZero(profile) + '.' + addLeadingZero(level) + '.' + addLeadingZero(bitDepth);
	        }
	        break;
	      }
	    case 'av01':
	      {
	        var av1CBox = findBox(sampleEntriesEnd, ['av1C'])[0];
	        if (av1CBox && av1CBox.length > 2) {
	          var _profile = av1CBox[1] >>> 5;
	          var _level = av1CBox[1] & 0x1f;
	          var _tierFlag = av1CBox[2] >>> 7 ? 'H' : 'M';
	          var highBitDepth = (av1CBox[2] & 0x40) >> 6;
	          var twelveBit = (av1CBox[2] & 0x20) >> 5;
	          var _bitDepth = _profile === 2 && highBitDepth ? twelveBit ? 12 : 10 : highBitDepth ? 10 : 8;
	          var monochrome = (av1CBox[2] & 0x10) >> 4;
	          var chromaSubsamplingX = (av1CBox[2] & 0x08) >> 3;
	          var chromaSubsamplingY = (av1CBox[2] & 0x04) >> 2;
	          var chromaSamplePosition = av1CBox[2] & 0x03;
	          // TODO: parse color_description_present_flag
	          // default it to BT.709/limited range for now
	          // more info https://aomediacodec.github.io/av1-isobmff/#av1codecconfigurationbox-syntax
	          var colorPrimaries = 1;
	          var transferCharacteristics = 1;
	          var matrixCoefficients = 1;
	          var videoFullRangeFlag = 0;
	          codec += '.' + _profile + '.' + addLeadingZero(_level) + _tierFlag + '.' + addLeadingZero(_bitDepth) + '.' + monochrome + '.' + chromaSubsamplingX + chromaSubsamplingY + chromaSamplePosition + '.' + addLeadingZero(colorPrimaries) + '.' + addLeadingZero(transferCharacteristics) + '.' + addLeadingZero(matrixCoefficients) + '.' + videoFullRangeFlag;
	          supplemental = parseSupplementalDoViCodec('dav1', sampleEntriesEnd);
	        }
	        break;
	      }
	  }
	  return {
	    codec: codec,
	    encrypted: encrypted,
	    supplemental: supplemental
	  };
	}
	function parseSupplementalDoViCodec(fourCC, sampleEntriesEnd) {
	  var dvvCResult = findBox(sampleEntriesEnd, ['dvvC']); // used by DoVi Profile 8 to 10
	  var dvXCBox = dvvCResult.length ? dvvCResult[0] : findBox(sampleEntriesEnd, ['dvcC'])[0]; // used by DoVi Profiles up to 7 and 20
	  if (dvXCBox) {
	    var doViProfile = dvXCBox[2] >> 1 & 0x7f;
	    var doViLevel = dvXCBox[2] << 5 & 0x20 | dvXCBox[3] >> 3 & 0x1f;
	    return fourCC + '.' + addLeadingZero(doViProfile) + '.' + addLeadingZero(doViLevel);
	  }
	}
	function reverse32BitInt(val) {
	  var result = 0;
	  for (var i = 0; i < 32; i++) {
	    result |= (val >> i & 1) << 32 - 1 - i;
	  }
	  return result >>> 0;
	}
	function skipBERInteger(bytes, i) {
	  var limit = i + 5;
	  while (bytes[i++] & 0x80 && i < limit) {
	    /* do nothing */
	  }
	  return i;
	}
	function toHex(x) {
	  return ('0' + x.toString(16).toUpperCase()).slice(-2);
	}
	function addLeadingZero(num) {
	  return (num < 10 ? '0' : '') + num;
	}
	function patchEncyptionData(initSegment, decryptdata) {
	  if (!initSegment || !decryptdata) {
	    return;
	  }
	  var keyId = decryptdata.keyId;
	  if (keyId && decryptdata.isCommonEncryption) {
	    var traks = findBox(initSegment, ['moov', 'trak']);
	    traks.forEach(function (trak) {
	      var stsd = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];

	      // skip the sample entry count
	      var sampleEntries = stsd.subarray(8);
	      var encBoxes = findBox(sampleEntries, ['enca']);
	      var isAudio = encBoxes.length > 0;
	      if (!isAudio) {
	        encBoxes = findBox(sampleEntries, ['encv']);
	      }
	      encBoxes.forEach(function (enc) {
	        var encBoxChildren = isAudio ? enc.subarray(28) : enc.subarray(78);
	        var sinfBoxes = findBox(encBoxChildren, ['sinf']);
	        sinfBoxes.forEach(function (sinf) {
	          var tenc = parseSinf(sinf);
	          if (tenc) {
	            // Look for default key id (keyID offset is always 8 within the tenc box):
	            var tencKeyId = tenc.subarray(8, 24);
	            if (!tencKeyId.some(function (b) {
	              return b !== 0;
	            })) {
	              logger.log("[eme] Patching keyId in 'enc" + (isAudio ? 'a' : 'v') + ">sinf>>tenc' box: " + Hex.hexDump(tencKeyId) + " -> " + Hex.hexDump(keyId));
	              tenc.set(keyId, 8);
	            }
	          }
	        });
	      });
	    });
	  }
	}
	function parseSinf(sinf) {
	  var schm = findBox(sinf, ['schm'])[0];
	  if (schm) {
	    var scheme = bin2str(schm.subarray(4, 8));
	    if (scheme === 'cbcs' || scheme === 'cenc') {
	      return findBox(sinf, ['schi', 'tenc'])[0];
	    }
	  }
	  return null;
	}

	/*
	  For Reference:
	  aligned(8) class TrackFragmentHeaderBox
	           extends FullBox(‘tfhd’, 0, tf_flags){
	     unsigned int(32)  track_ID;
	     // all the following are optional fields
	     unsigned int(64)  base_data_offset;
	     unsigned int(32)  sample_description_index;
	     unsigned int(32)  default_sample_duration;
	     unsigned int(32)  default_sample_size;
	     unsigned int(32)  default_sample_flags
	  }
	 */

	function getSampleData(data, initData, logger) {
	  var tracks = {};
	  var trafs = findBox(data, ['moof', 'traf']);
	  for (var i = 0; i < trafs.length; i++) {
	    var traf = trafs[i];
	    // There is only one tfhd & trun per traf
	    // This is true for CMAF style content, and we should perhaps check the ftyp
	    // and only look for a single trun then, but for ISOBMFF we should check
	    // for multiple track runs.
	    var tfhd = findBox(traf, ['tfhd'])[0];
	    // get the track id from the tfhd
	    var id = readUint32(tfhd, 4);
	    var track = initData[id];
	    if (!track) {
	      continue;
	    }
	    tracks[id] || (tracks[id] = {
	      start: NaN,
	      duration: 0,
	      sampleCount: 0,
	      timescale: track.timescale,
	      type: track.type
	    });
	    var trackTimes = tracks[id];
	    // get start DTS
	    var tfdt = findBox(traf, ['tfdt'])[0];
	    if (tfdt) {
	      var version = tfdt[0];
	      var baseTime = readUint32(tfdt, 4);
	      if (version === 1) {
	        // If value is too large, assume signed 64-bit. Negative track fragment decode times are invalid, but they exist in the wild.
	        // This prevents large values from being used for initPTS, which can cause playlist sync issues.
	        // https://github.com/video-dev/hls.js/issues/5303
	        if (baseTime === UINT32_MAX$1) {
	          logger.warn("[mp4-demuxer]: Ignoring assumed invalid signed 64-bit track fragment decode time");
	        } else {
	          baseTime *= UINT32_MAX$1 + 1;
	          baseTime += readUint32(tfdt, 8);
	        }
	      }
	      if (isFiniteNumber(baseTime) && (!isFiniteNumber(trackTimes.start) || baseTime < trackTimes.start)) {
	        trackTimes.start = baseTime;
	      }
	    }
	    var trackDefault = track.default;
	    var tfhdFlags = readUint32(tfhd, 0) | (trackDefault == null ? void 0 : trackDefault.flags);
	    var defaultSampleDuration = (trackDefault == null ? void 0 : trackDefault.duration) || 0;
	    if (tfhdFlags & 0x000008) {
	      // 0x000008 indicates the presence of the default_sample_duration field
	      if (tfhdFlags & 0x000002) {
	        // 0x000002 indicates the presence of the sample_description_index field, which precedes default_sample_duration
	        // If present, the default_sample_duration exists at byte offset 12
	        defaultSampleDuration = readUint32(tfhd, 12);
	      } else {
	        // Otherwise, the duration is at byte offset 8
	        defaultSampleDuration = readUint32(tfhd, 8);
	      }
	    }
	    var truns = findBox(traf, ['trun']);
	    var sampleDTS = trackTimes.start || 0;
	    var rawDuration = 0;
	    var sampleDuration = defaultSampleDuration;
	    for (var j = 0; j < truns.length; j++) {
	      var trun = truns[j];
	      var sampleCount = readUint32(trun, 4);
	      var sampleIndex = trackTimes.sampleCount;
	      trackTimes.sampleCount += sampleCount;
	      // Get duration from samples
	      var dataOffsetPresent = trun[3] & 0x01;
	      var firstSampleFlagsPresent = trun[3] & 0x04;
	      var sampleDurationPresent = trun[2] & 0x01;
	      var sampleSizePresent = trun[2] & 0x02;
	      var sampleFlagsPresent = trun[2] & 0x04;
	      var sampleCompositionTimeOffsetPresent = trun[2] & 0x08;
	      var offset = 8;
	      var remaining = sampleCount;
	      if (dataOffsetPresent) {
	        offset += 4;
	      }
	      if (firstSampleFlagsPresent && sampleCount) {
	        var isNonSyncSample = trun[offset + 1] & 0x01;
	        if (!isNonSyncSample && trackTimes.keyFrameIndex === undefined) {
	          trackTimes.keyFrameIndex = sampleIndex;
	        }
	        offset += 4;
	        if (sampleDurationPresent) {
	          sampleDuration = readUint32(trun, offset);
	          offset += 4;
	        } else {
	          sampleDuration = defaultSampleDuration;
	        }
	        if (sampleSizePresent) {
	          offset += 4;
	        }
	        if (sampleCompositionTimeOffsetPresent) {
	          offset += 4;
	        }
	        sampleDTS += sampleDuration;
	        rawDuration += sampleDuration;
	        remaining--;
	      }
	      while (remaining--) {
	        if (sampleDurationPresent) {
	          sampleDuration = readUint32(trun, offset);
	          offset += 4;
	        } else {
	          sampleDuration = defaultSampleDuration;
	        }
	        if (sampleSizePresent) {
	          offset += 4;
	        }
	        if (sampleFlagsPresent) {
	          var _isNonSyncSample = trun[offset + 1] & 0x01;
	          if (!_isNonSyncSample) {
	            if (trackTimes.keyFrameIndex === undefined) {
	              trackTimes.keyFrameIndex = trackTimes.sampleCount - (remaining + 1);
	              trackTimes.keyFrameStart = sampleDTS;
	            }
	          }
	          offset += 4;
	        }
	        if (sampleCompositionTimeOffsetPresent) {
	          offset += 4;
	        }
	        sampleDTS += sampleDuration;
	        rawDuration += sampleDuration;
	      }
	      if (!rawDuration && defaultSampleDuration) {
	        rawDuration += defaultSampleDuration * sampleCount;
	      }
	    }
	    trackTimes.duration += rawDuration;
	  }
	  if (!Object.keys(tracks).some(function (trackId) {
	    return tracks[trackId].duration;
	  })) {
	    // If duration samples are not available in the traf use sidx subsegment_duration
	    var sidxMinStart = Infinity;
	    var sidxMaxEnd = 0;
	    var sidxs = findBox(data, ['sidx']);
	    for (var _i2 = 0; _i2 < sidxs.length; _i2++) {
	      var sidx = parseSegmentIndex(sidxs[_i2]);
	      if (sidx != null && sidx.references) {
	        sidxMinStart = Math.min(sidxMinStart, sidx.earliestPresentationTime / sidx.timescale);
	        var subSegmentDuration = sidx.references.reduce(function (dur, ref) {
	          return dur + ref.info.duration || 0;
	        }, 0);
	        sidxMaxEnd = Math.max(sidxMaxEnd, subSegmentDuration + sidx.earliestPresentationTime / sidx.timescale);
	      }
	    }
	    if (sidxMaxEnd && isFiniteNumber(sidxMaxEnd)) {
	      Object.keys(tracks).forEach(function (trackId) {
	        if (!tracks[trackId].duration) {
	          tracks[trackId].duration = sidxMaxEnd * tracks[trackId].timescale - tracks[trackId].start;
	        }
	      });
	    }
	  }
	  return tracks;
	}

	// TODO: Check if the last moof+mdat pair is part of the valid range
	function segmentValidRange(data) {
	  var segmentedRange = {
	    valid: null,
	    remainder: null
	  };
	  var moofs = findBox(data, ['moof']);
	  if (moofs.length < 2) {
	    segmentedRange.remainder = data;
	    return segmentedRange;
	  }
	  var last = moofs[moofs.length - 1];
	  // Offset by 8 bytes; findBox offsets the start by as much
	  segmentedRange.valid = data.slice(0, last.byteOffset - 8);
	  segmentedRange.remainder = data.slice(last.byteOffset - 8);
	  return segmentedRange;
	}
	function appendUint8Array(data1, data2) {
	  var temp = new Uint8Array(data1.length + data2.length);
	  temp.set(data1);
	  temp.set(data2, data1.length);
	  return temp;
	}
	function parseSamples(timeOffset, track) {
	  var seiSamples = [];
	  var videoData = track.samples;
	  var timescale = track.timescale;
	  var trackId = track.id;
	  var isHEVCFlavor = false;
	  var moofs = findBox(videoData, ['moof']);
	  moofs.map(function (moof) {
	    var moofOffset = moof.byteOffset - 8;
	    var trafs = findBox(moof, ['traf']);
	    trafs.map(function (traf) {
	      // get the base media decode time from the tfdt
	      var baseTime = findBox(traf, ['tfdt']).map(function (tfdt) {
	        var version = tfdt[0];
	        var result = readUint32(tfdt, 4);
	        if (version === 1) {
	          result *= Math.pow(2, 32);
	          result += readUint32(tfdt, 8);
	        }
	        return result / timescale;
	      })[0];
	      if (baseTime !== undefined) {
	        timeOffset = baseTime;
	      }
	      return findBox(traf, ['tfhd']).map(function (tfhd) {
	        var id = readUint32(tfhd, 4);
	        var tfhdFlags = readUint32(tfhd, 0) & 0xffffff;
	        var baseDataOffsetPresent = (tfhdFlags & 0x000001) !== 0;
	        var sampleDescriptionIndexPresent = (tfhdFlags & 0x000002) !== 0;
	        var defaultSampleDurationPresent = (tfhdFlags & 0x000008) !== 0;
	        var defaultSampleDuration = 0;
	        var defaultSampleSizePresent = (tfhdFlags & 0x000010) !== 0;
	        var defaultSampleSize = 0;
	        var defaultSampleFlagsPresent = (tfhdFlags & 0x000020) !== 0;
	        var tfhdOffset = 8;
	        if (id === trackId) {
	          if (baseDataOffsetPresent) {
	            tfhdOffset += 8;
	          }
	          if (sampleDescriptionIndexPresent) {
	            tfhdOffset += 4;
	          }
	          if (defaultSampleDurationPresent) {
	            defaultSampleDuration = readUint32(tfhd, tfhdOffset);
	            tfhdOffset += 4;
	          }
	          if (defaultSampleSizePresent) {
	            defaultSampleSize = readUint32(tfhd, tfhdOffset);
	            tfhdOffset += 4;
	          }
	          if (defaultSampleFlagsPresent) {
	            tfhdOffset += 4;
	          }
	          if (track.type === 'video') {
	            isHEVCFlavor = isHEVC(track.codec);
	          }
	          findBox(traf, ['trun']).map(function (trun) {
	            var version = trun[0];
	            var flags = readUint32(trun, 0) & 0xffffff;
	            var dataOffsetPresent = (flags & 0x000001) !== 0;
	            var dataOffset = 0;
	            var firstSampleFlagsPresent = (flags & 0x000004) !== 0;
	            var sampleDurationPresent = (flags & 0x000100) !== 0;
	            var sampleDuration = 0;
	            var sampleSizePresent = (flags & 0x000200) !== 0;
	            var sampleSize = 0;
	            var sampleFlagsPresent = (flags & 0x000400) !== 0;
	            var sampleCompositionOffsetsPresent = (flags & 0x000800) !== 0;
	            var compositionOffset = 0;
	            var sampleCount = readUint32(trun, 4);
	            var trunOffset = 8; // past version, flags, and sample count

	            if (dataOffsetPresent) {
	              dataOffset = readUint32(trun, trunOffset);
	              trunOffset += 4;
	            }
	            if (firstSampleFlagsPresent) {
	              trunOffset += 4;
	            }
	            var sampleOffset = dataOffset + moofOffset;
	            for (var ix = 0; ix < sampleCount; ix++) {
	              if (sampleDurationPresent) {
	                sampleDuration = readUint32(trun, trunOffset);
	                trunOffset += 4;
	              } else {
	                sampleDuration = defaultSampleDuration;
	              }
	              if (sampleSizePresent) {
	                sampleSize = readUint32(trun, trunOffset);
	                trunOffset += 4;
	              } else {
	                sampleSize = defaultSampleSize;
	              }
	              if (sampleFlagsPresent) {
	                trunOffset += 4;
	              }
	              if (sampleCompositionOffsetsPresent) {
	                if (version === 0) {
	                  compositionOffset = readUint32(trun, trunOffset);
	                } else {
	                  compositionOffset = readSint32(trun, trunOffset);
	                }
	                trunOffset += 4;
	              }
	              if (track.type === ElementaryStreamTypes.VIDEO) {
	                var naluTotalSize = 0;
	                while (naluTotalSize < sampleSize) {
	                  var naluSize = readUint32(videoData, sampleOffset);
	                  sampleOffset += 4;
	                  if (isSEIMessage(isHEVCFlavor, videoData[sampleOffset])) {
	                    var data = videoData.subarray(sampleOffset, sampleOffset + naluSize);
	                    parseSEIMessageFromNALu(data, isHEVCFlavor ? 2 : 1, timeOffset + compositionOffset / timescale, seiSamples);
	                  }
	                  sampleOffset += naluSize;
	                  naluTotalSize += naluSize + 4;
	                }
	              }
	              timeOffset += sampleDuration / timescale;
	            }
	          });
	        }
	      });
	    });
	  });
	  return seiSamples;
	}
	function isHEVC(codec) {
	  if (!codec) {
	    return false;
	  }
	  var baseCodec = codec.substring(0, 4);
	  return baseCodec === 'hvc1' || baseCodec === 'hev1' ||
	  // Dolby Vision
	  baseCodec === 'dvh1' || baseCodec === 'dvhe';
	}
	function isSEIMessage(isHEVCFlavor, naluHeader) {
	  if (isHEVCFlavor) {
	    var naluType = naluHeader >> 1 & 0x3f;
	    return naluType === 39 || naluType === 40;
	  } else {
	    var _naluType = naluHeader & 0x1f;
	    return _naluType === 6;
	  }
	}
	function parseSEIMessageFromNALu(unescapedData, headerSize, pts, samples) {
	  var data = discardEPB(unescapedData);
	  var seiPtr = 0;
	  // skip nal header
	  seiPtr += headerSize;
	  var payloadType = 0;
	  var payloadSize = 0;
	  var b = 0;
	  while (seiPtr < data.length) {
	    payloadType = 0;
	    do {
	      if (seiPtr >= data.length) {
	        break;
	      }
	      b = data[seiPtr++];
	      payloadType += b;
	    } while (b === 0xff);

	    // Parse payload size.
	    payloadSize = 0;
	    do {
	      if (seiPtr >= data.length) {
	        break;
	      }
	      b = data[seiPtr++];
	      payloadSize += b;
	    } while (b === 0xff);
	    var leftOver = data.length - seiPtr;
	    // Create a variable to process the payload
	    var payPtr = seiPtr;

	    // Increment the seiPtr to the end of the payload
	    if (payloadSize < leftOver) {
	      seiPtr += payloadSize;
	    } else if (payloadSize > leftOver) {
	      // Some type of corruption has happened?
	      logger.error("Malformed SEI payload. " + payloadSize + " is too small, only " + leftOver + " bytes left to parse.");
	      // We might be able to parse some data, but let's be safe and ignore it.
	      break;
	    }
	    if (payloadType === 4) {
	      var countryCode = data[payPtr++];
	      if (countryCode === 181) {
	        var providerCode = readUint16(data, payPtr);
	        payPtr += 2;
	        if (providerCode === 49) {
	          var userStructure = readUint32(data, payPtr);
	          payPtr += 4;
	          if (userStructure === 0x47413934) {
	            var userDataType = data[payPtr++];

	            // Raw CEA-608 bytes wrapped in CEA-708 packet
	            if (userDataType === 3) {
	              var firstByte = data[payPtr++];
	              var totalCCs = 0x1f & firstByte;
	              var enabled = 0x40 & firstByte;
	              var totalBytes = enabled ? 2 + totalCCs * 3 : 0;
	              var byteArray = new Uint8Array(totalBytes);
	              if (enabled) {
	                byteArray[0] = firstByte;
	                for (var i = 1; i < totalBytes; i++) {
	                  byteArray[i] = data[payPtr++];
	                }
	              }
	              samples.push({
	                type: userDataType,
	                payloadType: payloadType,
	                pts: pts,
	                bytes: byteArray
	              });
	            }
	          }
	        }
	      }
	    } else if (payloadType === 5) {
	      if (payloadSize > 16) {
	        var uuidStrArray = [];
	        for (var _i3 = 0; _i3 < 16; _i3++) {
	          var _b = data[payPtr++].toString(16);
	          uuidStrArray.push(_b.length == 1 ? '0' + _b : _b);
	          if (_i3 === 3 || _i3 === 5 || _i3 === 7 || _i3 === 9) {
	            uuidStrArray.push('-');
	          }
	        }
	        var length = payloadSize - 16;
	        var userDataBytes = new Uint8Array(length);
	        for (var _i4 = 0; _i4 < length; _i4++) {
	          userDataBytes[_i4] = data[payPtr++];
	        }
	        samples.push({
	          payloadType: payloadType,
	          pts: pts,
	          uuid: uuidStrArray.join(''),
	          userData: utf8ArrayToStr(userDataBytes),
	          userDataBytes: userDataBytes
	        });
	      }
	    }
	  }
	}

	/**
	 * remove Emulation Prevention bytes from a RBSP
	 */
	function discardEPB(data) {
	  var length = data.byteLength;
	  var EPBPositions = [];
	  var i = 1;

	  // Find all `Emulation Prevention Bytes`
	  while (i < length - 2) {
	    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0x03) {
	      EPBPositions.push(i + 2);
	      i += 2;
	    } else {
	      i++;
	    }
	  }

	  // If no Emulation Prevention Bytes were found just return the original
	  // array
	  if (EPBPositions.length === 0) {
	    return data;
	  }

	  // Create a new array to hold the NAL unit data
	  var newLength = length - EPBPositions.length;
	  var newData = new Uint8Array(newLength);
	  var sourceIndex = 0;
	  for (i = 0; i < newLength; sourceIndex++, i++) {
	    if (sourceIndex === EPBPositions[0]) {
	      // Skip this byte
	      sourceIndex++;
	      // Remove this position index
	      EPBPositions.shift();
	    }
	    newData[i] = data[sourceIndex];
	  }
	  return newData;
	}
	function parseEmsg(data) {
	  var version = data[0];
	  var schemeIdUri = '';
	  var value = '';
	  var timeScale = 0;
	  var presentationTimeDelta = 0;
	  var presentationTime = 0;
	  var eventDuration = 0;
	  var id = 0;
	  var offset = 0;
	  if (version === 0) {
	    while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
	      schemeIdUri += bin2str(data.subarray(offset, offset + 1));
	      offset += 1;
	    }
	    schemeIdUri += bin2str(data.subarray(offset, offset + 1));
	    offset += 1;
	    while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
	      value += bin2str(data.subarray(offset, offset + 1));
	      offset += 1;
	    }
	    value += bin2str(data.subarray(offset, offset + 1));
	    offset += 1;
	    timeScale = readUint32(data, 12);
	    presentationTimeDelta = readUint32(data, 16);
	    eventDuration = readUint32(data, 20);
	    id = readUint32(data, 24);
	    offset = 28;
	  } else if (version === 1) {
	    offset += 4;
	    timeScale = readUint32(data, offset);
	    offset += 4;
	    var leftPresentationTime = readUint32(data, offset);
	    offset += 4;
	    var rightPresentationTime = readUint32(data, offset);
	    offset += 4;
	    presentationTime = Math.pow(2, 32) * leftPresentationTime + rightPresentationTime;
	    if (!isSafeInteger(presentationTime)) {
	      presentationTime = Number.MAX_SAFE_INTEGER;
	      logger.warn('Presentation time exceeds safe integer limit and wrapped to max safe integer in parsing emsg box');
	    }
	    eventDuration = readUint32(data, offset);
	    offset += 4;
	    id = readUint32(data, offset);
	    offset += 4;
	    while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
	      schemeIdUri += bin2str(data.subarray(offset, offset + 1));
	      offset += 1;
	    }
	    schemeIdUri += bin2str(data.subarray(offset, offset + 1));
	    offset += 1;
	    while (bin2str(data.subarray(offset, offset + 1)) !== '\0') {
	      value += bin2str(data.subarray(offset, offset + 1));
	      offset += 1;
	    }
	    value += bin2str(data.subarray(offset, offset + 1));
	    offset += 1;
	  }
	  var payload = data.subarray(offset, data.byteLength);
	  return {
	    schemeIdUri: schemeIdUri,
	    value: value,
	    timeScale: timeScale,
	    presentationTime: presentationTime,
	    presentationTimeDelta: presentationTimeDelta,
	    eventDuration: eventDuration,
	    id: id,
	    payload: payload
	  };
	}

	function dummyTrack(type, inputTimeScale) {
	  if (type === void 0) {
	    type = '';
	  }
	  if (inputTimeScale === void 0) {
	    inputTimeScale = 90000;
	  }
	  return {
	    type: type,
	    id: -1,
	    pid: -1,
	    inputTimeScale: inputTimeScale,
	    sequenceNumber: -1,
	    samples: [],
	    dropped: 0
	  };
	}

	var BaseAudioDemuxer = /*#__PURE__*/function () {
	  function BaseAudioDemuxer() {
	    this._audioTrack = void 0;
	    this._id3Track = void 0;
	    this.frameIndex = 0;
	    this.cachedData = null;
	    this.basePTS = null;
	    this.initPTS = null;
	    this.lastPTS = null;
	  }
	  var _proto = BaseAudioDemuxer.prototype;
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    this._id3Track = {
	      type: 'id3',
	      id: 3,
	      pid: -1,
	      inputTimeScale: 90000,
	      sequenceNumber: 0,
	      samples: [],
	      dropped: 0
	    };
	  };
	  _proto.resetTimeStamp = function resetTimeStamp(deaultTimestamp) {
	    this.initPTS = deaultTimestamp;
	    this.resetContiguity();
	  };
	  _proto.resetContiguity = function resetContiguity() {
	    this.basePTS = null;
	    this.lastPTS = null;
	    this.frameIndex = 0;
	  };
	  _proto.canParse = function canParse(data, offset) {
	    return false;
	  };
	  _proto.appendFrame = function appendFrame(track, data, offset) {}

	  // feed incoming data to the front of the parsing pipeline
	  ;
	  _proto.demux = function demux(data, timeOffset) {
	    if (this.cachedData) {
	      data = appendUint8Array(this.cachedData, data);
	      this.cachedData = null;
	    }
	    var id3Data = getId3Data(data, 0);
	    var offset = id3Data ? id3Data.length : 0;
	    var lastDataIndex;
	    var track = this._audioTrack;
	    var id3Track = this._id3Track;
	    var timestamp = id3Data ? getId3Timestamp(id3Data) : undefined;
	    var length = data.length;
	    if (this.basePTS === null || this.frameIndex === 0 && isFiniteNumber(timestamp)) {
	      this.basePTS = initPTSFn(timestamp, timeOffset, this.initPTS);
	      this.lastPTS = this.basePTS;
	    }
	    if (this.lastPTS === null) {
	      this.lastPTS = this.basePTS;
	    }

	    // more expressive than alternative: id3Data?.length
	    if (id3Data && id3Data.length > 0) {
	      id3Track.samples.push({
	        pts: this.lastPTS,
	        dts: this.lastPTS,
	        data: id3Data,
	        type: MetadataSchema.audioId3,
	        duration: Number.POSITIVE_INFINITY
	      });
	    }
	    while (offset < length) {
	      if (this.canParse(data, offset)) {
	        var frame = this.appendFrame(track, data, offset);
	        if (frame) {
	          this.frameIndex++;
	          this.lastPTS = frame.sample.pts;
	          offset += frame.length;
	          lastDataIndex = offset;
	        } else {
	          offset = length;
	        }
	      } else if (canParseId3(data, offset)) {
	        // after a canParse, a call to getId3Data *should* always returns some data
	        id3Data = getId3Data(data, offset);
	        id3Track.samples.push({
	          pts: this.lastPTS,
	          dts: this.lastPTS,
	          data: id3Data,
	          type: MetadataSchema.audioId3,
	          duration: Number.POSITIVE_INFINITY
	        });
	        offset += id3Data.length;
	        lastDataIndex = offset;
	      } else {
	        offset++;
	      }
	      if (offset === length && lastDataIndex !== length) {
	        var partialData = data.slice(lastDataIndex);
	        if (this.cachedData) {
	          this.cachedData = appendUint8Array(this.cachedData, partialData);
	        } else {
	          this.cachedData = partialData;
	        }
	      }
	    }
	    return {
	      audioTrack: track,
	      videoTrack: dummyTrack(),
	      id3Track: id3Track,
	      textTrack: dummyTrack()
	    };
	  };
	  _proto.demuxSampleAes = function demuxSampleAes(data, keyData, timeOffset) {
	    return Promise.reject(new Error("[" + this + "] This demuxer does not support Sample-AES decryption"));
	  };
	  _proto.flush = function flush(timeOffset) {
	    // Parse cache in case of remaining frames.
	    var cachedData = this.cachedData;
	    if (cachedData) {
	      this.cachedData = null;
	      this.demux(cachedData, 0);
	    }
	    return {
	      audioTrack: this._audioTrack,
	      videoTrack: dummyTrack(),
	      id3Track: this._id3Track,
	      textTrack: dummyTrack()
	    };
	  };
	  _proto.destroy = function destroy() {
	    this.cachedData = null;
	    // @ts-ignore
	    this._audioTrack = this._id3Track = undefined;
	  };
	  return BaseAudioDemuxer;
	}();
	/**
	 * Initialize PTS
	 * <p>
	 *    use timestamp unless it is undefined, NaN or Infinity
	 * </p>
	 */
	var initPTSFn = function initPTSFn(timestamp, timeOffset, initPTS) {
	  if (isFiniteNumber(timestamp)) {
	    return timestamp * 90;
	  }
	  var init90kHz = initPTS ? initPTS.baseTime * 90000 / initPTS.timescale : 0;
	  return timeOffset * 90000 + init90kHz;
	};

	/**
	 *  MPEG parser helper
	 */

	var chromeVersion$1 = null;
	var BitratesMap = [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
	var SamplingRateMap = [44100, 48000, 32000, 22050, 24000, 16000, 11025, 12000, 8000];
	var SamplesCoefficients = [
	// MPEG 2.5
	[0,
	// Reserved
	72,
	// Layer3
	144,
	// Layer2
	12 // Layer1
	],
	// Reserved
	[0,
	// Reserved
	0,
	// Layer3
	0,
	// Layer2
	0 // Layer1
	],
	// MPEG 2
	[0,
	// Reserved
	72,
	// Layer3
	144,
	// Layer2
	12 // Layer1
	],
	// MPEG 1
	[0,
	// Reserved
	144,
	// Layer3
	144,
	// Layer2
	12 // Layer1
	]];
	var BytesInSlot = [0,
	// Reserved
	1,
	// Layer3
	1,
	// Layer2
	4 // Layer1
	];
	function appendFrame(track, data, offset, pts, frameIndex) {
	  // Using http://www.datavoyage.com/mpgscript/mpeghdr.htm as a reference
	  if (offset + 24 > data.length) {
	    return;
	  }
	  var header = parseHeader(data, offset);
	  if (header && offset + header.frameLength <= data.length) {
	    var frameDuration = header.samplesPerFrame * 90000 / header.sampleRate;
	    var stamp = pts + frameIndex * frameDuration;
	    var sample = {
	      unit: data.subarray(offset, offset + header.frameLength),
	      pts: stamp,
	      dts: stamp
	    };
	    track.config = [];
	    track.channelCount = header.channelCount;
	    track.samplerate = header.sampleRate;
	    track.samples.push(sample);
	    return {
	      sample: sample,
	      length: header.frameLength,
	      missing: 0
	    };
	  }
	}
	function parseHeader(data, offset) {
	  var mpegVersion = data[offset + 1] >> 3 & 3;
	  var mpegLayer = data[offset + 1] >> 1 & 3;
	  var bitRateIndex = data[offset + 2] >> 4 & 15;
	  var sampleRateIndex = data[offset + 2] >> 2 & 3;
	  if (mpegVersion !== 1 && bitRateIndex !== 0 && bitRateIndex !== 15 && sampleRateIndex !== 3) {
	    var paddingBit = data[offset + 2] >> 1 & 1;
	    var channelMode = data[offset + 3] >> 6;
	    var columnInBitrates = mpegVersion === 3 ? 3 - mpegLayer : mpegLayer === 3 ? 3 : 4;
	    var bitRate = BitratesMap[columnInBitrates * 14 + bitRateIndex - 1] * 1000;
	    var columnInSampleRates = mpegVersion === 3 ? 0 : mpegVersion === 2 ? 1 : 2;
	    var sampleRate = SamplingRateMap[columnInSampleRates * 3 + sampleRateIndex];
	    var channelCount = channelMode === 3 ? 1 : 2; // If bits of channel mode are `11` then it is a single channel (Mono)
	    var sampleCoefficient = SamplesCoefficients[mpegVersion][mpegLayer];
	    var bytesInSlot = BytesInSlot[mpegLayer];
	    var samplesPerFrame = sampleCoefficient * 8 * bytesInSlot;
	    var frameLength = Math.floor(sampleCoefficient * bitRate / sampleRate + paddingBit) * bytesInSlot;
	    if (chromeVersion$1 === null) {
	      var userAgent = navigator.userAgent || '';
	      var result = userAgent.match(/Chrome\/(\d+)/i);
	      chromeVersion$1 = result ? parseInt(result[1]) : 0;
	    }
	    var needChromeFix = !!chromeVersion$1 && chromeVersion$1 <= 87;
	    if (needChromeFix && mpegLayer === 2 && bitRate >= 224000 && channelMode === 0) {
	      // Work around bug in Chromium by setting channelMode to dual-channel (01) instead of stereo (00)
	      data[offset + 3] = data[offset + 3] | 0x80;
	    }
	    return {
	      sampleRate: sampleRate,
	      channelCount: channelCount,
	      frameLength: frameLength,
	      samplesPerFrame: samplesPerFrame
	    };
	  }
	}
	function isHeaderPattern(data, offset) {
	  return data[offset] === 0xff && (data[offset + 1] & 0xe0) === 0xe0 && (data[offset + 1] & 0x06) !== 0x00;
	}
	function isHeader(data, offset) {
	  // Look for MPEG header | 1111 1111 | 111X XYZX | where X can be either 0 or 1 and Y or Z should be 1
	  // Layer bits (position 14 and 15) in header should be always different from 0 (Layer I or Layer II or Layer III)
	  // More info http://www.mp3-tech.org/programmer/frame_header.html
	  return offset + 1 < data.length && isHeaderPattern(data, offset);
	}
	function canParse(data, offset) {
	  var headerSize = 4;
	  return isHeaderPattern(data, offset) && headerSize <= data.length - offset;
	}
	function probe(data, offset) {
	  // same as isHeader but we also check that MPEG frame follows last MPEG frame
	  // or end of data is reached
	  if (offset + 1 < data.length && isHeaderPattern(data, offset)) {
	    // MPEG header Length
	    var headerLength = 4;
	    // MPEG frame Length
	    var header = parseHeader(data, offset);
	    var frameLength = headerLength;
	    if (header != null && header.frameLength) {
	      frameLength = header.frameLength;
	    }
	    var newOffset = offset + frameLength;
	    return newOffset === data.length || isHeader(data, newOffset);
	  }
	  return false;
	}

	var AACDemuxer = /*#__PURE__*/function (_BaseAudioDemuxer) {
	  function AACDemuxer(observer, config) {
	    var _this;
	    _this = _BaseAudioDemuxer.call(this) || this;
	    _this.observer = void 0;
	    _this.config = void 0;
	    _this.observer = observer;
	    _this.config = config;
	    return _this;
	  }
	  _inheritsLoose(AACDemuxer, _BaseAudioDemuxer);
	  var _proto = AACDemuxer.prototype;
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    _BaseAudioDemuxer.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
	    this._audioTrack = {
	      container: 'audio/adts',
	      type: 'audio',
	      id: 2,
	      pid: -1,
	      sequenceNumber: 0,
	      segmentCodec: 'aac',
	      samples: [],
	      manifestCodec: audioCodec,
	      duration: trackDuration,
	      inputTimeScale: 90000,
	      dropped: 0
	    };
	  }

	  // Source for probe info - https://wiki.multimedia.cx/index.php?title=ADTS
	  ;
	  AACDemuxer.probe = function probe$2(data, logger) {
	    if (!data) {
	      return false;
	    }

	    // Check for the ADTS sync word
	    // Look for ADTS header | 1111 1111 | 1111 X00X | where X can be either 0 or 1
	    // Layer bits (position 14 and 15) in header should be always 0 for ADTS
	    // More info https://wiki.multimedia.cx/index.php?title=ADTS
	    var id3Data = getId3Data(data, 0);
	    var offset = (id3Data == null ? void 0 : id3Data.length) || 0;
	    if (probe(data, offset)) {
	      return false;
	    }
	    for (var length = data.length; offset < length; offset++) {
	      if (probe$1(data, offset)) {
	        logger.log('ADTS sync word found !');
	        return true;
	      }
	    }
	    return false;
	  };
	  _proto.canParse = function canParse(data, offset) {
	    return canParse$1(data, offset);
	  };
	  _proto.appendFrame = function appendFrame(track, data, offset) {
	    initTrackConfig(track, this.observer, data, offset, track.manifestCodec, this.config.userAgent);
	    var frame = appendFrame$1(track, data, offset, this.basePTS, this.frameIndex);
	    if (frame && frame.missing === 0) {
	      return frame;
	    }
	  };
	  return AACDemuxer;
	}(BaseAudioDemuxer);

	var getAudioBSID = function getAudioBSID(data, offset) {
	  // check the bsid to confirm ac-3 | ec-3
	  var bsid = 0;
	  var numBits = 5;
	  offset += numBits;
	  var temp = new Uint32Array(1); // unsigned 32 bit for temporary storage
	  var mask = new Uint32Array(1); // unsigned 32 bit mask value
	  var _byte = new Uint8Array(1); // unsigned 8 bit for temporary storage
	  while (numBits > 0) {
	    _byte[0] = data[offset];
	    // read remaining bits, upto 8 bits at a time
	    var bits = Math.min(numBits, 8);
	    var shift = 8 - bits;
	    mask[0] = 0xff000000 >>> 24 + shift << shift;
	    temp[0] = (_byte[0] & mask[0]) >> shift;
	    bsid = !bsid ? temp[0] : bsid << bits | temp[0];
	    offset += 1;
	    numBits -= bits;
	  }
	  return bsid;
	};

	var AC3Demuxer = /*#__PURE__*/function (_BaseAudioDemuxer) {
	  function AC3Demuxer(observer) {
	    var _this;
	    _this = _BaseAudioDemuxer.call(this) || this;
	    _this.observer = void 0;
	    _this.observer = observer;
	    return _this;
	  }
	  _inheritsLoose(AC3Demuxer, _BaseAudioDemuxer);
	  var _proto = AC3Demuxer.prototype;
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    _BaseAudioDemuxer.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
	    this._audioTrack = {
	      container: 'audio/ac-3',
	      type: 'audio',
	      id: 2,
	      pid: -1,
	      sequenceNumber: 0,
	      segmentCodec: 'ac3',
	      samples: [],
	      manifestCodec: audioCodec,
	      duration: trackDuration,
	      inputTimeScale: 90000,
	      dropped: 0
	    };
	  };
	  _proto.canParse = function canParse(data, offset) {
	    return offset + 64 < data.length;
	  };
	  _proto.appendFrame = function appendFrame(track, data, offset) {
	    var frameLength = _appendFrame(track, data, offset, this.basePTS, this.frameIndex);
	    if (frameLength !== -1) {
	      var sample = track.samples[track.samples.length - 1];
	      return {
	        sample: sample,
	        length: frameLength,
	        missing: 0
	      };
	    }
	  };
	  AC3Demuxer.probe = function probe(data) {
	    if (!data) {
	      return false;
	    }
	    var id3Data = getId3Data(data, 0);
	    if (!id3Data) {
	      return false;
	    }

	    // look for the ac-3 sync bytes
	    var offset = id3Data.length;
	    if (data[offset] === 0x0b && data[offset + 1] === 0x77 && getId3Timestamp(id3Data) !== undefined &&
	    // check the bsid to confirm ac-3
	    getAudioBSID(data, offset) < 16) {
	      return true;
	    }
	    return false;
	  };
	  return AC3Demuxer;
	}(BaseAudioDemuxer);
	function _appendFrame(track, data, start, pts, frameIndex) {
	  if (start + 8 > data.length) {
	    return -1; // not enough bytes left
	  }
	  if (data[start] !== 0x0b || data[start + 1] !== 0x77) {
	    return -1; // invalid magic
	  }

	  // get sample rate
	  var samplingRateCode = data[start + 4] >> 6;
	  if (samplingRateCode >= 3) {
	    return -1; // invalid sampling rate
	  }
	  var samplingRateMap = [48000, 44100, 32000];
	  var sampleRate = samplingRateMap[samplingRateCode];

	  // get frame size
	  var frameSizeCode = data[start + 4] & 0x3f;
	  var frameSizeMap = [64, 69, 96, 64, 70, 96, 80, 87, 120, 80, 88, 120, 96, 104, 144, 96, 105, 144, 112, 121, 168, 112, 122, 168, 128, 139, 192, 128, 140, 192, 160, 174, 240, 160, 175, 240, 192, 208, 288, 192, 209, 288, 224, 243, 336, 224, 244, 336, 256, 278, 384, 256, 279, 384, 320, 348, 480, 320, 349, 480, 384, 417, 576, 384, 418, 576, 448, 487, 672, 448, 488, 672, 512, 557, 768, 512, 558, 768, 640, 696, 960, 640, 697, 960, 768, 835, 1152, 768, 836, 1152, 896, 975, 1344, 896, 976, 1344, 1024, 1114, 1536, 1024, 1115, 1536, 1152, 1253, 1728, 1152, 1254, 1728, 1280, 1393, 1920, 1280, 1394, 1920];
	  var frameLength = frameSizeMap[frameSizeCode * 3 + samplingRateCode] * 2;
	  if (start + frameLength > data.length) {
	    return -1;
	  }

	  // get channel count
	  var channelMode = data[start + 6] >> 5;
	  var skipCount = 0;
	  if (channelMode === 2) {
	    skipCount += 2;
	  } else {
	    if (channelMode & 1 && channelMode !== 1) {
	      skipCount += 2;
	    }
	    if (channelMode & 4) {
	      skipCount += 2;
	    }
	  }
	  var lfeon = (data[start + 6] << 8 | data[start + 7]) >> 12 - skipCount & 1;
	  var channelsMap = [2, 1, 2, 3, 3, 4, 4, 5];
	  var channelCount = channelsMap[channelMode] + lfeon;

	  // build dac3 box
	  var bsid = data[start + 5] >> 3;
	  var bsmod = data[start + 5] & 7;
	  var config = new Uint8Array([samplingRateCode << 6 | bsid << 1 | bsmod >> 2, (bsmod & 3) << 6 | channelMode << 3 | lfeon << 2 | frameSizeCode >> 4, frameSizeCode << 4 & 0xe0]);
	  var frameDuration = 1536 / sampleRate * 90000;
	  var stamp = pts + frameIndex * frameDuration;
	  var unit = data.subarray(start, start + frameLength);
	  track.config = config;
	  track.channelCount = channelCount;
	  track.samplerate = sampleRate;
	  track.samples.push({
	    unit: unit,
	    pts: stamp
	  });
	  return frameLength;
	}

	var MP3Demuxer = /*#__PURE__*/function (_BaseAudioDemuxer) {
	  function MP3Demuxer() {
	    return _BaseAudioDemuxer.apply(this, arguments) || this;
	  }
	  _inheritsLoose(MP3Demuxer, _BaseAudioDemuxer);
	  var _proto = MP3Demuxer.prototype;
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    _BaseAudioDemuxer.prototype.resetInitSegment.call(this, initSegment, audioCodec, videoCodec, trackDuration);
	    this._audioTrack = {
	      container: 'audio/mpeg',
	      type: 'audio',
	      id: 2,
	      pid: -1,
	      sequenceNumber: 0,
	      segmentCodec: 'mp3',
	      samples: [],
	      manifestCodec: audioCodec,
	      duration: trackDuration,
	      inputTimeScale: 90000,
	      dropped: 0
	    };
	  };
	  MP3Demuxer.probe = function probe$1(data) {
	    if (!data) {
	      return false;
	    }

	    // check if data contains ID3 timestamp and MPEG sync word
	    // Look for MPEG header | 1111 1111 | 111X XYZX | where X can be either 0 or 1 and Y or Z should be 1
	    // Layer bits (position 14 and 15) in header should be always different from 0 (Layer I or Layer II or Layer III)
	    // More info http://www.mp3-tech.org/programmer/frame_header.html
	    var id3Data = getId3Data(data, 0);
	    var offset = (id3Data == null ? void 0 : id3Data.length) || 0;

	    // Check for ac-3|ec-3 sync bytes and return false if present
	    if (id3Data && data[offset] === 0x0b && data[offset + 1] === 0x77 && getId3Timestamp(id3Data) !== undefined &&
	    // check the bsid to confirm ac-3 or ec-3 (not mp3)
	    getAudioBSID(data, offset) <= 16) {
	      return false;
	    }
	    for (var length = data.length; offset < length; offset++) {
	      if (probe(data, offset)) {
	        logger.log('MPEG Audio sync word found !');
	        return true;
	      }
	    }
	    return false;
	  };
	  _proto.canParse = function canParse$1(data, offset) {
	    return canParse(data, offset);
	  };
	  _proto.appendFrame = function appendFrame$1(track, data, offset) {
	    if (this.basePTS === null) {
	      return;
	    }
	    return appendFrame(track, data, offset, this.basePTS, this.frameIndex);
	  };
	  return MP3Demuxer;
	}(BaseAudioDemuxer);

	var DecrypterAesMode = {
	  cbc: 0,
	  ctr: 1
	};

	var AESCrypto = /*#__PURE__*/function () {
	  function AESCrypto(subtle, iv, aesMode) {
	    this.subtle = void 0;
	    this.aesIV = void 0;
	    this.aesMode = void 0;
	    this.subtle = subtle;
	    this.aesIV = iv;
	    this.aesMode = aesMode;
	  }
	  var _proto = AESCrypto.prototype;
	  _proto.decrypt = function decrypt(data, key) {
	    switch (this.aesMode) {
	      case DecrypterAesMode.cbc:
	        return this.subtle.decrypt({
	          name: 'AES-CBC',
	          iv: this.aesIV
	        }, key, data);
	      case DecrypterAesMode.ctr:
	        return this.subtle.decrypt({
	          name: 'AES-CTR',
	          counter: this.aesIV,
	          length: 64
	        },
	        //64 : NIST SP800-38A standard suggests that the counter should occupy half of the counter block
	        key, data);
	      default:
	        throw new Error("[AESCrypto] invalid aes mode " + this.aesMode);
	    }
	  };
	  return AESCrypto;
	}();

	// PKCS7
	function removePadding(array) {
	  var outputBytes = array.byteLength;
	  var paddingBytes = outputBytes && new DataView(array.buffer).getUint8(outputBytes - 1);
	  if (paddingBytes) {
	    return array.slice(0, outputBytes - paddingBytes);
	  }
	  return array;
	}
	var AESDecryptor = /*#__PURE__*/function () {
	  function AESDecryptor() {
	    this.rcon = [0x0, 0x1, 0x2, 0x4, 0x8, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
	    this.subMix = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
	    this.invSubMix = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
	    this.sBox = new Uint32Array(256);
	    this.invSBox = new Uint32Array(256);
	    this.key = new Uint32Array(0);
	    this.ksRows = 0;
	    this.keySize = 0;
	    this.keySchedule = void 0;
	    this.invKeySchedule = void 0;
	    this.initTable();
	  }

	  // Using view.getUint32() also swaps the byte order.
	  var _proto = AESDecryptor.prototype;
	  _proto.uint8ArrayToUint32Array_ = function uint8ArrayToUint32Array_(arrayBuffer) {
	    var view = new DataView(arrayBuffer);
	    var newArray = new Uint32Array(4);
	    for (var i = 0; i < 4; i++) {
	      newArray[i] = view.getUint32(i * 4);
	    }
	    return newArray;
	  };
	  _proto.initTable = function initTable() {
	    var sBox = this.sBox;
	    var invSBox = this.invSBox;
	    var subMix = this.subMix;
	    var subMix0 = subMix[0];
	    var subMix1 = subMix[1];
	    var subMix2 = subMix[2];
	    var subMix3 = subMix[3];
	    var invSubMix = this.invSubMix;
	    var invSubMix0 = invSubMix[0];
	    var invSubMix1 = invSubMix[1];
	    var invSubMix2 = invSubMix[2];
	    var invSubMix3 = invSubMix[3];
	    var d = new Uint32Array(256);
	    var x = 0;
	    var xi = 0;
	    var i = 0;
	    for (i = 0; i < 256; i++) {
	      if (i < 128) {
	        d[i] = i << 1;
	      } else {
	        d[i] = i << 1 ^ 0x11b;
	      }
	    }
	    for (i = 0; i < 256; i++) {
	      var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
	      sx = sx >>> 8 ^ sx & 0xff ^ 0x63;
	      sBox[x] = sx;
	      invSBox[sx] = x;

	      // Compute multiplication
	      var x2 = d[x];
	      var x4 = d[x2];
	      var x8 = d[x4];

	      // Compute sub/invSub bytes, mix columns tables
	      var t = d[sx] * 0x101 ^ sx * 0x1010100;
	      subMix0[x] = t << 24 | t >>> 8;
	      subMix1[x] = t << 16 | t >>> 16;
	      subMix2[x] = t << 8 | t >>> 24;
	      subMix3[x] = t;

	      // Compute inv sub bytes, inv mix columns tables
	      t = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
	      invSubMix0[sx] = t << 24 | t >>> 8;
	      invSubMix1[sx] = t << 16 | t >>> 16;
	      invSubMix2[sx] = t << 8 | t >>> 24;
	      invSubMix3[sx] = t;

	      // Compute next counter
	      if (!x) {
	        x = xi = 1;
	      } else {
	        x = x2 ^ d[d[d[x8 ^ x2]]];
	        xi ^= d[d[xi]];
	      }
	    }
	  };
	  _proto.expandKey = function expandKey(keyBuffer) {
	    // convert keyBuffer to Uint32Array
	    var key = this.uint8ArrayToUint32Array_(keyBuffer);
	    var sameKey = true;
	    var offset = 0;
	    while (offset < key.length && sameKey) {
	      sameKey = key[offset] === this.key[offset];
	      offset++;
	    }
	    if (sameKey) {
	      return;
	    }
	    this.key = key;
	    var keySize = this.keySize = key.length;
	    if (keySize !== 4 && keySize !== 6 && keySize !== 8) {
	      throw new Error('Invalid aes key size=' + keySize);
	    }
	    var ksRows = this.ksRows = (keySize + 6 + 1) * 4;
	    var ksRow;
	    var invKsRow;
	    var keySchedule = this.keySchedule = new Uint32Array(ksRows);
	    var invKeySchedule = this.invKeySchedule = new Uint32Array(ksRows);
	    var sbox = this.sBox;
	    var rcon = this.rcon;
	    var invSubMix = this.invSubMix;
	    var invSubMix0 = invSubMix[0];
	    var invSubMix1 = invSubMix[1];
	    var invSubMix2 = invSubMix[2];
	    var invSubMix3 = invSubMix[3];
	    var prev;
	    var t;
	    for (ksRow = 0; ksRow < ksRows; ksRow++) {
	      if (ksRow < keySize) {
	        prev = keySchedule[ksRow] = key[ksRow];
	        continue;
	      }
	      t = prev;
	      if (ksRow % keySize === 0) {
	        // Rot word
	        t = t << 8 | t >>> 24;

	        // Sub word
	        t = sbox[t >>> 24] << 24 | sbox[t >>> 16 & 0xff] << 16 | sbox[t >>> 8 & 0xff] << 8 | sbox[t & 0xff];

	        // Mix Rcon
	        t ^= rcon[ksRow / keySize | 0] << 24;
	      } else if (keySize > 6 && ksRow % keySize === 4) {
	        // Sub word
	        t = sbox[t >>> 24] << 24 | sbox[t >>> 16 & 0xff] << 16 | sbox[t >>> 8 & 0xff] << 8 | sbox[t & 0xff];
	      }
	      keySchedule[ksRow] = prev = (keySchedule[ksRow - keySize] ^ t) >>> 0;
	    }
	    for (invKsRow = 0; invKsRow < ksRows; invKsRow++) {
	      ksRow = ksRows - invKsRow;
	      if (invKsRow & 3) {
	        t = keySchedule[ksRow];
	      } else {
	        t = keySchedule[ksRow - 4];
	      }
	      if (invKsRow < 4 || ksRow <= 4) {
	        invKeySchedule[invKsRow] = t;
	      } else {
	        invKeySchedule[invKsRow] = invSubMix0[sbox[t >>> 24]] ^ invSubMix1[sbox[t >>> 16 & 0xff]] ^ invSubMix2[sbox[t >>> 8 & 0xff]] ^ invSubMix3[sbox[t & 0xff]];
	      }
	      invKeySchedule[invKsRow] = invKeySchedule[invKsRow] >>> 0;
	    }
	  }

	  // Adding this as a method greatly improves performance.
	  ;
	  _proto.networkToHostOrderSwap = function networkToHostOrderSwap(word) {
	    return word << 24 | (word & 0xff00) << 8 | (word & 0xff0000) >> 8 | word >>> 24;
	  };
	  _proto.decrypt = function decrypt(inputArrayBuffer, offset, aesIV) {
	    var nRounds = this.keySize + 6;
	    var invKeySchedule = this.invKeySchedule;
	    var invSBOX = this.invSBox;
	    var invSubMix = this.invSubMix;
	    var invSubMix0 = invSubMix[0];
	    var invSubMix1 = invSubMix[1];
	    var invSubMix2 = invSubMix[2];
	    var invSubMix3 = invSubMix[3];
	    var initVector = this.uint8ArrayToUint32Array_(aesIV);
	    var initVector0 = initVector[0];
	    var initVector1 = initVector[1];
	    var initVector2 = initVector[2];
	    var initVector3 = initVector[3];
	    var inputInt32 = new Int32Array(inputArrayBuffer);
	    var outputInt32 = new Int32Array(inputInt32.length);
	    var t0, t1, t2, t3;
	    var s0, s1, s2, s3;
	    var inputWords0, inputWords1, inputWords2, inputWords3;
	    var ksRow, i;
	    var swapWord = this.networkToHostOrderSwap;
	    while (offset < inputInt32.length) {
	      inputWords0 = swapWord(inputInt32[offset]);
	      inputWords1 = swapWord(inputInt32[offset + 1]);
	      inputWords2 = swapWord(inputInt32[offset + 2]);
	      inputWords3 = swapWord(inputInt32[offset + 3]);
	      s0 = inputWords0 ^ invKeySchedule[0];
	      s1 = inputWords3 ^ invKeySchedule[1];
	      s2 = inputWords2 ^ invKeySchedule[2];
	      s3 = inputWords1 ^ invKeySchedule[3];
	      ksRow = 4;

	      // Iterate through the rounds of decryption
	      for (i = 1; i < nRounds; i++) {
	        t0 = invSubMix0[s0 >>> 24] ^ invSubMix1[s1 >> 16 & 0xff] ^ invSubMix2[s2 >> 8 & 0xff] ^ invSubMix3[s3 & 0xff] ^ invKeySchedule[ksRow];
	        t1 = invSubMix0[s1 >>> 24] ^ invSubMix1[s2 >> 16 & 0xff] ^ invSubMix2[s3 >> 8 & 0xff] ^ invSubMix3[s0 & 0xff] ^ invKeySchedule[ksRow + 1];
	        t2 = invSubMix0[s2 >>> 24] ^ invSubMix1[s3 >> 16 & 0xff] ^ invSubMix2[s0 >> 8 & 0xff] ^ invSubMix3[s1 & 0xff] ^ invKeySchedule[ksRow + 2];
	        t3 = invSubMix0[s3 >>> 24] ^ invSubMix1[s0 >> 16 & 0xff] ^ invSubMix2[s1 >> 8 & 0xff] ^ invSubMix3[s2 & 0xff] ^ invKeySchedule[ksRow + 3];
	        // Update state
	        s0 = t0;
	        s1 = t1;
	        s2 = t2;
	        s3 = t3;
	        ksRow = ksRow + 4;
	      }

	      // Shift rows, sub bytes, add round key
	      t0 = invSBOX[s0 >>> 24] << 24 ^ invSBOX[s1 >> 16 & 0xff] << 16 ^ invSBOX[s2 >> 8 & 0xff] << 8 ^ invSBOX[s3 & 0xff] ^ invKeySchedule[ksRow];
	      t1 = invSBOX[s1 >>> 24] << 24 ^ invSBOX[s2 >> 16 & 0xff] << 16 ^ invSBOX[s3 >> 8 & 0xff] << 8 ^ invSBOX[s0 & 0xff] ^ invKeySchedule[ksRow + 1];
	      t2 = invSBOX[s2 >>> 24] << 24 ^ invSBOX[s3 >> 16 & 0xff] << 16 ^ invSBOX[s0 >> 8 & 0xff] << 8 ^ invSBOX[s1 & 0xff] ^ invKeySchedule[ksRow + 2];
	      t3 = invSBOX[s3 >>> 24] << 24 ^ invSBOX[s0 >> 16 & 0xff] << 16 ^ invSBOX[s1 >> 8 & 0xff] << 8 ^ invSBOX[s2 & 0xff] ^ invKeySchedule[ksRow + 3];

	      // Write
	      outputInt32[offset] = swapWord(t0 ^ initVector0);
	      outputInt32[offset + 1] = swapWord(t3 ^ initVector1);
	      outputInt32[offset + 2] = swapWord(t2 ^ initVector2);
	      outputInt32[offset + 3] = swapWord(t1 ^ initVector3);

	      // reset initVector to last 4 unsigned int
	      initVector0 = inputWords0;
	      initVector1 = inputWords1;
	      initVector2 = inputWords2;
	      initVector3 = inputWords3;
	      offset = offset + 4;
	    }
	    return outputInt32.buffer;
	  };
	  return AESDecryptor;
	}();

	var FastAESKey = /*#__PURE__*/function () {
	  function FastAESKey(subtle, key, aesMode) {
	    this.subtle = void 0;
	    this.key = void 0;
	    this.aesMode = void 0;
	    this.subtle = subtle;
	    this.key = key;
	    this.aesMode = aesMode;
	  }
	  var _proto = FastAESKey.prototype;
	  _proto.expandKey = function expandKey() {
	    var subtleAlgoName = getSubtleAlgoName(this.aesMode);
	    return this.subtle.importKey('raw', this.key, {
	      name: subtleAlgoName
	    }, false, ['encrypt', 'decrypt']);
	  };
	  return FastAESKey;
	}();
	function getSubtleAlgoName(aesMode) {
	  switch (aesMode) {
	    case DecrypterAesMode.cbc:
	      return 'AES-CBC';
	    case DecrypterAesMode.ctr:
	      return 'AES-CTR';
	    default:
	      throw new Error("[FastAESKey] invalid aes mode " + aesMode);
	  }
	}

	var CHUNK_SIZE = 16; // 16 bytes, 128 bits
	var Decrypter = /*#__PURE__*/function () {
	  function Decrypter(config, _temp) {
	    var _ref = _temp === void 0 ? {} : _temp,
	      _ref$removePKCS7Paddi = _ref.removePKCS7Padding,
	      removePKCS7Padding = _ref$removePKCS7Paddi === void 0 ? true : _ref$removePKCS7Paddi;
	    this.logEnabled = true;
	    this.removePKCS7Padding = void 0;
	    this.subtle = null;
	    this.softwareDecrypter = null;
	    this.key = null;
	    this.fastAesKey = null;
	    this.remainderData = null;
	    this.currentIV = null;
	    this.currentResult = null;
	    this.useSoftware = void 0;
	    this.enableSoftwareAES = void 0;
	    this.enableSoftwareAES = config.enableSoftwareAES;
	    this.removePKCS7Padding = removePKCS7Padding;
	    // built in decryptor expects PKCS7 padding
	    if (removePKCS7Padding) {
	      try {
	        var browserCrypto = self.crypto;
	        if (browserCrypto) {
	          this.subtle = browserCrypto.subtle || browserCrypto.webkitSubtle;
	        }
	      } catch (e) {
	        /* no-op */
	      }
	    }
	    this.useSoftware = !this.subtle;
	  }
	  var _proto = Decrypter.prototype;
	  _proto.destroy = function destroy() {
	    this.subtle = null;
	    this.softwareDecrypter = null;
	    this.key = null;
	    this.fastAesKey = null;
	    this.remainderData = null;
	    this.currentIV = null;
	    this.currentResult = null;
	  };
	  _proto.isSync = function isSync() {
	    return this.useSoftware;
	  };
	  _proto.flush = function flush() {
	    var currentResult = this.currentResult,
	      remainderData = this.remainderData;
	    if (!currentResult || remainderData) {
	      this.reset();
	      return null;
	    }
	    var data = new Uint8Array(currentResult);
	    this.reset();
	    if (this.removePKCS7Padding) {
	      return removePadding(data);
	    }
	    return data;
	  };
	  _proto.reset = function reset() {
	    this.currentResult = null;
	    this.currentIV = null;
	    this.remainderData = null;
	    if (this.softwareDecrypter) {
	      this.softwareDecrypter = null;
	    }
	  };
	  _proto.decrypt = function decrypt(data, key, iv, aesMode) {
	    var _this = this;
	    if (this.useSoftware) {
	      return new Promise(function (resolve, reject) {
	        var dataView = ArrayBuffer.isView(data) ? data : new Uint8Array(data);
	        _this.softwareDecrypt(dataView, key, iv, aesMode);
	        var decryptResult = _this.flush();
	        if (decryptResult) {
	          resolve(decryptResult.buffer);
	        } else {
	          reject(new Error('[softwareDecrypt] Failed to decrypt data'));
	        }
	      });
	    }
	    return this.webCryptoDecrypt(new Uint8Array(data), key, iv, aesMode);
	  }

	  // Software decryption is progressive. Progressive decryption may not return a result on each call. Any cached
	  // data is handled in the flush() call
	  ;
	  _proto.softwareDecrypt = function softwareDecrypt(data, key, iv, aesMode) {
	    var currentIV = this.currentIV,
	      currentResult = this.currentResult,
	      remainderData = this.remainderData;
	    if (aesMode !== DecrypterAesMode.cbc || key.byteLength !== 16) {
	      logger.warn('SoftwareDecrypt: can only handle AES-128-CBC');
	      return null;
	    }
	    this.logOnce('JS AES decrypt');
	    // The output is staggered during progressive parsing - the current result is cached, and emitted on the next call
	    // This is done in order to strip PKCS7 padding, which is found at the end of each segment. We only know we've reached
	    // the end on flush(), but by that time we have already received all bytes for the segment.
	    // Progressive decryption does not work with WebCrypto

	    if (remainderData) {
	      data = appendUint8Array(remainderData, data);
	      this.remainderData = null;
	    }

	    // Byte length must be a multiple of 16 (AES-128 = 128 bit blocks = 16 bytes)
	    var currentChunk = this.getValidChunk(data);
	    if (!currentChunk.length) {
	      return null;
	    }
	    if (currentIV) {
	      iv = currentIV;
	    }
	    var softwareDecrypter = this.softwareDecrypter;
	    if (!softwareDecrypter) {
	      softwareDecrypter = this.softwareDecrypter = new AESDecryptor();
	    }
	    softwareDecrypter.expandKey(key);
	    var result = currentResult;
	    this.currentResult = softwareDecrypter.decrypt(currentChunk.buffer, 0, iv);
	    this.currentIV = currentChunk.slice(-16).buffer;
	    if (!result) {
	      return null;
	    }
	    return result;
	  };
	  _proto.webCryptoDecrypt = function webCryptoDecrypt(data, key, iv, aesMode) {
	    var _this2 = this;
	    if (this.key !== key || !this.fastAesKey) {
	      if (!this.subtle) {
	        return Promise.resolve(this.onWebCryptoError(data, key, iv, aesMode));
	      }
	      this.key = key;
	      this.fastAesKey = new FastAESKey(this.subtle, key, aesMode);
	    }
	    return this.fastAesKey.expandKey().then(function (aesKey) {
	      // decrypt using web crypto
	      if (!_this2.subtle) {
	        return Promise.reject(new Error('web crypto not initialized'));
	      }
	      _this2.logOnce('WebCrypto AES decrypt');
	      var crypto = new AESCrypto(_this2.subtle, new Uint8Array(iv), aesMode);
	      return crypto.decrypt(data.buffer, aesKey);
	    }).catch(function (err) {
	      logger.warn("[decrypter]: WebCrypto Error, disable WebCrypto API, " + err.name + ": " + err.message);
	      return _this2.onWebCryptoError(data, key, iv, aesMode);
	    });
	  };
	  _proto.onWebCryptoError = function onWebCryptoError(data, key, iv, aesMode) {
	    var enableSoftwareAES = this.enableSoftwareAES;
	    if (enableSoftwareAES) {
	      this.useSoftware = true;
	      this.logEnabled = true;
	      this.softwareDecrypt(data, key, iv, aesMode);
	      var decryptResult = this.flush();
	      if (decryptResult) {
	        return decryptResult.buffer;
	      }
	    }
	    throw new Error('WebCrypto' + (enableSoftwareAES ? ' and softwareDecrypt' : '') + ': failed to decrypt data');
	  };
	  _proto.getValidChunk = function getValidChunk(data) {
	    var currentChunk = data;
	    var splitPoint = data.length - data.length % CHUNK_SIZE;
	    if (splitPoint !== data.length) {
	      currentChunk = data.slice(0, splitPoint);
	      this.remainderData = data.slice(splitPoint);
	    }
	    return currentChunk;
	  };
	  _proto.logOnce = function logOnce(msg) {
	    if (!this.logEnabled) {
	      return;
	    }
	    logger.log("[decrypter]: " + msg);
	    this.logEnabled = false;
	  };
	  return Decrypter;
	}();

	var emsgSchemePattern = /\/emsg[-/]ID3/i;
	var MP4Demuxer = /*#__PURE__*/function () {
	  function MP4Demuxer(observer, config) {
	    this.remainderData = null;
	    this.timeOffset = 0;
	    this.config = void 0;
	    this.videoTrack = void 0;
	    this.audioTrack = void 0;
	    this.id3Track = void 0;
	    this.txtTrack = void 0;
	    this.config = config;
	  }
	  var _proto = MP4Demuxer.prototype;
	  _proto.resetTimeStamp = function resetTimeStamp() {};
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    var videoTrack = this.videoTrack = dummyTrack('video', 1);
	    var audioTrack = this.audioTrack = dummyTrack('audio', 1);
	    var captionTrack = this.txtTrack = dummyTrack('text', 1);
	    this.id3Track = dummyTrack('id3', 1);
	    this.timeOffset = 0;
	    if (!(initSegment != null && initSegment.byteLength)) {
	      return;
	    }
	    var initData = parseInitSegment(initSegment);
	    if (initData.video) {
	      var _initData$video = initData.video,
	        id = _initData$video.id,
	        timescale = _initData$video.timescale,
	        codec = _initData$video.codec,
	        supplemental = _initData$video.supplemental;
	      videoTrack.id = id;
	      videoTrack.timescale = captionTrack.timescale = timescale;
	      videoTrack.codec = codec;
	      videoTrack.supplemental = supplemental;
	    }
	    if (initData.audio) {
	      var _initData$audio = initData.audio,
	        _id = _initData$audio.id,
	        _timescale = _initData$audio.timescale,
	        _codec = _initData$audio.codec;
	      audioTrack.id = _id;
	      audioTrack.timescale = _timescale;
	      audioTrack.codec = _codec;
	    }
	    captionTrack.id = RemuxerTrackIdConfig.text;
	    videoTrack.sampleDuration = 0;
	    videoTrack.duration = audioTrack.duration = trackDuration;
	  };
	  _proto.resetContiguity = function resetContiguity() {
	    this.remainderData = null;
	  };
	  MP4Demuxer.probe = function probe(data) {
	    return hasMoofData(data);
	  };
	  _proto.demux = function demux(data, timeOffset) {
	    this.timeOffset = timeOffset;
	    // Load all data into the avc track. The CMAF remuxer will look for the data in the samples object; the rest of the fields do not matter
	    var videoSamples = data;
	    var videoTrack = this.videoTrack;
	    var textTrack = this.txtTrack;
	    if (this.config.progressive) {
	      // Split the bytestream into two ranges: one encompassing all data up until the start of the last moof, and everything else.
	      // This is done to guarantee that we're sending valid data to MSE - when demuxing progressively, we have no guarantee
	      // that the fetch loader gives us flush moof+mdat pairs. If we push jagged data to MSE, it will throw an exception.
	      if (this.remainderData) {
	        videoSamples = appendUint8Array(this.remainderData, data);
	      }
	      var segmentedData = segmentValidRange(videoSamples);
	      this.remainderData = segmentedData.remainder;
	      videoTrack.samples = segmentedData.valid || new Uint8Array();
	    } else {
	      videoTrack.samples = videoSamples;
	    }
	    var id3Track = this.extractID3Track(videoTrack, timeOffset);
	    textTrack.samples = parseSamples(timeOffset, videoTrack);
	    return {
	      videoTrack: videoTrack,
	      audioTrack: this.audioTrack,
	      id3Track: id3Track,
	      textTrack: this.txtTrack
	    };
	  };
	  _proto.flush = function flush() {
	    var timeOffset = this.timeOffset;
	    var videoTrack = this.videoTrack;
	    var textTrack = this.txtTrack;
	    videoTrack.samples = this.remainderData || new Uint8Array();
	    this.remainderData = null;
	    var id3Track = this.extractID3Track(videoTrack, this.timeOffset);
	    textTrack.samples = parseSamples(timeOffset, videoTrack);
	    return {
	      videoTrack: videoTrack,
	      audioTrack: dummyTrack(),
	      id3Track: id3Track,
	      textTrack: dummyTrack()
	    };
	  };
	  _proto.extractID3Track = function extractID3Track(videoTrack, timeOffset) {
	    var _this = this;
	    var id3Track = this.id3Track;
	    if (videoTrack.samples.length) {
	      var emsgs = findBox(videoTrack.samples, ['emsg']);
	      if (emsgs) {
	        emsgs.forEach(function (data) {
	          var emsgInfo = parseEmsg(data);
	          if (emsgSchemePattern.test(emsgInfo.schemeIdUri)) {
	            var pts = getEmsgStartTime(emsgInfo, timeOffset);
	            var duration = emsgInfo.eventDuration === 0xffffffff ? Number.POSITIVE_INFINITY : emsgInfo.eventDuration / emsgInfo.timeScale;
	            // Safari takes anything <= 0.001 seconds and maps it to Infinity
	            if (duration <= 0.001) {
	              duration = Number.POSITIVE_INFINITY;
	            }
	            var payload = emsgInfo.payload;
	            id3Track.samples.push({
	              data: payload,
	              len: payload.byteLength,
	              dts: pts,
	              pts: pts,
	              type: MetadataSchema.emsg,
	              duration: duration
	            });
	          } else if (_this.config.enableEmsgKLVMetadata && emsgInfo.schemeIdUri.startsWith('urn:misb:KLV:bin:1910.1')) {
	            var _pts = getEmsgStartTime(emsgInfo, timeOffset);
	            id3Track.samples.push({
	              data: emsgInfo.payload,
	              len: emsgInfo.payload.byteLength,
	              dts: _pts,
	              pts: _pts,
	              type: MetadataSchema.misbklv,
	              duration: Number.POSITIVE_INFINITY
	            });
	          }
	        });
	      }
	    }
	    return id3Track;
	  };
	  _proto.demuxSampleAes = function demuxSampleAes(data, keyData, timeOffset) {
	    return Promise.reject(new Error('The MP4 demuxer does not support SAMPLE-AES decryption'));
	  };
	  _proto.destroy = function destroy() {
	    // @ts-ignore
	    this.config = null;
	    this.remainderData = null;
	    this.videoTrack = this.audioTrack = this.id3Track = this.txtTrack = undefined;
	  };
	  return MP4Demuxer;
	}();
	function getEmsgStartTime(emsgInfo, timeOffset) {
	  return isFiniteNumber(emsgInfo.presentationTime) ? emsgInfo.presentationTime / emsgInfo.timeScale : timeOffset + emsgInfo.presentationTimeDelta / emsgInfo.timeScale;
	}

	/**
	 * SAMPLE-AES decrypter
	 */

	var SampleAesDecrypter = /*#__PURE__*/function () {
	  function SampleAesDecrypter(observer, config, keyData) {
	    this.keyData = void 0;
	    this.decrypter = void 0;
	    this.keyData = keyData;
	    this.decrypter = new Decrypter(config, {
	      removePKCS7Padding: false
	    });
	  }
	  var _proto = SampleAesDecrypter.prototype;
	  _proto.decryptBuffer = function decryptBuffer(encryptedData) {
	    return this.decrypter.decrypt(encryptedData, this.keyData.key.buffer, this.keyData.iv.buffer, DecrypterAesMode.cbc);
	  }

	  // AAC - encrypt all full 16 bytes blocks starting from offset 16
	  ;
	  _proto.decryptAacSample = function decryptAacSample(samples, sampleIndex, callback) {
	    var _this = this;
	    var curUnit = samples[sampleIndex].unit;
	    if (curUnit.length <= 16) {
	      // No encrypted portion in this sample (first 16 bytes is not
	      // encrypted, see https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HLS_Sample_Encryption/Encryption/Encryption.html),
	      return;
	    }
	    var encryptedData = curUnit.subarray(16, curUnit.length - curUnit.length % 16);
	    var encryptedBuffer = encryptedData.buffer.slice(encryptedData.byteOffset, encryptedData.byteOffset + encryptedData.length);
	    this.decryptBuffer(encryptedBuffer).then(function (decryptedBuffer) {
	      var decryptedData = new Uint8Array(decryptedBuffer);
	      curUnit.set(decryptedData, 16);
	      if (!_this.decrypter.isSync()) {
	        _this.decryptAacSamples(samples, sampleIndex + 1, callback);
	      }
	    });
	  };
	  _proto.decryptAacSamples = function decryptAacSamples(samples, sampleIndex, callback) {
	    for (;; sampleIndex++) {
	      if (sampleIndex >= samples.length) {
	        callback();
	        return;
	      }
	      if (samples[sampleIndex].unit.length < 32) {
	        continue;
	      }
	      this.decryptAacSample(samples, sampleIndex, callback);
	      if (!this.decrypter.isSync()) {
	        return;
	      }
	    }
	  }

	  // AVC - encrypt one 16 bytes block out of ten, starting from offset 32
	  ;
	  _proto.getAvcEncryptedData = function getAvcEncryptedData(decodedData) {
	    var encryptedDataLen = Math.floor((decodedData.length - 48) / 160) * 16 + 16;
	    var encryptedData = new Int8Array(encryptedDataLen);
	    var outputPos = 0;
	    for (var inputPos = 32; inputPos < decodedData.length - 16; inputPos += 160, outputPos += 16) {
	      encryptedData.set(decodedData.subarray(inputPos, inputPos + 16), outputPos);
	    }
	    return encryptedData;
	  };
	  _proto.getAvcDecryptedUnit = function getAvcDecryptedUnit(decodedData, decryptedData) {
	    var uint8DecryptedData = new Uint8Array(decryptedData);
	    var inputPos = 0;
	    for (var outputPos = 32; outputPos < decodedData.length - 16; outputPos += 160, inputPos += 16) {
	      decodedData.set(uint8DecryptedData.subarray(inputPos, inputPos + 16), outputPos);
	    }
	    return decodedData;
	  };
	  _proto.decryptAvcSample = function decryptAvcSample(samples, sampleIndex, unitIndex, callback, curUnit) {
	    var _this2 = this;
	    var decodedData = discardEPB(curUnit.data);
	    var encryptedData = this.getAvcEncryptedData(decodedData);
	    this.decryptBuffer(encryptedData.buffer).then(function (decryptedBuffer) {
	      curUnit.data = _this2.getAvcDecryptedUnit(decodedData, decryptedBuffer);
	      if (!_this2.decrypter.isSync()) {
	        _this2.decryptAvcSamples(samples, sampleIndex, unitIndex + 1, callback);
	      }
	    });
	  };
	  _proto.decryptAvcSamples = function decryptAvcSamples(samples, sampleIndex, unitIndex, callback) {
	    if (samples instanceof Uint8Array) {
	      throw new Error('Cannot decrypt samples of type Uint8Array');
	    }
	    for (;; sampleIndex++, unitIndex = 0) {
	      if (sampleIndex >= samples.length) {
	        callback();
	        return;
	      }
	      var curUnits = samples[sampleIndex].units;
	      for (;; unitIndex++) {
	        if (unitIndex >= curUnits.length) {
	          break;
	        }
	        var curUnit = curUnits[unitIndex];
	        if (curUnit.data.length <= 48 || curUnit.type !== 1 && curUnit.type !== 5) {
	          continue;
	        }
	        this.decryptAvcSample(samples, sampleIndex, unitIndex, callback, curUnit);
	        if (!this.decrypter.isSync()) {
	          return;
	        }
	      }
	    }
	  };
	  return SampleAesDecrypter;
	}();

	var BaseVideoParser = /*#__PURE__*/function () {
	  function BaseVideoParser() {
	    this.VideoSample = null;
	  }
	  var _proto = BaseVideoParser.prototype;
	  _proto.createVideoSample = function createVideoSample(key, pts, dts) {
	    return {
	      key: key,
	      frame: false,
	      pts: pts,
	      dts: dts,
	      units: [],
	      length: 0
	    };
	  };
	  _proto.getLastNalUnit = function getLastNalUnit(samples) {
	    var _VideoSample;
	    var VideoSample = this.VideoSample;
	    var lastUnit;
	    // try to fallback to previous sample if current one is empty
	    if (!VideoSample || VideoSample.units.length === 0) {
	      VideoSample = samples[samples.length - 1];
	    }
	    if ((_VideoSample = VideoSample) != null && _VideoSample.units) {
	      var units = VideoSample.units;
	      lastUnit = units[units.length - 1];
	    }
	    return lastUnit;
	  };
	  _proto.pushAccessUnit = function pushAccessUnit(VideoSample, videoTrack) {
	    if (VideoSample.units.length && VideoSample.frame) {
	      // if sample does not have PTS/DTS, patch with last sample PTS/DTS
	      if (VideoSample.pts === undefined) {
	        var samples = videoTrack.samples;
	        var nbSamples = samples.length;
	        if (nbSamples) {
	          var lastSample = samples[nbSamples - 1];
	          VideoSample.pts = lastSample.pts;
	          VideoSample.dts = lastSample.dts;
	        } else {
	          // dropping samples, no timestamp found
	          videoTrack.dropped++;
	          return;
	        }
	      }
	      videoTrack.samples.push(VideoSample);
	    }
	  };
	  _proto.parseNALu = function parseNALu(track, array, endOfSegment) {
	    var len = array.byteLength;
	    var state = track.naluState || 0;
	    var lastState = state;
	    var units = [];
	    var i = 0;
	    var value;
	    var overflow;
	    var unitType;
	    var lastUnitStart = -1;
	    var lastUnitType = 0;
	    // logger.log('PES:' + Hex.hexDump(array));

	    if (state === -1) {
	      // special use case where we found 3 or 4-byte start codes exactly at the end of previous PES packet
	      lastUnitStart = 0;
	      // NALu type is value read from offset 0
	      lastUnitType = this.getNALuType(array, 0);
	      state = 0;
	      i = 1;
	    }
	    l1: while (i < len) {
	      // optimization. state 0 and 1 are the predominant case. let's handle them outside of the switch/case
	      if (state === 0) {
	        while (array[i++] !== 0) {
	          if (i === len) {
	            break l1;
	          }
	          // noop
	        }
	        state = 1;
	        continue;
	      } else if (state === 1) {
	        state = array[i++] === 0 ? 2 : 0;
	        continue;
	      }
	      value = array[i++];
	      // here we have state either equal to 2 or 3
	      if (value === 0) {
	        state = 3;
	      } else if (value === 1) {
	        overflow = i - state - 1;
	        if (lastUnitStart >= 0) {
	          var unit = {
	            data: array.subarray(lastUnitStart, overflow),
	            type: lastUnitType
	          };
	          // logger.log('pushing NALU, type/size:' + unit.type + '/' + unit.data.byteLength);
	          units.push(unit);
	        } else {
	          // lastUnitStart is undefined => this is the first start code found in this PES packet
	          // first check if start code delimiter is overlapping between 2 PES packets,
	          // ie it started in last packet (lastState not zero)
	          // and ended at the beginning of this PES packet (i <= 4 - lastState)
	          var lastUnit = this.getLastNalUnit(track.samples);
	          if (lastUnit) {
	            if (lastState && i <= 4 - lastState) {
	              // start delimiter overlapping between PES packets
	              // strip start delimiter bytes from the end of last NAL unit
	              // check if lastUnit had a state different from zero
	              if (lastUnit.state) {
	                // strip last bytes
	                lastUnit.data = lastUnit.data.subarray(0, lastUnit.data.byteLength - lastState);
	              }
	            }
	            // If NAL units are not starting right at the beginning of the PES packet, push preceding data into previous NAL unit.

	            if (overflow > 0) {
	              // logger.log('first NALU found with overflow:' + overflow);
	              lastUnit.data = appendUint8Array(lastUnit.data, array.subarray(0, overflow));
	              lastUnit.state = 0;
	            }
	          }
	        }
	        // check if we can read unit type
	        if (i < len) {
	          unitType = this.getNALuType(array, i);
	          // logger.log('find NALU @ offset:' + i + ',type:' + unitType);
	          lastUnitStart = i;
	          lastUnitType = unitType;
	          state = 0;
	        } else {
	          // not enough byte to read unit type. let's read it on next PES parsing
	          state = -1;
	        }
	      } else {
	        state = 0;
	      }
	    }
	    if (lastUnitStart >= 0 && state >= 0) {
	      var _unit = {
	        data: array.subarray(lastUnitStart, len),
	        type: lastUnitType,
	        state: state
	      };
	      units.push(_unit);
	      // logger.log('pushing NALU, type/size/state:' + unit.type + '/' + unit.data.byteLength + '/' + state);
	    }
	    // no NALu found
	    if (units.length === 0) {
	      // append pes.data to previous NAL unit
	      var _lastUnit = this.getLastNalUnit(track.samples);
	      if (_lastUnit) {
	        _lastUnit.data = appendUint8Array(_lastUnit.data, array);
	      }
	    }
	    track.naluState = state;
	    return units;
	  };
	  return BaseVideoParser;
	}();

	/**
	 * Parser for exponential Golomb codes, a variable-bitwidth number encoding scheme used by h264.
	 */

	var ExpGolomb = /*#__PURE__*/function () {
	  function ExpGolomb(data) {
	    this.data = void 0;
	    this.bytesAvailable = void 0;
	    this.word = void 0;
	    this.bitsAvailable = void 0;
	    this.data = data;
	    // the number of bytes left to examine in this.data
	    this.bytesAvailable = data.byteLength;
	    // the current word being examined
	    this.word = 0; // :uint
	    // the number of bits left to examine in the current word
	    this.bitsAvailable = 0; // :uint
	  }

	  // ():void
	  var _proto = ExpGolomb.prototype;
	  _proto.loadWord = function loadWord() {
	    var data = this.data;
	    var bytesAvailable = this.bytesAvailable;
	    var position = data.byteLength - bytesAvailable;
	    var workingBytes = new Uint8Array(4);
	    var availableBytes = Math.min(4, bytesAvailable);
	    if (availableBytes === 0) {
	      throw new Error('no bytes available');
	    }
	    workingBytes.set(data.subarray(position, position + availableBytes));
	    this.word = new DataView(workingBytes.buffer).getUint32(0);
	    // track the amount of this.data that has been processed
	    this.bitsAvailable = availableBytes * 8;
	    this.bytesAvailable -= availableBytes;
	  }

	  // (count:int):void
	  ;
	  _proto.skipBits = function skipBits(count) {
	    var skipBytes; // :int
	    count = Math.min(count, this.bytesAvailable * 8 + this.bitsAvailable);
	    if (this.bitsAvailable > count) {
	      this.word <<= count;
	      this.bitsAvailable -= count;
	    } else {
	      count -= this.bitsAvailable;
	      skipBytes = count >> 3;
	      count -= skipBytes << 3;
	      this.bytesAvailable -= skipBytes;
	      this.loadWord();
	      this.word <<= count;
	      this.bitsAvailable -= count;
	    }
	  }

	  // (size:int):uint
	  ;
	  _proto.readBits = function readBits(size) {
	    var bits = Math.min(this.bitsAvailable, size); // :uint
	    var valu = this.word >>> 32 - bits; // :uint
	    if (size > 32) {
	      logger.error('Cannot read more than 32 bits at a time');
	    }
	    this.bitsAvailable -= bits;
	    if (this.bitsAvailable > 0) {
	      this.word <<= bits;
	    } else if (this.bytesAvailable > 0) {
	      this.loadWord();
	    } else {
	      throw new Error('no bits available');
	    }
	    bits = size - bits;
	    if (bits > 0 && this.bitsAvailable) {
	      return valu << bits | this.readBits(bits);
	    } else {
	      return valu;
	    }
	  }

	  // ():uint
	  ;
	  _proto.skipLZ = function skipLZ() {
	    var leadingZeroCount; // :uint
	    for (leadingZeroCount = 0; leadingZeroCount < this.bitsAvailable; ++leadingZeroCount) {
	      if ((this.word & 0x80000000 >>> leadingZeroCount) !== 0) {
	        // the first bit of working word is 1
	        this.word <<= leadingZeroCount;
	        this.bitsAvailable -= leadingZeroCount;
	        return leadingZeroCount;
	      }
	    }
	    // we exhausted word and still have not found a 1
	    this.loadWord();
	    return leadingZeroCount + this.skipLZ();
	  }

	  // ():void
	  ;
	  _proto.skipUEG = function skipUEG() {
	    this.skipBits(1 + this.skipLZ());
	  }

	  // ():void
	  ;
	  _proto.skipEG = function skipEG() {
	    this.skipBits(1 + this.skipLZ());
	  }

	  // ():uint
	  ;
	  _proto.readUEG = function readUEG() {
	    var clz = this.skipLZ(); // :uint
	    return this.readBits(clz + 1) - 1;
	  }

	  // ():int
	  ;
	  _proto.readEG = function readEG() {
	    var valu = this.readUEG(); // :int
	    if (0x01 & valu) {
	      // the number is odd if the low order bit is set
	      return 1 + valu >>> 1; // add 1 to make it even, and divide by 2
	    } else {
	      return -1 * (valu >>> 1); // divide by two then make it negative
	    }
	  }

	  // Some convenience functions
	  // :Boolean
	  ;
	  _proto.readBoolean = function readBoolean() {
	    return this.readBits(1) === 1;
	  }

	  // ():int
	  ;
	  _proto.readUByte = function readUByte() {
	    return this.readBits(8);
	  }

	  // ():int
	  ;
	  _proto.readUShort = function readUShort() {
	    return this.readBits(16);
	  }

	  // ():int
	  ;
	  _proto.readUInt = function readUInt() {
	    return this.readBits(32);
	  };
	  return ExpGolomb;
	}();

	var AvcVideoParser = /*#__PURE__*/function (_BaseVideoParser) {
	  function AvcVideoParser() {
	    return _BaseVideoParser.apply(this, arguments) || this;
	  }
	  _inheritsLoose(AvcVideoParser, _BaseVideoParser);
	  var _proto = AvcVideoParser.prototype;
	  _proto.parsePES = function parsePES(track, textTrack, pes, endOfSegment) {
	    var _this = this;
	    var units = this.parseNALu(track, pes.data, endOfSegment);
	    var VideoSample = this.VideoSample;
	    var push;
	    var spsfound = false;
	    // free pes.data to save up some memory
	    pes.data = null;

	    // if new NAL units found and last sample still there, let's push ...
	    // this helps parsing streams with missing AUD (only do this if AUD never found)
	    if (VideoSample && units.length && !track.audFound) {
	      this.pushAccessUnit(VideoSample, track);
	      VideoSample = this.VideoSample = this.createVideoSample(false, pes.pts, pes.dts);
	    }
	    units.forEach(function (unit) {
	      var _VideoSample2, _VideoSample3;
	      switch (unit.type) {
	        // NDR
	        case 1:
	          {
	            var iskey = false;
	            push = true;
	            var data = unit.data;
	            // only check slice type to detect KF in case SPS found in same packet (any keyframe is preceded by SPS ...)
	            if (spsfound && data.length > 4) {
	              // retrieve slice type by parsing beginning of NAL unit (follow H264 spec, slice_header definition) to detect keyframe embedded in NDR
	              var sliceType = _this.readSliceType(data);
	              // 2 : I slice, 4 : SI slice, 7 : I slice, 9: SI slice
	              // SI slice : A slice that is coded using intra prediction only and using quantisation of the prediction samples.
	              // An SI slice can be coded such that its decoded samples can be constructed identically to an SP slice.
	              // I slice: A slice that is not an SI slice that is decoded using intra prediction only.
	              // if (sliceType === 2 || sliceType === 7) {
	              if (sliceType === 2 || sliceType === 4 || sliceType === 7 || sliceType === 9) {
	                iskey = true;
	              }
	            }
	            if (iskey) {
	              var _VideoSample;
	              // if we have non-keyframe data already, that cannot belong to the same frame as a keyframe, so force a push
	              if ((_VideoSample = VideoSample) != null && _VideoSample.frame && !VideoSample.key) {
	                _this.pushAccessUnit(VideoSample, track);
	                VideoSample = _this.VideoSample = null;
	              }
	            }
	            if (!VideoSample) {
	              VideoSample = _this.VideoSample = _this.createVideoSample(true, pes.pts, pes.dts);
	            }
	            VideoSample.frame = true;
	            VideoSample.key = iskey;
	            break;
	            // IDR
	          }
	        case 5:
	          push = true;
	          // handle PES not starting with AUD
	          // if we have frame data already, that cannot belong to the same frame, so force a push
	          if ((_VideoSample2 = VideoSample) != null && _VideoSample2.frame && !VideoSample.key) {
	            _this.pushAccessUnit(VideoSample, track);
	            VideoSample = _this.VideoSample = null;
	          }
	          if (!VideoSample) {
	            VideoSample = _this.VideoSample = _this.createVideoSample(true, pes.pts, pes.dts);
	          }
	          VideoSample.key = true;
	          VideoSample.frame = true;
	          break;
	        // SEI
	        case 6:
	          {
	            push = true;
	            parseSEIMessageFromNALu(unit.data, 1, pes.pts, textTrack.samples);
	            break;
	            // SPS
	          }
	        case 7:
	          {
	            var _track$pixelRatio, _track$pixelRatio2;
	            push = true;
	            spsfound = true;
	            var sps = unit.data;
	            var config = _this.readSPS(sps);
	            if (!track.sps || track.width !== config.width || track.height !== config.height || ((_track$pixelRatio = track.pixelRatio) == null ? void 0 : _track$pixelRatio[0]) !== config.pixelRatio[0] || ((_track$pixelRatio2 = track.pixelRatio) == null ? void 0 : _track$pixelRatio2[1]) !== config.pixelRatio[1]) {
	              track.width = config.width;
	              track.height = config.height;
	              track.pixelRatio = config.pixelRatio;
	              track.sps = [sps];
	              var codecarray = sps.subarray(1, 4);
	              var codecstring = 'avc1.';
	              for (var i = 0; i < 3; i++) {
	                var h = codecarray[i].toString(16);
	                if (h.length < 2) {
	                  h = '0' + h;
	                }
	                codecstring += h;
	              }
	              track.codec = codecstring;
	            }
	            break;
	          }
	        // PPS
	        case 8:
	          push = true;
	          track.pps = [unit.data];
	          break;
	        // AUD
	        case 9:
	          push = true;
	          track.audFound = true;
	          if ((_VideoSample3 = VideoSample) != null && _VideoSample3.frame) {
	            _this.pushAccessUnit(VideoSample, track);
	            VideoSample = null;
	          }
	          if (!VideoSample) {
	            VideoSample = _this.VideoSample = _this.createVideoSample(false, pes.pts, pes.dts);
	          }
	          break;
	        // Filler Data
	        case 12:
	          push = true;
	          break;
	        default:
	          push = false;
	          break;
	      }
	      if (VideoSample && push) {
	        var _units = VideoSample.units;
	        _units.push(unit);
	      }
	    });
	    // if last PES packet, push samples
	    if (endOfSegment && VideoSample) {
	      this.pushAccessUnit(VideoSample, track);
	      this.VideoSample = null;
	    }
	  };
	  _proto.getNALuType = function getNALuType(data, offset) {
	    return data[offset] & 0x1f;
	  };
	  _proto.readSliceType = function readSliceType(data) {
	    var eg = new ExpGolomb(data);
	    // skip NALu type
	    eg.readUByte();
	    // discard first_mb_in_slice
	    eg.readUEG();
	    // return slice_type
	    return eg.readUEG();
	  }

	  /**
	   * The scaling list is optionally transmitted as part of a sequence parameter
	   * set and is not relevant to transmuxing.
	   * @param count the number of entries in this scaling list
	   * @see Recommendation ITU-T H.264, Section 7.3.2.1.1.1
	   */;
	  _proto.skipScalingList = function skipScalingList(count, reader) {
	    var lastScale = 8;
	    var nextScale = 8;
	    var deltaScale;
	    for (var j = 0; j < count; j++) {
	      if (nextScale !== 0) {
	        deltaScale = reader.readEG();
	        nextScale = (lastScale + deltaScale + 256) % 256;
	      }
	      lastScale = nextScale === 0 ? lastScale : nextScale;
	    }
	  }

	  /**
	   * Read a sequence parameter set and return some interesting video
	   * properties. A sequence parameter set is the H264 metadata that
	   * describes the properties of upcoming video frames.
	   * @returns an object with configuration parsed from the
	   * sequence parameter set, including the dimensions of the
	   * associated video frames.
	   */;
	  _proto.readSPS = function readSPS(sps) {
	    var eg = new ExpGolomb(sps);
	    var frameCropLeftOffset = 0;
	    var frameCropRightOffset = 0;
	    var frameCropTopOffset = 0;
	    var frameCropBottomOffset = 0;
	    var numRefFramesInPicOrderCntCycle;
	    var scalingListCount;
	    var i;
	    var readUByte = eg.readUByte.bind(eg);
	    var readBits = eg.readBits.bind(eg);
	    var readUEG = eg.readUEG.bind(eg);
	    var readBoolean = eg.readBoolean.bind(eg);
	    var skipBits = eg.skipBits.bind(eg);
	    var skipEG = eg.skipEG.bind(eg);
	    var skipUEG = eg.skipUEG.bind(eg);
	    var skipScalingList = this.skipScalingList.bind(this);
	    readUByte();
	    var profileIdc = readUByte(); // profile_idc
	    readBits(5); // profileCompat constraint_set[0-4]_flag, u(5)
	    skipBits(3); // reserved_zero_3bits u(3),
	    readUByte(); // level_idc u(8)
	    skipUEG(); // seq_parameter_set_id
	    // some profiles have more optional data we don't need
	    if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
	      var chromaFormatIdc = readUEG();
	      if (chromaFormatIdc === 3) {
	        skipBits(1);
	      } // separate_colour_plane_flag

	      skipUEG(); // bit_depth_luma_minus8
	      skipUEG(); // bit_depth_chroma_minus8
	      skipBits(1); // qpprime_y_zero_transform_bypass_flag
	      if (readBoolean()) {
	        // seq_scaling_matrix_present_flag
	        scalingListCount = chromaFormatIdc !== 3 ? 8 : 12;
	        for (i = 0; i < scalingListCount; i++) {
	          if (readBoolean()) {
	            // seq_scaling_list_present_flag[ i ]
	            if (i < 6) {
	              skipScalingList(16, eg);
	            } else {
	              skipScalingList(64, eg);
	            }
	          }
	        }
	      }
	    }
	    skipUEG(); // log2_max_frame_num_minus4
	    var picOrderCntType = readUEG();
	    if (picOrderCntType === 0) {
	      readUEG(); // log2_max_pic_order_cnt_lsb_minus4
	    } else if (picOrderCntType === 1) {
	      skipBits(1); // delta_pic_order_always_zero_flag
	      skipEG(); // offset_for_non_ref_pic
	      skipEG(); // offset_for_top_to_bottom_field
	      numRefFramesInPicOrderCntCycle = readUEG();
	      for (i = 0; i < numRefFramesInPicOrderCntCycle; i++) {
	        skipEG();
	      } // offset_for_ref_frame[ i ]
	    }
	    skipUEG(); // max_num_ref_frames
	    skipBits(1); // gaps_in_frame_num_value_allowed_flag
	    var picWidthInMbsMinus1 = readUEG();
	    var picHeightInMapUnitsMinus1 = readUEG();
	    var frameMbsOnlyFlag = readBits(1);
	    if (frameMbsOnlyFlag === 0) {
	      skipBits(1);
	    } // mb_adaptive_frame_field_flag

	    skipBits(1); // direct_8x8_inference_flag
	    if (readBoolean()) {
	      // frame_cropping_flag
	      frameCropLeftOffset = readUEG();
	      frameCropRightOffset = readUEG();
	      frameCropTopOffset = readUEG();
	      frameCropBottomOffset = readUEG();
	    }
	    var pixelRatio = [1, 1];
	    if (readBoolean()) {
	      // vui_parameters_present_flag
	      if (readBoolean()) {
	        // aspect_ratio_info_present_flag
	        var aspectRatioIdc = readUByte();
	        switch (aspectRatioIdc) {
	          case 1:
	            pixelRatio = [1, 1];
	            break;
	          case 2:
	            pixelRatio = [12, 11];
	            break;
	          case 3:
	            pixelRatio = [10, 11];
	            break;
	          case 4:
	            pixelRatio = [16, 11];
	            break;
	          case 5:
	            pixelRatio = [40, 33];
	            break;
	          case 6:
	            pixelRatio = [24, 11];
	            break;
	          case 7:
	            pixelRatio = [20, 11];
	            break;
	          case 8:
	            pixelRatio = [32, 11];
	            break;
	          case 9:
	            pixelRatio = [80, 33];
	            break;
	          case 10:
	            pixelRatio = [18, 11];
	            break;
	          case 11:
	            pixelRatio = [15, 11];
	            break;
	          case 12:
	            pixelRatio = [64, 33];
	            break;
	          case 13:
	            pixelRatio = [160, 99];
	            break;
	          case 14:
	            pixelRatio = [4, 3];
	            break;
	          case 15:
	            pixelRatio = [3, 2];
	            break;
	          case 16:
	            pixelRatio = [2, 1];
	            break;
	          case 255:
	            {
	              pixelRatio = [readUByte() << 8 | readUByte(), readUByte() << 8 | readUByte()];
	              break;
	            }
	        }
	      }
	    }
	    return {
	      width: Math.ceil((picWidthInMbsMinus1 + 1) * 16 - frameCropLeftOffset * 2 - frameCropRightOffset * 2),
	      height: (2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16 - (frameMbsOnlyFlag ? 2 : 4) * (frameCropTopOffset + frameCropBottomOffset),
	      pixelRatio: pixelRatio
	    };
	  };
	  return AvcVideoParser;
	}(BaseVideoParser);

	var HevcVideoParser = /*#__PURE__*/function (_BaseVideoParser) {
	  function HevcVideoParser() {
	    var _this;
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	    _this = _BaseVideoParser.call.apply(_BaseVideoParser, [this].concat(args)) || this;
	    _this.initVPS = null;
	    return _this;
	  }
	  _inheritsLoose(HevcVideoParser, _BaseVideoParser);
	  var _proto = HevcVideoParser.prototype;
	  _proto.parsePES = function parsePES(track, textTrack, pes, endOfSegment) {
	    var _this2 = this;
	    var units = this.parseNALu(track, pes.data, endOfSegment);
	    var VideoSample = this.VideoSample;
	    var push;
	    var spsfound = false;
	    // free pes.data to save up some memory
	    pes.data = null;

	    // if new NAL units found and last sample still there, let's push ...
	    // this helps parsing streams with missing AUD (only do this if AUD never found)
	    if (VideoSample && units.length && !track.audFound) {
	      this.pushAccessUnit(VideoSample, track);
	      VideoSample = this.VideoSample = this.createVideoSample(false, pes.pts, pes.dts);
	    }
	    units.forEach(function (unit) {
	      var _VideoSample2, _VideoSample3;
	      switch (unit.type) {
	        // NON-IDR, NON RANDOM ACCESS SLICE
	        case 0:
	        case 1:
	        case 2:
	        case 3:
	        case 4:
	        case 5:
	        case 6:
	        case 7:
	        case 8:
	        case 9:
	          if (!VideoSample) {
	            VideoSample = _this2.VideoSample = _this2.createVideoSample(false, pes.pts, pes.dts);
	          }
	          VideoSample.frame = true;
	          push = true;
	          break;

	        // CRA, BLA (random access picture)
	        case 16:
	        case 17:
	        case 18:
	        case 21:
	          push = true;
	          if (spsfound) {
	            var _VideoSample;
	            // handle PES not starting with AUD
	            // if we have frame data already, that cannot belong to the same frame, so force a push
	            if ((_VideoSample = VideoSample) != null && _VideoSample.frame && !VideoSample.key) {
	              _this2.pushAccessUnit(VideoSample, track);
	              VideoSample = _this2.VideoSample = null;
	            }
	          }
	          if (!VideoSample) {
	            VideoSample = _this2.VideoSample = _this2.createVideoSample(true, pes.pts, pes.dts);
	          }
	          VideoSample.key = true;
	          VideoSample.frame = true;
	          break;

	        // IDR
	        case 19:
	        case 20:
	          push = true;
	          // handle PES not starting with AUD
	          // if we have frame data already, that cannot belong to the same frame, so force a push
	          if ((_VideoSample2 = VideoSample) != null && _VideoSample2.frame && !VideoSample.key) {
	            _this2.pushAccessUnit(VideoSample, track);
	            VideoSample = _this2.VideoSample = null;
	          }
	          if (!VideoSample) {
	            VideoSample = _this2.VideoSample = _this2.createVideoSample(true, pes.pts, pes.dts);
	          }
	          VideoSample.key = true;
	          VideoSample.frame = true;
	          break;

	        // SEI
	        case 39:
	          push = true;
	          parseSEIMessageFromNALu(unit.data, 2,
	          // NALu header size
	          pes.pts, textTrack.samples);
	          break;

	        // VPS
	        case 32:
	          push = true;
	          if (!track.vps) {
	            if (typeof track.params !== 'object') {
	              track.params = {};
	            }
	            track.params = _extends(track.params, _this2.readVPS(unit.data));
	            _this2.initVPS = unit.data;
	          }
	          track.vps = [unit.data];
	          break;

	        // SPS
	        case 33:
	          push = true;
	          spsfound = true;
	          if (track.vps !== undefined && track.vps[0] !== _this2.initVPS && track.sps !== undefined && !_this2.matchSPS(track.sps[0], unit.data)) {
	            _this2.initVPS = track.vps[0];
	            track.sps = track.pps = undefined;
	          }
	          if (!track.sps) {
	            var config = _this2.readSPS(unit.data);
	            track.width = config.width;
	            track.height = config.height;
	            track.pixelRatio = config.pixelRatio;
	            track.codec = config.codecString;
	            track.sps = [];
	            if (typeof track.params !== 'object') {
	              track.params = {};
	            }
	            for (var prop in config.params) {
	              track.params[prop] = config.params[prop];
	            }
	          }
	          _this2.pushParameterSet(track.sps, unit.data, track.vps);
	          if (!VideoSample) {
	            VideoSample = _this2.VideoSample = _this2.createVideoSample(true, pes.pts, pes.dts);
	          }
	          VideoSample.key = true;
	          break;

	        // PPS
	        case 34:
	          push = true;
	          if (typeof track.params === 'object') {
	            if (!track.pps) {
	              track.pps = [];
	              var _config = _this2.readPPS(unit.data);
	              for (var _prop in _config) {
	                track.params[_prop] = _config[_prop];
	              }
	            }
	            _this2.pushParameterSet(track.pps, unit.data, track.vps);
	          }
	          break;

	        // ACCESS UNIT DELIMITER
	        case 35:
	          push = true;
	          track.audFound = true;
	          if ((_VideoSample3 = VideoSample) != null && _VideoSample3.frame) {
	            _this2.pushAccessUnit(VideoSample, track);
	            VideoSample = null;
	          }
	          if (!VideoSample) {
	            VideoSample = _this2.VideoSample = _this2.createVideoSample(false, pes.pts, pes.dts);
	          }
	          break;
	        default:
	          push = false;
	          break;
	      }
	      if (VideoSample && push) {
	        var _units = VideoSample.units;
	        _units.push(unit);
	      }
	    });
	    // if last PES packet, push samples
	    if (endOfSegment && VideoSample) {
	      this.pushAccessUnit(VideoSample, track);
	      this.VideoSample = null;
	    }
	  };
	  _proto.pushParameterSet = function pushParameterSet(parameterSets, data, vps) {
	    if (vps && vps[0] === this.initVPS || !vps && !parameterSets.length) {
	      parameterSets.push(data);
	    }
	  };
	  _proto.getNALuType = function getNALuType(data, offset) {
	    return (data[offset] & 0x7e) >>> 1;
	  };
	  _proto.ebsp2rbsp = function ebsp2rbsp(arr) {
	    var dst = new Uint8Array(arr.byteLength);
	    var dstIdx = 0;
	    for (var i = 0; i < arr.byteLength; i++) {
	      if (i >= 2) {
	        // Unescape: Skip 0x03 after 00 00
	        if (arr[i] === 0x03 && arr[i - 1] === 0x00 && arr[i - 2] === 0x00) {
	          continue;
	        }
	      }
	      dst[dstIdx] = arr[i];
	      dstIdx++;
	    }
	    return new Uint8Array(dst.buffer, 0, dstIdx);
	  };
	  _proto.pushAccessUnit = function pushAccessUnit(VideoSample, videoTrack) {
	    _BaseVideoParser.prototype.pushAccessUnit.call(this, VideoSample, videoTrack);
	    if (this.initVPS) {
	      this.initVPS = null; // null initVPS to prevent possible track's sps/pps growth until next VPS
	    }
	  };
	  _proto.readVPS = function readVPS(vps) {
	    var eg = new ExpGolomb(vps);
	    // remove header
	    eg.readUByte();
	    eg.readUByte();
	    eg.readBits(4); // video_parameter_set_id
	    eg.skipBits(2);
	    eg.readBits(6); // max_layers_minus1
	    var max_sub_layers_minus1 = eg.readBits(3);
	    var temporal_id_nesting_flag = eg.readBoolean();
	    // ...vui fps can be here, but empty fps value is not critical for metadata

	    return {
	      numTemporalLayers: max_sub_layers_minus1 + 1,
	      temporalIdNested: temporal_id_nesting_flag
	    };
	  };
	  _proto.readSPS = function readSPS(sps) {
	    var eg = new ExpGolomb(this.ebsp2rbsp(sps));
	    eg.readUByte();
	    eg.readUByte();
	    eg.readBits(4); //video_parameter_set_id
	    var max_sub_layers_minus1 = eg.readBits(3);
	    eg.readBoolean(); // temporal_id_nesting_flag

	    // profile_tier_level
	    var general_profile_space = eg.readBits(2);
	    var general_tier_flag = eg.readBoolean();
	    var general_profile_idc = eg.readBits(5);
	    var general_profile_compatibility_flags_1 = eg.readUByte();
	    var general_profile_compatibility_flags_2 = eg.readUByte();
	    var general_profile_compatibility_flags_3 = eg.readUByte();
	    var general_profile_compatibility_flags_4 = eg.readUByte();
	    var general_constraint_indicator_flags_1 = eg.readUByte();
	    var general_constraint_indicator_flags_2 = eg.readUByte();
	    var general_constraint_indicator_flags_3 = eg.readUByte();
	    var general_constraint_indicator_flags_4 = eg.readUByte();
	    var general_constraint_indicator_flags_5 = eg.readUByte();
	    var general_constraint_indicator_flags_6 = eg.readUByte();
	    var general_level_idc = eg.readUByte();
	    var sub_layer_profile_present_flags = [];
	    var sub_layer_level_present_flags = [];
	    for (var i = 0; i < max_sub_layers_minus1; i++) {
	      sub_layer_profile_present_flags.push(eg.readBoolean());
	      sub_layer_level_present_flags.push(eg.readBoolean());
	    }
	    if (max_sub_layers_minus1 > 0) {
	      for (var _i = max_sub_layers_minus1; _i < 8; _i++) {
	        eg.readBits(2);
	      }
	    }
	    for (var _i2 = 0; _i2 < max_sub_layers_minus1; _i2++) {
	      if (sub_layer_profile_present_flags[_i2]) {
	        eg.readUByte(); // sub_layer_profile_space, sub_layer_tier_flag, sub_layer_profile_idc
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte(); // sub_layer_profile_compatibility_flag
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte();
	        eg.readUByte();
	      }
	      if (sub_layer_level_present_flags[_i2]) {
	        eg.readUByte();
	      }
	    }
	    eg.readUEG(); // seq_parameter_set_id
	    var chroma_format_idc = eg.readUEG();
	    if (chroma_format_idc == 3) {
	      eg.skipBits(1); //separate_colour_plane_flag
	    }
	    var pic_width_in_luma_samples = eg.readUEG();
	    var pic_height_in_luma_samples = eg.readUEG();
	    var conformance_window_flag = eg.readBoolean();
	    var pic_left_offset = 0,
	      pic_right_offset = 0,
	      pic_top_offset = 0,
	      pic_bottom_offset = 0;
	    if (conformance_window_flag) {
	      pic_left_offset += eg.readUEG();
	      pic_right_offset += eg.readUEG();
	      pic_top_offset += eg.readUEG();
	      pic_bottom_offset += eg.readUEG();
	    }
	    var bit_depth_luma_minus8 = eg.readUEG();
	    var bit_depth_chroma_minus8 = eg.readUEG();
	    var log2_max_pic_order_cnt_lsb_minus4 = eg.readUEG();
	    var sub_layer_ordering_info_present_flag = eg.readBoolean();
	    for (var _i3 = sub_layer_ordering_info_present_flag ? 0 : max_sub_layers_minus1; _i3 <= max_sub_layers_minus1; _i3++) {
	      eg.skipUEG(); // max_dec_pic_buffering_minus1[i]
	      eg.skipUEG(); // max_num_reorder_pics[i]
	      eg.skipUEG(); // max_latency_increase_plus1[i]
	    }
	    eg.skipUEG(); // log2_min_luma_coding_block_size_minus3
	    eg.skipUEG(); // log2_diff_max_min_luma_coding_block_size
	    eg.skipUEG(); // log2_min_transform_block_size_minus2
	    eg.skipUEG(); // log2_diff_max_min_transform_block_size
	    eg.skipUEG(); // max_transform_hierarchy_depth_inter
	    eg.skipUEG(); // max_transform_hierarchy_depth_intra
	    var scaling_list_enabled_flag = eg.readBoolean();
	    if (scaling_list_enabled_flag) {
	      var sps_scaling_list_data_present_flag = eg.readBoolean();
	      if (sps_scaling_list_data_present_flag) {
	        for (var sizeId = 0; sizeId < 4; sizeId++) {
	          for (var matrixId = 0; matrixId < (sizeId === 3 ? 2 : 6); matrixId++) {
	            var scaling_list_pred_mode_flag = eg.readBoolean();
	            if (!scaling_list_pred_mode_flag) {
	              eg.readUEG(); // scaling_list_pred_matrix_id_delta
	            } else {
	              var coefNum = Math.min(64, 1 << 4 + (sizeId << 1));
	              if (sizeId > 1) {
	                eg.readEG();
	              }
	              for (var _i4 = 0; _i4 < coefNum; _i4++) {
	                eg.readEG();
	              }
	            }
	          }
	        }
	      }
	    }
	    eg.readBoolean(); // amp_enabled_flag
	    eg.readBoolean(); // sample_adaptive_offset_enabled_flag
	    var pcm_enabled_flag = eg.readBoolean();
	    if (pcm_enabled_flag) {
	      eg.readUByte();
	      eg.skipUEG();
	      eg.skipUEG();
	      eg.readBoolean();
	    }
	    var num_short_term_ref_pic_sets = eg.readUEG();
	    var num_delta_pocs = 0;
	    for (var _i5 = 0; _i5 < num_short_term_ref_pic_sets; _i5++) {
	      var inter_ref_pic_set_prediction_flag = false;
	      if (_i5 !== 0) {
	        inter_ref_pic_set_prediction_flag = eg.readBoolean();
	      }
	      if (inter_ref_pic_set_prediction_flag) {
	        if (_i5 === num_short_term_ref_pic_sets) {
	          eg.readUEG();
	        }
	        eg.readBoolean();
	        eg.readUEG();
	        var next_num_delta_pocs = 0;
	        for (var j = 0; j <= num_delta_pocs; j++) {
	          var used_by_curr_pic_flag = eg.readBoolean();
	          var use_delta_flag = false;
	          if (!used_by_curr_pic_flag) {
	            use_delta_flag = eg.readBoolean();
	          }
	          if (used_by_curr_pic_flag || use_delta_flag) {
	            next_num_delta_pocs++;
	          }
	        }
	        num_delta_pocs = next_num_delta_pocs;
	      } else {
	        var num_negative_pics = eg.readUEG();
	        var num_positive_pics = eg.readUEG();
	        num_delta_pocs = num_negative_pics + num_positive_pics;
	        for (var _j = 0; _j < num_negative_pics; _j++) {
	          eg.readUEG();
	          eg.readBoolean();
	        }
	        for (var _j2 = 0; _j2 < num_positive_pics; _j2++) {
	          eg.readUEG();
	          eg.readBoolean();
	        }
	      }
	    }
	    var long_term_ref_pics_present_flag = eg.readBoolean();
	    if (long_term_ref_pics_present_flag) {
	      var num_long_term_ref_pics_sps = eg.readUEG();
	      for (var _i6 = 0; _i6 < num_long_term_ref_pics_sps; _i6++) {
	        for (var _j3 = 0; _j3 < log2_max_pic_order_cnt_lsb_minus4 + 4; _j3++) {
	          eg.readBits(1);
	        }
	        eg.readBits(1);
	      }
	    }
	    var min_spatial_segmentation_idc = 0;
	    var sar_width = 1,
	      sar_height = 1;
	    var fps_fixed = true,
	      fps_den = 1,
	      fps_num = 0;
	    eg.readBoolean(); // sps_temporal_mvp_enabled_flag
	    eg.readBoolean(); // strong_intra_smoothing_enabled_flag
	    var default_display_window_flag = false;
	    var vui_parameters_present_flag = eg.readBoolean();
	    if (vui_parameters_present_flag) {
	      var aspect_ratio_info_present_flag = eg.readBoolean();
	      if (aspect_ratio_info_present_flag) {
	        var aspect_ratio_idc = eg.readUByte();
	        var sar_width_table = [1, 12, 10, 16, 40, 24, 20, 32, 80, 18, 15, 64, 160, 4, 3, 2];
	        var sar_height_table = [1, 11, 11, 11, 33, 11, 11, 11, 33, 11, 11, 33, 99, 3, 2, 1];
	        if (aspect_ratio_idc > 0 && aspect_ratio_idc < 16) {
	          sar_width = sar_width_table[aspect_ratio_idc - 1];
	          sar_height = sar_height_table[aspect_ratio_idc - 1];
	        } else if (aspect_ratio_idc === 255) {
	          sar_width = eg.readBits(16);
	          sar_height = eg.readBits(16);
	        }
	      }
	      var overscan_info_present_flag = eg.readBoolean();
	      if (overscan_info_present_flag) {
	        eg.readBoolean();
	      }
	      var video_signal_type_present_flag = eg.readBoolean();
	      if (video_signal_type_present_flag) {
	        eg.readBits(3);
	        eg.readBoolean();
	        var colour_description_present_flag = eg.readBoolean();
	        if (colour_description_present_flag) {
	          eg.readUByte();
	          eg.readUByte();
	          eg.readUByte();
	        }
	      }
	      var chroma_loc_info_present_flag = eg.readBoolean();
	      if (chroma_loc_info_present_flag) {
	        eg.readUEG();
	        eg.readUEG();
	      }
	      eg.readBoolean(); // neutral_chroma_indication_flag
	      eg.readBoolean(); // field_seq_flag
	      eg.readBoolean(); // frame_field_info_present_flag
	      default_display_window_flag = eg.readBoolean();
	      if (default_display_window_flag) {
	        eg.skipUEG();
	        eg.skipUEG();
	        eg.skipUEG();
	        eg.skipUEG();
	      }
	      var vui_timing_info_present_flag = eg.readBoolean();
	      if (vui_timing_info_present_flag) {
	        fps_den = eg.readBits(32);
	        fps_num = eg.readBits(32);
	        var vui_poc_proportional_to_timing_flag = eg.readBoolean();
	        if (vui_poc_proportional_to_timing_flag) {
	          eg.readUEG();
	        }
	        var vui_hrd_parameters_present_flag = eg.readBoolean();
	        if (vui_hrd_parameters_present_flag) {
	          //const commonInfPresentFlag = true;
	          //if (commonInfPresentFlag) {
	          var nal_hrd_parameters_present_flag = eg.readBoolean();
	          var vcl_hrd_parameters_present_flag = eg.readBoolean();
	          var sub_pic_hrd_params_present_flag = false;
	          if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
	            sub_pic_hrd_params_present_flag = eg.readBoolean();
	            if (sub_pic_hrd_params_present_flag) {
	              eg.readUByte();
	              eg.readBits(5);
	              eg.readBoolean();
	              eg.readBits(5);
	            }
	            eg.readBits(4); // bit_rate_scale
	            eg.readBits(4); // cpb_size_scale
	            if (sub_pic_hrd_params_present_flag) {
	              eg.readBits(4);
	            }
	            eg.readBits(5);
	            eg.readBits(5);
	            eg.readBits(5);
	          }
	          //}
	          for (var _i7 = 0; _i7 <= max_sub_layers_minus1; _i7++) {
	            fps_fixed = eg.readBoolean(); // fixed_pic_rate_general_flag
	            var fixed_pic_rate_within_cvs_flag = fps_fixed || eg.readBoolean();
	            var low_delay_hrd_flag = false;
	            if (fixed_pic_rate_within_cvs_flag) {
	              eg.readEG();
	            } else {
	              low_delay_hrd_flag = eg.readBoolean();
	            }
	            var cpb_cnt = low_delay_hrd_flag ? 1 : eg.readUEG() + 1;
	            if (nal_hrd_parameters_present_flag) {
	              for (var _j4 = 0; _j4 < cpb_cnt; _j4++) {
	                eg.readUEG();
	                eg.readUEG();
	                if (sub_pic_hrd_params_present_flag) {
	                  eg.readUEG();
	                  eg.readUEG();
	                }
	                eg.skipBits(1);
	              }
	            }
	            if (vcl_hrd_parameters_present_flag) {
	              for (var _j5 = 0; _j5 < cpb_cnt; _j5++) {
	                eg.readUEG();
	                eg.readUEG();
	                if (sub_pic_hrd_params_present_flag) {
	                  eg.readUEG();
	                  eg.readUEG();
	                }
	                eg.skipBits(1);
	              }
	            }
	          }
	        }
	      }
	      var bitstream_restriction_flag = eg.readBoolean();
	      if (bitstream_restriction_flag) {
	        eg.readBoolean(); // tiles_fixed_structure_flag
	        eg.readBoolean(); // motion_vectors_over_pic_boundaries_flag
	        eg.readBoolean(); // restricted_ref_pic_lists_flag
	        min_spatial_segmentation_idc = eg.readUEG();
	      }
	    }
	    var width = pic_width_in_luma_samples,
	      height = pic_height_in_luma_samples;
	    if (conformance_window_flag) {
	      var chroma_scale_w = 1,
	        chroma_scale_h = 1;
	      if (chroma_format_idc === 1) {
	        // YUV 420
	        chroma_scale_w = chroma_scale_h = 2;
	      } else if (chroma_format_idc == 2) {
	        // YUV 422
	        chroma_scale_w = 2;
	      }
	      width = pic_width_in_luma_samples - chroma_scale_w * pic_right_offset - chroma_scale_w * pic_left_offset;
	      height = pic_height_in_luma_samples - chroma_scale_h * pic_bottom_offset - chroma_scale_h * pic_top_offset;
	    }
	    var profile_space_string = general_profile_space ? ['A', 'B', 'C'][general_profile_space] : '';
	    var profile_compatibility_buf = general_profile_compatibility_flags_1 << 24 | general_profile_compatibility_flags_2 << 16 | general_profile_compatibility_flags_3 << 8 | general_profile_compatibility_flags_4;
	    var profile_compatibility_rev = 0;
	    for (var _i8 = 0; _i8 < 32; _i8++) {
	      profile_compatibility_rev = (profile_compatibility_rev | (profile_compatibility_buf >> _i8 & 1) << 31 - _i8) >>> 0; // reverse bit position (and cast as UInt32)
	    }
	    var profile_compatibility_flags_string = profile_compatibility_rev.toString(16);
	    if (general_profile_idc === 1 && profile_compatibility_flags_string === '2') {
	      profile_compatibility_flags_string = '6';
	    }
	    var tier_flag_string = general_tier_flag ? 'H' : 'L';
	    return {
	      codecString: "hvc1." + profile_space_string + general_profile_idc + "." + profile_compatibility_flags_string + "." + tier_flag_string + general_level_idc + ".B0",
	      params: {
	        general_tier_flag: general_tier_flag,
	        general_profile_idc: general_profile_idc,
	        general_profile_space: general_profile_space,
	        general_profile_compatibility_flags: [general_profile_compatibility_flags_1, general_profile_compatibility_flags_2, general_profile_compatibility_flags_3, general_profile_compatibility_flags_4],
	        general_constraint_indicator_flags: [general_constraint_indicator_flags_1, general_constraint_indicator_flags_2, general_constraint_indicator_flags_3, general_constraint_indicator_flags_4, general_constraint_indicator_flags_5, general_constraint_indicator_flags_6],
	        general_level_idc: general_level_idc,
	        bit_depth: bit_depth_luma_minus8 + 8,
	        bit_depth_luma_minus8: bit_depth_luma_minus8,
	        bit_depth_chroma_minus8: bit_depth_chroma_minus8,
	        min_spatial_segmentation_idc: min_spatial_segmentation_idc,
	        chroma_format_idc: chroma_format_idc,
	        frame_rate: {
	          fixed: fps_fixed,
	          fps: fps_num / fps_den
	        }
	      },
	      width: width,
	      height: height,
	      pixelRatio: [sar_width, sar_height]
	    };
	  };
	  _proto.readPPS = function readPPS(pps) {
	    var eg = new ExpGolomb(this.ebsp2rbsp(pps));
	    eg.readUByte();
	    eg.readUByte();
	    eg.skipUEG(); // pic_parameter_set_id
	    eg.skipUEG(); // seq_parameter_set_id
	    eg.skipBits(2); // dependent_slice_segments_enabled_flag, output_flag_present_flag
	    eg.skipBits(3); // num_extra_slice_header_bits
	    eg.skipBits(2); // sign_data_hiding_enabled_flag, cabac_init_present_flag
	    eg.skipUEG();
	    eg.skipUEG();
	    eg.skipEG(); // init_qp_minus26
	    eg.skipBits(2); // constrained_intra_pred_flag, transform_skip_enabled_flag
	    var cu_qp_delta_enabled_flag = eg.readBoolean();
	    if (cu_qp_delta_enabled_flag) {
	      eg.skipUEG();
	    }
	    eg.skipEG(); // cb_qp_offset
	    eg.skipEG(); // cr_qp_offset
	    eg.skipBits(4); // pps_slice_chroma_qp_offsets_present_flag, weighted_pred_flag, weighted_bipred_flag, transquant_bypass_enabled_flag
	    var tiles_enabled_flag = eg.readBoolean();
	    var entropy_coding_sync_enabled_flag = eg.readBoolean();
	    var parallelismType = 1; // slice-based parallel decoding
	    if (entropy_coding_sync_enabled_flag && tiles_enabled_flag) {
	      parallelismType = 0; // mixed-type parallel decoding
	    } else if (entropy_coding_sync_enabled_flag) {
	      parallelismType = 3; // wavefront-based parallel decoding
	    } else if (tiles_enabled_flag) {
	      parallelismType = 2; // tile-based parallel decoding
	    }
	    return {
	      parallelismType: parallelismType
	    };
	  };
	  _proto.matchSPS = function matchSPS(sps1, sps2) {
	    // compare without headers and VPS related params
	    return String.fromCharCode.apply(null, sps1).substr(3) === String.fromCharCode.apply(null, sps2).substr(3);
	  };
	  return HevcVideoParser;
	}(BaseVideoParser);

	var PACKET_LENGTH = 188;
	var TSDemuxer = /*#__PURE__*/function () {
	  function TSDemuxer(observer, config, typeSupported, logger) {
	    this.logger = void 0;
	    this.observer = void 0;
	    this.config = void 0;
	    this.typeSupported = void 0;
	    this.sampleAes = null;
	    this.pmtParsed = false;
	    this.audioCodec = void 0;
	    this.videoCodec = void 0;
	    this._pmtId = -1;
	    this._videoTrack = void 0;
	    this._audioTrack = void 0;
	    this._id3Track = void 0;
	    this._txtTrack = void 0;
	    this.aacOverFlow = null;
	    this.remainderData = null;
	    this.videoParser = void 0;
	    this.observer = observer;
	    this.config = config;
	    this.typeSupported = typeSupported;
	    this.logger = logger;
	    this.videoParser = null;
	  }
	  TSDemuxer.probe = function probe(data, logger) {
	    var syncOffset = TSDemuxer.syncOffset(data);
	    if (syncOffset > 0) {
	      logger.warn("MPEG2-TS detected but first sync word found @ offset " + syncOffset);
	    }
	    return syncOffset !== -1;
	  };
	  TSDemuxer.syncOffset = function syncOffset(data) {
	    var length = data.length;
	    var scanwindow = Math.min(PACKET_LENGTH * 5, length - PACKET_LENGTH) + 1;
	    var i = 0;
	    while (i < scanwindow) {
	      // a TS init segment should contain at least 2 TS packets: PAT and PMT, each starting with 0x47
	      var foundPat = false;
	      var packetStart = -1;
	      var tsPackets = 0;
	      for (var j = i; j < length; j += PACKET_LENGTH) {
	        if (data[j] === 0x47 && (length - j === PACKET_LENGTH || data[j + PACKET_LENGTH] === 0x47)) {
	          tsPackets++;
	          if (packetStart === -1) {
	            packetStart = j;
	            // First sync word found at offset, increase scan length (#5251)
	            if (packetStart !== 0) {
	              scanwindow = Math.min(packetStart + PACKET_LENGTH * 99, data.length - PACKET_LENGTH) + 1;
	            }
	          }
	          if (!foundPat) {
	            foundPat = parsePID(data, j) === 0;
	          }
	          // Sync word found at 0 with 3 packets, or found at offset least 2 packets up to scanwindow (#5501)
	          if (foundPat && tsPackets > 1 && (packetStart === 0 && tsPackets > 2 || j + PACKET_LENGTH > scanwindow)) {
	            return packetStart;
	          }
	        } else if (tsPackets) {
	          // Exit if sync word found, but does not contain contiguous packets
	          return -1;
	        } else {
	          break;
	        }
	      }
	      i++;
	    }
	    return -1;
	  }

	  /**
	   * Creates a track model internal to demuxer used to drive remuxing input
	   */;
	  TSDemuxer.createTrack = function createTrack(type, duration) {
	    return {
	      container: type === 'video' || type === 'audio' ? 'video/mp2t' : undefined,
	      type: type,
	      id: RemuxerTrackIdConfig[type],
	      pid: -1,
	      inputTimeScale: 90000,
	      sequenceNumber: 0,
	      samples: [],
	      dropped: 0,
	      duration: type === 'audio' ? duration : undefined
	    };
	  }

	  /**
	   * Initializes a new init segment on the demuxer/remuxer interface. Needed for discontinuities/track-switches (or at stream start)
	   * Resets all internal track instances of the demuxer.
	   */;
	  var _proto = TSDemuxer.prototype;
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, trackDuration) {
	    this.pmtParsed = false;
	    this._pmtId = -1;
	    this._videoTrack = TSDemuxer.createTrack('video');
	    this._videoTrack.duration = trackDuration;
	    this._audioTrack = TSDemuxer.createTrack('audio', trackDuration);
	    this._id3Track = TSDemuxer.createTrack('id3');
	    this._txtTrack = TSDemuxer.createTrack('text');
	    this._audioTrack.segmentCodec = 'aac';

	    // flush any partial content
	    this.videoParser = null;
	    this.aacOverFlow = null;
	    this.remainderData = null;
	    this.audioCodec = audioCodec;
	    this.videoCodec = videoCodec;
	  };
	  _proto.resetTimeStamp = function resetTimeStamp() {};
	  _proto.resetContiguity = function resetContiguity() {
	    var _audioTrack = this._audioTrack,
	      _videoTrack = this._videoTrack,
	      _id3Track = this._id3Track;
	    if (_audioTrack) {
	      _audioTrack.pesData = null;
	    }
	    if (_videoTrack) {
	      _videoTrack.pesData = null;
	    }
	    if (_id3Track) {
	      _id3Track.pesData = null;
	    }
	    this.aacOverFlow = null;
	    this.remainderData = null;
	  };
	  _proto.demux = function demux(data, timeOffset, isSampleAes, flush) {
	    if (isSampleAes === void 0) {
	      isSampleAes = false;
	    }
	    if (flush === void 0) {
	      flush = false;
	    }
	    if (!isSampleAes) {
	      this.sampleAes = null;
	    }
	    var pes;
	    var videoTrack = this._videoTrack;
	    var audioTrack = this._audioTrack;
	    var id3Track = this._id3Track;
	    var textTrack = this._txtTrack;
	    var videoPid = videoTrack.pid;
	    var videoData = videoTrack.pesData;
	    var audioPid = audioTrack.pid;
	    var id3Pid = id3Track.pid;
	    var audioData = audioTrack.pesData;
	    var id3Data = id3Track.pesData;
	    var unknownPID = null;
	    var pmtParsed = this.pmtParsed;
	    var pmtId = this._pmtId;
	    var len = data.length;
	    if (this.remainderData) {
	      data = appendUint8Array(this.remainderData, data);
	      len = data.length;
	      this.remainderData = null;
	    }
	    if (len < PACKET_LENGTH && !flush) {
	      this.remainderData = data;
	      return {
	        audioTrack: audioTrack,
	        videoTrack: videoTrack,
	        id3Track: id3Track,
	        textTrack: textTrack
	      };
	    }
	    var syncOffset = Math.max(0, TSDemuxer.syncOffset(data));
	    len -= (len - syncOffset) % PACKET_LENGTH;
	    if (len < data.byteLength && !flush) {
	      this.remainderData = new Uint8Array(data.buffer, len, data.buffer.byteLength - len);
	    }

	    // loop through TS packets
	    var tsPacketErrors = 0;
	    for (var start = syncOffset; start < len; start += PACKET_LENGTH) {
	      if (data[start] === 0x47) {
	        var stt = !!(data[start + 1] & 0x40);
	        var pid = parsePID(data, start);
	        var atf = (data[start + 3] & 0x30) >> 4;

	        // if an adaption field is present, its length is specified by the fifth byte of the TS packet header.
	        var offset = void 0;
	        if (atf > 1) {
	          offset = start + 5 + data[start + 4];
	          // continue if there is only adaptation field
	          if (offset === start + PACKET_LENGTH) {
	            continue;
	          }
	        } else {
	          offset = start + 4;
	        }
	        switch (pid) {
	          case videoPid:
	            if (stt) {
	              if (videoData && (pes = parsePES(videoData, this.logger))) {
	                this.readyVideoParser(videoTrack.segmentCodec);
	                if (this.videoParser !== null) {
	                  this.videoParser.parsePES(videoTrack, textTrack, pes, false);
	                }
	              }
	              videoData = {
	                data: [],
	                size: 0
	              };
	            }
	            if (videoData) {
	              videoData.data.push(data.subarray(offset, start + PACKET_LENGTH));
	              videoData.size += start + PACKET_LENGTH - offset;
	            }
	            break;
	          case audioPid:
	            if (stt) {
	              if (audioData && (pes = parsePES(audioData, this.logger))) {
	                switch (audioTrack.segmentCodec) {
	                  case 'aac':
	                    this.parseAACPES(audioTrack, pes);
	                    break;
	                  case 'mp3':
	                    this.parseMPEGPES(audioTrack, pes);
	                    break;
	                  case 'ac3':
	                    {
	                      this.parseAC3PES(audioTrack, pes);
	                    }
	                    break;
	                }
	              }
	              audioData = {
	                data: [],
	                size: 0
	              };
	            }
	            if (audioData) {
	              audioData.data.push(data.subarray(offset, start + PACKET_LENGTH));
	              audioData.size += start + PACKET_LENGTH - offset;
	            }
	            break;
	          case id3Pid:
	            if (stt) {
	              if (id3Data && (pes = parsePES(id3Data, this.logger))) {
	                this.parseID3PES(id3Track, pes);
	              }
	              id3Data = {
	                data: [],
	                size: 0
	              };
	            }
	            if (id3Data) {
	              id3Data.data.push(data.subarray(offset, start + PACKET_LENGTH));
	              id3Data.size += start + PACKET_LENGTH - offset;
	            }
	            break;
	          case 0:
	            if (stt) {
	              offset += data[offset] + 1;
	            }
	            pmtId = this._pmtId = parsePAT(data, offset);
	            // this.logger.log('PMT PID:'  + this._pmtId);
	            break;
	          case pmtId:
	            {
	              if (stt) {
	                offset += data[offset] + 1;
	              }
	              var parsedPIDs = parsePMT(data, offset, this.typeSupported, isSampleAes, this.observer, this.logger);

	              // only update track id if track PID found while parsing PMT
	              // this is to avoid resetting the PID to -1 in case
	              // track PID transiently disappears from the stream
	              // this could happen in case of transient missing audio samples for example
	              // NOTE this is only the PID of the track as found in TS,
	              // but we are not using this for MP4 track IDs.
	              videoPid = parsedPIDs.videoPid;
	              if (videoPid > 0) {
	                videoTrack.pid = videoPid;
	                videoTrack.segmentCodec = parsedPIDs.segmentVideoCodec;
	              }
	              audioPid = parsedPIDs.audioPid;
	              if (audioPid > 0) {
	                audioTrack.pid = audioPid;
	                audioTrack.segmentCodec = parsedPIDs.segmentAudioCodec;
	              }
	              id3Pid = parsedPIDs.id3Pid;
	              if (id3Pid > 0) {
	                id3Track.pid = id3Pid;
	              }
	              if (unknownPID !== null && !pmtParsed) {
	                this.logger.warn("MPEG-TS PMT found at " + start + " after unknown PID '" + unknownPID + "'. Backtracking to sync byte @" + syncOffset + " to parse all TS packets.");
	                unknownPID = null;
	                // we set it to -188, the += 188 in the for loop will reset start to 0
	                start = syncOffset - 188;
	              }
	              pmtParsed = this.pmtParsed = true;
	              break;
	            }
	          case 0x11:
	          case 0x1fff:
	            break;
	          default:
	            unknownPID = pid;
	            break;
	        }
	      } else {
	        tsPacketErrors++;
	      }
	    }
	    if (tsPacketErrors > 0) {
	      emitParsingError(this.observer, new Error("Found " + tsPacketErrors + " TS packet/s that do not start with 0x47"), undefined, this.logger);
	    }
	    videoTrack.pesData = videoData;
	    audioTrack.pesData = audioData;
	    id3Track.pesData = id3Data;
	    var demuxResult = {
	      audioTrack: audioTrack,
	      videoTrack: videoTrack,
	      id3Track: id3Track,
	      textTrack: textTrack
	    };
	    if (flush) {
	      this.extractRemainingSamples(demuxResult);
	    }
	    return demuxResult;
	  };
	  _proto.flush = function flush() {
	    var remainderData = this.remainderData;
	    this.remainderData = null;
	    var result;
	    if (remainderData) {
	      result = this.demux(remainderData, -1, false, true);
	    } else {
	      result = {
	        videoTrack: this._videoTrack,
	        audioTrack: this._audioTrack,
	        id3Track: this._id3Track,
	        textTrack: this._txtTrack
	      };
	    }
	    this.extractRemainingSamples(result);
	    if (this.sampleAes) {
	      return this.decrypt(result, this.sampleAes);
	    }
	    return result;
	  };
	  _proto.extractRemainingSamples = function extractRemainingSamples(demuxResult) {
	    var audioTrack = demuxResult.audioTrack,
	      videoTrack = demuxResult.videoTrack,
	      id3Track = demuxResult.id3Track,
	      textTrack = demuxResult.textTrack;
	    var videoData = videoTrack.pesData;
	    var audioData = audioTrack.pesData;
	    var id3Data = id3Track.pesData;
	    // try to parse last PES packets
	    var pes;
	    if (videoData && (pes = parsePES(videoData, this.logger))) {
	      this.readyVideoParser(videoTrack.segmentCodec);
	      if (this.videoParser !== null) {
	        this.videoParser.parsePES(videoTrack, textTrack, pes, true);
	        videoTrack.pesData = null;
	      }
	    } else {
	      // either avcData null or PES truncated, keep it for next frag parsing
	      videoTrack.pesData = videoData;
	    }
	    if (audioData && (pes = parsePES(audioData, this.logger))) {
	      switch (audioTrack.segmentCodec) {
	        case 'aac':
	          this.parseAACPES(audioTrack, pes);
	          break;
	        case 'mp3':
	          this.parseMPEGPES(audioTrack, pes);
	          break;
	        case 'ac3':
	          {
	            this.parseAC3PES(audioTrack, pes);
	          }
	          break;
	      }
	      audioTrack.pesData = null;
	    } else {
	      if (audioData != null && audioData.size) {
	        this.logger.log('last AAC PES packet truncated,might overlap between fragments');
	      }

	      // either audioData null or PES truncated, keep it for next frag parsing
	      audioTrack.pesData = audioData;
	    }
	    if (id3Data && (pes = parsePES(id3Data, this.logger))) {
	      this.parseID3PES(id3Track, pes);
	      id3Track.pesData = null;
	    } else {
	      // either id3Data null or PES truncated, keep it for next frag parsing
	      id3Track.pesData = id3Data;
	    }
	  };
	  _proto.demuxSampleAes = function demuxSampleAes(data, keyData, timeOffset) {
	    var demuxResult = this.demux(data, timeOffset, true, !this.config.progressive);
	    var sampleAes = this.sampleAes = new SampleAesDecrypter(this.observer, this.config, keyData);
	    return this.decrypt(demuxResult, sampleAes);
	  };
	  _proto.readyVideoParser = function readyVideoParser(codec) {
	    if (this.videoParser === null) {
	      if (codec === 'avc') {
	        this.videoParser = new AvcVideoParser();
	      } else if (codec === 'hevc') {
	        this.videoParser = new HevcVideoParser();
	      }
	    }
	  };
	  _proto.decrypt = function decrypt(demuxResult, sampleAes) {
	    return new Promise(function (resolve) {
	      var audioTrack = demuxResult.audioTrack,
	        videoTrack = demuxResult.videoTrack;
	      if (audioTrack.samples && audioTrack.segmentCodec === 'aac') {
	        sampleAes.decryptAacSamples(audioTrack.samples, 0, function () {
	          if (videoTrack.samples) {
	            sampleAes.decryptAvcSamples(videoTrack.samples, 0, 0, function () {
	              resolve(demuxResult);
	            });
	          } else {
	            resolve(demuxResult);
	          }
	        });
	      } else if (videoTrack.samples) {
	        sampleAes.decryptAvcSamples(videoTrack.samples, 0, 0, function () {
	          resolve(demuxResult);
	        });
	      }
	    });
	  };
	  _proto.destroy = function destroy() {
	    if (this.observer) {
	      this.observer.removeAllListeners();
	    }
	    // @ts-ignore
	    this.config = this.logger = this.observer = null;
	    this.aacOverFlow = this.videoParser = this.remainderData = this.sampleAes = null;
	    this._videoTrack = this._audioTrack = this._id3Track = this._txtTrack = undefined;
	  };
	  _proto.parseAACPES = function parseAACPES(track, pes) {
	    var startOffset = 0;
	    var aacOverFlow = this.aacOverFlow;
	    var data = pes.data;
	    if (aacOverFlow) {
	      this.aacOverFlow = null;
	      var frameMissingBytes = aacOverFlow.missing;
	      var sampleLength = aacOverFlow.sample.unit.byteLength;
	      // logger.log(`AAC: append overflowing ${sampleLength} bytes to beginning of new PES`);
	      if (frameMissingBytes === -1) {
	        data = appendUint8Array(aacOverFlow.sample.unit, data);
	      } else {
	        var frameOverflowBytes = sampleLength - frameMissingBytes;
	        aacOverFlow.sample.unit.set(data.subarray(0, frameMissingBytes), frameOverflowBytes);
	        track.samples.push(aacOverFlow.sample);
	        startOffset = aacOverFlow.missing;
	      }
	    }
	    // look for ADTS header (0xFFFx)
	    var offset;
	    var len;
	    for (offset = startOffset, len = data.length; offset < len - 1; offset++) {
	      if (isHeader$1(data, offset)) {
	        break;
	      }
	    }
	    // if ADTS header does not start straight from the beginning of the PES payload, raise an error
	    if (offset !== startOffset) {
	      var reason;
	      var recoverable = offset < len - 1;
	      if (recoverable) {
	        reason = "AAC PES did not start with ADTS header,offset:" + offset;
	      } else {
	        reason = 'No ADTS header found in AAC PES';
	      }
	      emitParsingError(this.observer, new Error(reason), recoverable, this.logger);
	      if (!recoverable) {
	        return;
	      }
	    }
	    initTrackConfig(track, this.observer, data, offset, this.audioCodec, this.config.userAgent);
	    var pts;
	    if (pes.pts !== undefined) {
	      pts = pes.pts;
	    } else if (aacOverFlow) {
	      // if last AAC frame is overflowing, we should ensure timestamps are contiguous:
	      // first sample PTS should be equal to last sample PTS + frameDuration
	      var frameDuration = getFrameDuration(track.samplerate);
	      pts = aacOverFlow.sample.pts + frameDuration;
	    } else {
	      this.logger.warn('[tsdemuxer]: AAC PES unknown PTS');
	      return;
	    }

	    // scan for aac samples
	    var frameIndex = 0;
	    var frame;
	    while (offset < len) {
	      frame = appendFrame$1(track, data, offset, pts, frameIndex);
	      offset += frame.length;
	      if (!frame.missing) {
	        frameIndex++;
	        for (; offset < len - 1; offset++) {
	          if (isHeader$1(data, offset)) {
	            break;
	          }
	        }
	      } else {
	        this.aacOverFlow = frame;
	        break;
	      }
	    }
	  };
	  _proto.parseMPEGPES = function parseMPEGPES(track, pes) {
	    var data = pes.data;
	    var length = data.length;
	    var frameIndex = 0;
	    var offset = 0;
	    var pts = pes.pts;
	    if (pts === undefined) {
	      this.logger.warn('[tsdemuxer]: MPEG PES unknown PTS');
	      return;
	    }
	    while (offset < length) {
	      if (isHeader(data, offset)) {
	        var frame = appendFrame(track, data, offset, pts, frameIndex);
	        if (frame) {
	          offset += frame.length;
	          frameIndex++;
	        } else {
	          // logger.log('Unable to parse Mpeg audio frame');
	          break;
	        }
	      } else {
	        // nothing found, keep looking
	        offset++;
	      }
	    }
	  };
	  _proto.parseAC3PES = function parseAC3PES(track, pes) {
	    {
	      var data = pes.data;
	      var pts = pes.pts;
	      if (pts === undefined) {
	        this.logger.warn('[tsdemuxer]: AC3 PES unknown PTS');
	        return;
	      }
	      var length = data.length;
	      var frameIndex = 0;
	      var offset = 0;
	      var parsed;
	      while (offset < length && (parsed = _appendFrame(track, data, offset, pts, frameIndex++)) > 0) {
	        offset += parsed;
	      }
	    }
	  };
	  _proto.parseID3PES = function parseID3PES(id3Track, pes) {
	    if (pes.pts === undefined) {
	      this.logger.warn('[tsdemuxer]: ID3 PES unknown PTS');
	      return;
	    }
	    var id3Sample = _extends({}, pes, {
	      type: this._videoTrack ? MetadataSchema.emsg : MetadataSchema.audioId3,
	      duration: Number.POSITIVE_INFINITY
	    });
	    id3Track.samples.push(id3Sample);
	  };
	  return TSDemuxer;
	}();
	function parsePID(data, offset) {
	  // pid is a 13-bit field starting at the last bit of TS[1]
	  return ((data[offset + 1] & 0x1f) << 8) + data[offset + 2];
	}
	function parsePAT(data, offset) {
	  // skip the PSI header and parse the first PMT entry
	  return (data[offset + 10] & 0x1f) << 8 | data[offset + 11];
	}
	function parsePMT(data, offset, typeSupported, isSampleAes, observer, logger) {
	  var result = {
	    audioPid: -1,
	    videoPid: -1,
	    id3Pid: -1,
	    segmentVideoCodec: 'avc',
	    segmentAudioCodec: 'aac'
	  };
	  var sectionLength = (data[offset + 1] & 0x0f) << 8 | data[offset + 2];
	  var tableEnd = offset + 3 + sectionLength - 4;
	  // to determine where the table is, we have to figure out how
	  // long the program info descriptors are
	  var programInfoLength = (data[offset + 10] & 0x0f) << 8 | data[offset + 11];
	  // advance the offset to the first entry in the mapping table
	  offset += 12 + programInfoLength;
	  while (offset < tableEnd) {
	    var pid = parsePID(data, offset);
	    var esInfoLength = (data[offset + 3] & 0x0f) << 8 | data[offset + 4];
	    switch (data[offset]) {
	      case 0xcf:
	        // SAMPLE-AES AAC
	        if (!isSampleAes) {
	          logEncryptedSamplesFoundInUnencryptedStream('ADTS AAC', logger);
	          break;
	        }
	      /* falls through */
	      case 0x0f:
	        // ISO/IEC 13818-7 ADTS AAC (MPEG-2 lower bit-rate audio)
	        // logger.log('AAC PID:'  + pid);
	        if (result.audioPid === -1) {
	          result.audioPid = pid;
	        }
	        break;

	      // Packetized metadata (ID3)
	      case 0x15:
	        // logger.log('ID3 PID:'  + pid);
	        if (result.id3Pid === -1) {
	          result.id3Pid = pid;
	        }
	        break;
	      case 0xdb:
	        // SAMPLE-AES AVC
	        if (!isSampleAes) {
	          logEncryptedSamplesFoundInUnencryptedStream('H.264', logger);
	          break;
	        }
	      /* falls through */
	      case 0x1b:
	        // ITU-T Rec. H.264 and ISO/IEC 14496-10 (lower bit-rate video)
	        // logger.log('AVC PID:'  + pid);
	        if (result.videoPid === -1) {
	          result.videoPid = pid;
	        }
	        break;

	      // ISO/IEC 11172-3 (MPEG-1 audio)
	      // or ISO/IEC 13818-3 (MPEG-2 halved sample rate audio)
	      case 0x03:
	      case 0x04:
	        // logger.log('MPEG PID:'  + pid);
	        if (!typeSupported.mpeg && !typeSupported.mp3) {
	          logger.log('MPEG audio found, not supported in this browser');
	        } else if (result.audioPid === -1) {
	          result.audioPid = pid;
	          result.segmentAudioCodec = 'mp3';
	        }
	        break;
	      case 0xc1:
	        // SAMPLE-AES AC3
	        if (!isSampleAes) {
	          logEncryptedSamplesFoundInUnencryptedStream('AC-3', logger);
	          break;
	        }
	      /* falls through */
	      case 0x81:
	        {
	          if (!typeSupported.ac3) {
	            logger.log('AC-3 audio found, not supported in this browser');
	          } else if (result.audioPid === -1) {
	            result.audioPid = pid;
	            result.segmentAudioCodec = 'ac3';
	          }
	        }
	        break;
	      case 0x06:
	        // stream_type 6 can mean a lot of different things in case of DVB.
	        // We need to look at the descriptors. Right now, we're only interested
	        // in AC-3 audio, so we do the descriptor parsing only when we don't have
	        // an audio PID yet.
	        if (result.audioPid === -1 && esInfoLength > 0) {
	          var parsePos = offset + 5;
	          var remaining = esInfoLength;
	          while (remaining > 2) {
	            var descriptorId = data[parsePos];
	            switch (descriptorId) {
	              case 0x6a:
	                // DVB Descriptor for AC-3
	                {
	                  if (typeSupported.ac3 !== true) {
	                    logger.log('AC-3 audio found, not supported in this browser for now');
	                  } else {
	                    result.audioPid = pid;
	                    result.segmentAudioCodec = 'ac3';
	                  }
	                }
	                break;
	            }
	            var descriptorLen = data[parsePos + 1] + 2;
	            parsePos += descriptorLen;
	            remaining -= descriptorLen;
	          }
	        }
	        break;
	      case 0xc2: // SAMPLE-AES EC3
	      /* falls through */
	      case 0x87:
	        emitParsingError(observer, new Error('Unsupported EC-3 in M2TS found'), undefined, logger);
	        return result;
	      case 0x24:
	        // ITU-T Rec. H.265 and ISO/IEC 23008-2 (HEVC)
	        {
	          if (result.videoPid === -1) {
	            result.videoPid = pid;
	            result.segmentVideoCodec = 'hevc';
	            logger.log('HEVC in M2TS found');
	          }
	        }
	        break;
	    }
	    // move to the next table entry
	    // skip past the elementary stream descriptors, if present
	    offset += esInfoLength + 5;
	  }
	  return result;
	}
	function emitParsingError(observer, error, levelRetry, logger) {
	  logger.warn("parsing error: " + error.message);
	  observer.emit(Events.ERROR, Events.ERROR, {
	    type: ErrorTypes.MEDIA_ERROR,
	    details: ErrorDetails.FRAG_PARSING_ERROR,
	    fatal: false,
	    levelRetry: levelRetry,
	    error: error,
	    reason: error.message
	  });
	}
	function logEncryptedSamplesFoundInUnencryptedStream(type, logger) {
	  logger.log(type + " with AES-128-CBC encryption found in unencrypted stream");
	}
	function parsePES(stream, logger) {
	  var i = 0;
	  var frag;
	  var pesLen;
	  var pesHdrLen;
	  var pesPts;
	  var pesDts;
	  var data = stream.data;
	  // safety check
	  if (!stream || stream.size === 0) {
	    return null;
	  }

	  // we might need up to 19 bytes to read PES header
	  // if first chunk of data is less than 19 bytes, let's merge it with following ones until we get 19 bytes
	  // usually only one merge is needed (and this is rare ...)
	  while (data[0].length < 19 && data.length > 1) {
	    data[0] = appendUint8Array(data[0], data[1]);
	    data.splice(1, 1);
	  }
	  // retrieve PTS/DTS from first fragment
	  frag = data[0];
	  var pesPrefix = (frag[0] << 16) + (frag[1] << 8) + frag[2];
	  if (pesPrefix === 1) {
	    pesLen = (frag[4] << 8) + frag[5];
	    // if PES parsed length is not zero and greater than total received length, stop parsing. PES might be truncated
	    // minus 6 : PES header size
	    if (pesLen && pesLen > stream.size - 6) {
	      return null;
	    }
	    var pesFlags = frag[7];
	    if (pesFlags & 0xc0) {
	      /* PES header described here : http://dvd.sourceforge.net/dvdinfo/pes-hdr.html
	          as PTS / DTS is 33 bit we cannot use bitwise operator in JS,
	          as Bitwise operators treat their operands as a sequence of 32 bits */
	      pesPts = (frag[9] & 0x0e) * 536870912 +
	      // 1 << 29
	      (frag[10] & 0xff) * 4194304 +
	      // 1 << 22
	      (frag[11] & 0xfe) * 16384 +
	      // 1 << 14
	      (frag[12] & 0xff) * 128 +
	      // 1 << 7
	      (frag[13] & 0xfe) / 2;
	      if (pesFlags & 0x40) {
	        pesDts = (frag[14] & 0x0e) * 536870912 +
	        // 1 << 29
	        (frag[15] & 0xff) * 4194304 +
	        // 1 << 22
	        (frag[16] & 0xfe) * 16384 +
	        // 1 << 14
	        (frag[17] & 0xff) * 128 +
	        // 1 << 7
	        (frag[18] & 0xfe) / 2;
	        if (pesPts - pesDts > 60 * 90000) {
	          logger.warn(Math.round((pesPts - pesDts) / 90000) + "s delta between PTS and DTS, align them");
	          pesPts = pesDts;
	        }
	      } else {
	        pesDts = pesPts;
	      }
	    }
	    pesHdrLen = frag[8];
	    // 9 bytes : 6 bytes for PES header + 3 bytes for PES extension
	    var payloadStartOffset = pesHdrLen + 9;
	    if (stream.size <= payloadStartOffset) {
	      return null;
	    }
	    stream.size -= payloadStartOffset;
	    // reassemble PES packet
	    var pesData = new Uint8Array(stream.size);
	    for (var j = 0, dataLen = data.length; j < dataLen; j++) {
	      frag = data[j];
	      var len = frag.byteLength;
	      if (payloadStartOffset) {
	        if (payloadStartOffset > len) {
	          // trim full frag if PES header bigger than frag
	          payloadStartOffset -= len;
	          continue;
	        } else {
	          // trim partial frag if PES header smaller than frag
	          frag = frag.subarray(payloadStartOffset);
	          len -= payloadStartOffset;
	          payloadStartOffset = 0;
	        }
	      }
	      pesData.set(frag, i);
	      i += len;
	    }
	    if (pesLen) {
	      // payload size : remove PES header + PES extension
	      pesLen -= pesHdrLen + 3;
	    }
	    return {
	      data: pesData,
	      pts: pesPts,
	      dts: pesDts,
	      len: pesLen
	    };
	  }
	  return null;
	}

	/**
	 *  AAC helper
	 */
	var AAC = /*#__PURE__*/function () {
	  function AAC() {}
	  AAC.getSilentFrame = function getSilentFrame(codec, channelCount) {
	    switch (codec) {
	      case 'mp4a.40.2':
	        if (channelCount === 1) {
	          return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x23, 0x80]);
	        } else if (channelCount === 2) {
	          return new Uint8Array([0x21, 0x00, 0x49, 0x90, 0x02, 0x19, 0x00, 0x23, 0x80]);
	        } else if (channelCount === 3) {
	          return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x8e]);
	        } else if (channelCount === 4) {
	          return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x80, 0x2c, 0x80, 0x08, 0x02, 0x38]);
	        } else if (channelCount === 5) {
	          return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x82, 0x30, 0x04, 0x99, 0x00, 0x21, 0x90, 0x02, 0x38]);
	        } else if (channelCount === 6) {
	          return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x82, 0x30, 0x04, 0x99, 0x00, 0x21, 0x90, 0x02, 0x00, 0xb2, 0x00, 0x20, 0x08, 0xe0]);
	        }
	        break;
	      // handle HE-AAC below (mp4a.40.5 / mp4a.40.29)
	      default:
	        if (channelCount === 1) {
	          // ffmpeg -y -f lavfi -i "aevalsrc=0:d=0.05" -c:a libfdk_aac -profile:a aac_he -b:a 4k output.aac && hexdump -v -e '16/1 "0x%x," "\n"' -v output.aac
	          return new Uint8Array([0x1, 0x40, 0x22, 0x80, 0xa3, 0x4e, 0xe6, 0x80, 0xba, 0x8, 0x0, 0x0, 0x0, 0x1c, 0x6, 0xf1, 0xc1, 0xa, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5e]);
	        } else if (channelCount === 2) {
	          // ffmpeg -y -f lavfi -i "aevalsrc=0|0:d=0.05" -c:a libfdk_aac -profile:a aac_he_v2 -b:a 4k output.aac && hexdump -v -e '16/1 "0x%x," "\n"' -v output.aac
	          return new Uint8Array([0x1, 0x40, 0x22, 0x80, 0xa3, 0x5e, 0xe6, 0x80, 0xba, 0x8, 0x0, 0x0, 0x0, 0x0, 0x95, 0x0, 0x6, 0xf1, 0xa1, 0xa, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5e]);
	        } else if (channelCount === 3) {
	          // ffmpeg -y -f lavfi -i "aevalsrc=0|0|0:d=0.05" -c:a libfdk_aac -profile:a aac_he_v2 -b:a 4k output.aac && hexdump -v -e '16/1 "0x%x," "\n"' -v output.aac
	          return new Uint8Array([0x1, 0x40, 0x22, 0x80, 0xa3, 0x5e, 0xe6, 0x80, 0xba, 0x8, 0x0, 0x0, 0x0, 0x0, 0x95, 0x0, 0x6, 0xf1, 0xa1, 0xa, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5e]);
	        }
	        break;
	    }
	    return undefined;
	  };
	  return AAC;
	}();

	/**
	 * Generate MP4 Box
	 */

	var UINT32_MAX = Math.pow(2, 32) - 1;
	var MP4 = /*#__PURE__*/function () {
	  function MP4() {}
	  MP4.init = function init() {
	    MP4.types = {
	      avc1: [],
	      // codingname
	      avcC: [],
	      hvc1: [],
	      hvcC: [],
	      btrt: [],
	      dinf: [],
	      dref: [],
	      esds: [],
	      ftyp: [],
	      hdlr: [],
	      mdat: [],
	      mdhd: [],
	      mdia: [],
	      mfhd: [],
	      minf: [],
	      moof: [],
	      moov: [],
	      mp4a: [],
	      '.mp3': [],
	      dac3: [],
	      'ac-3': [],
	      mvex: [],
	      mvhd: [],
	      pasp: [],
	      sdtp: [],
	      stbl: [],
	      stco: [],
	      stsc: [],
	      stsd: [],
	      stsz: [],
	      stts: [],
	      tfdt: [],
	      tfhd: [],
	      traf: [],
	      trak: [],
	      trun: [],
	      trex: [],
	      tkhd: [],
	      vmhd: [],
	      smhd: []
	    };
	    var i;
	    for (i in MP4.types) {
	      if (MP4.types.hasOwnProperty(i)) {
	        MP4.types[i] = [i.charCodeAt(0), i.charCodeAt(1), i.charCodeAt(2), i.charCodeAt(3)];
	      }
	    }
	    var videoHdlr = new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00,
	    // pre_defined
	    0x76, 0x69, 0x64, 0x65,
	    // handler_type: 'vide'
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x56, 0x69, 0x64, 0x65, 0x6f, 0x48, 0x61, 0x6e, 0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'VideoHandler'
	    ]);
	    var audioHdlr = new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00,
	    // pre_defined
	    0x73, 0x6f, 0x75, 0x6e,
	    // handler_type: 'soun'
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x53, 0x6f, 0x75, 0x6e, 0x64, 0x48, 0x61, 0x6e, 0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'SoundHandler'
	    ]);
	    MP4.HDLR_TYPES = {
	      video: videoHdlr,
	      audio: audioHdlr
	    };
	    var dref = new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x01,
	    // entry_count
	    0x00, 0x00, 0x00, 0x0c,
	    // entry_size
	    0x75, 0x72, 0x6c, 0x20,
	    // 'url' type
	    0x00,
	    // version 0
	    0x00, 0x00, 0x01 // entry_flags
	    ]);
	    var stco = new Uint8Array([0x00,
	    // version
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00 // entry_count
	    ]);
	    MP4.STTS = MP4.STSC = MP4.STCO = stco;
	    MP4.STSZ = new Uint8Array([0x00,
	    // version
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00,
	    // sample_size
	    0x00, 0x00, 0x00, 0x00 // sample_count
	    ]);
	    MP4.VMHD = new Uint8Array([0x00,
	    // version
	    0x00, 0x00, 0x01,
	    // flags
	    0x00, 0x00,
	    // graphicsmode
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // opcolor
	    ]);
	    MP4.SMHD = new Uint8Array([0x00,
	    // version
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00,
	    // balance
	    0x00, 0x00 // reserved
	    ]);
	    MP4.STSD = new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x01]); // entry_count

	    var majorBrand = new Uint8Array([105, 115, 111, 109]); // isom
	    var avc1Brand = new Uint8Array([97, 118, 99, 49]); // avc1
	    var minorVersion = new Uint8Array([0, 0, 0, 1]);
	    MP4.FTYP = MP4.box(MP4.types.ftyp, majorBrand, minorVersion, majorBrand, avc1Brand);
	    MP4.DINF = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, dref));
	  };
	  MP4.box = function box(type) {
	    var size = 8;
	    for (var _len = arguments.length, payload = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      payload[_key - 1] = arguments[_key];
	    }
	    var i = payload.length;
	    var len = i;
	    // calculate the total size we need to allocate
	    while (i--) {
	      size += payload[i].byteLength;
	    }
	    var result = new Uint8Array(size);
	    result[0] = size >> 24 & 0xff;
	    result[1] = size >> 16 & 0xff;
	    result[2] = size >> 8 & 0xff;
	    result[3] = size & 0xff;
	    result.set(type, 4);
	    // copy the payload into the result
	    for (i = 0, size = 8; i < len; i++) {
	      // copy payload[i] array @ offset size
	      result.set(payload[i], size);
	      size += payload[i].byteLength;
	    }
	    return result;
	  };
	  MP4.hdlr = function hdlr(type) {
	    return MP4.box(MP4.types.hdlr, MP4.HDLR_TYPES[type]);
	  };
	  MP4.mdat = function mdat(data) {
	    return MP4.box(MP4.types.mdat, data);
	  };
	  MP4.mdhd = function mdhd(timescale, duration) {
	    duration *= timescale;
	    var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
	    var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
	    return MP4.box(MP4.types.mdhd, new Uint8Array([0x01,
	    // version 1
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
	    // creation_time
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
	    // modification_time
	    timescale >> 24 & 0xff, timescale >> 16 & 0xff, timescale >> 8 & 0xff, timescale & 0xff,
	    // timescale
	    upperWordDuration >> 24, upperWordDuration >> 16 & 0xff, upperWordDuration >> 8 & 0xff, upperWordDuration & 0xff, lowerWordDuration >> 24, lowerWordDuration >> 16 & 0xff, lowerWordDuration >> 8 & 0xff, lowerWordDuration & 0xff, 0x55, 0xc4,
	    // 'und' language (undetermined)
	    0x00, 0x00]));
	  };
	  MP4.mdia = function mdia(track) {
	    return MP4.box(MP4.types.mdia, MP4.mdhd(track.timescale || 0, track.duration || 0), MP4.hdlr(track.type), MP4.minf(track));
	  };
	  MP4.mfhd = function mfhd(sequenceNumber) {
	    return MP4.box(MP4.types.mfhd, new Uint8Array([0x00, 0x00, 0x00, 0x00,
	    // flags
	    sequenceNumber >> 24, sequenceNumber >> 16 & 0xff, sequenceNumber >> 8 & 0xff, sequenceNumber & 0xff // sequence_number
	    ]));
	  };
	  MP4.minf = function minf(track) {
	    if (track.type === 'audio') {
	      return MP4.box(MP4.types.minf, MP4.box(MP4.types.smhd, MP4.SMHD), MP4.DINF, MP4.stbl(track));
	    } else {
	      return MP4.box(MP4.types.minf, MP4.box(MP4.types.vmhd, MP4.VMHD), MP4.DINF, MP4.stbl(track));
	    }
	  };
	  MP4.moof = function moof(sn, baseMediaDecodeTime, track) {
	    return MP4.box(MP4.types.moof, MP4.mfhd(sn), MP4.traf(track, baseMediaDecodeTime));
	  };
	  MP4.moov = function moov(tracks) {
	    var i = tracks.length;
	    var boxes = [];
	    while (i--) {
	      boxes[i] = MP4.trak(tracks[i]);
	    }
	    return MP4.box.apply(null, [MP4.types.moov, MP4.mvhd(tracks[0].timescale || 0, tracks[0].duration || 0)].concat(boxes).concat(MP4.mvex(tracks)));
	  };
	  MP4.mvex = function mvex(tracks) {
	    var i = tracks.length;
	    var boxes = [];
	    while (i--) {
	      boxes[i] = MP4.trex(tracks[i]);
	    }
	    return MP4.box.apply(null, [MP4.types.mvex].concat(boxes));
	  };
	  MP4.mvhd = function mvhd(timescale, duration) {
	    duration *= timescale;
	    var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
	    var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
	    var bytes = new Uint8Array([0x01,
	    // version 1
	    0x00, 0x00, 0x00,
	    // flags
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
	    // creation_time
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
	    // modification_time
	    timescale >> 24 & 0xff, timescale >> 16 & 0xff, timescale >> 8 & 0xff, timescale & 0xff,
	    // timescale
	    upperWordDuration >> 24, upperWordDuration >> 16 & 0xff, upperWordDuration >> 8 & 0xff, upperWordDuration & 0xff, lowerWordDuration >> 24, lowerWordDuration >> 16 & 0xff, lowerWordDuration >> 8 & 0xff, lowerWordDuration & 0xff, 0x00, 0x01, 0x00, 0x00,
	    // 1.0 rate
	    0x01, 0x00,
	    // 1.0 volume
	    0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00,
	    // transformation: unity matrix
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // pre_defined
	    0xff, 0xff, 0xff, 0xff // next_track_ID
	    ]);
	    return MP4.box(MP4.types.mvhd, bytes);
	  };
	  MP4.sdtp = function sdtp(track) {
	    var samples = track.samples || [];
	    var bytes = new Uint8Array(4 + samples.length);
	    var i;
	    var flags;
	    // leave the full box header (4 bytes) all zero
	    // write the sample table
	    for (i = 0; i < samples.length; i++) {
	      flags = samples[i].flags;
	      bytes[i + 4] = flags.dependsOn << 4 | flags.isDependedOn << 2 | flags.hasRedundancy;
	    }
	    return MP4.box(MP4.types.sdtp, bytes);
	  };
	  MP4.stbl = function stbl(track) {
	    return MP4.box(MP4.types.stbl, MP4.stsd(track), MP4.box(MP4.types.stts, MP4.STTS), MP4.box(MP4.types.stsc, MP4.STSC), MP4.box(MP4.types.stsz, MP4.STSZ), MP4.box(MP4.types.stco, MP4.STCO));
	  };
	  MP4.avc1 = function avc1(track) {
	    var sps = [];
	    var pps = [];
	    var i;
	    var data;
	    var len;
	    // assemble the SPSs

	    for (i = 0; i < track.sps.length; i++) {
	      data = track.sps[i];
	      len = data.byteLength;
	      sps.push(len >>> 8 & 0xff);
	      sps.push(len & 0xff);

	      // SPS
	      sps = sps.concat(Array.prototype.slice.call(data));
	    }

	    // assemble the PPSs
	    for (i = 0; i < track.pps.length; i++) {
	      data = track.pps[i];
	      len = data.byteLength;
	      pps.push(len >>> 8 & 0xff);
	      pps.push(len & 0xff);
	      pps = pps.concat(Array.prototype.slice.call(data));
	    }
	    var avcc = MP4.box(MP4.types.avcC, new Uint8Array([0x01,
	    // version
	    sps[3],
	    // profile
	    sps[4],
	    // profile compat
	    sps[5],
	    // level
	    0xfc | 3,
	    // lengthSizeMinusOne, hard-coded to 4 bytes
	    0xe0 | track.sps.length // 3bit reserved (111) + numOfSequenceParameterSets
	    ].concat(sps).concat([track.pps.length // numOfPictureParameterSets
	    ]).concat(pps))); // "PPS"
	    var width = track.width;
	    var height = track.height;
	    var hSpacing = track.pixelRatio[0];
	    var vSpacing = track.pixelRatio[1];
	    return MP4.box(MP4.types.avc1, new Uint8Array([0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01,
	    // data_reference_index
	    0x00, 0x00,
	    // pre_defined
	    0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // pre_defined
	    width >> 8 & 0xff, width & 0xff,
	    // width
	    height >> 8 & 0xff, height & 0xff,
	    // height
	    0x00, 0x48, 0x00, 0x00,
	    // horizresolution
	    0x00, 0x48, 0x00, 0x00,
	    // vertresolution
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01,
	    // frame_count
	    0x12, 0x64, 0x61, 0x69, 0x6c,
	    // dailymotion/hls.js
	    0x79, 0x6d, 0x6f, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x68, 0x6c, 0x73, 0x2e, 0x6a, 0x73, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // compressorname
	    0x00, 0x18,
	    // depth = 24
	    0x11, 0x11]),
	    // pre_defined = -1
	    avcc, MP4.box(MP4.types.btrt, new Uint8Array([0x00, 0x1c, 0x9c, 0x80,
	    // bufferSizeDB
	    0x00, 0x2d, 0xc6, 0xc0,
	    // maxBitrate
	    0x00, 0x2d, 0xc6, 0xc0])),
	    // avgBitrate
	    MP4.box(MP4.types.pasp, new Uint8Array([hSpacing >> 24,
	    // hSpacing
	    hSpacing >> 16 & 0xff, hSpacing >> 8 & 0xff, hSpacing & 0xff, vSpacing >> 24,
	    // vSpacing
	    vSpacing >> 16 & 0xff, vSpacing >> 8 & 0xff, vSpacing & 0xff])));
	  };
	  MP4.esds = function esds(track) {
	    var config = track.config;
	    return new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags

	    0x03,
	    // descriptor_type
	    0x19,
	    // length

	    0x00, 0x01,
	    // es_id

	    0x00,
	    // stream_priority

	    0x04,
	    // descriptor_type
	    0x11,
	    // length
	    0x40,
	    // codec : mpeg4_audio
	    0x15,
	    // stream_type
	    0x00, 0x00, 0x00,
	    // buffer_size
	    0x00, 0x00, 0x00, 0x00,
	    // maxBitrate
	    0x00, 0x00, 0x00, 0x00,
	    // avgBitrate

	    0x05,
	    // descriptor_type
	    0x02].concat(config, [0x06, 0x01, 0x02 // GASpecificConfig)); // length + audio config descriptor
	    ]));
	  };
	  MP4.audioStsd = function audioStsd(track) {
	    var samplerate = track.samplerate || 0;
	    return new Uint8Array([0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01,
	    // data_reference_index
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, track.channelCount || 0,
	    // channelcount
	    0x00, 0x10,
	    // sampleSize:16bits
	    0x00, 0x00, 0x00, 0x00,
	    // reserved2
	    samplerate >> 8 & 0xff, samplerate & 0xff,
	    //
	    0x00, 0x00]);
	  };
	  MP4.mp4a = function mp4a(track) {
	    return MP4.box(MP4.types.mp4a, MP4.audioStsd(track), MP4.box(MP4.types.esds, MP4.esds(track)));
	  };
	  MP4.mp3 = function mp3(track) {
	    return MP4.box(MP4.types['.mp3'], MP4.audioStsd(track));
	  };
	  MP4.ac3 = function ac3(track) {
	    return MP4.box(MP4.types['ac-3'], MP4.audioStsd(track), MP4.box(MP4.types.dac3, track.config));
	  };
	  MP4.stsd = function stsd(track) {
	    var segmentCodec = track.segmentCodec;
	    if (track.type === 'audio') {
	      if (segmentCodec === 'aac') {
	        return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp4a(track));
	      }
	      if (segmentCodec === 'ac3' && track.config) {
	        return MP4.box(MP4.types.stsd, MP4.STSD, MP4.ac3(track));
	      }
	      if (segmentCodec === 'mp3' && track.codec === 'mp3') {
	        return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp3(track));
	      }
	    } else {
	      if (track.pps && track.sps) {
	        if (segmentCodec === 'avc') {
	          return MP4.box(MP4.types.stsd, MP4.STSD, MP4.avc1(track));
	        }
	        if (segmentCodec === 'hevc' && track.vps) {
	          return MP4.box(MP4.types.stsd, MP4.STSD, MP4.hvc1(track));
	        }
	      } else {
	        throw new Error("video track missing pps or sps");
	      }
	    }
	    throw new Error("unsupported " + track.type + " segment codec (" + segmentCodec + "/" + track.codec + ")");
	  };
	  MP4.tkhd = function tkhd(track) {
	    var id = track.id;
	    var duration = (track.duration || 0) * (track.timescale || 0);
	    var width = track.width || 0;
	    var height = track.height || 0;
	    var upperWordDuration = Math.floor(duration / (UINT32_MAX + 1));
	    var lowerWordDuration = Math.floor(duration % (UINT32_MAX + 1));
	    return MP4.box(MP4.types.tkhd, new Uint8Array([0x01,
	    // version 1
	    0x00, 0x00, 0x07,
	    // flags
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
	    // creation_time
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
	    // modification_time
	    id >> 24 & 0xff, id >> 16 & 0xff, id >> 8 & 0xff, id & 0xff,
	    // track_ID
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    upperWordDuration >> 24, upperWordDuration >> 16 & 0xff, upperWordDuration >> 8 & 0xff, upperWordDuration & 0xff, lowerWordDuration >> 24, lowerWordDuration >> 16 & 0xff, lowerWordDuration >> 8 & 0xff, lowerWordDuration & 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00,
	    // layer
	    0x00, 0x00,
	    // alternate_group
	    0x00, 0x00,
	    // non-audio track volume
	    0x00, 0x00,
	    // reserved
	    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00,
	    // transformation: unity matrix
	    width >> 8 & 0xff, width & 0xff, 0x00, 0x00,
	    // width
	    height >> 8 & 0xff, height & 0xff, 0x00, 0x00 // height
	    ]));
	  };
	  MP4.traf = function traf(track, baseMediaDecodeTime) {
	    var sampleDependencyTable = MP4.sdtp(track);
	    var id = track.id;
	    var upperWordBaseMediaDecodeTime = Math.floor(baseMediaDecodeTime / (UINT32_MAX + 1));
	    var lowerWordBaseMediaDecodeTime = Math.floor(baseMediaDecodeTime % (UINT32_MAX + 1));
	    return MP4.box(MP4.types.traf, MP4.box(MP4.types.tfhd, new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    id >> 24, id >> 16 & 0xff, id >> 8 & 0xff, id & 0xff // track_ID
	    ])), MP4.box(MP4.types.tfdt, new Uint8Array([0x01,
	    // version 1
	    0x00, 0x00, 0x00,
	    // flags
	    upperWordBaseMediaDecodeTime >> 24, upperWordBaseMediaDecodeTime >> 16 & 0xff, upperWordBaseMediaDecodeTime >> 8 & 0xff, upperWordBaseMediaDecodeTime & 0xff, lowerWordBaseMediaDecodeTime >> 24, lowerWordBaseMediaDecodeTime >> 16 & 0xff, lowerWordBaseMediaDecodeTime >> 8 & 0xff, lowerWordBaseMediaDecodeTime & 0xff])), MP4.trun(track, sampleDependencyTable.length + 16 +
	    // tfhd
	    20 +
	    // tfdt
	    8 +
	    // traf header
	    16 +
	    // mfhd
	    8 +
	    // moof header
	    8),
	    // mdat header
	    sampleDependencyTable);
	  }

	  /**
	   * Generate a track box.
	   * @param track a track definition
	   */;
	  MP4.trak = function trak(track) {
	    track.duration = track.duration || 0xffffffff;
	    return MP4.box(MP4.types.trak, MP4.tkhd(track), MP4.mdia(track));
	  };
	  MP4.trex = function trex(track) {
	    var id = track.id;
	    return MP4.box(MP4.types.trex, new Uint8Array([0x00,
	    // version 0
	    0x00, 0x00, 0x00,
	    // flags
	    id >> 24, id >> 16 & 0xff, id >> 8 & 0xff, id & 0xff,
	    // track_ID
	    0x00, 0x00, 0x00, 0x01,
	    // default_sample_description_index
	    0x00, 0x00, 0x00, 0x00,
	    // default_sample_duration
	    0x00, 0x00, 0x00, 0x00,
	    // default_sample_size
	    0x00, 0x01, 0x00, 0x01 // default_sample_flags
	    ]));
	  };
	  MP4.trun = function trun(track, offset) {
	    var samples = track.samples || [];
	    var len = samples.length;
	    var arraylen = 12 + 16 * len;
	    var array = new Uint8Array(arraylen);
	    var i;
	    var sample;
	    var duration;
	    var size;
	    var flags;
	    var cts;
	    offset += 8 + arraylen;
	    array.set([track.type === 'video' ? 0x01 : 0x00,
	    // version 1 for video with signed-int sample_composition_time_offset
	    0x00, 0x0f, 0x01,
	    // flags
	    len >>> 24 & 0xff, len >>> 16 & 0xff, len >>> 8 & 0xff, len & 0xff,
	    // sample_count
	    offset >>> 24 & 0xff, offset >>> 16 & 0xff, offset >>> 8 & 0xff, offset & 0xff // data_offset
	    ], 0);
	    for (i = 0; i < len; i++) {
	      sample = samples[i];
	      duration = sample.duration;
	      size = sample.size;
	      flags = sample.flags;
	      cts = sample.cts;
	      array.set([duration >>> 24 & 0xff, duration >>> 16 & 0xff, duration >>> 8 & 0xff, duration & 0xff,
	      // sample_duration
	      size >>> 24 & 0xff, size >>> 16 & 0xff, size >>> 8 & 0xff, size & 0xff,
	      // sample_size
	      flags.isLeading << 2 | flags.dependsOn, flags.isDependedOn << 6 | flags.hasRedundancy << 4 | flags.paddingValue << 1 | flags.isNonSync, flags.degradPrio & 0xf0 << 8, flags.degradPrio & 0x0f,
	      // sample_flags
	      cts >>> 24 & 0xff, cts >>> 16 & 0xff, cts >>> 8 & 0xff, cts & 0xff // sample_composition_time_offset
	      ], 12 + 16 * i);
	    }
	    return MP4.box(MP4.types.trun, array);
	  };
	  MP4.initSegment = function initSegment(tracks) {
	    if (!MP4.types) {
	      MP4.init();
	    }
	    var movie = MP4.moov(tracks);
	    var result = appendUint8Array(MP4.FTYP, movie);
	    return result;
	  };
	  MP4.hvc1 = function hvc1(track) {
	    var ps = track.params;
	    var units = [track.vps, track.sps, track.pps];
	    var NALuLengthSize = 4;
	    var config = new Uint8Array([0x01, ps.general_profile_space << 6 | (ps.general_tier_flag ? 32 : 0) | ps.general_profile_idc, ps.general_profile_compatibility_flags[0], ps.general_profile_compatibility_flags[1], ps.general_profile_compatibility_flags[2], ps.general_profile_compatibility_flags[3], ps.general_constraint_indicator_flags[0], ps.general_constraint_indicator_flags[1], ps.general_constraint_indicator_flags[2], ps.general_constraint_indicator_flags[3], ps.general_constraint_indicator_flags[4], ps.general_constraint_indicator_flags[5], ps.general_level_idc, 240 | ps.min_spatial_segmentation_idc >> 8, 255 & ps.min_spatial_segmentation_idc, 252 | ps.parallelismType, 252 | ps.chroma_format_idc, 248 | ps.bit_depth_luma_minus8, 248 | ps.bit_depth_chroma_minus8, 0x00, parseInt(ps.frame_rate.fps), NALuLengthSize - 1 | ps.temporal_id_nested << 2 | ps.num_temporal_layers << 3 | (ps.frame_rate.fixed ? 64 : 0), units.length]);

	    // compute hvcC size in bytes
	    var length = config.length;
	    for (var i = 0; i < units.length; i += 1) {
	      length += 3;
	      for (var j = 0; j < units[i].length; j += 1) {
	        length += 2 + units[i][j].length;
	      }
	    }
	    var hvcC = new Uint8Array(length);
	    hvcC.set(config, 0);
	    length = config.length;
	    // append parameter set units: one vps, one or more sps and pps
	    var iMax = units.length - 1;
	    for (var _i = 0; _i < units.length; _i += 1) {
	      hvcC.set(new Uint8Array([32 + _i | (_i === iMax ? 128 : 0), 0x00, units[_i].length]), length);
	      length += 3;
	      for (var _j = 0; _j < units[_i].length; _j += 1) {
	        hvcC.set(new Uint8Array([units[_i][_j].length >> 8, units[_i][_j].length & 255]), length);
	        length += 2;
	        hvcC.set(units[_i][_j], length);
	        length += units[_i][_j].length;
	      }
	    }
	    var hvcc = MP4.box(MP4.types.hvcC, hvcC);
	    var width = track.width;
	    var height = track.height;
	    var hSpacing = track.pixelRatio[0];
	    var vSpacing = track.pixelRatio[1];
	    return MP4.box(MP4.types.hvc1, new Uint8Array([0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01,
	    // data_reference_index
	    0x00, 0x00,
	    // pre_defined
	    0x00, 0x00,
	    // reserved
	    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // pre_defined
	    width >> 8 & 0xff, width & 0xff,
	    // width
	    height >> 8 & 0xff, height & 0xff,
	    // height
	    0x00, 0x48, 0x00, 0x00,
	    // horizresolution
	    0x00, 0x48, 0x00, 0x00,
	    // vertresolution
	    0x00, 0x00, 0x00, 0x00,
	    // reserved
	    0x00, 0x01,
	    // frame_count
	    0x12, 0x64, 0x61, 0x69, 0x6c,
	    // dailymotion/hls.js
	    0x79, 0x6d, 0x6f, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x68, 0x6c, 0x73, 0x2e, 0x6a, 0x73, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	    // compressorname
	    0x00, 0x18,
	    // depth = 24
	    0x11, 0x11]),
	    // pre_defined = -1
	    hvcc, MP4.box(MP4.types.btrt, new Uint8Array([0x00, 0x1c, 0x9c, 0x80,
	    // bufferSizeDB
	    0x00, 0x2d, 0xc6, 0xc0,
	    // maxBitrate
	    0x00, 0x2d, 0xc6, 0xc0])),
	    // avgBitrate
	    MP4.box(MP4.types.pasp, new Uint8Array([hSpacing >> 24,
	    // hSpacing
	    hSpacing >> 16 & 0xff, hSpacing >> 8 & 0xff, hSpacing & 0xff, vSpacing >> 24,
	    // vSpacing
	    vSpacing >> 16 & 0xff, vSpacing >> 8 & 0xff, vSpacing & 0xff])));
	  };
	  return MP4;
	}();
	MP4.types = void 0;
	MP4.HDLR_TYPES = void 0;
	MP4.STTS = void 0;
	MP4.STSC = void 0;
	MP4.STCO = void 0;
	MP4.STSZ = void 0;
	MP4.VMHD = void 0;
	MP4.SMHD = void 0;
	MP4.STSD = void 0;
	MP4.FTYP = void 0;
	MP4.DINF = void 0;

	var PlaylistLevelType = {
	  MAIN: "main",
	  AUDIO: "audio"};

	var MPEG_TS_CLOCK_FREQ_HZ = 90000;
	function toTimescaleFromBase(baseTime, destScale, srcBase, round) {
	  var result = baseTime * destScale * srcBase; // equivalent to `(value * scale) / (1 / base)`
	  return Math.round(result) ;
	}
	function toMsFromMpegTsClock(baseTime, round) {
	  return toTimescaleFromBase(baseTime, 1000, 1 / MPEG_TS_CLOCK_FREQ_HZ);
	}

	var MAX_SILENT_FRAME_DURATION = 10 * 1000; // 10 seconds
	var AAC_SAMPLES_PER_FRAME = 1024;
	var MPEG_AUDIO_SAMPLE_PER_FRAME = 1152;
	var AC3_SAMPLES_PER_FRAME = 1536;
	var chromeVersion = null;
	var safariWebkitVersion = null;
	function createMp4Sample(isKeyframe, duration, size, cts) {
	  return {
	    duration: duration,
	    size: size,
	    cts: cts,
	    flags: {
	      isLeading: 0,
	      isDependedOn: 0,
	      hasRedundancy: 0,
	      degradPrio: 0,
	      dependsOn: isKeyframe ? 2 : 1,
	      isNonSync: isKeyframe ? 0 : 1
	    }
	  };
	}
	var MP4Remuxer = /*#__PURE__*/function (_Logger) {
	  function MP4Remuxer(observer, config, typeSupported, logger) {
	    var _this;
	    _this = _Logger.call(this, 'mp4-remuxer', logger) || this;
	    _this.observer = void 0;
	    _this.config = void 0;
	    _this.typeSupported = void 0;
	    _this.ISGenerated = false;
	    _this._initPTS = null;
	    _this._initDTS = null;
	    _this.nextVideoTs = null;
	    _this.nextAudioTs = null;
	    _this.videoSampleDuration = null;
	    _this.isAudioContiguous = false;
	    _this.isVideoContiguous = false;
	    _this.videoTrackConfig = void 0;
	    _this.observer = observer;
	    _this.config = config;
	    _this.typeSupported = typeSupported;
	    _this.ISGenerated = false;
	    if (chromeVersion === null) {
	      var userAgent = navigator.userAgent || '';
	      var result = userAgent.match(/Chrome\/(\d+)/i);
	      chromeVersion = result ? parseInt(result[1]) : 0;
	    }
	    if (safariWebkitVersion === null) {
	      var _result = navigator.userAgent.match(/Safari\/(\d+)/i);
	      safariWebkitVersion = _result ? parseInt(_result[1]) : 0;
	    }
	    return _this;
	  }
	  _inheritsLoose(MP4Remuxer, _Logger);
	  var _proto = MP4Remuxer.prototype;
	  _proto.destroy = function destroy() {
	    // @ts-ignore
	    this.config = this.videoTrackConfig = this._initPTS = this._initDTS = null;
	  };
	  _proto.resetTimeStamp = function resetTimeStamp(defaultTimeStamp) {
	    this.log('initPTS & initDTS reset');
	    this._initPTS = this._initDTS = defaultTimeStamp;
	  };
	  _proto.resetNextTimestamp = function resetNextTimestamp() {
	    this.log('reset next timestamp');
	    this.isVideoContiguous = false;
	    this.isAudioContiguous = false;
	  };
	  _proto.resetInitSegment = function resetInitSegment() {
	    this.log('ISGenerated flag reset');
	    this.ISGenerated = false;
	    this.videoTrackConfig = undefined;
	  };
	  _proto.getVideoStartPts = function getVideoStartPts(videoSamples) {
	    // Get the minimum PTS value relative to the first sample's PTS, normalized for 33-bit wrapping
	    var rolloverDetected = false;
	    var firstPts = videoSamples[0].pts;
	    var startPTS = videoSamples.reduce(function (minPTS, sample) {
	      var pts = sample.pts;
	      var delta = pts - minPTS;
	      if (delta < -4294967296) {
	        // 2^32, see PTSNormalize for reasoning, but we're hitting a rollover here, and we don't want that to impact the timeOffset calculation
	        rolloverDetected = true;
	        pts = normalizePts(pts, firstPts);
	        delta = pts - minPTS;
	      }
	      if (delta > 0) {
	        return minPTS;
	      }
	      return pts;
	    }, firstPts);
	    if (rolloverDetected) {
	      this.debug('PTS rollover detected');
	    }
	    return startPTS;
	  };
	  _proto.remux = function remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset, flush, playlistType) {
	    var video;
	    var audio;
	    var initSegment;
	    var text;
	    var id3;
	    var independent;
	    var audioTimeOffset = timeOffset;
	    var videoTimeOffset = timeOffset;

	    // If we're remuxing audio and video progressively, wait until we've received enough samples for each track before proceeding.
	    // This is done to synchronize the audio and video streams. We know if the current segment will have samples if the "pid"
	    // parameter is greater than -1. The pid is set when the PMT is parsed, which contains the tracks list.
	    // However, if the initSegment has already been generated, or we've reached the end of a segment (flush),
	    // then we can remux one track without waiting for the other.
	    var hasAudio = audioTrack.pid > -1;
	    var hasVideo = videoTrack.pid > -1;
	    var length = videoTrack.samples.length;
	    var enoughAudioSamples = audioTrack.samples.length > 0;
	    var enoughVideoSamples = flush && length > 0 || length > 1;
	    var canRemuxAvc = (!hasAudio || enoughAudioSamples) && (!hasVideo || enoughVideoSamples) || this.ISGenerated || flush;
	    if (canRemuxAvc) {
	      if (this.ISGenerated) {
	        var _videoTrack$pixelRati, _config$pixelRatio, _videoTrack$pixelRati2, _config$pixelRatio2;
	        var config = this.videoTrackConfig;
	        if (config && (videoTrack.width !== config.width || videoTrack.height !== config.height || ((_videoTrack$pixelRati = videoTrack.pixelRatio) == null ? void 0 : _videoTrack$pixelRati[0]) !== ((_config$pixelRatio = config.pixelRatio) == null ? void 0 : _config$pixelRatio[0]) || ((_videoTrack$pixelRati2 = videoTrack.pixelRatio) == null ? void 0 : _videoTrack$pixelRati2[1]) !== ((_config$pixelRatio2 = config.pixelRatio) == null ? void 0 : _config$pixelRatio2[1])) || !config && enoughVideoSamples || this.nextAudioTs === null && enoughAudioSamples) {
	          this.resetInitSegment();
	        }
	      }
	      if (!this.ISGenerated) {
	        initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
	      }
	      var isVideoContiguous = this.isVideoContiguous;
	      var firstKeyFrameIndex = -1;
	      var firstKeyFramePTS;
	      if (enoughVideoSamples) {
	        firstKeyFrameIndex = findKeyframeIndex(videoTrack.samples);
	        if (!isVideoContiguous && this.config.forceKeyFrameOnDiscontinuity) {
	          independent = true;
	          if (firstKeyFrameIndex > 0) {
	            this.warn("Dropped " + firstKeyFrameIndex + " out of " + length + " video samples due to a missing keyframe");
	            var startPTS = this.getVideoStartPts(videoTrack.samples);
	            videoTrack.samples = videoTrack.samples.slice(firstKeyFrameIndex);
	            videoTrack.dropped += firstKeyFrameIndex;
	            videoTimeOffset += (videoTrack.samples[0].pts - startPTS) / videoTrack.inputTimeScale;
	            firstKeyFramePTS = videoTimeOffset;
	          } else if (firstKeyFrameIndex === -1) {
	            this.warn("No keyframe found out of " + length + " video samples");
	            independent = false;
	          }
	        }
	      }
	      if (this.ISGenerated) {
	        if (enoughAudioSamples && enoughVideoSamples) {
	          // timeOffset is expected to be the offset of the first timestamp of this fragment (first DTS)
	          // if first audio DTS is not aligned with first video DTS then we need to take that into account
	          // when providing timeOffset to remuxAudio / remuxVideo. if we don't do that, there might be a permanent / small
	          // drift between audio and video streams
	          var _startPTS = this.getVideoStartPts(videoTrack.samples);
	          var tsDelta = normalizePts(audioTrack.samples[0].pts, _startPTS) - _startPTS;
	          var audiovideoTimestampDelta = tsDelta / videoTrack.inputTimeScale;
	          audioTimeOffset += Math.max(0, audiovideoTimestampDelta);
	          videoTimeOffset += Math.max(0, -audiovideoTimestampDelta);
	        }

	        // Purposefully remuxing audio before video, so that remuxVideo can use nextAudioPts, which is calculated in remuxAudio.
	        if (enoughAudioSamples) {
	          // if initSegment was generated without audio samples, regenerate it again
	          if (!audioTrack.samplerate) {
	            this.warn('regenerate InitSegment as audio detected');
	            initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
	          }
	          audio = this.remuxAudio(audioTrack, audioTimeOffset, this.isAudioContiguous, accurateTimeOffset, hasVideo || enoughVideoSamples || playlistType === PlaylistLevelType.AUDIO ? videoTimeOffset : undefined);
	          if (enoughVideoSamples) {
	            var audioTrackLength = audio ? audio.endPTS - audio.startPTS : 0;
	            // if initSegment was generated without video samples, regenerate it again
	            if (!videoTrack.inputTimeScale) {
	              this.warn('regenerate InitSegment as video detected');
	              initSegment = this.generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset);
	            }
	            video = this.remuxVideo(videoTrack, videoTimeOffset, isVideoContiguous, audioTrackLength);
	          }
	        } else if (enoughVideoSamples) {
	          video = this.remuxVideo(videoTrack, videoTimeOffset, isVideoContiguous, 0);
	        }
	        if (video) {
	          video.firstKeyFrame = firstKeyFrameIndex;
	          video.independent = firstKeyFrameIndex !== -1;
	          video.firstKeyFramePTS = firstKeyFramePTS;
	        }
	      }
	    }

	    // Allow ID3 and text to remux, even if more audio/video samples are required
	    if (this.ISGenerated && this._initPTS && this._initDTS) {
	      if (id3Track.samples.length) {
	        id3 = flushTextTrackMetadataCueSamples(id3Track, timeOffset, this._initPTS, this._initDTS);
	      }
	      if (textTrack.samples.length) {
	        text = flushTextTrackUserdataCueSamples(textTrack, timeOffset, this._initPTS);
	      }
	    }
	    return {
	      audio: audio,
	      video: video,
	      initSegment: initSegment,
	      independent: independent,
	      text: text,
	      id3: id3
	    };
	  };
	  _proto.generateIS = function generateIS(audioTrack, videoTrack, timeOffset, accurateTimeOffset) {
	    var audioSamples = audioTrack.samples;
	    var videoSamples = videoTrack.samples;
	    var typeSupported = this.typeSupported;
	    var tracks = {};
	    var _initPTS = this._initPTS;
	    var computePTSDTS = !_initPTS || accurateTimeOffset;
	    var container = 'audio/mp4';
	    var initPTS;
	    var initDTS;
	    var timescale;
	    var trackId = -1;
	    if (computePTSDTS) {
	      initPTS = initDTS = Infinity;
	    }
	    if (audioTrack.config && audioSamples.length) {
	      // let's use audio sampling rate as MP4 time scale.
	      // rationale is that there is a integer nb of audio frames per audio sample (1024 for AAC)
	      // using audio sampling rate here helps having an integer MP4 frame duration
	      // this avoids potential rounding issue and AV sync issue
	      audioTrack.timescale = audioTrack.samplerate;
	      switch (audioTrack.segmentCodec) {
	        case 'mp3':
	          if (typeSupported.mpeg) {
	            // Chrome and Safari
	            container = 'audio/mpeg';
	            audioTrack.codec = '';
	          } else if (typeSupported.mp3) {
	            // Firefox
	            audioTrack.codec = 'mp3';
	          }
	          break;
	        case 'ac3':
	          audioTrack.codec = 'ac-3';
	          break;
	      }
	      tracks.audio = {
	        id: 'audio',
	        container: container,
	        codec: audioTrack.codec,
	        initSegment: audioTrack.segmentCodec === 'mp3' && typeSupported.mpeg ? new Uint8Array(0) : MP4.initSegment([audioTrack]),
	        metadata: {
	          channelCount: audioTrack.channelCount
	        }
	      };
	      if (computePTSDTS) {
	        trackId = audioTrack.id;
	        timescale = audioTrack.inputTimeScale;
	        if (!_initPTS || timescale !== _initPTS.timescale) {
	          // remember first PTS of this demuxing context. for audio, PTS = DTS
	          initPTS = initDTS = audioSamples[0].pts - Math.round(timescale * timeOffset);
	        } else {
	          computePTSDTS = false;
	        }
	      }
	    }
	    if (videoTrack.sps && videoTrack.pps && videoSamples.length) {
	      // let's use input time scale as MP4 video timescale
	      // we use input time scale straight away to avoid rounding issues on frame duration / cts computation
	      videoTrack.timescale = videoTrack.inputTimeScale;
	      tracks.video = {
	        id: 'main',
	        container: 'video/mp4',
	        codec: videoTrack.codec,
	        initSegment: MP4.initSegment([videoTrack]),
	        metadata: {
	          width: videoTrack.width,
	          height: videoTrack.height
	        }
	      };
	      if (computePTSDTS) {
	        trackId = videoTrack.id;
	        timescale = videoTrack.inputTimeScale;
	        if (!_initPTS || timescale !== _initPTS.timescale) {
	          var startPTS = this.getVideoStartPts(videoSamples);
	          var startOffset = Math.round(timescale * timeOffset);
	          initDTS = Math.min(initDTS, normalizePts(videoSamples[0].dts, startPTS) - startOffset);
	          initPTS = Math.min(initPTS, startPTS - startOffset);
	        } else {
	          computePTSDTS = false;
	        }
	      }
	      this.videoTrackConfig = {
	        width: videoTrack.width,
	        height: videoTrack.height,
	        pixelRatio: videoTrack.pixelRatio
	      };
	    }
	    if (Object.keys(tracks).length) {
	      this.ISGenerated = true;
	      if (computePTSDTS) {
	        if (_initPTS) {
	          this.warn("Timestamps at playlist time: " + (accurateTimeOffset ? '' : '~') + timeOffset + " " + initPTS / timescale + " != initPTS: " + _initPTS.baseTime / _initPTS.timescale + " (" + _initPTS.baseTime + "/" + _initPTS.timescale + ") trackId: " + _initPTS.trackId);
	        }
	        this.log("Found initPTS at playlist time: " + timeOffset + " offset: " + initPTS / timescale + " (" + initPTS + "/" + timescale + ") trackId: " + trackId);
	        this._initPTS = {
	          baseTime: initPTS,
	          timescale: timescale,
	          trackId: trackId
	        };
	        this._initDTS = {
	          baseTime: initDTS,
	          timescale: timescale,
	          trackId: trackId
	        };
	      } else {
	        initPTS = timescale = undefined;
	      }
	      return {
	        tracks: tracks,
	        initPTS: initPTS,
	        timescale: timescale,
	        trackId: trackId
	      };
	    }
	  };
	  _proto.remuxVideo = function remuxVideo(track, timeOffset, contiguous, audioTrackLength) {
	    var timeScale = track.inputTimeScale;
	    var inputSamples = track.samples;
	    var outputSamples = [];
	    var nbSamples = inputSamples.length;
	    var initPTS = this._initPTS;
	    var initTime = initPTS.baseTime * timeScale / initPTS.timescale;
	    var nextVideoTs = this.nextVideoTs;
	    var offset = 8;
	    var mp4SampleDuration = this.videoSampleDuration;
	    var firstDTS;
	    var lastDTS;
	    var minPTS = Number.POSITIVE_INFINITY;
	    var maxPTS = Number.NEGATIVE_INFINITY;
	    var sortSamples = false;

	    // if parsed fragment is contiguous with last one, let's use last DTS value as reference
	    if (!contiguous || nextVideoTs === null) {
	      var pts = initTime + timeOffset * timeScale;
	      var cts = inputSamples[0].pts - normalizePts(inputSamples[0].dts, inputSamples[0].pts);
	      if (chromeVersion && nextVideoTs !== null && Math.abs(pts - cts - (nextVideoTs + initTime)) < 15000) {
	        // treat as contigous to adjust samples that would otherwise produce video buffer gaps in Chrome
	        contiguous = true;
	      } else {
	        // if not contiguous, let's use target timeOffset
	        nextVideoTs = pts - cts - initTime;
	      }
	    }

	    // PTS is coded on 33bits, and can loop from -2^32 to 2^32
	    // PTSNormalize will make PTS/DTS value monotonic, we use last known DTS value as reference value
	    var nextVideoPts = nextVideoTs + initTime;
	    for (var i = 0; i < nbSamples; i++) {
	      var sample = inputSamples[i];
	      sample.pts = normalizePts(sample.pts, nextVideoPts);
	      sample.dts = normalizePts(sample.dts, nextVideoPts);
	      if (sample.dts < inputSamples[i > 0 ? i - 1 : i].dts) {
	        sortSamples = true;
	      }
	    }

	    // sort video samples by DTS then PTS then demux id order
	    if (sortSamples) {
	      inputSamples.sort(function (a, b) {
	        var deltadts = a.dts - b.dts;
	        var deltapts = a.pts - b.pts;
	        return deltadts || deltapts;
	      });
	    }

	    // Get first/last DTS
	    firstDTS = inputSamples[0].dts;
	    lastDTS = inputSamples[inputSamples.length - 1].dts;

	    // Sample duration (as expected by trun MP4 boxes), should be the delta between sample DTS
	    // set this constant duration as being the avg delta between consecutive DTS.
	    var inputDuration = lastDTS - firstDTS;
	    var averageSampleDuration = inputDuration ? Math.round(inputDuration / (nbSamples - 1)) : mp4SampleDuration || track.inputTimeScale / 30;

	    // if fragment are contiguous, detect hole/overlapping between fragments
	    if (contiguous) {
	      // check timestamp continuity across consecutive fragments (this is to remove inter-fragment gap/hole)
	      var delta = firstDTS - nextVideoPts;
	      var foundHole = delta > averageSampleDuration;
	      var foundOverlap = delta < -1;
	      if (foundHole || foundOverlap) {
	        if (foundHole) {
	          this.warn((track.segmentCodec || '').toUpperCase() + ": " + toMsFromMpegTsClock(delta) + " ms (" + delta + "dts) hole between fragments detected at " + timeOffset.toFixed(3));
	        } else {
	          this.warn((track.segmentCodec || '').toUpperCase() + ": " + toMsFromMpegTsClock(-delta) + " ms (" + delta + "dts) overlapping between fragments detected at " + timeOffset.toFixed(3));
	        }
	        if (!foundOverlap || nextVideoPts >= inputSamples[0].pts || chromeVersion) {
	          firstDTS = nextVideoPts;
	          var firstPTS = inputSamples[0].pts - delta;
	          if (foundHole) {
	            inputSamples[0].dts = firstDTS;
	            inputSamples[0].pts = firstPTS;
	          } else {
	            var isPTSOrderRetained = true;
	            for (var _i = 0; _i < inputSamples.length; _i++) {
	              if (inputSamples[_i].dts > firstPTS && isPTSOrderRetained) {
	                break;
	              }
	              var prevPTS = inputSamples[_i].pts;
	              inputSamples[_i].dts -= delta;
	              inputSamples[_i].pts -= delta;

	              // check to see if this sample's PTS order has changed
	              // relative to the next one
	              if (_i < inputSamples.length - 1) {
	                var nextSamplePTS = inputSamples[_i + 1].pts;
	                var currentSamplePTS = inputSamples[_i].pts;
	                var currentOrder = nextSamplePTS <= currentSamplePTS;
	                var prevOrder = nextSamplePTS <= prevPTS;
	                isPTSOrderRetained = currentOrder == prevOrder;
	              }
	            }
	          }
	          this.log("Video: Initial PTS/DTS adjusted: " + toMsFromMpegTsClock(firstPTS) + "/" + toMsFromMpegTsClock(firstDTS) + ", delta: " + toMsFromMpegTsClock(delta) + " ms");
	        }
	      }
	    }
	    firstDTS = Math.max(0, firstDTS);
	    var nbNalu = 0;
	    var naluLen = 0;
	    var dtsStep = firstDTS;
	    for (var _i2 = 0; _i2 < nbSamples; _i2++) {
	      // compute total/avc sample length and nb of NAL units
	      var _sample = inputSamples[_i2];
	      var units = _sample.units;
	      var nbUnits = units.length;
	      var sampleLen = 0;
	      for (var j = 0; j < nbUnits; j++) {
	        sampleLen += units[j].data.length;
	      }
	      naluLen += sampleLen;
	      nbNalu += nbUnits;
	      _sample.length = sampleLen;

	      // ensure sample monotonic DTS
	      if (_sample.dts < dtsStep) {
	        _sample.dts = dtsStep;
	        dtsStep += averageSampleDuration / 4 | 0 || 1;
	      } else {
	        dtsStep = _sample.dts;
	      }
	      minPTS = Math.min(_sample.pts, minPTS);
	      maxPTS = Math.max(_sample.pts, maxPTS);
	    }
	    lastDTS = inputSamples[nbSamples - 1].dts;

	    /* concatenate the video data and construct the mdat in place
	      (need 8 more bytes to fill length and mpdat type) */
	    var mdatSize = naluLen + 4 * nbNalu + 8;
	    var mdat;
	    try {
	      mdat = new Uint8Array(mdatSize);
	    } catch (err) {
	      this.observer.emit(Events.ERROR, Events.ERROR, {
	        type: ErrorTypes.MUX_ERROR,
	        details: ErrorDetails.REMUX_ALLOC_ERROR,
	        fatal: false,
	        error: err,
	        bytes: mdatSize,
	        reason: "fail allocating video mdat " + mdatSize
	      });
	      return;
	    }
	    var view = new DataView(mdat.buffer);
	    view.setUint32(0, mdatSize);
	    mdat.set(MP4.types.mdat, 4);
	    var stretchedLastFrame = false;
	    var minDtsDelta = Number.POSITIVE_INFINITY;
	    var minPtsDelta = Number.POSITIVE_INFINITY;
	    var maxDtsDelta = Number.NEGATIVE_INFINITY;
	    var maxPtsDelta = Number.NEGATIVE_INFINITY;
	    for (var _i3 = 0; _i3 < nbSamples; _i3++) {
	      var VideoSample = inputSamples[_i3];
	      var VideoSampleUnits = VideoSample.units;
	      var mp4SampleLength = 0;
	      // convert NALU bitstream to MP4 format (prepend NALU with size field)
	      for (var _j = 0, _nbUnits = VideoSampleUnits.length; _j < _nbUnits; _j++) {
	        var unit = VideoSampleUnits[_j];
	        var unitData = unit.data;
	        var unitDataLen = unit.data.byteLength;
	        view.setUint32(offset, unitDataLen);
	        offset += 4;
	        mdat.set(unitData, offset);
	        offset += unitDataLen;
	        mp4SampleLength += 4 + unitDataLen;
	      }

	      // expected sample duration is the Decoding Timestamp diff of consecutive samples
	      var ptsDelta = void 0;
	      if (_i3 < nbSamples - 1) {
	        mp4SampleDuration = inputSamples[_i3 + 1].dts - VideoSample.dts;
	        ptsDelta = inputSamples[_i3 + 1].pts - VideoSample.pts;
	      } else {
	        var config = this.config;
	        var lastFrameDuration = _i3 > 0 ? VideoSample.dts - inputSamples[_i3 - 1].dts : averageSampleDuration;
	        ptsDelta = _i3 > 0 ? VideoSample.pts - inputSamples[_i3 - 1].pts : averageSampleDuration;
	        if (config.stretchShortVideoTrack && this.nextAudioTs !== null) {
	          // In some cases, a segment's audio track duration may exceed the video track duration.
	          // Since we've already remuxed audio, and we know how long the audio track is, we look to
	          // see if the delta to the next segment is longer than maxBufferHole.
	          // If so, playback would potentially get stuck, so we artificially inflate
	          // the duration of the last frame to minimize any potential gap between segments.
	          var gapTolerance = Math.floor(config.maxBufferHole * timeScale);
	          var deltaToFrameEnd = (audioTrackLength ? minPTS + audioTrackLength * timeScale : this.nextAudioTs + initTime) - VideoSample.pts;
	          if (deltaToFrameEnd > gapTolerance) {
	            // We subtract lastFrameDuration from deltaToFrameEnd to try to prevent any video
	            // frame overlap. maxBufferHole should be >> lastFrameDuration anyway.
	            mp4SampleDuration = deltaToFrameEnd - lastFrameDuration;
	            if (mp4SampleDuration < 0) {
	              mp4SampleDuration = lastFrameDuration;
	            } else {
	              stretchedLastFrame = true;
	            }
	            this.log("It is approximately " + deltaToFrameEnd / 90 + " ms to the next segment; using duration " + mp4SampleDuration / 90 + " ms for the last video frame.");
	          } else {
	            mp4SampleDuration = lastFrameDuration;
	          }
	        } else {
	          mp4SampleDuration = lastFrameDuration;
	        }
	      }
	      var compositionTimeOffset = Math.round(VideoSample.pts - VideoSample.dts);
	      minDtsDelta = Math.min(minDtsDelta, mp4SampleDuration);
	      maxDtsDelta = Math.max(maxDtsDelta, mp4SampleDuration);
	      minPtsDelta = Math.min(minPtsDelta, ptsDelta);
	      maxPtsDelta = Math.max(maxPtsDelta, ptsDelta);
	      outputSamples.push(createMp4Sample(VideoSample.key, mp4SampleDuration, mp4SampleLength, compositionTimeOffset));
	    }
	    if (outputSamples.length) {
	      if (chromeVersion) {
	        if (chromeVersion < 70) {
	          // Chrome workaround, mark first sample as being a Random Access Point (keyframe) to avoid sourcebuffer append issue
	          // https://code.google.com/p/chromium/issues/detail?id=229412
	          var flags = outputSamples[0].flags;
	          flags.dependsOn = 2;
	          flags.isNonSync = 0;
	        }
	      } else if (safariWebkitVersion) {
	        // Fix for "CNN special report, with CC" in test-streams (Safari browser only)
	        // Ignore DTS when frame durations are irregular. Safari MSE does not handle this leading to gaps.
	        if (maxPtsDelta - minPtsDelta < maxDtsDelta - minDtsDelta && averageSampleDuration / maxDtsDelta < 0.025 && outputSamples[0].cts === 0) {
	          this.warn('Found irregular gaps in sample duration. Using PTS instead of DTS to determine MP4 sample duration.');
	          var dts = firstDTS;
	          for (var _i4 = 0, len = outputSamples.length; _i4 < len; _i4++) {
	            var nextDts = dts + outputSamples[_i4].duration;
	            var _pts = dts + outputSamples[_i4].cts;
	            if (_i4 < len - 1) {
	              var nextPts = nextDts + outputSamples[_i4 + 1].cts;
	              outputSamples[_i4].duration = nextPts - _pts;
	            } else {
	              outputSamples[_i4].duration = _i4 ? outputSamples[_i4 - 1].duration : averageSampleDuration;
	            }
	            outputSamples[_i4].cts = 0;
	            dts = nextDts;
	          }
	        }
	      }
	    }
	    // next AVC/HEVC sample DTS should be equal to last sample DTS + last sample duration (in PES timescale)
	    mp4SampleDuration = stretchedLastFrame || !mp4SampleDuration ? averageSampleDuration : mp4SampleDuration;
	    var endDTS = lastDTS + mp4SampleDuration;
	    this.nextVideoTs = nextVideoTs = endDTS - initTime;
	    this.videoSampleDuration = mp4SampleDuration;
	    this.isVideoContiguous = true;
	    var moof = MP4.moof(track.sequenceNumber++, firstDTS, _extends(track, {
	      samples: outputSamples
	    }));
	    var type = 'video';
	    var data = {
	      data1: moof,
	      data2: mdat,
	      startPTS: (minPTS - initTime) / timeScale,
	      endPTS: (maxPTS + mp4SampleDuration - initTime) / timeScale,
	      startDTS: (firstDTS - initTime) / timeScale,
	      endDTS: nextVideoTs / timeScale,
	      type: type,
	      hasAudio: false,
	      hasVideo: true,
	      nb: outputSamples.length,
	      outputSamples: outputSamples,
	      dropped: track.dropped
	    };
	    track.samples = [];
	    track.dropped = 0;
	    return data;
	  };
	  _proto.getSamplesPerFrame = function getSamplesPerFrame(track) {
	    switch (track.segmentCodec) {
	      case 'mp3':
	        return MPEG_AUDIO_SAMPLE_PER_FRAME;
	      case 'ac3':
	        return AC3_SAMPLES_PER_FRAME;
	      default:
	        return AAC_SAMPLES_PER_FRAME;
	    }
	  };
	  _proto.remuxAudio = function remuxAudio(track, timeOffset, contiguous, accurateTimeOffset, videoTimeOffset) {
	    var inputTimeScale = track.inputTimeScale;
	    var mp4timeScale = track.samplerate ? track.samplerate : inputTimeScale;
	    var scaleFactor = inputTimeScale / mp4timeScale;
	    var mp4SampleDuration = this.getSamplesPerFrame(track);
	    var inputSampleDuration = mp4SampleDuration * scaleFactor;
	    var initPTS = this._initPTS;
	    var rawMPEG = track.segmentCodec === 'mp3' && this.typeSupported.mpeg;
	    var outputSamples = [];
	    var alignedWithVideo = videoTimeOffset !== undefined;
	    var inputSamples = track.samples;
	    var offset = rawMPEG ? 0 : 8;
	    var nextAudioTs = this.nextAudioTs || -1;

	    // window.audioSamples ? window.audioSamples.push(inputSamples.map(s => s.pts)) : (window.audioSamples = [inputSamples.map(s => s.pts)]);

	    // for audio samples, also consider consecutive fragments as being contiguous (even if a level switch occurs),
	    // for sake of clarity:
	    // consecutive fragments are frags with
	    //  - less than 100ms gaps between new time offset (if accurate) and next expected PTS OR
	    //  - less than 20 audio frames distance
	    // contiguous fragments are consecutive fragments from same quality level (same level, new SN = old SN + 1)
	    // this helps ensuring audio continuity
	    // and this also avoids audio glitches/cut when switching quality, or reporting wrong duration on first audio frame
	    var initTime = initPTS.baseTime * inputTimeScale / initPTS.timescale;
	    var timeOffsetMpegTS = initTime + timeOffset * inputTimeScale;
	    this.isAudioContiguous = contiguous = contiguous || inputSamples.length && nextAudioTs > 0 && (accurateTimeOffset && Math.abs(timeOffsetMpegTS - (nextAudioTs + initTime)) < 9000 || Math.abs(normalizePts(inputSamples[0].pts, timeOffsetMpegTS) - (nextAudioTs + initTime)) < 20 * inputSampleDuration);

	    // compute normalized PTS
	    inputSamples.forEach(function (sample) {
	      sample.pts = normalizePts(sample.pts, timeOffsetMpegTS);
	    });
	    if (!contiguous || nextAudioTs < 0) {
	      // filter out sample with negative PTS that are not playable anyway
	      // if we don't remove these negative samples, they will shift all audio samples forward.
	      // leading to audio overlap between current / next fragment
	      inputSamples = inputSamples.filter(function (sample) {
	        return sample.pts >= 0;
	      });

	      // in case all samples have negative PTS, and have been filtered out, return now
	      if (!inputSamples.length) {
	        return;
	      }
	      if (videoTimeOffset === 0) {
	        // Set the start to match video so that start gaps larger than inputSampleDuration are filled with silence
	        nextAudioTs = 0;
	      } else if (accurateTimeOffset && !alignedWithVideo) {
	        // When not seeking, not live, and LevelDetails.PTSKnown, use fragment start as predicted next audio PTS
	        nextAudioTs = Math.max(0, timeOffsetMpegTS - initTime);
	      } else {
	        // if frags are not contiguous and if we cant trust time offset, let's use first sample PTS as next audio PTS
	        nextAudioTs = inputSamples[0].pts - initTime;
	      }
	    }

	    // If the audio track is missing samples, the frames seem to get "left-shifted" within the
	    // resulting mp4 segment, causing sync issues and leaving gaps at the end of the audio segment.
	    // In an effort to prevent this from happening, we inject frames here where there are gaps.
	    // When possible, we inject a silent frame; when that's not possible, we duplicate the last
	    // frame.

	    if (track.segmentCodec === 'aac') {
	      var maxAudioFramesDrift = this.config.maxAudioFramesDrift;
	      for (var i = 0, nextPts = nextAudioTs + initTime; i < inputSamples.length; i++) {
	        // First, let's see how far off this frame is from where we expect it to be
	        var sample = inputSamples[i];
	        var pts = sample.pts;
	        var delta = pts - nextPts;
	        var duration = Math.abs(1000 * delta / inputTimeScale);

	        // When remuxing with video, if we're overlapping by more than a duration, drop this sample to stay in sync
	        if (delta <= -maxAudioFramesDrift * inputSampleDuration && alignedWithVideo) {
	          if (i === 0) {
	            this.warn("Audio frame @ " + (pts / inputTimeScale).toFixed(3) + "s overlaps marker by " + Math.round(1000 * delta / inputTimeScale) + " ms.");
	            this.nextAudioTs = nextAudioTs = pts - initTime;
	            nextPts = pts;
	          }
	        } // eslint-disable-line brace-style

	        // Insert missing frames if:
	        // 1: We're more than maxAudioFramesDrift frame away
	        // 2: Not more than MAX_SILENT_FRAME_DURATION away
	        // 3: currentTime (aka nextPtsNorm) is not 0
	        // 4: remuxing with video (videoTimeOffset !== undefined)
	        else if (delta >= maxAudioFramesDrift * inputSampleDuration && duration < MAX_SILENT_FRAME_DURATION && alignedWithVideo) {
	          var missing = Math.round(delta / inputSampleDuration);
	          // Adjust nextPts so that silent samples are aligned with media pts. This will prevent media samples from
	          // later being shifted if nextPts is based on timeOffset and delta is not a multiple of inputSampleDuration.
	          nextPts = pts - missing * inputSampleDuration;
	          while (nextPts < 0 && missing && inputSampleDuration) {
	            missing--;
	            nextPts += inputSampleDuration;
	          }
	          if (i === 0) {
	            this.nextAudioTs = nextAudioTs = nextPts - initTime;
	          }
	          this.warn("Injecting " + missing + " audio frames @ " + ((nextPts - initTime) / inputTimeScale).toFixed(3) + "s due to " + Math.round(1000 * delta / inputTimeScale) + " ms gap.");
	          for (var j = 0; j < missing; j++) {
	            var fillFrame = AAC.getSilentFrame(track.parsedCodec || track.manifestCodec || track.codec, track.channelCount);
	            if (!fillFrame) {
	              this.log('Unable to get silent frame for given audio codec; duplicating last frame instead.');
	              fillFrame = sample.unit.subarray();
	            }
	            inputSamples.splice(i, 0, {
	              unit: fillFrame,
	              pts: nextPts
	            });
	            nextPts += inputSampleDuration;
	            i++;
	          }
	        }
	        sample.pts = nextPts;
	        nextPts += inputSampleDuration;
	      }
	    }
	    var firstPTS = null;
	    var lastPTS = null;
	    var mdat;
	    var mdatSize = 0;
	    var sampleLength = inputSamples.length;
	    while (sampleLength--) {
	      mdatSize += inputSamples[sampleLength].unit.byteLength;
	    }
	    for (var _j2 = 0, _nbSamples = inputSamples.length; _j2 < _nbSamples; _j2++) {
	      var audioSample = inputSamples[_j2];
	      var unit = audioSample.unit;
	      var _pts2 = audioSample.pts;
	      if (lastPTS !== null) {
	        // If we have more than one sample, set the duration of the sample to the "real" duration; the PTS diff with
	        // the previous sample
	        var prevSample = outputSamples[_j2 - 1];
	        prevSample.duration = Math.round((_pts2 - lastPTS) / scaleFactor);
	      } else {
	        if (contiguous && track.segmentCodec === 'aac') {
	          // set PTS/DTS to expected PTS/DTS
	          _pts2 = nextAudioTs + initTime;
	        }
	        // remember first PTS of our audioSamples
	        firstPTS = _pts2;
	        if (mdatSize > 0) {
	          /* concatenate the audio data and construct the mdat in place
	            (need 8 more bytes to fill length and mdat type) */
	          mdatSize += offset;
	          try {
	            mdat = new Uint8Array(mdatSize);
	          } catch (err) {
	            this.observer.emit(Events.ERROR, Events.ERROR, {
	              type: ErrorTypes.MUX_ERROR,
	              details: ErrorDetails.REMUX_ALLOC_ERROR,
	              fatal: false,
	              error: err,
	              bytes: mdatSize,
	              reason: "fail allocating audio mdat " + mdatSize
	            });
	            return;
	          }
	          if (!rawMPEG) {
	            var view = new DataView(mdat.buffer);
	            view.setUint32(0, mdatSize);
	            mdat.set(MP4.types.mdat, 4);
	          }
	        } else {
	          // no audio samples
	          return;
	        }
	      }
	      mdat.set(unit, offset);
	      var unitLen = unit.byteLength;
	      offset += unitLen;
	      // Default the sample's duration to the computed mp4SampleDuration, which will either be 1024 for AAC or 1152 for MPEG
	      // In the case that we have 1 sample, this will be the duration. If we have more than one sample, the duration
	      // becomes the PTS diff with the previous sample
	      outputSamples.push(createMp4Sample(true, mp4SampleDuration, unitLen, 0));
	      lastPTS = _pts2;
	    }

	    // We could end up with no audio samples if all input samples were overlapping with the previously remuxed ones
	    var nbSamples = outputSamples.length;
	    if (!nbSamples) {
	      return;
	    }

	    // The next audio sample PTS should be equal to last sample PTS + duration
	    var lastSample = outputSamples[outputSamples.length - 1];
	    nextAudioTs = lastPTS - initTime;
	    this.nextAudioTs = nextAudioTs + scaleFactor * lastSample.duration;

	    // Set the track samples from inputSamples to outputSamples before remuxing
	    var moof = rawMPEG ? new Uint8Array(0) : MP4.moof(track.sequenceNumber++, firstPTS / scaleFactor, _extends({}, track, {
	      samples: outputSamples
	    }));

	    // Clear the track samples. This also clears the samples array in the demuxer, since the reference is shared
	    track.samples = [];
	    var start = (firstPTS - initTime) / inputTimeScale;
	    var end = nextAudioTs / inputTimeScale;
	    var type = 'audio';
	    var audioData = {
	      data1: moof,
	      data2: mdat,
	      startPTS: start,
	      endPTS: end,
	      startDTS: start,
	      endDTS: end,
	      type: type,
	      hasAudio: true,
	      hasVideo: false,
	      nb: nbSamples,
	      outputSamples: outputSamples
	    };
	    this.isAudioContiguous = true;
	    return audioData;
	  };
	  return MP4Remuxer;
	}(Logger);
	function normalizePts(value, reference) {
	  var offset;
	  if (reference === null) {
	    return value;
	  }
	  if (reference < value) {
	    // - 2^33
	    offset = -8589934592;
	  } else {
	    // + 2^33
	    offset = 8589934592;
	  }
	  /* PTS is 33bit (from 0 to 2^33 -1)
	    if diff between value and reference is bigger than half of the amplitude (2^32) then it means that
	    PTS looping occured. fill the gap */
	  while (Math.abs(value - reference) > 4294967296) {
	    value += offset;
	  }
	  return value;
	}
	function findKeyframeIndex(samples) {
	  for (var i = 0; i < samples.length; i++) {
	    if (samples[i].key) {
	      return i;
	    }
	  }
	  return -1;
	}
	function flushTextTrackMetadataCueSamples(track, timeOffset, initPTS, initDTS) {
	  var length = track.samples.length;
	  if (!length) {
	    return;
	  }
	  var inputTimeScale = track.inputTimeScale;
	  for (var index = 0; index < length; index++) {
	    var sample = track.samples[index];
	    // setting id3 pts, dts to relative time
	    // using this._initPTS and this._initDTS to calculate relative time
	    sample.pts = normalizePts(sample.pts - initPTS.baseTime * inputTimeScale / initPTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
	    sample.dts = normalizePts(sample.dts - initDTS.baseTime * inputTimeScale / initDTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
	  }
	  var samples = track.samples;
	  track.samples = [];
	  return {
	    samples: samples
	  };
	}
	function flushTextTrackUserdataCueSamples(track, timeOffset, initPTS) {
	  var length = track.samples.length;
	  if (!length) {
	    return;
	  }
	  var inputTimeScale = track.inputTimeScale;
	  for (var index = 0; index < length; index++) {
	    var sample = track.samples[index];
	    // setting text pts, dts to relative time
	    // using this._initPTS and this._initDTS to calculate relative time
	    sample.pts = normalizePts(sample.pts - initPTS.baseTime * inputTimeScale / initPTS.timescale, timeOffset * inputTimeScale) / inputTimeScale;
	  }
	  track.samples.sort(function (a, b) {
	    return a.pts - b.pts;
	  });
	  var samples = track.samples;
	  track.samples = [];
	  return {
	    samples: samples
	  };
	}

	function getMediaSource(preferManagedMediaSource) {
	  if (preferManagedMediaSource === void 0) {
	    preferManagedMediaSource = true;
	  }
	  if (typeof self === 'undefined') return undefined;
	  var mms = (preferManagedMediaSource || !self.MediaSource) && self.ManagedMediaSource;
	  return mms || self.MediaSource || self.WebKitMediaSource;
	}

	function isCodecMediaSourceSupported(codec, type, preferManagedMediaSource) {
	  var _MediaSource$isTypeSu;
	  if (preferManagedMediaSource === void 0) {
	    preferManagedMediaSource = true;
	  }
	  var MediaSource = getMediaSource(preferManagedMediaSource);
	  return (_MediaSource$isTypeSu = MediaSource == null ? void 0 : MediaSource.isTypeSupported(mimeTypeForCodec(codec, type))) != null ? _MediaSource$isTypeSu : false;
	}
	function mimeTypeForCodec(codec, type) {
	  return type + "/mp4;codecs=" + codec;
	}
	var CODEC_COMPATIBLE_NAMES = {};
	function getCodecCompatibleNameLower(lowerCaseCodec, preferManagedMediaSource) {
	  if (preferManagedMediaSource === void 0) {
	    preferManagedMediaSource = true;
	  }
	  if (CODEC_COMPATIBLE_NAMES[lowerCaseCodec]) {
	    return CODEC_COMPATIBLE_NAMES[lowerCaseCodec];
	  }
	  var codecsToCheck = {
	    // Idealy fLaC and Opus would be first (spec-compliant) but
	    // some browsers will report that fLaC is supported then fail.
	    // see: https://bugs.chromium.org/p/chromium/issues/detail?id=1422728
	    flac: ['flac', 'fLaC', 'FLAC'],
	    opus: ['opus', 'Opus'],
	    // Replace audio codec info if browser does not support mp4a.40.34,
	    // and demuxer can fallback to 'audio/mpeg' or 'audio/mp4;codecs="mp3"'
	    'mp4a.40.34': ['mp3']
	  }[lowerCaseCodec];
	  for (var i = 0; i < codecsToCheck.length; i++) {
	    var _getMediaSource;
	    if (isCodecMediaSourceSupported(codecsToCheck[i], 'audio', preferManagedMediaSource)) {
	      CODEC_COMPATIBLE_NAMES[lowerCaseCodec] = codecsToCheck[i];
	      return codecsToCheck[i];
	    } else if (codecsToCheck[i] === 'mp3' && (_getMediaSource = getMediaSource(preferManagedMediaSource)) != null && _getMediaSource.isTypeSupported('audio/mpeg')) {
	      return '';
	    }
	  }
	  return lowerCaseCodec;
	}
	var AUDIO_CODEC_REGEXP = /flac|opus|mp4a\.40\.34/i;
	function getCodecCompatibleName(codec, preferManagedMediaSource) {
	  if (preferManagedMediaSource === void 0) {
	    preferManagedMediaSource = true;
	  }
	  return codec.replace(AUDIO_CODEC_REGEXP, function (m) {
	    return getCodecCompatibleNameLower(m.toLowerCase(), preferManagedMediaSource);
	  });
	}

	var PassThroughRemuxer = /*#__PURE__*/function (_Logger) {
	  function PassThroughRemuxer(observer, config, typeSupported, logger) {
	    var _this;
	    _this = _Logger.call(this, 'passthrough-remuxer', logger) || this;
	    _this.emitInitSegment = false;
	    _this.audioCodec = void 0;
	    _this.videoCodec = void 0;
	    _this.initData = void 0;
	    _this.initPTS = null;
	    _this.initTracks = void 0;
	    _this.lastEndTime = null;
	    _this.isVideoContiguous = false;
	    return _this;
	  }
	  _inheritsLoose(PassThroughRemuxer, _Logger);
	  var _proto = PassThroughRemuxer.prototype;
	  _proto.destroy = function destroy() {};
	  _proto.resetTimeStamp = function resetTimeStamp(defaultInitPTS) {
	    this.lastEndTime = null;
	    var initPTS = this.initPTS;
	    if (initPTS && defaultInitPTS) {
	      if (initPTS.baseTime === defaultInitPTS.baseTime && initPTS.timescale === defaultInitPTS.timescale) {
	        return;
	      }
	    }
	    this.initPTS = defaultInitPTS;
	  };
	  _proto.resetNextTimestamp = function resetNextTimestamp() {
	    this.isVideoContiguous = false;
	    this.lastEndTime = null;
	  };
	  _proto.resetInitSegment = function resetInitSegment(initSegment, audioCodec, videoCodec, decryptdata) {
	    this.audioCodec = audioCodec;
	    this.videoCodec = videoCodec;
	    this.generateInitSegment(initSegment, decryptdata);
	    this.emitInitSegment = true;
	  };
	  _proto.generateInitSegment = function generateInitSegment(initSegment, decryptdata) {
	    var audioCodec = this.audioCodec,
	      videoCodec = this.videoCodec;
	    if (!(initSegment != null && initSegment.byteLength)) {
	      this.initTracks = undefined;
	      this.initData = undefined;
	      return;
	    }
	    var _this$initData = this.initData = parseInitSegment(initSegment),
	      audio = _this$initData.audio,
	      video = _this$initData.video;
	    if (decryptdata) {
	      patchEncyptionData(initSegment, decryptdata);
	    } else {
	      var eitherTrack = audio || video;
	      if (eitherTrack != null && eitherTrack.encrypted) {
	        this.warn("Init segment with encrypted track with has no key (\"" + eitherTrack.codec + "\")!");
	      }
	    }

	    // Get codec from initSegment
	    if (audio) {
	      audioCodec = getParsedTrackCodec(audio, ElementaryStreamTypes.AUDIO, this);
	    }
	    if (video) {
	      videoCodec = getParsedTrackCodec(video, ElementaryStreamTypes.VIDEO, this);
	    }
	    var tracks = {};
	    if (audio && video) {
	      tracks.audiovideo = {
	        container: 'video/mp4',
	        codec: audioCodec + ',' + videoCodec,
	        supplemental: video.supplemental,
	        encrypted: video.encrypted,
	        initSegment: initSegment,
	        id: 'main'
	      };
	    } else if (audio) {
	      tracks.audio = {
	        container: 'audio/mp4',
	        codec: audioCodec,
	        encrypted: audio.encrypted,
	        initSegment: initSegment,
	        id: 'audio'
	      };
	    } else if (video) {
	      tracks.video = {
	        container: 'video/mp4',
	        codec: videoCodec,
	        supplemental: video.supplemental,
	        encrypted: video.encrypted,
	        initSegment: initSegment,
	        id: 'main'
	      };
	    } else {
	      this.warn('initSegment does not contain moov or trak boxes.');
	    }
	    this.initTracks = tracks;
	  };
	  _proto.remux = function remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset) {
	    var _initData, _initData2;
	    var initPTS = this.initPTS,
	      lastEndTime = this.lastEndTime;
	    var result = {
	      audio: undefined,
	      video: undefined,
	      text: textTrack,
	      id3: id3Track,
	      initSegment: undefined
	    };

	    // If we haven't yet set a lastEndDTS, or it was reset, set it to the provided timeOffset. We want to use the
	    // lastEndDTS over timeOffset whenever possible; during progressive playback, the media source will not update
	    // the media duration (which is what timeOffset is provided as) before we need to process the next chunk.
	    if (!isFiniteNumber(lastEndTime)) {
	      lastEndTime = this.lastEndTime = timeOffset || 0;
	    }

	    // The binary segment data is added to the videoTrack in the mp4demuxer. We don't check to see if the data is only
	    // audio or video (or both); adding it to video was an arbitrary choice.
	    var data = videoTrack.samples;
	    if (!data.length) {
	      return result;
	    }
	    var initSegment = {
	      initPTS: undefined,
	      timescale: undefined,
	      trackId: undefined
	    };
	    var initData = this.initData;
	    if (!((_initData = initData) != null && _initData.length)) {
	      this.generateInitSegment(data);
	      initData = this.initData;
	    }
	    if (!((_initData2 = initData) != null && _initData2.length)) {
	      // We can't remux if the initSegment could not be generated
	      this.warn('Failed to generate initSegment.');
	      return result;
	    }
	    if (this.emitInitSegment) {
	      initSegment.tracks = this.initTracks;
	      this.emitInitSegment = false;
	    }
	    var trackSampleData = getSampleData(data, initData, this);
	    var audioSampleTimestamps = initData.audio ? trackSampleData[initData.audio.id] : null;
	    var videoSampleTimestamps = initData.video ? trackSampleData[initData.video.id] : null;
	    var videoStartTime = toStartEndOrDefault(videoSampleTimestamps, Infinity);
	    var audioStartTime = toStartEndOrDefault(audioSampleTimestamps, Infinity);
	    var videoEndTime = toStartEndOrDefault(videoSampleTimestamps, 0, true);
	    var audioEndTime = toStartEndOrDefault(audioSampleTimestamps, 0, true);
	    var decodeTime = timeOffset;
	    var duration = 0;
	    var syncOnAudio = audioSampleTimestamps && (!videoSampleTimestamps || !initPTS && audioStartTime < videoStartTime || initPTS && initPTS.trackId === initData.audio.id);
	    var baseOffsetSamples = syncOnAudio ? audioSampleTimestamps : videoSampleTimestamps;
	    if (baseOffsetSamples) {
	      var timescale = baseOffsetSamples.timescale;
	      var baseTime = baseOffsetSamples.start - timeOffset * timescale;
	      var trackId = syncOnAudio ? initData.audio.id : initData.video.id;
	      decodeTime = baseOffsetSamples.start / timescale;
	      duration = syncOnAudio ? audioEndTime - audioStartTime : videoEndTime - videoStartTime;
	      if ((accurateTimeOffset || !initPTS) && (isInvalidInitPts(initPTS, decodeTime, timeOffset, duration) || timescale !== initPTS.timescale)) {
	        if (initPTS) {
	          this.warn("Timestamps at playlist time: " + (accurateTimeOffset ? '' : '~') + timeOffset + " " + baseTime / timescale + " != initPTS: " + initPTS.baseTime / initPTS.timescale + " (" + initPTS.baseTime + "/" + initPTS.timescale + ") trackId: " + initPTS.trackId);
	        }
	        this.log("Found initPTS at playlist time: " + timeOffset + " offset: " + (decodeTime - timeOffset) + " (" + baseTime + "/" + timescale + ") trackId: " + trackId);
	        initPTS = null;
	        initSegment.initPTS = baseTime;
	        initSegment.timescale = timescale;
	        initSegment.trackId = trackId;
	      }
	    } else {
	      this.warn("No audio or video samples found for initPTS at playlist time: " + timeOffset);
	    }
	    if (!initPTS) {
	      if (!initSegment.timescale || initSegment.trackId === undefined || initSegment.initPTS === undefined) {
	        this.warn('Could not set initPTS');
	        initSegment.initPTS = decodeTime;
	        initSegment.timescale = 1;
	        initSegment.trackId = -1;
	      }
	      this.initPTS = initPTS = {
	        baseTime: initSegment.initPTS,
	        timescale: initSegment.timescale,
	        trackId: initSegment.trackId
	      };
	    } else {
	      initSegment.initPTS = initPTS.baseTime;
	      initSegment.timescale = initPTS.timescale;
	      initSegment.trackId = initPTS.trackId;
	    }
	    var startTime = decodeTime - initPTS.baseTime / initPTS.timescale;
	    var endTime = startTime + duration;
	    if (duration > 0) {
	      this.lastEndTime = endTime;
	    } else {
	      this.warn('Duration parsed from mp4 should be greater than zero');
	      this.resetNextTimestamp();
	    }
	    var hasAudio = !!initData.audio;
	    var hasVideo = !!initData.video;
	    var type = '';
	    if (hasAudio) {
	      type += 'audio';
	    }
	    if (hasVideo) {
	      type += 'video';
	    }
	    var encrypted = (initData.audio ? initData.audio.encrypted : false) || (initData.video ? initData.video.encrypted : false);
	    var track = {
	      data1: data,
	      startPTS: startTime,
	      startDTS: startTime,
	      endPTS: endTime,
	      endDTS: endTime,
	      type: type,
	      hasAudio: hasAudio,
	      hasVideo: hasVideo,
	      nb: 1,
	      dropped: 0,
	      encrypted: encrypted
	    };
	    result.audio = hasAudio && !hasVideo ? track : undefined;
	    result.video = hasVideo ? track : undefined;
	    var videoSampleCount = videoSampleTimestamps == null ? void 0 : videoSampleTimestamps.sampleCount;
	    if (videoSampleCount) {
	      var firstKeyFrame = videoSampleTimestamps.keyFrameIndex;
	      var independent = firstKeyFrame !== -1;
	      track.nb = videoSampleCount;
	      track.dropped = firstKeyFrame === 0 || this.isVideoContiguous ? 0 : independent ? firstKeyFrame : videoSampleCount;
	      track.independent = independent;
	      track.firstKeyFrame = firstKeyFrame;
	      if (independent && videoSampleTimestamps.keyFrameStart) {
	        track.firstKeyFramePTS = (videoSampleTimestamps.keyFrameStart - initPTS.baseTime) / initPTS.timescale;
	      }
	      if (!this.isVideoContiguous) {
	        result.independent = independent;
	      }
	      this.isVideoContiguous || (this.isVideoContiguous = independent);
	      if (track.dropped) {
	        this.warn("fmp4 does not start with IDR: firstIDR " + firstKeyFrame + "/" + videoSampleCount + " dropped: " + track.dropped + " start: " + (track.firstKeyFramePTS || 'NA'));
	      }
	    }
	    result.initSegment = initSegment;
	    result.id3 = flushTextTrackMetadataCueSamples(id3Track, timeOffset, initPTS, initPTS);
	    if (textTrack.samples.length) {
	      result.text = flushTextTrackUserdataCueSamples(textTrack, timeOffset, initPTS);
	    }
	    return result;
	  };
	  return PassThroughRemuxer;
	}(Logger);
	function toStartEndOrDefault(trackTimes, defaultValue, end) {
	  if (end === void 0) {
	    end = false;
	  }
	  return (trackTimes == null ? void 0 : trackTimes.start) !== undefined ? (trackTimes.start + (end ? trackTimes.duration : 0)) / trackTimes.timescale : defaultValue;
	}
	function isInvalidInitPts(initPTS, startDTS, timeOffset, duration) {
	  if (initPTS === null) {
	    return true;
	  }
	  // InitPTS is invalid when distance from program would be more than segment duration or a minimum of one second
	  var minDuration = Math.max(duration, 1);
	  var startTime = startDTS - initPTS.baseTime / initPTS.timescale;
	  return Math.abs(startTime - timeOffset) > minDuration;
	}
	function getParsedTrackCodec(track, type, logger) {
	  var parsedCodec = track.codec;
	  if (parsedCodec && parsedCodec.length > 4) {
	    return parsedCodec;
	  }
	  if (type === ElementaryStreamTypes.AUDIO) {
	    if (parsedCodec === 'ec-3' || parsedCodec === 'ac-3' || parsedCodec === 'alac') {
	      return parsedCodec;
	    }
	    if (parsedCodec === 'fLaC' || parsedCodec === 'Opus') {
	      // Opting not to get `preferManagedMediaSource` from player config for isSupported() check for simplicity
	      var preferManagedMediaSource = false;
	      return getCodecCompatibleName(parsedCodec, preferManagedMediaSource);
	    }
	    logger.warn("Unhandled audio codec \"" + parsedCodec + "\" in mp4 MAP");
	    return parsedCodec || 'mp4a';
	  }
	  // Provide defaults based on codec type
	  // This allows for some playback of some fmp4 playlists without CODECS defined in manifest
	  logger.warn("Unhandled video codec \"" + parsedCodec + "\" in mp4 MAP");
	  return parsedCodec || 'avc1';
	}

	function isFullSegmentEncryption(method) {
	  return method === 'AES-128' || method === 'AES-256' || method === 'AES-256-CTR';
	}
	function getAesModeFromFullSegmentMethod(method) {
	  switch (method) {
	    case 'AES-128':
	    case 'AES-256':
	      return DecrypterAesMode.cbc;
	    case 'AES-256-CTR':
	      return DecrypterAesMode.ctr;
	    default:
	      throw new Error("invalid full segment method " + method);
	  }
	}

	var now;
	// performance.now() not available on WebWorker, at least on Safari Desktop
	try {
	  now = self.performance.now.bind(self.performance);
	} catch (err) {
	  now = Date.now;
	}
	var muxConfig = [{
	  demux: MP4Demuxer,
	  remux: PassThroughRemuxer
	}, {
	  demux: TSDemuxer,
	  remux: MP4Remuxer
	}, {
	  demux: AACDemuxer,
	  remux: MP4Remuxer
	}, {
	  demux: MP3Demuxer,
	  remux: MP4Remuxer
	}];
	{
	  muxConfig.splice(2, 0, {
	    demux: AC3Demuxer,
	    remux: MP4Remuxer
	  });
	}
	var Transmuxer = /*#__PURE__*/function () {
	  function Transmuxer(observer, typeSupported, config, vendor, id, logger) {
	    this.asyncResult = false;
	    this.logger = void 0;
	    this.observer = void 0;
	    this.typeSupported = void 0;
	    this.config = void 0;
	    this.id = void 0;
	    this.demuxer = void 0;
	    this.remuxer = void 0;
	    this.decrypter = void 0;
	    this.probe = void 0;
	    this.decryptionPromise = null;
	    this.transmuxConfig = void 0;
	    this.currentTransmuxState = void 0;
	    this.observer = observer;
	    this.typeSupported = typeSupported;
	    this.config = config;
	    this.id = id;
	    this.logger = logger;
	  }
	  var _proto = Transmuxer.prototype;
	  _proto.configure = function configure(transmuxConfig) {
	    this.transmuxConfig = transmuxConfig;
	    if (this.decrypter) {
	      this.decrypter.reset();
	    }
	  };
	  _proto.push = function push(data, decryptdata, chunkMeta, state) {
	    var _this = this;
	    var stats = chunkMeta.transmuxing;
	    stats.executeStart = now();
	    var uintData = new Uint8Array(data);
	    var currentTransmuxState = this.currentTransmuxState,
	      transmuxConfig = this.transmuxConfig;
	    if (state) {
	      this.currentTransmuxState = state;
	    }
	    var _ref = state || currentTransmuxState,
	      contiguous = _ref.contiguous,
	      discontinuity = _ref.discontinuity,
	      trackSwitch = _ref.trackSwitch,
	      accurateTimeOffset = _ref.accurateTimeOffset,
	      timeOffset = _ref.timeOffset,
	      initSegmentChange = _ref.initSegmentChange;
	    var audioCodec = transmuxConfig.audioCodec,
	      videoCodec = transmuxConfig.videoCodec,
	      defaultInitPts = transmuxConfig.defaultInitPts,
	      duration = transmuxConfig.duration,
	      initSegmentData = transmuxConfig.initSegmentData;
	    var keyData = getEncryptionType(uintData, decryptdata);
	    if (keyData && isFullSegmentEncryption(keyData.method)) {
	      var decrypter = this.getDecrypter();
	      var aesMode = getAesModeFromFullSegmentMethod(keyData.method);

	      // Software decryption is synchronous; webCrypto is not
	      if (decrypter.isSync()) {
	        // Software decryption is progressive. Progressive decryption may not return a result on each call. Any cached
	        // data is handled in the flush() call
	        var decryptedData = decrypter.softwareDecrypt(uintData, keyData.key.buffer, keyData.iv.buffer, aesMode);
	        // For Low-Latency HLS Parts, decrypt in place, since part parsing is expected on push progress
	        var loadingParts = chunkMeta.part > -1;
	        if (loadingParts) {
	          var _data = decrypter.flush();
	          decryptedData = _data ? _data.buffer : _data;
	        }
	        if (!decryptedData) {
	          stats.executeEnd = now();
	          return emptyResult(chunkMeta);
	        }
	        uintData = new Uint8Array(decryptedData);
	      } else {
	        this.asyncResult = true;
	        this.decryptionPromise = decrypter.webCryptoDecrypt(uintData, keyData.key.buffer, keyData.iv.buffer, aesMode).then(function (decryptedData) {
	          // Calling push here is important; if flush() is called while this is still resolving, this ensures that
	          // the decrypted data has been transmuxed
	          var result = _this.push(decryptedData, null, chunkMeta);
	          _this.decryptionPromise = null;
	          return result;
	        });
	        return this.decryptionPromise;
	      }
	    }
	    var resetMuxers = this.needsProbing(discontinuity, trackSwitch);
	    if (resetMuxers) {
	      var error = this.configureTransmuxer(uintData);
	      if (error) {
	        this.logger.warn("[transmuxer] " + error.message);
	        this.observer.emit(Events.ERROR, Events.ERROR, {
	          type: ErrorTypes.MEDIA_ERROR,
	          details: ErrorDetails.FRAG_PARSING_ERROR,
	          fatal: false,
	          error: error,
	          reason: error.message
	        });
	        stats.executeEnd = now();
	        return emptyResult(chunkMeta);
	      }
	    }
	    if (discontinuity || trackSwitch || initSegmentChange || resetMuxers) {
	      this.resetInitSegment(initSegmentData, audioCodec, videoCodec, duration, decryptdata);
	    }
	    if (discontinuity || initSegmentChange || resetMuxers) {
	      this.resetInitialTimestamp(defaultInitPts);
	    }
	    if (!contiguous) {
	      this.resetContiguity();
	    }
	    var result = this.transmux(uintData, keyData, timeOffset, accurateTimeOffset, chunkMeta);
	    this.asyncResult = isPromise(result);
	    var currentState = this.currentTransmuxState;
	    currentState.contiguous = true;
	    currentState.discontinuity = false;
	    currentState.trackSwitch = false;
	    stats.executeEnd = now();
	    return result;
	  }

	  // Due to data caching, flush calls can produce more than one TransmuxerResult (hence the Array type)
	  ;
	  _proto.flush = function flush(chunkMeta) {
	    var _this2 = this;
	    var stats = chunkMeta.transmuxing;
	    stats.executeStart = now();
	    var decrypter = this.decrypter,
	      currentTransmuxState = this.currentTransmuxState,
	      decryptionPromise = this.decryptionPromise;
	    if (decryptionPromise) {
	      this.asyncResult = true;
	      // Upon resolution, the decryption promise calls push() and returns its TransmuxerResult up the stack. Therefore
	      // only flushing is required for async decryption
	      return decryptionPromise.then(function () {
	        return _this2.flush(chunkMeta);
	      });
	    }
	    var transmuxResults = [];
	    var timeOffset = currentTransmuxState.timeOffset;
	    if (decrypter) {
	      // The decrypter may have data cached, which needs to be demuxed. In this case we'll have two TransmuxResults
	      // This happens in the case that we receive only 1 push call for a segment (either for non-progressive downloads,
	      // or for progressive downloads with small segments)
	      var decryptedData = decrypter.flush();
	      if (decryptedData) {
	        // Push always returns a TransmuxerResult if decryptdata is null
	        transmuxResults.push(this.push(decryptedData.buffer, null, chunkMeta));
	      }
	    }
	    var demuxer = this.demuxer,
	      remuxer = this.remuxer;
	    if (!demuxer || !remuxer) {
	      // If probing failed, then Hls.js has been given content its not able to handle
	      stats.executeEnd = now();
	      var emptyResults = [emptyResult(chunkMeta)];
	      if (this.asyncResult) {
	        return Promise.resolve(emptyResults);
	      }
	      return emptyResults;
	    }
	    var demuxResultOrPromise = demuxer.flush(timeOffset);
	    if (isPromise(demuxResultOrPromise)) {
	      this.asyncResult = true;
	      // Decrypt final SAMPLE-AES samples
	      return demuxResultOrPromise.then(function (demuxResult) {
	        _this2.flushRemux(transmuxResults, demuxResult, chunkMeta);
	        return transmuxResults;
	      });
	    }
	    this.flushRemux(transmuxResults, demuxResultOrPromise, chunkMeta);
	    if (this.asyncResult) {
	      return Promise.resolve(transmuxResults);
	    }
	    return transmuxResults;
	  };
	  _proto.flushRemux = function flushRemux(transmuxResults, demuxResult, chunkMeta) {
	    var audioTrack = demuxResult.audioTrack,
	      videoTrack = demuxResult.videoTrack,
	      id3Track = demuxResult.id3Track,
	      textTrack = demuxResult.textTrack;
	    var _this$currentTransmux = this.currentTransmuxState,
	      accurateTimeOffset = _this$currentTransmux.accurateTimeOffset,
	      timeOffset = _this$currentTransmux.timeOffset;
	    this.logger.log("[transmuxer.ts]: Flushed " + this.id + " sn: " + chunkMeta.sn + (chunkMeta.part > -1 ? ' part: ' + chunkMeta.part : '') + " of " + (this.id === PlaylistLevelType.MAIN ? 'level' : 'track') + " " + chunkMeta.level);
	    var remuxResult = this.remuxer.remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset, true, this.id);
	    transmuxResults.push({
	      remuxResult: remuxResult,
	      chunkMeta: chunkMeta
	    });
	    chunkMeta.transmuxing.executeEnd = now();
	  };
	  _proto.resetInitialTimestamp = function resetInitialTimestamp(defaultInitPts) {
	    var demuxer = this.demuxer,
	      remuxer = this.remuxer;
	    if (!demuxer || !remuxer) {
	      return;
	    }
	    demuxer.resetTimeStamp(defaultInitPts);
	    remuxer.resetTimeStamp(defaultInitPts);
	  };
	  _proto.resetContiguity = function resetContiguity() {
	    var demuxer = this.demuxer,
	      remuxer = this.remuxer;
	    if (!demuxer || !remuxer) {
	      return;
	    }
	    demuxer.resetContiguity();
	    remuxer.resetNextTimestamp();
	  };
	  _proto.resetInitSegment = function resetInitSegment(initSegmentData, audioCodec, videoCodec, trackDuration, decryptdata) {
	    var demuxer = this.demuxer,
	      remuxer = this.remuxer;
	    if (!demuxer || !remuxer) {
	      return;
	    }
	    demuxer.resetInitSegment(initSegmentData, audioCodec, videoCodec, trackDuration);
	    remuxer.resetInitSegment(initSegmentData, audioCodec, videoCodec, decryptdata);
	  };
	  _proto.destroy = function destroy() {
	    if (this.demuxer) {
	      this.demuxer.destroy();
	      this.demuxer = undefined;
	    }
	    if (this.remuxer) {
	      this.remuxer.destroy();
	      this.remuxer = undefined;
	    }
	  };
	  _proto.transmux = function transmux(data, keyData, timeOffset, accurateTimeOffset, chunkMeta) {
	    var result;
	    if (keyData && keyData.method === 'SAMPLE-AES') {
	      result = this.transmuxSampleAes(data, keyData, timeOffset, accurateTimeOffset, chunkMeta);
	    } else {
	      result = this.transmuxUnencrypted(data, timeOffset, accurateTimeOffset, chunkMeta);
	    }
	    return result;
	  };
	  _proto.transmuxUnencrypted = function transmuxUnencrypted(data, timeOffset, accurateTimeOffset, chunkMeta) {
	    var _demux = this.demuxer.demux(data, timeOffset, false, !this.config.progressive),
	      audioTrack = _demux.audioTrack,
	      videoTrack = _demux.videoTrack,
	      id3Track = _demux.id3Track,
	      textTrack = _demux.textTrack;
	    var remuxResult = this.remuxer.remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset, accurateTimeOffset, false, this.id);
	    return {
	      remuxResult: remuxResult,
	      chunkMeta: chunkMeta
	    };
	  };
	  _proto.transmuxSampleAes = function transmuxSampleAes(data, decryptData, timeOffset, accurateTimeOffset, chunkMeta) {
	    var _this3 = this;
	    return this.demuxer.demuxSampleAes(data, decryptData, timeOffset).then(function (demuxResult) {
	      var remuxResult = _this3.remuxer.remux(demuxResult.audioTrack, demuxResult.videoTrack, demuxResult.id3Track, demuxResult.textTrack, timeOffset, accurateTimeOffset, false, _this3.id);
	      return {
	        remuxResult: remuxResult,
	        chunkMeta: chunkMeta
	      };
	    });
	  };
	  _proto.configureTransmuxer = function configureTransmuxer(data) {
	    var config = this.config,
	      observer = this.observer,
	      typeSupported = this.typeSupported;
	    // probe for content type
	    var mux;
	    for (var i = 0, len = muxConfig.length; i < len; i++) {
	      var _muxConfig$i$demux;
	      if ((_muxConfig$i$demux = muxConfig[i].demux) != null && _muxConfig$i$demux.probe(data, this.logger)) {
	        mux = muxConfig[i];
	        break;
	      }
	    }
	    if (!mux) {
	      return new Error('Failed to find demuxer by probing fragment data');
	    }
	    // so let's check that current remuxer and demuxer are still valid
	    var demuxer = this.demuxer;
	    var remuxer = this.remuxer;
	    var Remuxer = mux.remux;
	    var Demuxer = mux.demux;
	    if (!remuxer || !(remuxer instanceof Remuxer)) {
	      this.remuxer = new Remuxer(observer, config, typeSupported, this.logger);
	    }
	    if (!demuxer || !(demuxer instanceof Demuxer)) {
	      this.demuxer = new Demuxer(observer, config, typeSupported, this.logger);
	      this.probe = Demuxer.probe;
	    }
	  };
	  _proto.needsProbing = function needsProbing(discontinuity, trackSwitch) {
	    // in case of continuity change, or track switch
	    // we might switch from content type (AAC container to TS container, or TS to fmp4 for example)
	    return !this.demuxer || !this.remuxer || discontinuity || trackSwitch;
	  };
	  _proto.getDecrypter = function getDecrypter() {
	    var decrypter = this.decrypter;
	    if (!decrypter) {
	      decrypter = this.decrypter = new Decrypter(this.config);
	    }
	    return decrypter;
	  };
	  return Transmuxer;
	}();
	function getEncryptionType(data, decryptData) {
	  var encryptionType = null;
	  if (data.byteLength > 0 && (decryptData == null ? void 0 : decryptData.key) != null && decryptData.iv !== null && decryptData.method != null) {
	    encryptionType = decryptData;
	  }
	  return encryptionType;
	}
	var emptyResult = function emptyResult(chunkMeta) {
	  return {
	    remuxResult: {},
	    chunkMeta: chunkMeta
	  };
	};
	function isPromise(p) {
	  return 'then' in p && p.then instanceof Function;
	}

	var transmuxers = [];
	{
	  startWorker();
	}
	function startWorker() {
	  self.addEventListener('message', function (ev) {
	    var data = ev.data;
	    var instanceNo = data.instanceNo;
	    if (instanceNo === undefined) {
	      return;
	    }
	    var transmuxer = transmuxers[instanceNo];
	    if (data.cmd === 'reset') {
	      delete transmuxers[data.resetNo];
	      if (transmuxer) {
	        transmuxer.destroy();
	      }
	      data.cmd = 'init';
	    }
	    if (data.cmd === 'init') {
	      var config = JSON.parse(data.config);
	      var observer = new EventEmitter();
	      observer.on(Events.FRAG_DECRYPTED, forwardMessage);
	      observer.on(Events.ERROR, forwardMessage);
	      var logger = enableLogs(config.debug, data.id);
	      forwardWorkerLogs(logger, instanceNo);
	      transmuxers[instanceNo] = new Transmuxer(observer, data.typeSupported, config, '', data.id, logger);
	      forwardMessage('init', null, instanceNo);
	      return;
	    }
	    if (!transmuxer) {
	      return;
	    }
	    switch (data.cmd) {
	      case 'configure':
	        {
	          transmuxer.configure(data.config);
	          break;
	        }
	      case 'demux':
	        {
	          var transmuxResult = transmuxer.push(data.data, data.decryptdata, data.chunkMeta, data.state);
	          if (isPromise(transmuxResult)) {
	            transmuxResult.then(function (data) {
	              emitTransmuxComplete(self, data, instanceNo);
	            }).catch(function (error) {
	              forwardMessage(Events.ERROR, {
	                instanceNo: instanceNo,
	                type: ErrorTypes.MEDIA_ERROR,
	                details: ErrorDetails.FRAG_PARSING_ERROR,
	                chunkMeta: data.chunkMeta,
	                fatal: false,
	                error: error,
	                err: error,
	                reason: "transmuxer-worker push error"
	              }, instanceNo);
	            });
	          } else {
	            emitTransmuxComplete(self, transmuxResult, instanceNo);
	          }
	          break;
	        }
	      case 'flush':
	        {
	          var chunkMeta = data.chunkMeta;
	          var _transmuxResult = transmuxer.flush(chunkMeta);
	          if (isPromise(_transmuxResult)) {
	            _transmuxResult.then(function (results) {
	              handleFlushResult(self, results, chunkMeta, instanceNo);
	            }).catch(function (error) {
	              forwardMessage(Events.ERROR, {
	                type: ErrorTypes.MEDIA_ERROR,
	                details: ErrorDetails.FRAG_PARSING_ERROR,
	                chunkMeta: data.chunkMeta,
	                fatal: false,
	                error: error,
	                err: error,
	                reason: "transmuxer-worker flush error"
	              }, instanceNo);
	            });
	          } else {
	            handleFlushResult(self, _transmuxResult, chunkMeta, instanceNo);
	          }
	          break;
	        }
	    }
	  });
	}
	function emitTransmuxComplete(self, transmuxResult, instanceNo) {
	  if (isEmptyResult(transmuxResult.remuxResult)) {
	    return false;
	  }
	  var transferable = [];
	  var _transmuxResult$remux = transmuxResult.remuxResult,
	    audio = _transmuxResult$remux.audio,
	    video = _transmuxResult$remux.video;
	  if (audio) {
	    addToTransferable(transferable, audio);
	  }
	  if (video) {
	    addToTransferable(transferable, video);
	  }
	  self.postMessage({
	    event: 'transmuxComplete',
	    data: transmuxResult,
	    instanceNo: instanceNo
	  }, transferable);
	  return true;
	}

	// Converts data to a transferable object https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast)
	// in order to minimize message passing overhead
	function addToTransferable(transferable, track) {
	  if (track.data1) {
	    transferable.push(track.data1.buffer);
	  }
	  if (track.data2) {
	    transferable.push(track.data2.buffer);
	  }
	}
	function handleFlushResult(self, results, chunkMeta, instanceNo) {
	  var parsed = results.reduce(function (parsed, result) {
	    return emitTransmuxComplete(self, result, instanceNo) || parsed;
	  }, false);
	  if (!parsed) {
	    // Emit at least one "transmuxComplete" message even if media is not found to update stream-controller state to PARSING
	    self.postMessage({
	      event: 'transmuxComplete',
	      data: results[0],
	      instanceNo: instanceNo
	    });
	  }
	  self.postMessage({
	    event: 'flush',
	    data: chunkMeta,
	    instanceNo: instanceNo
	  });
	}
	function forwardMessage(event, data, instanceNo) {
	  self.postMessage({
	    event: event,
	    data: data,
	    instanceNo: instanceNo
	  });
	}
	function forwardWorkerLogs(logger, instanceNo) {
	  var _loop = function _loop(logFn) {
	    logger[logFn] = function () {
	      var message = Array.prototype.join.call(arguments, ' ');
	      forwardMessage('workerLog', {
	        logType: logFn,
	        message: message
	      }, instanceNo);
	    };
	  };
	  for (var logFn in logger) {
	    _loop(logFn);
	  }
	}
	function isEmptyResult(remuxResult) {
	  return !remuxResult.audio && !remuxResult.video && !remuxResult.text && !remuxResult.id3 && !remuxResult.initSegment;
	}

})();
//# sourceMappingURL=hls.worker.js.map
