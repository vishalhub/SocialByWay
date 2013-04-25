/**
 * @class  Google Plus
 * @classdesc This is Google Plus service implementation
 * @augments ServiceController
 * @constructor
 */
SBW.Controllers.Services.GooglePlus = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.GooglePlus# */{
  /** @constant */
  name: 'googleplus',
  /** @constant */
  icon: 'googleplus',
  /** @constant */
  title: 'Google Plus',
  /** Method init : Initialize method to setup require items
   */
  init: function () {
    var clientID = SBW.Singletons.config.services.GooglePlus.clientID;
    var callbackURL = SBW.Singletons.utils.callbackURLForService('GooglePlus');
    this.accessObject = {
      clientId: clientID,
      callbackUrl: callbackURL,
      accessTokenUrl: 'https://accounts.google.com/o/oauth2/auth?client_id=' + clientID + '&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/plus.me&response_type=token&redirect_uri=' + callbackURL,
      access_token: null,
      apiKey: SBW.Singletons.config.services.GooglePlus.apiKey,
      baseURL: "https://www.googleapis.com/plus/v1"
    };
  },
  /**
   * Method startActionHandler : Triggers authentication process to the googlePlus service.
   * @param {callback} callback
   */
  startActionHandler: function (callback) {
    var service = this;
    var accessTokenListner = function (windowRef) {
      if (!windowRef.closed) {
        if (service.getCookie('googleplusToken')) {
          windowRef.close();
          service.getAccessToken.call(service, callback);
        } else {
          setTimeout(function () {
            accessTokenListner(windowRef);
          }, 2000);
        }
      }
    };

    if (service.authWindowReference === null || service.authWindowReference.closed) {
      service.authWindowReference = window.open(service.accessObject['accessTokenUrl'], 'googleplus' + new Date().getTime(), service.getPopupWindowParams({height: 500, width: 400}));
      accessTokenListner(service.authWindowReference);
    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * Method checkUserLoggedIn : Checks whether user is logged-in and has an authenticated session to service.
   * @param {callback} callback Callback function that will be called after checking login status
   */
  checkUserLoggedIn: function (callback) {
    var service = this;
    var access_token = service.accessObject['access_token'];
    var url = "https://accounts.google.com/o/oauth2/tokeninfo?v=2.1&access_token=" + access_token;
    $.getJSON(url, 'callback=?', function (response) {
      if (response.error) {
        callback(false);
      } else {
        callback(true);
      }
    });
  },
  /**
   * Method getAccessToken : Retrieves access tokens from cookie and sets it to accessObject
   * @param {callback} callback callback function to be called after fetching access token
   */
  getAccessToken: function (callback) {
    var service = this;
    var _cookie = service.getCookie('googleplusToken');
    if (_cookie != "undefined") {
      service.accessObject['access_token'] = _cookie;
      callback();
    } else {
      //service.failureLoginHandler.call(service, null);
    }
  },
  /**
   * Method _getData : Helps us fetch specific set of data
   * @param {object} context object that has type of request and post/profile id
   * @param {callback} callback
   */
  _getData: function (context, callback) {
    var service = this, url = service.accessObject['baseURL'];
    if (context.method === 'list') {
      if (context.type === 'activities') {
        url += "/people/" + context.id + "/activities/public";
      } else if (context.type === 'comments') {
        url += "/activities/" + context.id + "/comments";
      }
    } else if (context.method === 'get') {
      url += "/" + context.type + "/" + context.id;
    }
    url += "?key=" + service.accessObject['apiKey'];
    if (context.nextPageToken) {
      url += "&pageToken=" + context.nextPageToken;
    }
    $.getJSON(url, 'callback=?',
      function (response) {
        callback(response);
      }
    );
  },
  /**
   * Method _getAllData : Helps us retrieve all the data of a particular context
   * @param {object} context
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  _getAllData: function (context, successCallback, errorCallback) {
    var service = this, posts = [];
    var callback = (function (successCallback, errorCallback) {
      return function (response) {
        if (response && !response.error) {
          if (response.items) {
            for (var i = 0, len = response.items.length; i < len; i++) {
              posts.push(response.items[i]);
            }
          } else {
            posts.push(response);
          }
          if (response.nextPageToken) {
            context.nextPageToken = response.nextPageToken;
            service._getData(context, callback);
          } else {
            posts = posts.length == 1 ? posts[0] : posts;
            if (successCallback) {
              successCallback(posts);
            }
          }
        } else {
          if (errorCallback) {
            errorCallback(response);
          }
        }
      };
    })(successCallback, errorCallback);
    service._getData(context, callback);
  },
  /**
   * Method getPosts : Retrieves activities of the user
   * @param userId
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getPosts: function (userId, successCallback, errorCallback) {
    var service = this;
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          service._getAllData({type: 'activities', method: 'list', id: userId}, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            service._getAllData({type: 'activities', method: 'list', id: userId}, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   *  Method getComments : Retrieves comments of an activity
   * @param {Object} idObject
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getComments: function (idObject, successCallback, errorCallback) {
    var service = this;
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          service._getAllData({type: 'comments', method: 'list', id: idObject.assetId}, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            service._getAllData({type: 'comments', method: 'list', id: idObject.assetId}, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   *  Method getProfile : Retrieves profile of the user
   * @param userId
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getProfile: function (userId, successCallback, errorCallback) {
    var service = this;
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          service._getAllData({type: 'people', method: 'get', id: userId}, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            service._getAllData({type: 'people', method: 'get', id: userId}, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   *  Method getPostByID : Retrieves a particular activity based on id
   * @param activityID
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getPostByID: function (activityID, successCallback, errorCallback) {
    var service = this;
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          service._getAllData({type: 'activities', method: 'get', id: activityID}, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            service._getAllData({type: 'activities', method: 'get', id: activityID}, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   *  Method getCommentByID : Retrieves a particular comment
   * @param commentID
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getCommentByID: function (commentID, successCallback, errorCallback) {
    var service = this;
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          service._getAllData({type: 'comments', method: 'get', id: commentID}, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            service._getAllData({type: 'comments', method: 'get', id: commentID}, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  }
});
