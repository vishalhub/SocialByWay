( function() {"use strict";
		/*jslint nomen: true*/
		/*jslint plusplus: true */
		/*global SBW,ActiveXObject, $*/
		/**
		 * @class Utils
		 * @classdesc A service utility class.
		 * @constructor
		 */
		SBW.Utils = SBW.Object.extend(/** @lends SBW.Utils# */
		{
			/**
			 * @desc XML Http Request object.
			 * @type {XMLHTTPRequest}
			 */
			xmlHttpObj : null,
			// Ends the "getSelectedCheckBoxValue" function
			/**
			 * @method
			 * @desc Returns an array of selected item values in the checkbox group.
			 * @param {Element} node The parent dom element to access the checkbox group.
			 * @returns {String[]} retArr Array of selected item values.
			 */
			getSelectedCheckboxValue : function(node) {
				/**
				 * return an array of values selected in the check box group. if no boxes
				 * were checked, returned array will be empty (length will be zero)
				 * set up empty array for the return values
				 */
				var retArr = [], i, chkElements = this.getCheckBoxElements(node);
				if (chkElements.length > 0) {// if there was something selected
					for ( i = 0; i < chkElements.length; i = i + 1) {
						if (chkElements[i].checked) {
							retArr[i] = chkElements[i].value;
						}
					}
				}
				return retArr;
			},
			/**
			 * @method
			 * @desc Returns an array of checkbox type dom elements from the specified node.
			 * @param {Element} node The parent dom element to filter the checkbox elements.
			 * @returns {Element[]} retArr Array of Checkbox dom elements.
			 */
			getCheckBoxElements : function(node) {
				var arr = [], i, inputArr;
				if (node) {
					inputArr = node.getElementsByTagName('input');
					for ( i = 0; i < inputArr.length; i = i + 1) {
						if (inputArr[i].type === "checkbox") {
							arr[arr.length] = inputArr[i];
						}
					}
				}
				return arr;
			},
			/**
			 * @method
			 * @desc Creates the cross browser compatible xml http request object.
			 * @returns {Object} xmlHttpObj Returns the cross browser comaptible XMLHttpRequest object
			 */
			createXmlHttpObj : function() {
				var factoryItem, xmlHttpFactories = [
				function() {
					return new XMLHttpRequest();
				},
				function() {
					return new ActiveXObject("Msxml2.XMLHTTP");
				},
				function() {
					return new ActiveXObject("Msxml3.XMLHTTP");
				},
				function() {
					return new ActiveXObject("Microsoft.XMLHTTP");
				}], itemSize = xmlHttpFactories.length;

				for ( factoryItem = 0; factoryItem < itemSize; factoryItem++) {
					try {
						this.xmlHttpObj = xmlHttpFactories[factoryItem]();
					} catch (error) {
						this.xmlHttpObj = null;
					}
				}
				return this.xmlHttpObj;
			},
			/**
			 * @method
			 * @desc Creates a cross browser AJAX request.
			 * @param {Object} options AJAX Request options.
			 * @param {Function} successCallBack Callback to be executed on success. The ajax response will be passed as argument to the callback.
			 * @param {Function} failureCallBack Callback to be executed on failure. The ajax response will be passed as argument to the callback.
			 */
			ajax : function(options, successCallback, failureCallback) {
				$.ajax({
					url : options.url,
					data : options.data,
          cache : options.cache,
					contentType : options.contentType,
					processData : (options.processData === undefined ? true : false),
					crossDomain : options.crossDomain || true,
					type : options.type || 'GET',
					dataType : options.dataType,
					beforeSend : function(jqXHR, settings) {
						if (options.customHeaders) {
							$.each(options.customHeaders, function(key, value) {
								jqXHR.setRequestHeader(key, value);
							});
						}
					},
					success : function(data) {
						successCallback(data);
					},
					error : function(data) {
						failureCallback(data);
					}
				});
			},
			/**
			 * @method
			 * @desc Returns the Query String as a JSON object .
			 * @param {String} jsonString The query string to convert to JSON.
			 * @returns {Object} vars JSON object.
			 */
			getJSONFromQueryParams : function(jsonString) {
				var vars = [], hash, hashes = jsonString.contents || jsonString, i;
				hashes = hashes.split('&');
				for ( i = 0; i < hashes.length; i = i + 1) {
					hash = hashes[i].split('=');
					vars.push(hash[0]);
					vars[$.trim(hash[0])] = $.trim(hash[1]);
				}
				return vars;
			},
			/**
			 * @method
			 * @desc Returns the callback URL for the specified service .
			 * @param {String} service  Name of the registered service.
			 * @returns {String} url Callback URL of the service.
			 */
			callbackURLForService : function(service) {
				var _wwwLocation = this._wwwLocation();
				return _wwwLocation.protocol + "//" + _wwwLocation.host + SBW.Singletons.config.callbackDirectory + "/callback" + service + ".html";
			},
			/**
			 * @private
			 * @desc Returns the parsed location object.
			 * @returns {Object} object Parsed location object.
			 */
			_wwwLocation : function() {
				var host = "www" + location.host.substr(location.host.indexOf("."));
				return {
					protocol : location.protocol,
					host : host
				};
			},
			/**
			 * @method
			 * @desc Checks the given object with the required type
			 * @param {Object} object Object to check the type
			 * @param {Object} requiredType Name of the built-in object
			 * @returns {Boolean} boolean Returns the type check status
			 */
			isType : function(object, requiredType) {
				var type = object ? object.constructor : undefined;
				//Object.prototype.toString.call(object).match(/^\[object ([a-zA-Z]*)\]$/)[1];
				return type === requiredType;
			},
			/**
			 * @method
			 * @desc Iterates each array element with the specified callback
			 * @param {Object[]} array The array of any type to iterate
			 * @param {Function} callback The callback to execute on each array item. The (arrayElement, iterationIndex, actualArray) will be passed as arguments to the callback.
			 */
			forEach : function(array, callback) {
				var len = array.length, itemIdx;
				if (this.isType(array, Array) && this.isType(callback, Function)) {
					for ( itemIdx = 0; itemIdx < len; itemIdx++) {
						if ( itemIdx in array) {
							callback.call(array, array[itemIdx], itemIdx, array);
						}
					}
				}
			}
		});
	}());
// End of IIFE