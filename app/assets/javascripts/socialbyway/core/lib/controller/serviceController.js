(function () {
  "use strict";
  /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global SBW*/
  /**
   * @class
   * @name ServiceController
   * @namespace SBW.Controllers.Services.ServiceController
   * @classdesc A controller class to manage the services.
   * @constructor
   */
  SBW.Controllers.Services.ServiceController = SBW.Object.extend(/** @lends SBW.Controllers.Services.ServiceController# */ {
    /**
     * @private
     * @desc Name of the service.
     * @type {String}
     */
    name: null,
    /**
     * @private
     * @desc User logged in the service.
     * @type {Object}
     */
    user: null,
    /**
     * @private
     * @desc Icon for the service.
     * @type {String}
     */
    icon: null,
    /**
     * @private
     * @desc Title of the service.
     * @type {String}
     */
    title: null,
    /**
     * @private
     * @desc Access object of the service.
     * @type {Object}
     */
    accessObject: [],
    /**
     * @private
     * @type {Boolean}
     * @desc Flag to indicate the user login.
     */
    isUserLoggedIn: false,
    /**
     * @private
     * @type {Boolean}
     * @desc Flag to specify the service is either remote or local.
     */
    isRemoteService: true,
    /**
     * @private
     * @type {Object}
     * @desc File status.
     */
    fileStatus: {},
    /**
     * @private
     */
    _forEach: function (array, callback) {
      if (!this.utils) {
        this.utils = new SBW.Utils();
      }
      this.utils.forEach(array, callback);
    },
    /**
     * @method
     * @desc Initializes the service.
     * @see SBW.Controllers.Services.Facebook
     */
    init: function () {
    },
    /**
     * @method
     * @desc Resets the service object to default values.
     */
    reset: function () {
    },
    /**
     * @method
     * @private
     * @desc The internationalized message for title, openAlbumLabel, seeAllAlbumsLabel. Internal method to be executed by service init method.
     */
    setup: function () {
    },
    /**
     * @method
     * @desc Checks whether the user is logged in / has a authenticated session to service.
     * @param {String} service Service to check for user's authenticated session.
     * @param {Function} callback  Callback function to be executed once the user is logged in.
     */
    checkUserLoggedIn: function (service, callback) {
      SBW.Singletons.serviceFactory.getService(service).checkUserLoggedIn(callback);
    },
    /**
     * @method
     * @desc Update the user object in the service
     * @param {Object} userObject  Object of logged in user
     */
    populateUserInformation: function (userObject) {
      this.user = userObject;
    },
    /**
     * @method
     * @desc Triggers the authentication process.
     * @param {Function} callback  Callback function to be executed once the user is authenticated and connected to the client application.
     */
    startActionHandler: function (callback) {
    },
    /**
     * @method
     * @desc Retrieves access tokens from the response.
     * @param {Object} response  Response from the service.
     * @param {Function} callback  Callback function to be executed after retrieving the access token.
     */
    getAccessToken: function (response, callback) {
    },
    /**
     * @method
     * @desc Handler for login failure.
     * @param {Function} callback Callback function to be executed on authentication failure.
     * @param {String} message Error message to be displayed .
     */
    failureLoginHandler: function (callback, message) {
    },
    /**
     * @method
     * @desc Publishing text message onto the specified services. This method accepts success and error callbacks in the arguments. For each
     * callback the (response) object of the service will be passed as an argument, to process the callback.
     * @param {String[]} serviceArr An array of registered services.
     * @param {String} message  Message to be posted on the service
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~publishMessage-successCallback Callback} to be executed on successful message publishing.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~publishMessage-errorCallback Callback} to be executed on message publishing error
     * @example
     * Usage:
     * SBW.api
     *        .publishMessage(['Facebook','Flickr'], "Sample Message", function(response) {
		 *        // Success callback logic...
		 *        }, function(response) {
		 *         // Error callback logic...
		 *        });
     */
    publishMessage: function (serviceArr, message, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).publishMessage(message, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the publishMessage method.
     * @callback SBW.Controllers.Services.ServiceController~publishMessage-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the publishMessage method.
     * @callback SBW.Controllers.Services.ServiceController~publishMessage-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Publishing text message(with picture,link,actions etc) onto the specified services. This method accepts success and error callbacks in the arguments. For each
     * callback the (response) object of the service will be passed as an argument, to process the callback.
     * @param {String[]} serviceArr An array of registered services.
     * @param {String} postObject object containing the metaData to Post a message
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~postShare-successCallback Callback} to be executed on successful message publishing.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~postShare-errorCallback Callback} to be executed on message publishing error
     */
    postShare: function (serviceArr, postObject, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).postShare(postObject, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the postShare method.
     * @callback SBW.Controllers.Services.ServiceController~postShare-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the postShare method.
     * @callback SBW.Controllers.Services.ServiceController~postShare-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Handler for login success.
     * @param {SBW.User} user  The service user object.
     * @param {Function} callback Callback to be executed on successful login.
     */
    successLoginHandler: function (user, callback) {
      this.set('isUserLoggedIn', true);
      this.set('isUserLoggingIn', false);
      // format the user_id
      if (user) {
        user.set('name', unescape(user.get('name')));
      }
      this.set('user', user);
    },
    /**
     * @method
     * @desc Publishing link onto the specified services.
     * @param  {String[]} serviceArr An array of registered services.
     * @param {String} type Specifies the type of the post e.g.link, photo, video etc..
     * @param {String} name Specifies the name for the link.
     * @param {String} caption The caption to appear beneath the link name.
     * @param {String} message A description message about the link.
     * @param {String} link  The URL link to be attached for this post.
     * @param {String} description The detailed description about the link to appear beneath the link caption.
     * @param {String} picture  The URL link of the picture to be included with this post if available.
     * @param {String} icon The URL link of the icon to represent the type of the post.
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~publishLink-successCallback Callback} to be executed on successful link publishing.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~publishLink-errorCallback Callback} to be executed on link publishing error.
     */
    publishLink: function (serviceArr, type, name, caption, message, link, description, picture, icon, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).publishLink(type, name, caption, message, link, description, picture, icon, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the publishLink method.
     * @callback SBW.Controllers.Services.ServiceController~publishLink-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the publishLink method.
     * @callback SBW.Controllers.Services.ServiceController~publishLink-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Publishing event onto the specified services.
     * @param  {String[]} serviceAr An array of registered services.
     * @param {String} name  Specifies the name of the event.
     * @param {String} startTime Specifies the start time of the event. The date string should be in ISO-8601 formatted date/time.
     * @param {String} endTime Specifies the end time of the event. The date string should be in ISO-8601 formatted date/time.
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~publishEvent-successCallback Callback} to be executed on successful event publishing.
     * @param {Function} errorCallback {@link SBW.Controllers.Services.ServiceController~publishEvent-errorCallback Callback} to be executed on event publishing error.
     */
    publishEvent: function (serviceArr, name, startTime, endTime, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).publishEvent(name, startTime, endTime, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the publishEvent method.
     * @callback SBW.Controllers.Services.ServiceController~publishEvent-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the publishEvent method.
     * @callback SBW.Controllers.Services.ServiceController~publishEvent-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Liking an object onto the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} objectId  Id of the object liked i.e. post,comment etc..
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~like-successCallback Callback} to be executed on object liking in a service succeeds.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~like-errorCallback Callback} to be executed on object liking error.
     */
    like: function (serviceName, objectId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).like(objectId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the like method.
     * @callback SBW.Controllers.Services.ServiceController~like-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the like method.
     * @callback SBW.Controllers.Services.ServiceController~like-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Un liking an object onto the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} objectId  Id of the object un liked i.e. post,comment etc..
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~unlike-successCallback Callback} to be executed on object un liking in a service succeeds.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~unlike-errorCallback Callback} to be executed on object un liking error.
     */
    unlike: function (serviceName, objectId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).unlike(objectId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the unlike method.
     * @callback SBW.Controllers.Services.ServiceController~unlike-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the unlike method.
     * @callback SBW.Controllers.Services.ServiceController~unlike-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Posting comment on an object in the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {Object} idObject  Id of the object liked i.e. post,comment etc..
     * @param {String} comment Comment to be posted on to the service.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~postComment-successCallback Callback} to be executed on successful comment posting.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~postComment-errorCallback Callback} to be executed on comment posting error.
     */
		postComment: function(serviceArr, idObject, comment, successCallback, errorCallback) {
			if (!(serviceArr instanceof Array)) {
				serviceArr = [];
			} // create an empty array if not passed
			serviceArr.forEach(function(serviceName, index, serviceArr) {
				SBW.Singletons.serviceFactory.getService(serviceName).postComment(idObject, comment, successCallback, errorCallback);
			});
    },
    /**
     * This callback is displayed as part of the postComment method.
     * @callback SBW.Controllers.Services.ServiceController~postComment-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the postComment method.
     * @callback SBW.Controllers.Services.ServiceController~postComment-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieving posts from the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId Id of the service user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getPosts-successCallback Callback} to be executed on successful posts retrieving.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getPosts-errorCallback Callback} to be executed on retrieving posts error.
     */
    getPosts: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getPosts(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getPosts method.
     * @callback SBW.Controllers.Services.ServiceController~getPosts-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getPosts method.
     * @callback SBW.Controllers.Services.ServiceController~getPosts-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieving likes of an object from the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} objectId  Id of the object liked i.e. post,comment etc..
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~getLikes-successCallback Callback} to be executed on successful likes retrieving.
     * @param {Function} errorCallback {@link SBW.Controllers.Services.ServiceController~getLikes-errorCallback Callback} to be executed on retrieving likes error.
     */
    getLikes: function (serviceName, objectId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getLikes(objectId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getLikes method.
     * @callback SBW.Controllers.Services.ServiceController~getLikes-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getLikes method.
     * @callback SBW.Controllers.Services.ServiceController~getLikes-errorCallback
		 * @param {Object} response JSON response from the service
		 **/
		/**
		 * @method
		 * @desc Deletes comments from the specified service that matches the object id.
		 * @param {String} serviceName  Name of the registered service.
		 * @param {String} objectId  Id of the object.
		 * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~deleteComment-successCallback Callback} to be executed on successful comments retrieving.
		 * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~deleteComment-errorCallback Callback} to be executed on retrieving comments error.
		 */
		deleteComment: function(serviceName, objectId, successCallback, errorCallback) {
			SBW.Singletons.serviceFactory.getService(serviceName).deleteComment(objectId, successCallback, errorCallback);
		},
		/**
		 * This callback is displayed as part of the deleteComment method.
		 * @callback SBW.Controllers.Services.ServiceController~deleteComment-successCallback
		 * @param {Boolean} response JSON response from the service
		 **/
		/**
		 * This callback is displayed as part of the deleteComment method.
		 * @callback SBW.Controllers.Services.ServiceController~deleteComment-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieving the comments from the specified service that matches the object id.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} idObject  Id  object.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getComments-successCallback Callback} to be executed on successful comments retrieving.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getComments-errorCallback Callback} to be executed on retrieving comments error.
     */
    getComments: function (serviceName, idObject, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getComments(idObject, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getComments method.
     * @callback SBW.Controllers.Services.ServiceController~getComments-successCallback
     * @param {SBW.Models.Comment} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getComments method.
     * @callback SBW.Controllers.Services.ServiceController~getComments-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc get albums for the logged in user from the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getAlbums-successCallback Callback} to be executed on successful retrieval of albums.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getAlbums-errorCallback Callback} to be executed on error while retrieving albums.
     */
    getAlbums: function (serviceName, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getAlbums(successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getAlbums method.
     * @callback SBW.Controllers.Services.ServiceController~getAlbums-successCallback
     * @param {Array} response Array of {@link SBW.Models.AssetCollection albums} from the service
     **/
    /**
     * This callback is displayed as part of the getAlbums method.
     * @callback SBW.Controllers.Services.ServiceController~getAlbums-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc get albums for the logged in user from the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getPhotos-successCallback Callback} to be executed on successful retrieval of albums.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getPhotos-errorCallback Callback} to be executed on error while retrieving albums.
     */
    getPhotos: function (serviceName, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getPhotos(successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getAlbums method.
     * @callback SBW.Controllers.Services.ServiceController~getAlbums-successCallback
     * @param {Array} response
     **/
    /**
     * This callback is displayed as part of the getAlbums method.
     * @callback SBW.Controllers.Services.ServiceController~getAlbums-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc Fetch photo details from album for the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String}   albumId Album Id from which to fetch the photo details.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getPhotosFromAlbum-successCallback Callback} to be called with json response after fetching the photo details successfully.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getPhotosFromAlbum-errorCallback Callback} to be called in case of error while fetching photo details.
     */
    getPhotosFromAlbum: function (serviceName, albumId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getPhotosFromAlbum(albumId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getPhotosFromAlbum method.
     * @callback SBW.Controllers.Services.ServiceController~getPhotosFromAlbum-successCallback
     * @param {Array} response Array of {@Link SBW.Models.Asset} from the service
     **/
    /**
     * This callback is displayed as part of the getPhotosFromAlbum method.
     * @callback SBW.Controllers.Services.ServiceController~getPhotosFromAlbum-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves comments for the url with the specified options on the speicifed service.
     * @param  {String[]} serviceArr An array of registered services.
     * @param {Object} options The service options to retrieve the comments.
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~getCommentsForUrl-successCallback Callback} to be executed on successful comments retrieving.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getCommentsForUrl-errorCallback Callback} to be executed on retrieving comments error.
     * @example
     * Usage:
     *  SBW.api
     *        .getCommentsForUrl(['Facebook','Flickr'], { url: 'www.example.com',  limit: 10,  offset: 0},
     *           function(response) {
     *              // Success callback logic...
     *            }, function(response) {
     *              // Error callback logic...
     *            });
     */
    getCommentsForUrl: function (serviceArr, options, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).getCommentsForUrl(options, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the getCommentsForUrl method.
     * @callback SBW.Controllers.Services.ServiceController~getCommentsForUrl-successCallback
     * @param {SBW.Models.Comment} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getCommentsForUrl method.
     * @callback SBW.Controllers.Services.ServiceController~getCommentsForUrl-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc Follow a user(twitter)/company(linkedin).
     * @param {String} serviceName Name of the registered service.
     * @param {String} serviceOption screenName(twitter) / companyId(linkedin) to follow.
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~follow-successCallback Callback} to be executed after following user/company successfully.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~follow-errorCallback Callback} to be executed on error while following.
     */
    follow: function (serviceName, serviceOption, successCallback, errorCallback) {
      var serviceFactory = SBW.Singletons.serviceFactory;
      /*TODO - Check for method implementation in service being called*/
      //if(serviceFactory.getService(value).hasOwnProperty('follow')) {
      serviceFactory.getService(serviceName).follow(serviceOption, successCallback, errorCallback);
      //}
    },
    /**
     * This callback is displayed as part of the follow method.
     * @callback SBW.Controllers.Services.ServiceController~follow-successCallback
     * @param {SBW.Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the follow method.
     * @callback SBW.Controllers.Services.ServiceController~follow-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves follow count for the user from the service
     * @param {String} serviceName Name of the registered service.
     * @param {String} serviceOption screenName(twitter) / companyid(linkedin) to get follow count.
     * @param {Function} successCallback {@link SBW.Controllers.Services.ServiceController~getFollowCount-successCallback Callback} to be executed on successful retrieval of follow count.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getFollowCount-errorCallback Callback} to be executed on error while retrieving follow count.
     */
    getFollowCount: function (serviceName, serviceOption, successCallback, errorCallback) {
      var serviceFactory = SBW.Singletons.serviceFactory;
      /*TODO - Check for method implementation in service being called*/
      //if(serviceFactory.getService(value).hasOwnProperty('getFollowCount')) {
      serviceFactory.getService(serviceName).getFollowCount(serviceOption, successCallback, errorCallback);
      //}
    },
    /**
     * This callback is displayed as part of the getFollowCount method.
     * @callback SBW.Controllers.Services.ServiceController~getFollowCount-successCallback
     * @param {SBW.Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getFollowCount method.
     * @callback SBW.Controllers.Services.ServiceController~getFollowCount-errorCallback
     * @param {SBW.Models.Error} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the events from the specified service that matches the user ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId  Id of the user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getEvents-successCallback Callback} to be executed on successful events retrieval.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getEvents-errorCallback Callback} to be executed on events retrieving error.
     */
    getEvents: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getEvents(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getEvents method.
     * @callback SBW.Controllers.Services.ServiceController~getEvents-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getEvents method.
     * @callback SBW.Controllers.Services.ServiceController~getEvents-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the social groups from the specified service that matches the user ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId  Id of the user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getSocialGroups-successCallback Callback} to be executed on successful social groups retrieval.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getSocialGroups-errorCallback Callback} to be executed on social groups retrieving error.
     */
    getSocialGroups: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getSocialGroups(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getSocialGroups method.
     * @callback SBW.Controllers.Services.ServiceController~getSocialGroups-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getSocialGroups method.
     * @callback SBW.Controllers.Services.ServiceController~getSocialGroups-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the share count from the specified service that matches the url.
     * @param {Array} serviceArr  Array of service names
     * @param {String} url
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getShareCount-successCallback Callback} to be executed on successful social groups retrieval.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getShareCount-errorCallback Callback} to be executed on social groups retrieving error.
     */
    getShareCount: function (serviceArr, url, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).getShareCount(url, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the getShareCount method.
     * @callback SBW.Controllers.Services.ServiceController~getShareCount-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getShareCount method.
     * @callback SBW.Controllers.Services.ServiceController~getShareCount-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the friends list from the specified service that matches the user ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId  Id of the user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getFriends-successCallback Callback} to be executed on successful friends list retrieval.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getFriends-errorCallback Callback} to be executed on friends list retrieving error.
     */
    getFriends: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getFriends(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getFriends method.
     * @callback SBW.Controllers.Services.ServiceController~getFriends-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getFriends method.
     * @callback SBW.Controllers.Services.ServiceController~getFriends-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the profile picture from the specified service that matches the user ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId  Id of the user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getProfilePic-successCallback Callback} to be executed on successful profile picture retrieval.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getProfilePic-errorCallback Callback} to be executed on profile picture retrieving error.
     */
    getProfilePic: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getProfilePic(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getProfilePic method.
     * @callback SBW.Controllers.Services.ServiceController~getProfilePic-successCallback
     * @param {String} response Url for the user's profile pic
     **/
    /**
     * This callback is displayed as part of the getProfilePic method.
     * @callback SBW.Controllers.Services.ServiceController~getProfilePic-errorCallback
     * @param {String} response  error response from the service
     **/
    /**
     * @method
     * @desc Publishes the notes onto the specified services.
     * @param  {String[]} serviceArr An array of registered services.
     * @param {String} subject  Message subject to be published.
     * @param {String} message  Message to be published.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~publishNotes-successCallback Callback} to be executed on successful notes publishing.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~publishNotes-errorCallback Callback} to be executed on publishing notes error.
     */
    publishNotes: function (serviceArr, subject, message, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).publishNotes(subject, message, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the publishNotes method.
     * @callback SBW.Controllers.Services.ServiceController~publishNotes-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the publishNotes method.
     * @callback SBW.Controllers.Services.ServiceController~publishNotes-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the notes from the specified service that matches the user ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {userId} Id of the user in that service.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getNotes-successCallback Callback} to be executed on successful notes retrieving.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getNotes-errorCallback Callback} to be executed on retrieving notes error.
     */
    getNotes: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getNotes(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getNotes method.
     * @callback SBW.Controllers.Services.ServiceController~getNotes-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getNotes method.
     * @callback SBW.Controllers.Services.ServiceController~getNotes-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Returns the popup window parameters with the specified dimensions.
     * @param {Object} layout  Object that specifies the dimensions of popup window.
     * @return {String} params Popup window parameters.
     */
    getPopupWindowParams: function (layout) {
      var height = (layout.height == undefined) ? '250' : layout.height;
      var width = (layout.width == undefined) ? '500' : layout.width;
      var left = ($(window).width() - width) / 2;
      var top = ($(window).height() - height) / 2;
      var params = 'width=' + width;
      params += ', height=' + height;
      params += ', top=' + top + ', left=' + left;
      params += ', location=no';
      params += ', menubar=no';
      params += ', resizable=no';
      params += ', scrollbars=yes';
      params += ', status=no';
      params += ', toolbar=no';
      return params;
    },
    /**
     * @method
     * @desc Retrieves the cookie value that matches the token.
     * @param {String} token Name of the cookie.
     * @return {String} value Value of the cookie.
     */
    getCookie: function (token) {
      //retrieve the cookie from the document
      var cks = document.cookie.split(";");
      var val = null;
      for (var i = 0; i < cks.length; i++) {
        var ck = cks[i].split('=');
        if (ck[1] && $.trim(ck[0]) == token && $.trim(ck[1]).length > 0) {
          val = ck[1];
          break;
        }
      }
      return val;
    },
    /**
     * @method
     * @desc Retrieves the profile of user from the service.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} userId  Id of the service user.
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getProfile-successCallback Callback} to be executed on successful profile retrieving.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getProfile-errorCallback Callback} to be executed on retrieving profile error.
     */
    getProfile: function (serviceName, userId, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getProfile(userId, successCallback, errorCallback);
    },
    /**
     * This callback is displayed as part of the getProfile method.
     * @callback SBW.Controllers.Services.ServiceController~getProfile-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the getProfile method.
     * @callback SBW.Controllers.Services.ServiceController~getProfile-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Creates a new cookie with the name and value.
     * @param {String} name Name of the cookie.
     * @param {String} value Value for the cookie.
     * @param {Number} [days] The number of days for the cookie to be alive.
     */
    createCookie: function (name, value, days) {
      var expires, domain = window.location.hostname.substr(window.location.hostname.indexOf("."));
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
      } else {
        expires = "";
      }
      document.cookie = name + "=" + value + expires + "; path=/" + "; domain=" + domain;
    },
    /**
     * @method
     * @desc Removes the existing cookie that matches by name.
     * @param {String} name Name of the cookie to be removed.
     */
    eraseCookie: function (name) {
      this.createCookie(name, "", -1);
    },
    /**
     * @method
     * @desc Uploads the video onto the specified services.
     * @param {String} serviceName  Name of the registered service.
     * @param {Array} fileData  Array of {@link  SBW.Models.UploadFileMetaData}
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~uploadVideo-successCallback Callback} to be executed on successful video upload.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~uploadVideo-errorCallback Callback} to be executed on video upload error.
     */
    uploadVideo: function (serviceArr, fileData, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).uploadVideo(fileData, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the uploadVideo method.
     * @callback SBW.Controllers.Services.ServiceController~uploadVideo-successCallback
     * @param {SBW.Models.UploadStatus} response Object containting information about the upload status
     **/
    /**
     * This callback is displayed as part of the uploadVideo method.
     * @callback SBW.Controllers.Services.ServiceController~uploadVideo-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Uploads the photo onto the specified services.
     * @param  {String[]} serviceArr An array of registered services.
     * @param {Array} fileData  Array of {@link  SBW.Models.UploadFileMetaData}
     * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~uploadPhoto-successCallback Callback} to be executed on successful photo upload.
     * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~uploadPhoto-errorCallback Callback} to be executed on photo upload error.
     */
    uploadPhoto: function (serviceArr, fileData, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        serviceArr = [];
      } // create an empty array if not passed
      serviceArr.forEach(function (data, index, serviceArr) {
        SBW.Singletons.serviceFactory.getService(data).uploadPhoto(fileData, successCallback, errorCallback);
      });
    },
    /**
     * This callback is displayed as part of the uploadPhoto method.
     * @callback SBW.Controllers.Services.ServiceController~uploadPhoto-successCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * This callback is displayed as part of the uploadPhoto method.
     * @callback SBW.Controllers.Services.ServiceController~uploadPhoto-errorCallback
     * @param {Object} response JSON response from the service
     **/
    /**
     * @method
     * @desc Retrieves the post from the specified service that matches the post ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} postID Id of the post.
     * @param {Function} successCallback  Callback to be executed on successful post retrieving.
     * @param {Function} errorCallback  Callback to be executed on post retrieving error.
     */
    getPostByID: function (serviceName, postID, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getPostByID(postID, successCallback, errorCallback);
    },
    /**
     * @method
     * @desc Retrieves the comment from the specified service that matches the comment ID.
     * @param {String} serviceName  Name of the registered service.
     * @param {String} postID Id of the post.
     * @param {Function} successCallback  Callback to be executed on successful comment retrieving.
     * @param {Function} errorCallback  Callback to be executed on comment retrieving error.
     */
    getCommentByID: function (serviceName, commentByID, successCallback, errorCallback) {
      SBW.Singletons.serviceFactory.getService(serviceName).getCommentByID(commentByID, successCallback, errorCallback);
    },
    /**
     * @method
     * @desc Upload the file onto the specified service.
     * @param {String} serviceName  Name of the registered service.
     * @param {Array} fileData  Array of {@link  SBW.Models.UploadFileMetaData}
     * @param {Object} options The service options to upload the file e.g url, upload type, dataType etc...
     * @param {Function} successCallback  Callback to be executed on successful file uploading.
     * @param {Function} errorCallback  Callback to be executed on file uploading error.
     * @ignore
     */
    fileUpload: function (serviceName, fileData, options, successCallback, errorCallback) {
      var i = 0,
        j = 0,
        processData = options.processData || false,
        queueLength, fileLength = fileData.length,
        returnValue = [],
        service = this;
      service.fileStatus[serviceName] = service.fileStatus[serviceName] || [];
      for (i = 0; i < fileLength; i = i + 1) {
        queueLength = i; //service.fileStatus[serviceName].length
        /*service.fileStatus[serviceName][queueLength] = {
         'file': fileData[i].file.name,
         'status': 'uploading'
         };*/
        var formData = new FormData();
        for (var key in fileData[i]) {
          if (fileData[i].hasOwnProperty(key)) {
            formData.append(key, fileData[i][key]);
          }
        }

        var scallback = (function (len) {
          return function (response) {
            j++;
            // service.fileStatus[serviceName][len].status = "Uploaded";
            returnValue[len] = response;
            if (j === fileLength) {
              service.postUpload(serviceName, returnValue, successCallback, errorCallback);
            }
          }
        })(queueLength);

        var fcallback = (function (len) {
          return function (data) {
            j++;
            // service.fileStatus[serviceName][len].status = "Upload Failed";
            returnValue[len] = data;
            if (j === fileLength) {
              service.postUpload(serviceName, returnValue, successCallback, errorCallback);
            }
          }
        })(queueLength);
        SBW.Singletons.utils.ajax({
          url: options.url,
          type: options.type,
          data: formData,
          dataType: options.dataType,
          processData: processData,
          contentType: false
        }, scallback, fcallback);

      }
    },
    /**
     * @method
     * @desc Fetches assets from the asset collection
     * @param {String} serviceName  Name of the registered service.
     * @param  {String} serviceName A name of registered services.
     * @param  {String} assetCollectionId Id of the assetcollection
     * @param  {String} assetId Id of the asset.
     *
     */
    getAsset: function (serviceName, assetCollectionId, assetId) {
      var assetArray = SBW.Singletons.serviceFactory.getService(serviceName) && SBW.Singletons.serviceFactory.getService(serviceName).content || [],
        assetObj;
      assetArray.forEach(function (value) {
        if (value.metadata.assetCollectionId === assetCollectionId) {
          value.assets.forEach(function (asset) {
            if (asset.metadata.assetId === assetId) {
              assetObj = asset;
            }
          });
        }
      });
      return assetObj;
    },

    /**
     * @method
     * @desc Logs user out of service.
     * @param {String} serviceName  Name of the registered service.
     * @param {Function} successCallback  Callback to be executed on successful logging out.
     * @param {Function} errorCallback  Callback to be executed on logging out error.
     */
    logout: function(serviceName,successCallback,errorCallback){
       SBW.Singletons.serviceFactory.getService(serviceName).logout(successCallback,errorCallback);
    },    
    /**
     * @method
     * @desc Upload the post onto the specified services
     * @param  {String[]} serviceArr An array of registered services.
     * @param  {Object} returnValue Object that holds the service response.
     * @param {Function} successCallback  Callback to be executed on successful post uploading.
     * @param {Function} errorCallback  Callback to be executed on post uploading error.
     * @example
     * Usage:
     *   SBW.api
     *        .postUpload(['Facebook','Twitter'], , function(response) {
		 *          // Success callback logic..
		 *    }, function(response) {
		 *        // Error callback logic...
		 *   );
		 */
    postUpload: function (serviceArr, returnValue, successCallback, errorCallback) {
      if (!(serviceArr instanceof Array)) {
        SBW.Singletons.serviceFactory.getService(serviceArr).postUpload(returnValue, successCallback, errorCallback);
      } else { // create an empty array if not passed
        serviceArr.forEach(function (data, index, serviceArr) {
          SBW.Singletons.serviceFactory.getService(data).postUpload(returnValue, successCallback, errorCallback);
        });
      }
    },    
    /**
     * @method
     * @desc uploads raw image
     * @param {String[]} serviceArr An array of registered services.
     * @param {Array} mediaData array of image meta data objects
     * @param {Function} successCallback  Callback to be executed on successful logging out.
     * @param {Function} errorCallback  Callback to be executed on logging out error.
     */
    uploadRawImage: function(serviceArr, mediaData, successCallback,errorCallback){
       if (!(serviceArr instanceof Array)) {
        SBW.Singletons.serviceFactory.getService(serviceArr).uploadRawImage(mediaData, successCallback, errorCallback);
      } else {
        serviceArr.forEach(function (data, index, serviceArr) {  
            SBW.Singletons.serviceFactory.getService(data).uploadRawImage(mediaData, successCallback,errorCallback);
        });
      }
    }   

  });
}());
// End of IIFE