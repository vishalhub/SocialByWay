/**
 * @class Flickr
 * @classdesc This is Flickr service implementation
 * @augments ServiceController
 * @constructor
 */
SBW.Controllers.Services.Flickr = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.Flickr# */ {
  /**
   * @constant
   * @type {string}
   * @desc The service name
   **/
  name: 'flickr',
  /**
   * @constant
   * @desc The icon class
   * @type {string}
   **/
  icon: 'flickr',
  /**
   * @constant
   * @desc The title of the service
   * @type {string}
   **/
  title: 'Flickr',

  /**
   * @method
   * @desc initialize method to setup required items
   **/
  init: function () {
    this.callbackUrl = SBW.Singletons.utils.callbackURLForService('Flickr');
    this.proxyUrl = SBW.Singletons.config.proxyURL;
    this.requestTokenUrl = "http://www.flickr.com/services/oauth/request_token";
    this.authorizationUrl = "http://www.flickr.com/services/oauth/authorize";
    this.accessTokenUrl = "http://www.flickr.com/services/oauth/access_token";
    this.flickrApiUrl = "http://api.flickr.com/services/rest";
    this.flickrUploadApiUrl = "http://api.flickr.com/services/upload/";
    this.accessObject = {
      consumerKey: SBW.Singletons.config.services.Flickr.apiKey,
      consumerSecret: SBW.Singletons.config.services.Flickr.secret,
      access_token: null,
      id: null,
      permissionLevel: 'write'
    };
  },
  /**
   * @method
   * @triggers authentication process to the flickr service.
   **/
  startActionHandler: function (callback) {
    var service = this;
    service.eraseCookie('flickrToken');
    var tokenListener = function (windowReference) {
      if (!windowReference.closed) {
        if (service.getCookie('flickrToken')) {
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

    if (service.authWindowReference === undefined || service.authWindowReference === null || service.authWindowReference.closed) {
      service.authWindowReference = window.open('', 'Flickr' + new Date().getTime(), service.getPopupWindowParams({
        height: 500,
        width: 400
      }));
      service.authWindowReference.document.write("redirecting to Flickr");

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
        action: service.requestTokenUrl,
        method: "GET",
        parameters: {
          oauth_callback: service.callbackUrl
        }
      };

      var url = service.signAndReturnUrl(service.requestTokenUrl, message);
      $.ajax({
        url: service.proxyUrl,
        data: {
          url: url
        },
        type: 'GET',
        success: function (response) {
          var respJson = SBW.Singletons.utils.getJSONFromQueryParams(response);
          service.accessObject.access_token = respJson.oauth_token;
          service.accessObject.tokenSecret = respJson.oauth_token_secret;
          service.authWindowReference.document.location.href = service.authorizationUrl + "?oauth_token=" + service.accessObject.access_token + "&perms=write";
          tokenListener(service.authWindowReference);
        },
        error: function (response) {
        }
      });

    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * @method
   * @desc Method to check whether user is logged in(has an authenticated session to service).
   * @param {callback} callback Callback function that will be called after checking login status
   **/
  checkUserLoggedIn: function (callback) {
    var service = this;
    if (this.accessObject.access_token !== null && this.accessObject.access_token !== undefined) {
      callback(true);
    } else {
      callback(false);
    }
  },
  /**
   * @method
   * @desc Utility method used for signing urls.
   * @param {String} link url link to be signed
   * @param {Object} msg hash object used for signing the request.
   * @returns {String} url signed url
   **/
  signAndReturnUrl: function (link, msg) {
    var service = this;
    OAuth.completeRequest(msg, service.accessObject);
    OAuth.SignatureMethod.sign(msg, service.accessObject);
    link = link + '?' + OAuth.formEncode(msg.parameters);
    return link;
  },

  /**
   * @method
   * @desc Retrieves access tokens from the response, sends request to flickr service to fetch user details using Flickr method and call successLoginHandler on successful response.
   * @param callback callback function to be called after fetching access token
   */
  getAccessToken: function (callback) {
    var service = this,
      flickrVerifier = service.getCookie('flickrToken');
    if (flickrVerifier) {
      var message = {
        action: service.accessTokenUrl,
        method: "GET",
        parameters: {
          oauth_token: service.accessObject.access_token,
          oauth_verifier: flickrVerifier,
          perms: 'write'
        }
      };
      var url = service.signAndReturnUrl(service.accessTokenUrl, message);
      $.ajax({
        url: service.proxyUrl,
        data: {
          url: url
        },
        type: 'GET',
        crossDomain: true,
        success: function (response) {
          var jsonResp = SBW.Singletons.utils.getJSONFromQueryParams(response);
          service.accessObject.id = decodeURIComponent(jsonResp.user_nsid);
          service.accessObject.access_token = jsonResp.oauth_token;
          service.accessObject.tokenSecret = jsonResp.oauth_token_secret;
          var user = new SBW.Models.User({
            name:jsonResp.username,
            id:decodeURIComponent(jsonResp.user_nsid)
          });
          service.populateUserInformation(user);
          callback(response);
        }
      });
    } else {
      alert("error in getting access token");
    }
  },

  /**
   * @method
   * @desc  To like an object.
   * @param {String} objectId
   * @param successCallback
   * @param errorCallback
   */
  like: function (objectId, successCallback, errorCallback) {
    var service = this;
    var postLike = function (objectId, successCallback, errorCallback) {
      var apiKey = service.accessObject.consumerKey;
      var message = {
        action: service.flickrApiUrl,
        method: "POST",
        parameters: {
          method: 'flickr.favorites.add',
          perms: 'write',
          format: 'json',
          photo_id: objectId,
          api_key: apiKey,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'POST',
        dataType: "json"
      }, successCallback, errorCallback);
    };
    var callback = (function (service, objectId, successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          postLike(objectId, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            postLike(objectId, successCallback, errorCallback);
          });
        }
      };
    })(service, objectId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc  To unlike an object.
   * @param {String} objectId
   * @param successCallback
   * @param errorCallback
   */
  unlike: function (objectId, successCallback, errorCallback) {
    var service = this;
    var removeLike = function (objectId, successCallback, errorCallback) {
      var apiKey = service.accessObject.consumerKey;
      var message = {
        action: service.flickrApiUrl,
        method: "POST",
        parameters: {
          method: 'flickr.favorites.remove',
          perms: 'write',
          format: 'json',
          photo_id: objectId,
          api_key: apiKey,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'POST',
        dataType: "json"
      }, successCallback, errorCallback);
    };
    var callback = (function (service, objectId, successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          removeLike(objectId, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            removeLike(objectId, successCallback, errorCallback);
          });
        }
      };
    })(service, objectId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To comment on a photo.
   * @param {String} objectId
   * @param {String} comment
   * @param successCallback
   * @param errorCallback
   */
  postComment: function (objectId, comment, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var publish = function (objectId, comment, successCallback, errorCallback) {
      var message = {
        action: service.flickrApiUrl,
        method: "POST",
        parameters: {
          method: 'flickr.photos.comments.addComment',
          api_key: apiKey,
          format: 'json',
          photo_id: objectId,
          perms: 'write',
          comment_text: comment,
          oauth_token: service.accessObject.access_token,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'POST',
        dataType: "json"
      }, successCallback, errorCallback);
    };
    var callback = (function (objectId, comment, successCallback, errorCallback) {
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
   * @desc To post a photo to flickr through flickr API service
   * Flickr supports JPEGs, non-animated GIFs, and PNGs. Any other  format is automatically converted to and stored in JPEG format.
   * additional help for photo upload refer to URL: http://www.flickr.com/help/photos/
   * @param fileData
   * @param successCallback
   * @param errorCallback
   */
  uploadPhoto: function (fileDataArray, successCallback, errorCallback) {
    var service = this;
      fileDataArray.forEach(function(fileData){
         var apiKey = service.accessObject.consumerKey,
          upload = function (fileData, successCallback, errorCallback) {
            var message = {
                action: service.flickrUploadApiUrl,
                method: "POST",
                parameters: {
                  oauth_consumer_key: apiKey,
                  oauth_token: service.accessObject.access_token,
                  oauth_token_secret: service.accessObject.tokenSecret,
                  oauth_callback: service.callbackUrl,
                  title: fileData['title'],
                  description: fileData['description'],
                  is_public:1
                }
              },
              url = service.signAndReturnUrl(service.flickrUploadApiUrl, message),
              options = {
                url: url,
                type: 'POST',
                dataType: 'xml',
                processData: false,
                fileType: 'photo'
              };
            var filedata = [
              {oauth_consumer_key: apiKey, oauth_token: service.accessObject.access_token, photo: fileData['file'], title: fileData['title'], description: fileData['description'],is_public:1}
            ];
            SBW.Singletons.serviceFactory.getService("controller").fileUpload(['flickr'], filedata, options, successCallback, errorCallback);
          },
          callback = (function (fileData, successCallback, errorCallback) {
            return function (isLoggedIn) {
              if (isLoggedIn) {
                upload(fileData, successCallback, errorCallback);
              } else {
                service.startActionHandler(function () {
                  upload(fileData, successCallback, errorCallback);
                });
              }
            };
          })(fileData, successCallback, errorCallback);

        service.checkUserLoggedIn(callback);
    })
  },
  /**
   * @method
   * @desc To post a video to flickr through flickr API service
   * Format supported for video  AVI (Proprietary codecs may not work), WMV, MOV (AVID or other proprietary codecs may not work), MPEG (1, 2, and 4), 3gp, M2TS, OGG, OGV
   * additional help on video upload refer to URL: http://www.flickr.com/help/video/
   * @param fileData
   * @param metadata
   * @param successCallback
   * @param errorCallback
   */
  uploadVideo: function (fileData, metadata, successCallback, errorCallback) {
    this.uploadPhoto(fileData, metadata, successCallback, errorCallback);
  },
  /**
   * @method
   * @desc utility method to format response from Upload methods
   * @param  {Object} response        [description]
   * @param  {Callback} successCallback [description]
   * @param  {Callback} errorCallback [description]
   */
  postUpload: function (response, successCallback, errorCallback) {
    var resp, key;
    for (key in response) {
      resp = response[key];
    }
    var uploadStatus = new Array(),
      callBack = successCallback;
    if ((resp.getElementsByTagName("photoid").length !== 0)) {
      uploadStatus.push(new SBW.Models.UploadStatus({
        id: resp.getElementsByTagName("photoid")[0].textContent,
        serviceName: 'flickr',
        status: 'success',
        rawData: response
      }));
    } else {
      callBack = errorCallback;
      uploadStatus.push(new SBW.Models.ErrorObject({
        message: resp.getElementsByTagName("err")[0].getAttribute('msg'),
        serviceName: 'facebook',
        rawData: response
      }));
    }
    callBack(uploadStatus);
  },
  /**
   * @method
   * @desc To get galleries from logged in user through flickr API service
   * The method doesn't require any authentication
   * @param {String} userId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getGalleries: function (userId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var message = {
      action: service.flickrApiUrl,
      method: "GET",
      parameters: {
        method: 'flickr.galleries.getList',
        perms: 'write',
        format: 'json',
        user_id: userId,
        api_key: apiKey,
        nojsoncallback: 1
      }
    };
    var url = service.signAndReturnUrl(service.flickrApiUrl, message);
    SBW.Singletons.utils.ajax({
      url: url,
      type: 'GET',
      dataType: "json"
    },
      successCallback,
      errorCallback
    );
  },

  /**
  * @method
  * @desc To get likes(favorites) for the photo given through flickr API service
  * The method doesn't require any authentication
  * @param {String} photoId
  * @param {Callback} successCallback
  * @param {Callback} errorCallback
  */
  getLikes: function (photoId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var message = {
      action: service.flickrApiUrl,
      method: "GET",
      parameters: {
        method: 'flickr.photos.getFavorites',
        perms: 'write',
        format: 'json',
        photo_id: photoId,
        api_key: apiKey,
        nojsoncallback: 1
      }
    };
    var url = service.signAndReturnUrl(service.flickrApiUrl, message);
    var likeSuccess = function(response){
      var likesData = [];
      for (var i = 0; i < response.photo.person.length; i++) {
        var user = new SBW.Models.User({
          name: response.photo.person[i].username,
          id: response.photo.person[i].nsid
        });
        likesData[i] = new SBW.Models.Like({
          user: user,
          rawData: response.photo.person[i]
        });
      }
      var likesObject = {
        serviceName: 'flickr',
        likes: likesData,
        likeCount: likesData.length,
        rawData: response
      }
      // Todo Populating the asset object with the like and user objects
      successCallback(likesObject);
    };
    SBW.Singletons.utils.ajax({
      url: url,
      type: 'GET',
      dataType: "json"
    },
      likeSuccess,
      errorCallback
    );
  },
  /**
   * @method
   * @desc To create a Gallery in the logged in User's account through flickr API service
   * @param {String} title
   * @param {String} description
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  createGallery: function (title, description, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var newGallery = function (title, description, successCallback, errorCallback) {
      var message = {
        action: service.flickrApiUrl,
        method: "POST",
        parameters: {
          api_key: apiKey,
          description: description,
          title: title,
          format: 'json',
          method: 'flickr.galleries.create',
          oauth_token: service.accessObject.access_token,
          perms: 'write',
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'POST',
        dataType: 'json'
      },
        successCallback,
        errorCallback);
    };
    var callback = (function (title, description, successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          newGallery(title, description, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            newGallery(title, description, successCallback, errorCallback);
          });
        }
      };
    })(title, description, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To add a photo to logged in User's gallery through flickr API service
   * @param {String} galleryId
   * @param {String} photoId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  addPhotoToGallery: function (galleryId, photoId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var addPhoto = function (galleryId, photoId, successCallback, errorCallback) {
      var message = {
        action: service.flickrApiUrl,
        method: "POST",
        parameters: {
          api_key: apiKey,
          gallery_id: galleryId,
          method: 'flickr.galleries.addPhoto',
          format: 'json',
          oauth_token: service.accessObject.access_token,
          perms: 'write',
          photo_id: photoId,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'POST',
        dataType: 'json'
      },
        successCallback,
        errorCallback);
    };
    var callback = (function (galleryId, photoId, successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          addPhoto(galleryId, photoId, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            addPhoto(galleryId, photoId, successCallback, errorCallback);
          });
        }
      };
    })(galleryId, photoId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get contacts of the user logged in through flickr API service
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getContacts: function (successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var getData = function (successCallback, errorCallback) {
      var message = {
        action: service.flickrApiUrl,
        method: "GET",
        parameters: {
          api_key: apiKey,
          format: 'json',
          method: 'flickr.contacts.getList',
          oauth_token: service.accessObject.access_token,
          perms: 'read',
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'
      },
        successCallback,
        errorCallback);
    };
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          getData(successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            getData(successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get groups of the logged in user through flickr API service
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getGroups: function (successCallback, errorCallback) {
    var service = this;
    var getData = function (successCallback, errorCallback) {
      var userId = service.accessObject.id;
      var apiKey = service.accessObject.consumerKey;
      var message = {
        action: service.flickrApiUrl,
        method: "GET",
        parameters: {
          method: 'flickr.people.getGroups',
          perms: 'read',
          format: 'json',
          api_key: apiKey,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'
      },
        successCallback,
        errorCallback);
    };
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          getData(successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            getData(successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get the logged in User profile information through Flickr API service
   * method doesn't require any authentication
   * @param {String} userId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getUserInfo: function (userId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var message = {
      action: service.flickrApiUrl,
      method: "GET",
      parameters: {
        method: 'flickr.people.getInfo',
        format: 'json',
        user_id: userId,
        api_key: apiKey,
        nojsoncallback: 1
      }
    };
    var url = service.signAndReturnUrl(service.flickrApiUrl, message);
    SBW.Singletons.utils.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    },
      successCallback,
      errorCallback);
  },
  /**
   * @method
   * @desc To get comments of a Photo through Flickr API service
   * method doesn't require any authentication
   * @param {String} objectId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getComments: function (objectId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var message = {
      action: service.flickrApiUrl,
      method: "GET",
      parameters: {
        method: 'flickr.photos.comments.getList',
        format: 'json',
        photo_id: objectId,
        api_key: apiKey,
        nojsoncallback: 1
      }
    };
    var url = service.signAndReturnUrl(service.flickrApiUrl, message);
    SBW.Singletons.utils.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    },
      successCallback,
      errorCallback);
  },
  /**
   * @method
   * @desc To get the url for photos posted in flickr by the logged in user through Flickr API service
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getPhotoUrl: function (successCallback, errorCallback) {
    var service = this;
    var getData = function (successCallback, errorCallback) {
      var userId = service.accessObject.id;
      var apiKey = service.accessObject.consumerKey;
      var message = {
        action: service.flickrApiUrl,
        method: "GET",
        parameters: {
          method: 'flickr.urls.getUserPhotos',
          format: 'json',
          user_id: userId,
          api_key: apiKey,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'
      },
        successCallback,
        errorCallback);
    };
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          getData(successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            getData(successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get photos of the logged in user through Flickr API service
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getPhotos: function (successCallback, errorCallback) {
    var service = this;
    var getData = function (successCallback, errorCallback) {
      var userId = service.accessObject.id;
      var apiKey = service.accessObject.consumerKey;
      var photoUrlArray = [];
      var message = {
        action: service.flickrApiUrl,
        method: "GET",
        parameters: {
          method: 'flickr.people.getPhotos',
          format: 'json',
          user_id: userId,
          api_key: apiKey,
          nojsoncallback: 1
        }
      };
      var url = service.signAndReturnUrl(service.flickrApiUrl, message);
      var success = function (response) {
          var photoArray = response.photos.photo;
          for (var i = 0; i < photoArray.length; i++) {
            var photoUrl = 'http://farm' + photoArray[i].farm + '.staticflickr.com/' + photoArray[i].server + '/' + photoArray[i].id + '_' + photoArray[i].secret + '.jpg'
            photoUrlArray[i] = photoUrl;
          }
          successCallback(photoUrlArray);
        },
        error = function (response) {
          errorCallback(response);
        };
      SBW.Singletons.utils.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        processData: true
      },
        success,
        error);
    };
    var callback = (function (successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          getData(successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            getData(successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get the information of a photo posted on flickr.
   * This method doesn't require any authentication
   * @param {String} photoId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getPhotoInfo: function (photoId, successCallback, errorCallback) {
    var service = this;
    var apiKey = service.accessObject.consumerKey;
    var message = {
      action: service.flickrApiUrl,
      method: "GET",
      parameters: {
        method: 'flickr.photos.getInfo',
        format: 'json',
        photo_id: photoId,
        api_key: apiKey,
        nojsoncallback: 1
      }
    };
    var url = service.signAndReturnUrl(service.flickrApiUrl, message);
    SBW.Singletons.utils.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'},
      successCallback,
      errorCallback);
  },
  /**
   * @method
   * @desc Method to get the profile image(buddy icon) of the logged in user
   * @param {String} userId
   * @param {Callback} successCallback
   * @param {Callback} errorCallback
   */
  getProfilePic: function (userId, successCallback, errorCallback) {
    var service = this;
    userId = ((userId !== undefined) ? userId : service.accessObject.id );
    if (userId !== undefined) {
      var profilePicUrl = 'http://flickr.com/buddyicons/' + userId + '.jpg';
      successCallback(profilePicUrl);
    } else {
      errorCallback();
    }
  },
  /**
   * @method
   * @desc This function is called for resetting the flickr's accessObject. Called when the user clicks on change link.
   */
  logoutHandler: function (callback) {
    var service = this;
    service.accessObject['access_token'] = null;
    service.accessObject.id = null;
    callback();
  }
});