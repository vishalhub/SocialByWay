( function() {"use strict";
		/*jslint nomen: true*/
		/*jslint plusplus: true */
		/*global SBW*/
		SBW.init = function(url, callback) {

			SBW.Singletons.serviceFactory = new SBW.Controllers.ServiceFactory();
			SBW.logger = new SBW.Logger();
			SBW.Singletons.utils = new SBW.Utils();

			if (SBW.Singletons.utils.isType(url, String) && SBW.Singletons.utils.isType(callback, Function)) {
				SBW.api = new SBW.Controllers.Services.ServiceController();
				SBW.Singletons.utils.ajax({
					url : url,
					dataType : 'json'
				}, function(successResponse) {

					var enabledServices = successResponse.services, key, serviceName;
					SBW.Singletons.config = successResponse;
					SBW.logger.on = successResponse.debug === 'true' ? true : false;

					for (key in enabledServices) {
						if (enabledServices.hasOwnProperty(key)) {
							serviceName = key.toLowerCase();
							SBW.Singletons.serviceFactory.registerService(serviceName, SBW.Controllers.Services[key]);
							SBW.Singletons.serviceFactory.getService(serviceName).init();
						}
					}
					callback();
				}, function(errorResponse) {
					callback(errorResponse);
				});
			}
		};
	}());
// End of IIFE