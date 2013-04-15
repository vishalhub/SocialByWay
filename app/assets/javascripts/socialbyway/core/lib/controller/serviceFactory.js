( function() {"use strict";
		/*jslint nomen: true*/
		/*jslint plusplus: true */
		/*global SBW*/
		/**
		 * @class
		 * @name ServiceFactory
		 * @namespace SBW.Controllers.ServiceFactory
		 * @classdesc  A factory class to handle the initialization/destroy/registration of service.
		 * @constructor
		 */
		SBW.Controllers.ServiceFactory = SBW.Object.extend(/** @lends SBW.Controllers.ServiceFactory# */
		{
			/**
			 * @private
			 * @desc List to hold the registered services.
			 */
			_services : {},
			/**
			 * @method
			 * @desc Method to register the service
			 * @param {String} serviceName  Name of the registered service.
			 * @param {Function}  service The Service Controller class function.
			 * @example
			 * Usage:
			 * SBW.Singletons.serviceFactory.registerService('Twitter', SBW.Controllers.Services['Twitter']);
			 * SBW.Singletons.serviceFactory.registerService('controller', SBW.Controllers.Services.ServiceController);
			 */
			registerService : function(serviceName, service) {
				var utils = new SBW.Utils();
				if (utils.isType(service, Function)) {
					this._services[serviceName] = new service();
				}
			},
			/**
			 * @method
			 * @desc Returns the service from the list of registered services if exists.
			 * @param {String} serviceName  Name of the registered service.
			 * @returns {SBW.Controllers.Services.ServiceController} serviceObject Instance of ServiceController.
			 * @example
			 * Usage:
			 * SBW.Singletons.serviceFactory.getService('Twitter');
			 */
			getService : function(serviceName) {
				return this._services[serviceName];
			}
		});
	}());
// End of IIFE