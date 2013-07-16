/**
 * @class  Twitter
 * @classdesc This is Twitter service implementation
 * @augments ServiceController
 * @constructor
 **/
SBW.Controllers.Services.Twitter = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.Twitter# */ {
  /**
   * @constant
   * @type {string}
   * @desc The service name
   **/
  name: 'twitter',
  /**
   * @constant
   * @type {string}
   * @desc The service icon
   **/
  icon: 'twitter',
  /**
   * @constant
   * @type {string}
   * @desc The service title
   **/
  title: 'Twitter',
  /**
   * @method
   * @desc initialize method to setup required urls and objects.
   */
  init: function () {
    this.callbackUrl = SBW.Singletons.utils.callbackURLForService('twitter');
    this.proxyUrl = SBW.Singletons.config.proxyURL;
    this.apiVersionUrl = "https://api.twitter.com/1.1";
    this.postUrl = this.apiVersionUrl + "/statuses/update.json";
    this.shareUrl = this.apiVersionUrl + "/statuses/retweet/";
    this.homeTimelineUrl = this.apiVersionUrl + "/statuses/home_timeline.json";
    this.mentionsTimelineUrl = this.apiVersionUrl + "/statuses/mentions_timeline.json";
    this.apiSearchUrl = this.apiVersionUrl + "/search/tweets.json";
    this.userTimelineUrl = this.apiVersionUrl + "/statuses/user_timeline.json";
    this.accountSettingsUrl = this.apiVersionUrl + "/account/settings.json";
    this.profileUrl = this.apiVersionUrl + "/users/show.json";
    this.countUrl = "http://cdn.api.twitter.com/1/urls/count.json";
    this.followUrl = this.apiVersionUrl + "/friendships/create.json";
    this.unfollowUrl = this.apiVersionUrl + "/friendships/destroy.json";
    this.followStatusUrl = this.apiVersionUrl + "/friendships/show.json";
    this.likeUrl = this.apiVersionUrl + "/favorites/create.json";
    this.unlikeUrl = this.apiVersionUrl + "/favorites/destroy.json";
    this.requestTokenUrl = "http://api.twitter.com/oauth/request_token";
    this.authorizeUrl = "http://api.twitter.com/oauth/authorize";
    this.accessTokenUrl = "http://api.twitter.com/oauth/access_token";
    this.getPostUrl = "https://api.twitter.com/1.1/statuses/show/";
    this.accessObject = {
      consumerKey: SBW.Singletons.config.services.Twitter.consumerKey,
      consumerSecret: SBW.Singletons.config.services.Twitter.consumerSecret,
      user_id: null
    };
    this.user = new SBW.Models.User({});
  },
  /**
   * @method
   * @desc Triggers authentication process for the twitter service.
   * @param {callback} callback
   */
  startActionHandler: function (callback) {
    var service = this;
    service.eraseCookie('twitterToken');
    var tokenListener = function (windowReference) {
      if (!windowReference.closed) {
        if (service.getCookie('twitterToken')) {
          windowReference.close();
          service.getAccessToken.call(service, callback);
        } else {
          setTimeout(function () {
            tokenListener(windowReference);
          }, 2000);
        }
      } else {
        service.isUserLoggingIn = false;
      }
    };
    if (service.authWindowReference === null || service.authWindowReference.closed || service.authWindowReference === undefined) {
      service.authWindowReference = window.open('', 'Twitter' + new Date().getTime(), service.getPopupWindowParams({
        height: 500,
        width: 400
      }));
      service.authWindowReference.document.write("redirecting to Twitter");
      /*The reference window is bounded with beforeunload event to see if the popup is closed using the window close button*/
      $(service.authWindowReference).bind("beforeunload", function (e) {
        var _window = this;
        setTimeout(function () {
          if (_window.closed) {
            service.isUserLoggingIn = false;
          }
        }, 500);
      });
      var message = {
        action: this.requestTokenUrl,
        method: "GET",
        parameters: {
          oauth_callback: service.callbackUrl
        }
      };
      service.accessObject.access_token = null;
      service.accessObject.tokenSecret = null;
      var url = service.signAndReturnUrl(this.requestTokenUrl, message);
      this.sendTwitterRequest({
        url: url,
        returnType: 'text'
      }, function (response) {
        var respJson = SBW.Singletons.utils.getJSONFromQueryParams(response);
        service.accessObject.access_token = respJson.oauth_token;
        service.accessObject.tokenSecret = respJson.oauth_token_secret;
        service.authWindowReference.document.location.href = service.authorizeUrl + "?oauth_token=" + service.accessObject.access_token + "&perms=write";
        tokenListener(service.authWindowReference);
      }, function (response) {
        console.log('Error: ', response);
      });
    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * @method
   * @desc Function to check if the user is logged in.
   * @param {callback} callback
   */
  checkUserLoggedIn: function (callback) {
    if (this.accessObject.tokenSecret && this.accessObject.access_token && this.isUserLoggingIn) {
      callback(true);
    } else {
      callback(false);
    }
  },
  /**
   * @method.
   * @desc Method to generate the oauth_signature for a request and append oauth tokens as querystring parameters.
   * @param {String} link The url link to be signed.
   * @param {Object} msg An object that contains information about the request such as request type, url and parameters.
   * @returns {String} signed url containing the oauth signature and tokens as querystring parameters.
   */
  signAndReturnUrl: function (link, msg) {
    var service = this;
    OAuth.completeRequest(msg, service.accessObject);
    OAuth.SignatureMethod.sign(msg, service.accessObject);
    link = link + '?' + OAuth.formEncode(msg.parameters);
    return link;
  },
  /**
   * @method
   * @desc Sends request for fetching the access tokens for a user and sets them in the Twitter service access object,
   * @param {callback} callback - callback function to be called after fetching the access token.
   */
  getAccessToken: function (callback) {
    var service = this,
      twitterVerifier = service.getCookie('twitterToken');
    if (twitterVerifier) {
      var message = {
        action: this.accessTokenUrl,
        method: "GET",
        parameters: {
          oauth_token: service.accessObject.access_token,
          oauth_verifier: twitterVerifier
        }
      },
        url = service.signAndReturnUrl(this.accessTokenUrl, message);
      this.sendTwitterRequest({
        url: url,
        returnType: 'text'
      }, function (response) {
        var jsonResp = SBW.Singletons.utils.getJSONFromQueryParams(response);
        service.accessObject.user_id = jsonResp.user_id;
        service.accessObject.access_token = jsonResp.oauth_token;
        service.accessObject.tokenSecret = jsonResp.oauth_token_secret;
        service.user.id = jsonResp.user_id;
        service.user.screenName = jsonResp.screen_name;
        service.isUserLoggingIn = true;
        if (service.user.id !== undefined) {
          callback();
        }
      }, function (response) {
        console.log('Error: ', response);
      });
    } else {
      console.log("error in getting access token");
    }
  },
  /**
   * @method
   * @desc Function to reset the access object of twitter service on logout.
   * @param {callback} callback
   */
  logoutHandler: function (callback) {
    var service = this;
    service.accessObject.access_token = null;
    service.accessObject.nsid = null;
  },
  /**
   * @method
   * @desc Function to send a request to the proxy.
   * @param {Object} data An object that contains the request url, parameters, type and headers.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  sendTwitterRequest: function (data, successCallback, errorCallback) {
    var service = this, index, headerLength, header, headers = {}, options;
    if (data.header) {
      headerLength = data.header.length;
      for (index = 0; index < headerLength; index++) {
        header = data.header[index].split(':');
        if (header.length === 2) {
          headers[header[0]] = header[1];
        }
      }
    }
    options = {
      url: service.proxyUrl + '?url=' + encodeURIComponent(data.url),
      type: (data.type || 'GET'),
      data: data.parameters || '',
      customHeaders: headers,
      contentType: data.contentType,
      processData: data.processData,
      dataType: data.returnType || 'json'
    };
    SBW.Singletons.utils.ajax(options, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to create the twitter authorization header.
   * @param {Object} message An object that contains the request url, parameters and request type.
   * @return {String} The authorization header as a string.
   */
  getAuthorizationHeader: function (message) {
    var service = this;
    var parameters = message.parameters;
    parameters.push(['oauth_consumer_key', service.accessObject.consumerKey]);
    parameters.push(['oauth_nonce', OAuth.nonce(32)]);
    parameters.push(['oauth_signature_method', "HMAC-SHA1"]);
    parameters.push(['oauth_timestamp', OAuth.timestamp()]);
    parameters.push(['oauth_token', service.accessObject.access_token]);
    parameters.push(['oauth_version', "1.0"]);

    var accessor = {
      consumerSecret: service.accessObject.consumerSecret,
      tokenSecret: service.accessObject.tokenSecret
    };

    OAuth.SignatureMethod.sign(message, accessor);
    var normalizedParameters = OAuth.SignatureMethod.normalizeParameters(message.parameters),
      signatureBaseString = OAuth.SignatureMethod.getBaseString(message),
      signature = OAuth.getParameter(message.parameters, "oauth_signature"),
      authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);

    return 'Authorization: ' + authorizationHeader;
  },
  /**
   * @method
   * @desc Function to create an object containing the request url, type, parameters and headers.
   * @param {String} url The request url.
   * @param {Object} parameters The request parameters.
   * @param {String} type The request type.
   * @return {Object} An object containing the request url, type, parameters and headers..
   */
  getDataForRequest: function (url, parameters, type) {
    var requestParameters = [], key;
    if (parameters) {
      for (key in parameters) {
        if (parameters.hasOwnProperty(key)) {
          requestParameters.push([key, parameters[key]]);
        }
      }
    }
    var message = {
        action: url,
        method: type,
        parameters: requestParameters
      },
      authorizationHeader = this.getAuthorizationHeader(message);
    return {
      url: url + ((type === "GET") ? ('?' + OAuth.formEncode(parameters)) : ''),
      type: type,
      header: [authorizationHeader],
      parameters: ((type === "GET") ? '' : parameters)
    };
  },
  /**
   * @method
   * @desc Function to get the home time line for a user.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @example parameter object
      {
        count:12           optional
        since_id:12345     optional
        max_id:12345       optional
        contributor_details:true optional
      }
      there are many other optional parameters to filter the search results
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getHomeTimeLine: function (parameters, successCallback, errorCallback) {
    var service = this, data,
      getTimeLine = function (parameters, successCallback, errorCallback) {
        data = service.getDataForRequest(service.homeTimelineUrl, parameters, 'GET');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getTimeLine(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getTimeLine(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the mentions time line for a user.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @example parameter object
     {
       count:12           optional
       since_id:12345     optional
       max_id:12345       optional
       contributor_details:true optional
     }
     there are many other optional parameters to filter the search results
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getMentionsTimeLine: function (parameters, successCallback, errorCallback) {
    var service = this, data,
      getTimeLine = function (parameters, successCallback, errorCallback) {
        data = service.getDataForRequest(service.mentionsTimelineUrl, parameters, 'GET');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getTimeLine(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getTimeLine(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to search twitter for a particular search string. No authentication is required for this request.
   * api deprecated by twitter
   * @param {Object} parameters An object that contains the parameters for the request.
   * @example parameter object
     { q:socialbyway+imaginea   required
       result_type:recent       optional
       show_user:true           optional
       until:2013-03-28         optional
     }
     there are many other optional parameters to filter the search results
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  searchTweets: function (parameters, successCallback, errorCallback) {
    var key, queryString = '';
    if (parameters) {
      for (key in parameters) {
        if (parameters.hasOwnProperty(key)) {
          parameters[key] = encodeURIComponent(parameters[key]);
          queryString += key + '=' + parameters[key] + '&';
        }
      }
      queryString = queryString.slice(0, queryString.lastIndexOf('&'));
    }
    var data = {
      url: 'https://search.twitter.com/search.json' + '?' + queryString,
      type: 'GET',
      header: '',
      parameters: ''
    };
    this.sendTwitterRequest(data, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to search twitter for a particular search string. User authentication is required for this request.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  search: function (parameters, successCallback, errorCallback) {
    var service = this, data,
      searchTweets = function (parameters, successCallback, errorCallback) {
        data = service.getDataForRequest(service.apiSearchUrl, parameters, 'GET');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            searchTweets(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              searchTweets(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the users timeline.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @example parameter object
     {
       user_id:12345              optional
       screen_name:'socialbyway'  optional
       count:20                   optional
       since_id:12345             optional
       max_id:12345               optional
       contributor_details:true   optional
     }
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getUserTimeline: function (parameters, successCallback, errorCallback) {
    var service = this, data,
      getTimeLine = function (parameters, successCallback, errorCallback) {
        data = service.getDataForRequest(service.userTimelineUrl, parameters, 'GET');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getTimeLine(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getTimeLine(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the logged in user's account settings.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getAccountSettings: function (successCallback, errorCallback) {
    var service = this, data,
      getSettings = function (successCallback, errorCallback) {
        data = service.getDataForRequest(service.accountSettingsUrl, null, 'GET');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getSettings(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getSettings(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to post a string on twitter.
   * @param {String} message The string that has to be posted on twitter.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  publishMessage: function (message, successCallback, errorCallback) {
    var service = this,
      requestParameters = {
        status: message
      },
      publishMessageCallback = function (requestParameters, successCallback, errorCallback) {
        var data = service.getDataForRequest(service.postUrl, requestParameters, 'POST');
        service.sendTwitterRequest(data, function (jsonResponse) {
          successCallback({
            id: jsonResponse.id,
            serviceName: "twitter"
          }, jsonResponse);
        }, function (response) {
          var errorObject = new SBW.Models.Error();
          errorObject.message = JSON.parse(response.responseText).errors[0].message;
          errorObject.code = JSON.parse(response.responseText).errors[0].code;
          errorObject.serviceName = 'twitter';
          errorObject.rawData = JSON.parse(response.responseText);
          errorCallback(errorObject);
        });
      },
      callback = (function (requestParameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publishMessageCallback(requestParameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publishMessageCallback(requestParameters, successCallback, errorCallback);
            });
          }
        };
      })(requestParameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * implement it when twitter supports get favorites count for a tweet
   * @method
   * @desc Function to get a post corresponding to an id.
   * @param {String} objectId Id of the object.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getLikes: function (objectId, successCallback, errorCallback) {
    var likesObject = {
      serviceName: 'twitter',
      likes: null,
      likeCount: null,
      message: undefined,
      rawData: ''
    };
    successCallback(likesObject);
  },
  /**
   * @method
   * @desc Function to get a post corresponding to an id.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getPost: function (parameters, successCallback, errorCallback) {
    if (parameters.id) {
      var data = this.getDataForRequest(this.getPostUrl + parameters.id + '.json', parameters, 'GET');
      this.sendTwitterRequest(data, successCallback, errorCallback);
    } else {
      errorCallback(null);
    }
    // todo authentication required
  },
  /**
   * @method
   * @desc Function to post a tweet with an image on twitter.
   * @param {Array} parameterArray An array that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  updateWithMedia: function (parameterArray, successCallback, errorCallback) {
    var service = this, requestParameters = [];
    parameterArray.forEach(function (parameters) {
      var formData = new FormData(),
        key,
        file = parameters.file,
        fileData = {};
      formData.append('media[]', file);
      fileData.status = parameters.title + ' - ' + parameters.description;
      for (key in fileData) {
        if (fileData.hasOwnProperty(key)) {
          requestParameters.push([key, fileData[key]]);
          formData.append(key, fileData[key]);
        }
      }
      var message = {
          action: 'https://api.twitter.com/1.1/statuses/update_with_media.json',
          method: "POST",
          parameters: requestParameters
        },
        authorizationHeader = service.getAuthorizationHeader(message),
        queryString = OAuth.formEncode(fileData),
        data = {
          url: 'https://api.twitter.com/1.1/statuses/update_with_media.json?' + queryString,
          header: [authorizationHeader],
          type: 'POST',
          parameters: formData,
          processData: false,
          contentType: false
        },
        success = function (jsonResponse) {
          var uploadStatus = [];
          uploadStatus.push(new SBW.Models.UploadStatus({
            id: jsonResponse.id,
            serviceName: 'twitter',
            status: 'success',
            rawData: jsonResponse
          }));
          successCallback(uploadStatus);
        };
      service.sendTwitterRequest(data, success, errorCallback);
    });
  },
  /**
   * @method
   * @desc Function to post a tweet with an image on twitter.
   * @param {Array} parameterArray An array that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  uploadPhoto: function (parameterArray, successCallback, errorCallback) {
    this.updateWithMedia(parameterArray, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to get the profile picture of the logged in user.
   * @param {String} userId The twitter user id of the user.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getProfilePic: function (userId, successCallback, errorCallback) {
    var service = this,
      parameters = {};
    if (service.user.userImage) {
      successCallback(service.user.userImage);
    } else {
      if (userId) {
        parameters['user_id'] = userId;
      } else {
        if (service.user.id) {
          parameters['user_id'] = service.user.id;
        } else if (service.user.screenName) {
          parameters['screen_name'] = service.user.screenName;
        }
      }
      service.getProfile(parameters, function () {
        successCallback(service.user.userImage);
      }, errorCallback);
    }
  },
  /**
   * @method
   * @desc Function to get the user profile information.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @example parameter object
       {
         user_id:12345              optional
         screen_name:'socialbyway'  optional
         include_entities:false     optional
       }
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getProfile: function (parameters, successCallback, errorCallback) {
    var service = this, data;
    if (service.user.id && service.user.name && service.user.screenName && service.user.userImage) {
      successCallback(service.user);
    } else {
      var getProfileData = function (parameters, successCallback, errorCallback) {
          data = service.getDataForRequest(service.profileUrl, parameters, 'GET');
          service.sendTwitterRequest(data, function (jsonResponse) {
            service.user.id = jsonResponse.id;
            service.user.name = jsonResponse.name;
            service.user.screenName = jsonResponse.screen_name;
            service.user.userImage = jsonResponse.profile_image_url;
            successCallback(jsonResponse);
          }, errorCallback);
        },
        callback = (function (parameters, successCallback, errorCallback) {
          return function (isLoggedIn) {
            if (isLoggedIn) {
              getProfileData(parameters, successCallback, errorCallback);
            } else {
              service.startActionHandler(function () {
                getProfileData(parameters, successCallback, errorCallback);
              });
            }
          };
        })(parameters, successCallback, errorCallback);
      service.checkUserLoggedIn(callback);
    }
  },
  /**
   * @method
   * @desc Function to follow the user given his screen name.
   * @param {String} name The twitter user to follow..
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  follow: function (name, successCallback, errorCallback) {
    var service = this;
    service.checkFollowStatus(name, function (isFollowing) {
      if (isFollowing === true) {
        service.unSubscribe({
          screen_name: name
        }, successCallback, function (error) {
          errorCallback(new SBW.Models.Error({
            serviceName: 'twitter'
          }));
        });
      } else {
        service.subscribe({
          screen_name: name
        }, successCallback, function (error) {
          errorCallback(new SBW.Models.Error({
            serviceName: 'twitter'
          }));
        });
      }
    }, function (error) {
      SBW.logger.error("In checkFollowStatus method - Twitter");
    });
  },
  /**
   * @method
   * @desc Checks if the logged in user follows the given target user.
   * @param {String} targetScreenName Screen name of the user to check follow status.
   * @param {callback} successCallback Function to be executed in case of success response from twitter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   * @ignore
   */
  checkFollowStatus: function (targetScreenName, successCallback, errorCallback) {
    var service = this,
      data,
      checkFollowStatusCallback = function (targetScreenName, successCallback, errorCallback) {
        data = service.getDataForRequest(service.followStatusUrl, {
          source_screen_name: service.user.screenName,
          target_screen_name: targetScreenName
        }, 'GET');
        service.sendTwitterRequest(data, function (response) {
          successCallback(response.relationship.target.followed_by);
        }, function (error) {
          errorCallback(new SBW.Models.Error({
            serviceName: 'twitter'
          }));
        });
      },
      callback = (function (targetScreenName, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            checkFollowStatusCallback(targetScreenName, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              checkFollowStatusCallback(targetScreenName, successCallback, errorCallback);
            });
          }
        };
      })(targetScreenName, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the followers count of a user.
   * @param {String} name The twitter screen name of the user.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getFollowCount: function (name, successCallback, errorCallback) {
    var service = this,
      getFollowCountCallback = function (name, successCallback, errorCallback) {
        var data = service.getDataForRequest(service.profileUrl, {
          screen_name: name
        }, 'GET');
        service.sendTwitterRequest(data, function (response) {
          successCallback({
            count: response['followers_count'],
            serviceName: 'twitter'
          });
        }, function (error) {
          errorCallback(new SBW.Models.Error({
            serviceName: 'twitter'
          }));
        });
      },
      callback = (function (name, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getFollowCountCallback(name, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getFollowCountCallback(name, successCallback, errorCallback);
            });
          }
        };
      })(name, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the Share count of a url.
   * @param {String} url The url for which share count has to be obtained.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getShareCount: function (url, successCallback, errorCallback) {
    var data = {
      url: this.countUrl + ('?' + OAuth.formEncode({ url: url })),
      type: 'GET',
      header: [],
      parameters: ''
    };
    this.sendTwitterRequest(data, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to get the tweet count of a particular url.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getCount: function (parameters, successCallback, errorCallback) {
    var data = {
      url: this.countUrl + ('?' + OAuth.formEncode(parameters)),
      type: 'GET',
      header: [],
      parameters: ''
    };
    this.sendTwitterRequest(data, successCallback, errorCallback);
    // todo usability of this method, as getShareCount already present
  },
  /**
   * @method
   * @desc Function to retweet a twitter post.
   * @param {String} id Twitter id of the post that has to be shared.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  share: function (id, parameters, successCallback, errorCallback) {
    var service = this, data,
      shareTweet = function (id, parameters, successCallback, errorCallback) {
        data = service.getDataForRequest(service.shareUrl + id + ".json", parameters, 'POST');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (id, parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            shareTweet(id, parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              shareTweet(id, parameters, successCallback, errorCallback);
            });
          }
        };
      })(id, parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to Un follow a particular twitter user.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  unSubscribe: function (parameters, successCallback, errorCallback) {
    var data = this.getDataForRequest(this.unfollowUrl, parameters, 'POST');
    this.sendTwitterRequest(data, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to follow a particular twitter user.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  subscribe: function (parameters, successCallback, errorCallback) {
    var data = this.getDataForRequest(this.followUrl, parameters, 'POST');
    this.sendTwitterRequest(data, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Function to favourite a twitter post.
   * @param {Object} ObjectId Id of the object.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  like: function (ObjectId, successCallback, errorCallback) {
    var parameters = {
      id: ObjectId
    };
    var service = this,
      postLike = function (parameters, successCallback, errorCallback) {
        var data = service.getDataForRequest(service.likeUrl, parameters, 'POST'),
          errorCall = function (resp) {
            if (JSON.parse(resp.responseText).errors[0]['code'] == 139) {
              // error code 139 comes when the user has liked the tweet already
              var likesObject = {
                message: JSON.parse(resp.responseText).errors[0]['message']
              };
              errorCallback(likesObject);
            }
          },
          successCall = function (resp) {

            var likesObject = {
              message: (resp.favorited) ? "You have successfully favorited this status/page." : "Try again"
            };
            successCallback(likesObject);

          };
        service.sendTwitterRequest(data, successCall, errorCall);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            postLike(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              postLike(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to Un favourite a twitter post.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  unlike: function (ObjectId, successCallback, errorCallback) {
    var parameters = {
      id: ObjectId
    };
    var service = this,
      postUnlike = function (parameters, successCallback, errorCallback) {
        var data = service.getDataForRequest(service.unlikeUrl, parameters, 'POST');
        service.sendTwitterRequest(data, successCallback, errorCallback);
      },
      callback = (function (parameters, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            postUnlike(parameters, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              postUnlike(parameters, successCallback, errorCallback);
            });
          }
        };
      })(parameters, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Function to get the tweets for a particular url.
   * @param {Object} parameters An object that contains the parameters for the request.
   * @param {callback} successCallback Function to be executed in case of success response from twitter. Contains a count object as parameter.
   * @param {callback} errorCallback Function to be executed in case of error response from twitter.
   */
  getCommentsForUrl: function (parameters, successCallback, errorCallback) {
    var requestObject = {
      q: parameters.url,
      rpp: parameters.limit || 10,
      page: Math.ceil(parameters.offset / parameters.limit) || 1
    };
    this.searchTweets(requestObject, function (response) {
      var sbwObject = [],
        sbwTweetObject, index;
      var tweets = response.results,
        tweet;
      for (index in tweets) {
        if (tweets.hasOwnProperty(index)) {
          tweet = tweets[index];
          if (tweet.created_at && tweet.from_user && tweet.text && tweet.profile_image_url) {
            sbwTweetObject = new SBW.Models.Comment({
              createdTime: tweet.created_at,
              fromUser: tweet.from_user,
              likeCount: 0,
              text: tweet.text,
              userImage: tweet.profile_image_url,
              serviceName: "twitter"
            });
            sbwObject.push(sbwTweetObject);
          }
        }
      }
      successCallback(sbwObject);
    }, errorCallback);
  }
});