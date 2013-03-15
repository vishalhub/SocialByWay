/**
 * @class  Instagram
 * @classdesc This is Imstagram service implementation
 * @augments ServiceController
 * @constructor
 **/
SBW.Controllers.Services.Instagram = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.Instagram# */{
  name: 'instagram',
  icon: 'instagram',
  isPhotoSetSupported: false,

  authWindowReference: null,

  init: function () {
    var clientID = SBW.Singletons.config.services.Instagram.apiKey,
      callbackURL = SBW.Singletons.utils.callbackURLForService('instagram');
    this.apiUrl = "https://api.instagram.com/v1/";
    this.accessObject = {
      clientId: clientID,
      callbackUrl: callbackURL,
      accessTokenUrl: 'http://api.instagram.com/oauth/authorize/?client_id=' + clientID + '&redirect_uri=' + callbackURL + '&response_type=token' + '&scope=likes+comments',
      access_token: null,
    };
  },
  /**
   * @method
   * @decs This function is called by serviceController on Click of start of button instagram service's authorize view page. gets the accessTokenUrl, forms the authentication url, opens the popup with signed url and calls for auth token listener.
   * @param {Callback} callback function to be called after successful authentication
   */
  startActionHandler: function (callback) {
    var service = this;
    service.eraseCookie('instagramToken');
    service.accessObject.access_token = null;
    var tokenListner = function (windowRef) {
      if (!windowRef.closed) {
        if (service.getCookie('instagramToken')) {
          windowRef.close();
          service.accessObject.access_token = service.getCookie('instagramToken');
          callback();
        } else {
          setTimeout(function () {
            tokenListner(windowRef);
          }, 2000);
        }
      } else {
        service.isUserLoggingIn = false;
      }
    };
    if (service.authWindowReference === null || service.authWindowReference.closed) {
      service.authWindowReference = window.open(service.accessObject.accessTokenUrl, "Instagram" + new Date().getTime(), service.getPopupWindowParams({width: 800, height: 300}));
      tokenListner(service.authWindowReference);
    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * @method
   * @decs This function is called by serviceController to verify whether the user is logged in or not.This function creates a signed url for checking the auth token validation and makes an jsonp request.
   * @param {Callback} callback Function that will be called with the flag of whether the user is logged in or not (true are false).
   */
  checkUserLoggedIn: function (callback) {
    var service = this,
      access_token = service.accessObject.access_token,
      url = "https://api.instagram.com/v1/users/self/?access_token=" + access_token;
    SBW.Singletons.utils.ajax({
      url: url,
      type: 'GET',
      dataType: "jsonp"
    }, function (response) {
      if (response.meta.code === 200) {
        callback(true);
      } else {
        callback(false);
      }
    }
      );
  },
  /**
   * @method
   * @desc To get logged in user profile through Instagram API service
   * @param {String} userId  Id of the service user.
   * @param {Function} successCallback  {@link SBW.Controllers.Services.ServiceController~getProfile-successCallback Callback} to be executed on successful profile retrieving.
   * @param {Function} errorCallback  {@link SBW.Controllers.Services.ServiceController~getProfile-errorCallback Callback} to be executed on retrieving profile error.
   */
  getProfile: function (userId, successCallback, errorCallback) {
    userId = ((userId !== undefined) ? userId : 'self');
    var service = this,
      publish = function (successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: service.apiUrl + '/users/' + userId,
            type: 'GET',
            dataType: "jsonp",
            data: {access_token: service.accessObject.access_token}
          }, function (response) {
            var user = new SBW.Models.User({
              name: response.data.full_name,
              id: response.data.id,
              userImage: response.data.profile_picture,
              rawData: response
            });
            successCallback(user);
          },
          errorCallback
        );
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get comments of a Photo through Instagram API service
   * method doesn't require any authentication
   * @param {String} mediaId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getComments-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getComments-errorCallback Callback} will be called in case of any error while fetching data
   */
  getComments: function (mediaId, successCallback, errorCallback) {
    var service = this,
      publish = function (mediaId, successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: service.apiUrl + '/media/' + mediaId + '/comments',
            type: 'GET',
            dataType: "jsonp",
            data: {access_token: service.accessObject.access_token}
          }, successCallback,
          errorCallback
        );
      },
      callback = (function (mediaId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(mediaId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(mediaId, successCallback, errorCallback);
            });
          }
        };
      })(mediaId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To like(favorite) a media through instagram API service
   * @param {String} mediaId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~like-successCallback Callback} will be called if like is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~like-errorCallback Callback} will be called in case of any error while liking
   */
  like: function (mediaId, successCallback, errorCallback) {
    var service = this,
      publish = function (mediaId, successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: SBW.Singletons.config.proxyURL + '?url=' + service.apiUrl + '/media/' + mediaId + '/likes',
            type: 'POST',
            data: {access_token: service.accessObject.access_token}
          }, successCallback,
          errorCallback
        );
      },
      callback = (function (mediaId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(mediaId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(mediaId, successCallback, errorCallback);
            });
          }
        };
      })(mediaId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To unlike(un-favorite) a media through instagram API service
   * @param {String} mediaId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~unlike-successCallback Callback} will be called if unlike is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~unlike-errorCallback Callback} will be called in case of any error while unliking
   */
  unlike: function (mediaId, successCallback, errorCallback) {
    var service = this,
      publish = function (mediaId, successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: SBW.Singletons.config.proxyURL + '?url=' + service.apiUrl + '/media/' + mediaId + '/likes?access_token=' + service.accessObject.access_token,
            type: 'DELETE'
          }, successCallback,
          errorCallback
        );
      },
      callback = (function (mediaId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(mediaId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(mediaId, successCallback, errorCallback);
            });
          }
        };
      })(mediaId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get likes(favorites) for the photo given through instagram API service
   * The method doesn't require any authentication
   * @param {String} mediaId
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-errorCallback Callback} will be called in case of any error while fetching data
   */
  getLikes: function (mediaId, successCallback, errorCallback) {
    var service = this,
      publish = function (mediaId, successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: service.apiUrl + '/media/' + mediaId + '/likes',
            type: 'GET',
            dataType: "jsonp",
            data: {access_token: service.accessObject.access_token}
          }, function (response) {
            var likesData = [], i, user;
            for (i = 0; i < response.data.length; i++) {
              user = new SBW.Models.User({
                name: response.data[i].full_name,
                id: response.data[i].id,
                userImage: response.data[i].profile_picture
              });
              likesData[i] = new SBW.Models.Like({
                user: user,
                rawData: response.data[i]
              });
            }
            var likesObject = {
              serviceName: 'instagram',
              likes: likesData,
              likeCount: likesData.length,
              rawData: response
            };
            // Todo Populating the asset object with the like and user objects
            successCallback(likesObject);
          }, function (response) {
            errorCallback(response);
          }
        );
      },
      callback = (function (mediaId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(mediaId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(mediaId, successCallback, errorCallback);
            });
          }
        };
      })(mediaId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc To get Media of the user through instagram API service
   * @param {String} userId
   * @param {Callback} successCallback  will be called if data is fetched successfully
   * @param {Callback} errorCallback  will be called in case of any error while fetching data
   */
  getMedia: function (userId, successCallback, errorCallback) {
    var service = this,
      publish = function (userId, successCallback, errorCallback) {
        SBW.Singletons.utils.ajax({
            url: service.apiUrl + '/users/' + userId + '/media/recent',
            data: {access_token: service.accessObject.access_token},
            type: 'GET',
            dataType: 'jsonp'
          },
          function (response) {
            var content = new Array(),
              assets = response.data;
            assets.forEach(function (asset) {
              var collection = new SBW.Models.ImageAsset({
                  id: '',
                  src: asset.images.standard_resolution.url,
                  title: asset.caption === null ? null : asset.caption.text,
                  createdTime: new Date.getTime(),
                  serviceName: 'instagram',
                  rawData: asset,
                  status: 'private',
                  imgSizes: {
                    t: asset.images.thumbnail.url,
                    s: asset.images.thumbnail.url,
                    m: asset.images.low_resolution.url,
                    l: asset.images.standard_resolution.url
                  },
                  metadata: {
                    caption: asset.caption,
                    type: asset.type,
                    dateTaken: new Date(asset.created_time * 1000).toDateString(),
                    dateUpdated: null,
                    dateUploaded: null,
                    comments: null,
                    size: null,
                    assetId: asset.id,
                    assetCollectionId: null,
                    height: asset.images.standard_resolution.height,
                    width: asset.images.standard_resolution.width,
                    commentCount: asset.comments.count,
                    category: null,
                    exifMake: null,
                    exifModel: null,
                    iptcKeywords: null,
                    orientation: null,
                    tags: asset.tags,
                    downloadUrl: asset.images.standard_resolution.url,
                    originalFormat: null,
                    fileName: null,
                    version: null,
                    description: asset.caption,
                    thumbnail: asset.images.thumbnail.url,
                    previewUrl: asset.images.standard_resolution.url,
                    author: new SBW.Models.User({
                      name: asset.user.full_name,
                      id: asset.user.id,
                      userImage: asset.user.profile_picture
                    }),
                    authorAvatar: null,
                    likeCount: asset.likes.count,
                    likes: asset.likes.data
                  }
                }),
                comments = asset.comments.data,
                commentsArray = new Array(),
                likes = asset.likes.data,
                likesArray = new Array();
              collection.id = collection.getID();
              comments.forEach(function (comment) {
                var commentObject = new SBW.Models.Comment({
                  text: comment.text,
                  id: comment.id,
                  createdTime: comment.created_time,
                  fromUser: comment.from.full_name,
                  likeCount: null,
                  profilePic: comment.from.profile_picture,
                  rawData: comment,
                  serviceName: 'instagram'
                });
                commentsArray.push(commentObject);
              });
              collection.metadata.comments = commentsArray;
              likes.forEach(function (like) {
                var likeObject = new SBW.Models.Like({
                  user: new SBW.Models.User({
                    name: like.full_name,
                    id: like.id,
                    userImage: like.profile_picture
                  }),
                  rawData: like
                });
                likesArray.push(likeObject);
              });
              collection.metadata.likes = likesArray;
              content.push(collection);
            });
            successCallback(content);
          }, function (response) {
            errorCallback(response);
          }
        );
      },
      callback = (function (userId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            publish(userId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              publish(userId, successCallback, errorCallback);
            });
          }
        };
      })(userId, successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  }
});
