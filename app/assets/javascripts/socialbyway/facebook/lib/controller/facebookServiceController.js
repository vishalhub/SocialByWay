/**
 * @class
 * @name Facebook
 * @namespace SBW.Controllers.Services.Facebook
 * @classdesc This is Facebook service implementation
 * @augments ServiceController
 * @constructor
 */
SBW.Controllers.Services.Facebook = SBW.Controllers.Services.ServiceController.extend( /** @lends SBW.Controllers.Services.Facebook# */ {
  /**
   * @constant
   * @type {String}
   * @desc The service name
   **/
  name: 'facebook',
  /**
   * @constant
   * @desc The icon class
   * @type {String}
   **/
  icon: 'facebook',
  /**
   * @constant
   * @desc The title of the service
   * @type {String}
   **/
  title: 'Facebook',
  /**
   * @constant
   * @desc Boolean to specify the initialization of facebook
   * @type {boolean}
   **/
  facebookInit: false,
  /**
   * @constant
   * @desc Facebook API URL
   * @type {String}
   **/
  apiUrl: 'https://graph.facebook.com',
  /**
   * @constant
   * @desc Supported File format for uploading to service
   * @type {Object}
   **/
  allowedExtensions: {
    'photo': /GIF|JPG|PNG|PSD|TIFF|JP2|IFF|WBMP|XBM/i,
    'video': /3g2|3gp|3gpp|asf|avi|dat|divx|dv|f4v|flv|m2ts|m4v|mkv|mod|mov|mp4|mpe|mpeg|mpeg4|mpg|mts|nsv|ogm|ogv|qt|tod|ts|vob|wmv/i
  },
  /**
   * @method
   * @desc Initialize method to setup require items
   **/
  init: function () {
    this.accessObject = {
      appId: SBW.Singletons.config.services.Facebook.appID,
      token: null
    };
    this.setup();
  },
  /**
   * @method
   * @desc This method is called at the time of setting the service
   */
  setup: function () {
    var self = this;
    $(document).ready(function () {
      var scriptEle = document.createElement('script'),
        done = false;
      if (document.getElementById('fb-root') === null) {
        var fbroot = document.createElement('script'),
          fbattr = document.createAttribute('id'),
          body = document.getElementsByTagName("body")[0] || document.documentElement;
        fbattr.value = 'fb-root';
        fbroot.setAttributeNode(fbattr);
        body.insertBefore(fbroot, body.lastChild);
      }
      scriptEle.src = "//connect.facebook.net/en_US/all.js";
      scriptEle.onload = scriptEle.onreadystatechange = function () {
        if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
          done = true;
          FB.init({
            appId: self.accessObject.appId,
            xfbml: true,
            status: true,
            cookie: true
          });
          //TODO Hack for IE remove this when its fixed in facebook for IE http://bugs.developers.facebook.net/show_bug.cgi?id=20168
          if (navigator.userAgent.indexOf('MSIE') !== -1) {
            FB.UIServer.setLoadedNode = function (a, b) {
              FB.UIServer._loadedNodes[a.id] = b;
            };
          }
          // Handle memory leak in IE
          scriptEle.onload = scriptEle.onreadystatechange = null;
          self.facebookInit = true;
        }
      };
      var head = document.getElementsByTagName("head")[0] || document.documentElement;
      head.insertBefore(scriptEle, head.firstChild);
    });
  },
  /**
   * @method
   * @desc Triggers authentication process to the facebook service using FB.api call to method permissions.request. Disables start button.
   * @param {Callback} callback Callback will be executed on successful authentication
   */
  startActionHandler: function (callback) {
    var service = this;
    if (service.facebookInit) {
      FB.getLoginStatus(function (response) {
        if (response.status === 'connected') {
          // the user is logged in and connected to your
          // app, and response.authResponse supplies
          // the user's ID, a valid access token, a signed
          // request, and the time the access token
          // and signed request each expire
          service.getAccessToken.call(service, response, callback);
        } else {
          window._facebookopen = window.open;
          window.open = function (url, name, params) {
            service.authWindowReference = window._facebookopen(url, name, params);
            return service.authWindowReference;
          };

          // the user isn't even logged in to Facebook.
          FB.login(function (response) {
            if (response.authResponse !== null && !$.isEmptyObject(response.authResponse)) {
              service.user = service.user || new SBW.Models.User();
              service.getAccessToken.call(service, response, function (response) {
                service.user.name = response.name;
                service.user.id = response.id;
                service.getProfilePic(null, function (response) {
                  service.user.userImage = response;
                }, function (error) {
                  SBW.logger.debug("Could not fetch image url");
                });
                callback();
              });
            } else {

              service.isUserLoggingIn = false;
              service.authWindowReference.close();
            }
          }, {
            scope: 'user_photos,user_videos,publish_stream,read_stream,publish_actions,user_events,create_event,user_groups,user_notes'
          });

          window.open = window._facebookopen;
          window._facebookopen = null;

          var intervalId = setInterval(function () {
            if (service.authWindowReference.closed) {
              service.isUserLoggingIn = false;
              clearInterval(intervalId);
            }
          }, 1000);
        }
      });
    } else {
      setTimeout(function () {
        service.startActionHandler();
      }, 1000);
    }
  },
  /**
   * @method
   * @desc Checks whether user is logged in(has a authenticated session to service).
   * @param {Callback} callback Callback function that will be called after checking login status
   */
  checkUserLoggedIn: function (callback) {
    var service = this;
    if (service.facebookInit) {
      FB.api('/me?access_token=' + service.accessObject['token'], "post", function (response) {
        if (response.name !== undefined || response.error === null) {
          callback(true);
        } else {
          callback(false);
        }
      });
    } else {
      setTimeout(function () {
        service.checkUserLoggedIn(callback);
      }, 1000);
    }
  },
  /**
   * @method
   * @desc Retrieves access tokens from the response, sends request to facebook service to fetch user details using FB method me and call successLoginHandler on successful response.
   * @param {Object} response  response from facebook api for the method permissions.request(authentication)
   * @param {Callback} callback function to be called after fetching access token
   */
  getAccessToken: function (response, callback) {
    var service = this;
    if (response.status === "connected") {
      service.accessObject['uid'] = response.authResponse.userID;
      service.accessObject['token'] = response.authResponse.accessToken;
      service.accessObject['tokenSecret'] = response.authResponse.signedRequest;
      FB.api('/me?access_token=' + service.accessObject['token'], function (response) {
        if (response.name) {
          callback(response);
          if (service.authWindowReference && !service.authWindowReference.closed) {
            service.authWindowReference.close();
          }
        } else {
          service.failureLoginHandler.call(service, callback);
        }
      });
    } else {
      service.failureLoginHandler.call(service, callback);
    }
  },
  /**
   * @method
   * @desc Posts a message to facebook through FB API service
   * @param {String} message Message to be published
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~publishMessage-successCallback Callback} will be called if publishing is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~publishMessage-errorCallback Callback} will be called in case of any error while publishing
   */
  publishMessage: function (message, successCallback, errorCallback) {
    var service = this,
      publish = function (message, successCallback, errorCallback) {
        FB.api('/me/feed?access_token=' + service.accessObject['token'], 'post', {
          message: message
        }, function (response) {
          if (response.id !== undefined || response.error === null) {
            if (successCallback) {
              successCallback({
                id: response.id,
                serviceName: "facebook"
              }, response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }
          }
        })
      },
      callback = (function (message, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(message, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(message, successCallback, errorCallback);
            });
          }
        };
      })(message, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Subscribes to a post on the facebook Service.
   * @param  {String}  uid             id of the post
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~subscribe-successCallback Callback} will be called if successfully subscribes
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~subscribe-errorCallback Callback} will be called in case of any error
   */
  subscribe: function (uid, successCallback, errorCallback) {
    var service = this,
      publish = function (uid, successCallback, errorCallback) {
        FB.api('/me/og.follows?access_token=' + service.accessObject['token'], 'post', {
          profile: uid
        }, function (response) {
          if (response.name !== undefined || response.error === null) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (uid, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(uid, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(uid, successCallback, errorCallback);
            });
          }
        };
      })(uid, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Shares the link to the wall of the user through FB API Service.
   * @param  {String} link url of the link to be shared.
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~share-successCallback Callback} will be called if successfully shared the link.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~share-errorCallback Callback} will be called if case of any error in sharing the link.
   */
  share: function (link, successCallback, errorCallback) {
    var service = this,
      publish = function (link, successCallback, errorCallback) {
        FB.api('/me/feed?access_token=' + service.accessObject['token'], 'post', {
          link: link
        }, function (response) {
          if (response.name !== undefined || response.error === null) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (message, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(message, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(message, successCallback, errorCallback);
            });
          }
        };
      })(link, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Publishes link onto the wall of the user.
   * @param {String} type  A string indicating the type for this post (including link, photo, video)
   * @param {String} name  The name of the link
   * @param {String} caption  The caption of the link (appears beneath the link name)
   * @param {String} message  message relate to link
   * @param {String} link  The link attached to this post
   * @param {String} description  description of the link (appears beneath the link caption)
   * @param {String} picture  If available, a link to the picture included with this post
   * @param {String} icon  A link to an icon representing the type of this post
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~publishLink-successCallback Callback} will get called if publish successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~publishLink-errorCallback Callback} will get called in case of any error
   */
  publishLink: function (type, name, caption, message, link, description, picture, icon, successCallback, errorCallback) {
    var service = this,
      linkJson = {
        type: type,
        name: name,
        caption: caption,
        message: message,
        link: link,
        description: description,
        picture: picture,
        icon: icon
      },
      publish = function (obj, successCallback, errorCallback) {
        FB.api('/me/feed?access_token=' + service.accessObject['token'], 'post', {
          type: obj.type,
          name: obj.name,
          message: obj.message,
          caption: obj.caption,
          link: obj.link,
          description: obj.description,
          picture: obj.picture,
          icon: obj.icon
        }, function (response) {
          if (response.name !== undefined || response.error === null) {
            if (successCallback) {
              successCallback(response); //make the response consistent with other services
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }
          }
        });
      },
      callback = (function (linkJson, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(linkJson, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(linkJson, successCallback, errorCallback);
            });
          }
        };
      })(linkJson, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Posts an event to facebook through FB API service
   * @param {String} name Name of the event
   * @param {Date} startTime Start time of the event
   * @param {Date} endTime End time of the event
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~publishEvent-successCallback Callback} will be called if publishing is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~publishEvent-errorCallback Callback} will be called in case of any error while publishing
   */
  publishEvent: function (name, startTime, endTime, successCallback, errorCallback) {
    var service = this,
      publish = function (name, startTime, endTime, successCallback, errorCallback) {
        FB.api('/me/events?access_token=' + service.accessObject['token'], 'post', {
          name: name,
          start_time: startTime,
          end_time: endTime
        }, function (response) {
          if (!response.id || !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (name, startTime, endTime, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(name, startTime, endTime, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(name, startTime, endTime, successCallback, errorCallback);
            });
          }
        };
      })(name, startTime, endTime, successCallback, errorCallback);

    service.checkUserLoggeIdn(callback);
  },
  /**
   * @method
   * @desc Likes an object on facebook through FB API service
   * @param {String} objectId of the object to be liked.
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~like-successCallback Callback} will be called if like is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~like-errorCallback Callback} will be called in case of any error while liking
   */
  like: function (objectId, successCallback, errorCallback) {
    var service = this,
      postLike = function (objectId, successCallback, errorCallback) {
        FB.api('/' + objectId + '/likes?access_token=' + service.accessObject['token'], 'post', function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }
          }
        });
      },
      callback = (function (objectId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            postLike(objectId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              postLike(objectId, successCallback, errorCallback);
            });
          }
        };
      })(objectId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Un likes an object on facebook through FB API service
   * @param {String} objectId of the object to be un liked.
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~unlike-successCallback Callback} will be called if unlike is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~unlike-errorCallback Callback} will be called in case of any error while un liking
   */
  unlike: function (objectId, successCallback, errorCallback) {
    var service = this,
      postUnlike = function (objectId, successCallback, errorCallback) {
        FB.api('/' + objectId + '/likes?access_token=' + service.accessObject['token'], 'delete', function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }
          }
        });
      },
      callback = (function (objectId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            postUnlike(objectId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              postUnlike(objectId, successCallback, errorCallback);
            });
          }
        };
      })(objectId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Posts a comment to facebook through FB API service
   * @param objectId Id of the object on to which comment should be posted.
   * @param {String} comment
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~postComment-successCallback Callback} will be called if posting is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~postComment-errorCallback Callback} will be called in case of any error while posting
   */
  postComment: function (objectId, comment, successCallback, errorCallback) {
    var service = this,
      publish = function (objectId, comment, successCallback, errorCallback) {
        FB.api('/' + objectId + '/comments?access_token=' + service.accessObject['token'], 'post', {
          message: comment
        }, function (response) {
          if (!response.id || !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (objectId, comment, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(objectId, comment, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(objectId, comment, successCallback, errorCallback);
            });
          }
        };
      })(objectId, comment, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Help us fetch specific set of data
   * @ignore
   */
  _getData: function (context, callback) {
    var service = this,
      url = context.url,
      user;
    if (!url) {
      user = context.id ? context.id : 'me';
      if (context.type === 'posts') {
        url = '/' + user + '/feed?access_token=' + service.accessObject['token'];
      } else if (context.type === 'likes') {
        url = '/' + context.id + '/likes?access_token=' + service.accessObject['token'];
      } else if (context.type === 'comments') {
        url = '/' + context.id + '/comments?access_token=' + service.accessObject['token'];
      } else if (context.type === 'events') {
        url = '/' + user + '/events?access_token=' + service.accessObject['token'];
      } else if (context.type === 'friends') {
        url = '/' + user + '/friends?access_token=' + service.accessObject['token'];
      } else if (context.type === 'notes') {
        url = '/' + user + '/notes?access_token=' + service.accessObject['token'];
      } else if (context.type === 'groups') {
        url = '/' + user + '/groups?access_token=' + service.accessObject['token'];
      } else if (context.type === 'user') {
        url = '/' + user + '?access_token=' + service.accessObject['token'];
      }
    }
    FB.api(url, 'get', function (response) {
      callback(response);
    });
  },
  /**
   * @method
   * @desc Helps us retrieve all data of a particular context
   * @ignore
   */
  _getAllData: function (context, successCallback, errorCallback) {
    var service = this,
      posts = [],
      callback = (function (successCallback, errorCallback) {
        return function (response) {
          if (response && !response.error) {
            // if data is not present in response than return the response as it is and let the implementor fetch whatever he is looking for
            if (!response.data) {
              successCallback(response);
              return; // simply return !!
            }

            for (var i = 0, len = response.data.length; i < len; i++) {
              if (!response.data[i].story) {
                posts.push(response.data[i]);
              }
            }
            if (response.paging && response.paging.next) {
              service._getData({
                url: response.paging.next
              }, callback);
            } else {
              successCallback(posts);
            }
          } else {
            var errorObject = new SBW.Models.Error({
              message: response.error.message,
              code: response.error.code,
              serviceName: 'facebook',
              rawData: response
            });
            errorCallback(errorObject);
          }
        };
      })(successCallback, errorCallback);
    service._getData(context, callback);
  },
  /**
   * @method
   * @desc Fetches posts from a facebook user through FB API service
   * @param userId Id of the User.
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getPosts-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getPosts-errorCallback Callback} will be called in case of any error while fetching data
   */
  getPosts: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'posts',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'posts',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches "Like" objects for an object through FB API service
   * @param objectId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-errorCallback Callback} will be called in case of any error while fetching data
   */
  getLikes: function (objectId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          var likeSuccess = function (response) {
            var likesData = [];
            for (var i = 0; i < response.length; i++) {
              var user = new SBW.Models.User({
                name: response[i].name,
                id: response[i].id
              });
              likesData[i] = new SBW.Models.Like({
                user: user,
                rawData: response[i]
              });
            }
            var likesObject = {
              serviceName: 'facebook',
              rawData: response,
              likes: likesData,
              likeCount: likesData.length
            };
            // Todo Populating the asset object with the like and user objects
            successCallback(likesObject);
          };
          if (isLoggedIn) {
            service._getAllData({
              type: 'likes',
              id: objectId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'likes',
                id: objectId
              }, likeSuccess, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetchs share count for a url on facebook
   * @param  {String} url             of the domain.
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getShareCount-successCallback Callback} will be called if the share count is fetched successfully.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getShareCount-errorCallback Callback} will be called in case of any error while fetching.
   */
  getShareCount: function (url, successCallback, errorCallback) {
    var service = this,
      getCount = function (url, successCallback, errorCallback) {
        FB.api('/?id=' + url, 'get', function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback({
                count: response.shares || 0
              }, response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      };
    if (service.facebookInit) {
      getCount(url, successCallback, errorCallback);
    } else {
      setTimeout(function () {
        service.getShareCount(url, successCallback, errorCallback);
      }, 1000);
    }
  },
  /**
   * @method
   * @desc Fetches Comments for an object through FB API service
   * @param objectId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getComments-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getComments-errorCallback Callback} will be called in case of any error while fetching data
   */
  getComments: function (objectId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          var commentSuccess = function (result) {
              var commentsData = [];
              for (var i = 0; i < result.length; i++) {
                commentsData[i] = new SBW.Models.Comment({
                  createdTime: result[i].created_time,
                  fromUser: result[i].from.name,
                  likeCount: result[i].like_count,
                  text: result[i].message,
                  rawData: result[i],
                  serviceName: "facebook"
                });
              }
              successCallback(commentsData);
            };
          if (isLoggedIn) {
            service._getAllData({
              type: 'comments',
              id: objectId
            }, commentSuccess, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'comments',
                id: objectId
              }, commentSuccess, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches events of a facebook user through FB API service
   * @param userId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getEvents-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getEvents-errorCallback Callback} will be called in case of any error while fetching data
   */
  getEvents: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'events',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'events',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc This method helps in getting the social groups a facebook user is associated with through FB API service
   * @param userId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getSocialGroups-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getSocialGroups-errorCallback Callback} will be called in case of any error while fetching data
   */
  getSocialGroups: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'groups',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'groups',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches friends of a facebook user through FB API service
   * @param userId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getFriends-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getFriends-errorCallback Callback} will be called in case of any error while fetching data
   */
  getFriends: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'friends',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'friends',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches profile picture of user in facebook through FB API service
   * @param userId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getProfilePic-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getProfilePic-errorCallback Callback} will be called in case of any error while fetching data
   */
  getProfilePic: function (userId, successCallback, errorCallback) {
    userId = userId ? userId : 'me';
    var service = this,
      getPic = function (userId, successCallback, errorCallback) {
        FB.api('/' + userId + '/picture', 'get', function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback(response.data.url);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      };

    getPic(userId, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc Publishes notes to facebook through FB API service
   * @param {String} subject Subject of the notes
   * @param {String} message Content of the notes
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~publishNotes-successCallback Callback} will be called if publishing is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~publishNotes-errorCallback Callback} will be called in case of any error while publishing
   */
  publishNotes: function (subject, message, successCallback, errorCallback) {
    var service = this,
      publish = function (subject, message, successCallback, errorCallback) {
        FB.api('/me/notes?access_token=' + service.accessObject['token'], 'post', {
          message: message,
          subject: subject
        }, function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (subject, message, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(subject, message, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(subject, message, successCallback, errorCallback);
            });
          }
        };
      })(subject, message, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches notes of a facebook user through FB API service
   * @param {String} userId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getNotes-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getNotes-errorCallback Callback} will be called in case of any error while fetching data
   */
  getNotes: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'notes',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'notes',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches the profile of the user
   * @param  {String} userId          [description]
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getProfile-successCallback Callback} will be called if the profile is fetched successfully.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getProfile-errorCallback Callback} will be called in case of any error in fetching the profile.
   */
  getProfile: function (userId, successCallback, errorCallback) {
    var service = this,
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            service._getAllData({
              type: 'user',
              method: 'get',
              id: userId
            }, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              service._getAllData({
                type: 'user',
                method: 'get',
                id: userId
              }, successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Uploads photos to facebook user acount by making an ajax call.
   * @param {Array} fileData  Array of {@link  SBW.Models.UploadFileMetaData}
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~uploadPhoto-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~uploadPhoto-errorCallback Callback} will be called in case of any error while fetching data
   */
  uploadPhoto: function (fileData, successCallback, errorCallback) {
    var url=this.apiUrl + '/me/photos'; 
    this._uploadMedia(fileData, successCallback, errorCallback, url);
  },
  /**
   * @method
   * @desc Uploads videos to facebook user acount by making an ajax call.
   * @param {Array} fileData  Array of {@link  SBW.Models.UploadFileMetaData}
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~uploadVideo-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~uploadVideo-errorCallback Callback} will be called in case of any error while fetching data
   */
  uploadVideo: function (fileData, successCallback, errorCallback) {
    var url='https://graph-video.facebook.com/me/videos'; 
    this._uploadMedia(fileData, successCallback, errorCallback, url);
  },
  /**
   * @method
   * @desc Utility for upload media
   * @ignore
   */
  _uploadMedia: function (fileData, successCallback, errorCallback, context) {
    var service = this,
      upload = function (fileData, successCallback, errorCallback, context) {
        var url = context + '?access_token=' + service.accessObject['token'];
        var options = {
          url: url,
          type: 'POST',
          dataType: 'json',
          contentType: false
        };
        SBW.api.fileUpload('facebook', fileData, options, successCallback, errorCallback);
      },
      callback = (function (fileData, successCallback, errorCallback, context) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            upload(fileData, successCallback, errorCallback, context);
          } else {
            service.startActionHandler(function () {
              upload(fileData, successCallback, errorCallback, context);
            });
          }
        };
      })(fileData, successCallback, errorCallback, context);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc postupload function is used to make consistent response for uploads across different services
   * @param  {Object} response        contains facebook sent response for uploaded file
   * @param  {Callback} successCallback Callaback will be called once the success event happens
   * @param  {Callback} errorCallback Callback will be called once the failure event happens
   */
  postUpload: function (response, successCallback, errorCallback) {
    var uploadStatus = [],
      callBack = successCallback;
    response.forEach(function (value) {
      if (value && !value.error) {
        uploadStatus.push(new SBW.Models.UploadStatus({
          id: value.id,
          postId: value.post_id,
          serviceName: 'facebook',
          status: 'success',
          rawData: value
        }));
      } else {
        callBack = errorCallback;
        uploadStatus.push(new SBW.Models.Error({
          message: value.error.message,
          code: value.error.code,
          serviceName: 'facebook',
          rawData: value
        }));
      }
    });

    callBack(uploadStatus);
  },
  /**
   * @method
   * @desc publishPhoto method uploads photo to facebook user account with FB API service
   * @param  {String} description     description about the photo
   * @param  {String} imageUrl        url pointing to the image
   * @param {Callback} successCallback  {@link  SBW.Controllers.Services.ServiceController~publishPhoto-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback  {@link  SBW.Controllers.Services.ServiceController~publishPhoto-errorCallback Callback} will be called in case of any error while fetching data
   * @ignore
   */
  publishPhoto: function (description, imageUrl, successCallback, errorCallback) {
    var service = this,
      publish = function (description, imageUrl, successCallback, errorCallback) {
        FB.api('/me/photos?access_token=' + service.accessObject['token'], 'post', {
          url: imageUrl,
          message: description
        }, function (response) {
          if (response && !response.error) {
            if (successCallback) {
              successCallback(response);
            }
          } else {
            if (errorCallback) {
              var errorObject = new SBW.Models.Error({
                message: response.error.message,
                code: response.error.code,
                serviceName: 'facebook',
                rawData: response
              });
              errorCallback(errorObject);
            }

          }
        });
      },
      callback = (function (description, imageUrl, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(description, imageUrl, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(description, imageUrl, successCallback, errorCallback);
            });
          }
        };
      })(description, imageUrl, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Fetches comments for a url on facebook
   * @param  {Object} options          containing url,limit and offset
   * @param  {Callback} successCallback  {@link  SBW.Controllers.Services.ServiceController~getCommentsForUrl-successCallback Callback} will be called if data is fetched successfully
   * @param  {Callback} errorCallback  {@link  SBW.Controllers.Services.ServiceController~getCommentsForUrl-errorCallback Callback} will be called in case of any error while fetching data
   */
  getCommentsForUrl: function (options, successCallback, errorCallback) {
    var service = this,
      success = function (response) {
        var data = [],
          i = 0;
        response.data.forEach(function (value, index, array) {
          service.getProfilePic(value['from']['id'], function (picResponse) {
            var temp = new SBW.Models.Comment({
              createdTime: value['created_time'],
              fromUser: value['from']['name'],
              likeCount: value['like_count'],
              text: value['message'],
              picUrl: picResponse,
              rawData: value,
              serviceName: "facebook"
            });
            data[index] = (temp);
            i++;
            if (i === array.length) {
              successCallback(data);
            }
          }, function (picResponse) {
            var temp = new SBW.Models.Comment({
              createdTime: value['created_time'],
              fromUser: value['from']['name'],
              likeCount: value['like_count'],
              text: value['message'],
              rawData: value,
              serviceName: "facebook"
            });
            data[index] = (temp);
            i++;
            if (i === array.length) {
              successCallback(data);
            }
          });


        });

      },
      error = function (response) {
        var errorObject = new SBW.Models.Error({
          message: response.error.message,
          code: response.error.code,
          serviceName: 'facebook',
          rawData: response
        });
        errorCallback(errorObject);
      };
    SBW.Singletons.utils.ajax({
      url: service.apiUrl + '/comments/?id=' + options.url + '&limit=' + (options.limit || 10) + '&offset=' + (options.offset || 0),
      type: "GET",
      data: {},
      dataType: "json"
    }, success, error);
  }
});