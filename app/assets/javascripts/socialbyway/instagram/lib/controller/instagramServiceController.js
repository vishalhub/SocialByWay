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
      mediaCount: 0
    };
  },
  /**
   * @method
   * @decs This function is called by serviceController on init and is used to set internationalized messages for title, openAlbumLabel, seeAllAlbumsLabel.
   */
  setup: function () {
  },
  /**
   * @method
   * @decs This function is called by serviceController on Click of start of button instagram service's authorize view page. gets the accessTokenUrl, forms the authentication url, opens the popup with signed url and calls for auth token listener.
   * @param {Callback} callback function to be called after successful authentication
   */
  startActionHandler: function (callback) {
    var service = this;
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
    if (service.authWindowReference == null || service.authWindowReference.closed) {
      service.authWindowReference = window.open(service.accessObject.accessTokenUrl, "Instagram" + new Date().getTime(), service.getPopupWindowParams({width: 800, height: 300}));
      tokenListner(service.authWindowReference);
    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * @method
   * @decs This function pings the server for authenticated access token till the user authorize the service and finally called
   * serviceController's successLoginHandler function
   * @param {Callback} callback callback function to be called after fetching access token
   */
  getAccessToken: function (callback) {
    var service = this,
      cookie = service.getCookie('instagramToken');
    if (cookie !== "undefined") {
      service.accessObject.access_token = cookie;
      $.ajax({
        url: "https://api.instagram.com/v1/users/self",
        data: {access_token: service.accessObject.access_token},
        dataType: 'jsonp',
        jsonpCallback: 'callback',
        success: function (response) {
          if (response && response.meta && response.meta.code === 200) {
//                        var user= EM.Models.AssetManager.User.create({name:response.data.username});
            var user = {name: response.data.username};
            service.accessObject.mediaCount = parseInt(response.data.counts.media);
            callback(user);
          } else {
            service.failureLoginHandler.call(service, null);
          }
        }
      });
    } else {
      service.failureLoginHandler.call(service, null);
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
    $.getJSON(url, 'callback=?', function (response) {
      if (response.meta.code === 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  getProfile: function (successCallback, errorCallback) {
    var service = this,
      publish = function (successCallback, errorCallback) {
        $.ajax({
          url: service.apiUrl + '/users/self',
          data: {access_token: service.accessObject.access_token},
          type: 'GET',
          dataType: 'jsonp',
          crossDomain: true,
          success: function (response) {
            successCallback(response);
          },
          error: function (response) {
            errorCallback(response);
          }
        });
      };
    var callback = (function (successCallback, errorCallback) {
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
        $.ajax({
          url: service.apiUrl + '/media/' + mediaId + '/comments',
          data: {access_token: service.accessObject.access_token},
          type: 'GET',
          dataType: 'jsonp',
          crossDomain: true,
          success: function (response) {
            successCallback(response);
          },
          error: function (response) {
            errorCallback(response);
          }
        });
      };
    var callback = (function (mediaId, successCallback, errorCallback) {
      return function (isLoggedIn) {
        if (isLoggedIn) {
          publish(mediaId, successCallback, errorCallback);
        } else {
          service.startActionHandler(function () {
            publish(mediaId, successCallback, errorCallback);
          });
        }
      };
    })(successCallback, errorCallback);
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
        $.ajax({
          url: service.apiUrl + '/media/' + mediaId + '/likes',
          data: {access_token: service.accessObject.access_token},
          type: 'GET',
          dataType: 'jsonp',
          crossDomain: true,
          success: function (response) {
            successCallback(response);
          },
          error: function (response) {
            errorCallback(response);
          }
        });
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
  /*
   *
   *
   */
  getMedia: function (userId, successCallback, errorCallback) {
    var service = this,
      publish = function (userId, successCallback, errorCallback) {
        $.ajax({
          url: service.apiUrl + '/users/' + userId + '/media/recent',
          data: {access_token: service.accessObject.access_token},
          type: 'GET',
          dataType: 'jsonp',
          crossDomain: true,
          success: function (response) {
            var content = new Array(),
              assets = response.data;
            assets.forEach(function (asset) {
              var collection = new SBW.Models.ImageAsset({
                  id: '',
                  title: asset.caption === null ? null : asset.caption.text,
                  createdTime: asset.created_time,
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
                    dateTaken: null,
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
                    downloadUrl: null,
                    originalFormat: null,
                    fileName: null,
                    version: null,
                    description: null,
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
            successCallback(content)
          },
          error: function (response) {
            errorCallback(response);
          }
        });
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
  },

  _getPaginatedCollection: function (service, response, next_url, callback) {
    service.data = $.merge($.makeArray(response.data), $.makeArray(service.data));
    $.ajax({
      url: next_url,
      data: {access_token: service.accessObject.access_token},
      dataType: 'jsonp',
      jsonpCallback: 'callback_' + new Date().getTime(),
      success: function (response) {
        if (response.meta.code === 200) {
          response.data = $.merge($.makeArray(service.data), $.makeArray(response.data));
          if (response.data.length == service.accessObject.mediaCount) {
            service.successMediaSetCollectionHandler(response, callback);
          } else {
            var next_url = response.pagination.next_url;
            service._getPaginatedCollection(service, response, next_url, callback);
          }
        } else {
        }
      }
    });
  },

  /**
   * @method
   * @decs This function is the implementation of abstract function defined in serviceController. Used for retrieving photo collection.
   * @param {Object} photoSet Photo-set object
   * @param {Callback} callback function to be called after successful completion of photos from service
   * @param {Number} pageNumber - Page number.
   */
  getMediaForMediaSet: function (photoSet, callback, pageNumber) {
    this.successMediaForMediaSetHandler.call(this, photoSet, photoSet.rawData, callback, pageNumber);
  },

  /**
   *  @method
   * @decs This function is used for retrieving photo-set collection from instagram service's raw response.
   * @param {Object} response Raw response of the instagram service's request for photo-sets.
   * @returns  {Array} media set objects array.
   */
  getMediaSetCollectionObjFromResponse: function (response) {
    var name = "Instagram Photos",
      id = "collection";
    if (response.data && $.makeArray(response.data).length > 0) {
      var thumbUrl = response.data[0].images.thumbnail.url,
        responseData = {setData: {id: id, title: name, content: [], imgSizes: {'t': thumbUrl}, type: 'photoset', mediaCount: $.makeArray(response.data).length, rawData: response}};
      return true;
    } else {
      return null;
    }
  },

  /**
   * @method
   * @desc This function is used for retrieving photos from instagram service's response.
   * @param {Object} response Raw response of the instagram service's request for photos.
   * @return {Object} photo set object
   *
   */
  getMediaFromResponse: function (response) {
    return  response.data;
  },
  /**
   * @method
   * @desc This function is used for converting instagram's raw photo into.
   * @param {Object} media photo response object
   * @return {Object} photo object
   *
   */
  formatMedia: function (media) {
    // getting date in datetime string
    var dateTakenString = this.getFormattedDate(new Date(parseInt(media.created_time) * 1000));
    var name = media["caption"] ? media["caption"]["text"] : '';
    var thumbUrl = media.images.thumbnail.url;
    var mediumUrl = media.images['low_resolution'].url;
    var largeUrl = media.images['standard_resolution'].url;
    var isSupported = this.validateMedia(media);
    return this.newPhoto({id: media.id, title: name, imgSizes: {t: thumbUrl, s: thumbUrl, m: mediumUrl, l: largeUrl}, dateTakenString: dateTakenString, dateUploadedString: dateTakenString, rawData: media, isSupported: isSupported});
  },

  /**
   * @method
   * @desc This function is called for resetting the instagram's accessObject. Called when the user clicks on change link.
   * @param {Callback} callback callback function to be called after logout.
   *
   */

  logoutHandler: function (callback) {
//        EM.Utils.clearCookie('instagramToken');
    var service = this;
    service.accessObject['access_token'] = null;
    var image = new Image();
    image.src = 'https://instagram.com/accounts/logout/';
    service.successLogoutHandler.call(service, callback);
  },

  /**
   * @method
   * @desc This function is called for retrieving metadata of a given photo. Makes a jsnop request and obtained meta information of the given photo.
   * @param {Object} photo  Photo object
   * @param {Callback} callback function to be called after getting the photo meta data from service
   *
   */
  getMediaMetadata: function (photo, callback) {
    this.successMediaMetadataHandler(photo.metadata, callback);
  },
  /**
   * @method
   * @desc Method for populating the response to a  object.
   * @param {Object} fMedia formated media after doing doing formatting by each service.
   */
  populateAdditionalMediaMetaData: function (fMedia) {
    var height = fMedia.rawData.images.standard_resolution.height;
    var width = fMedia.rawData.images.standard_resolution.width;

    var properties = {
      "dateTaken": this.convertDateToUTC(fMedia.dateTakenString),
      "dateUploaded": this.convertDateToUTC(fMedia.dateUploadedString),
      "dateUpdated": this.convertDateToUTC(fMedia.dateTakenString),
      "caption": fMedia.rawData["caption"] ? fMedia.rawData["caption"]["text"] : '',
      "description": fMedia.rawData["caption"] ? fMedia.rawData["caption"]["text"] : '',
      "comments": fMedia.rawData['comments'],
      "size": fMedia.rawData["size"],
      "height": height,
      "width": width,
      "author": fMedia.rawData["user"] ? fMedia.rawData["user"]["full_name"] : '',
      "authorAvatar": fMedia.rawData["user"] ? fMedia.rawData["user"]["profile_picture"] : '',
      "commentCount": fMedia.rawData["comments"] ? fMedia.rawData["comments"]["count"] : '',
      "likeCount": fMedia.rawData["likes"] ? fMedia.rawData["likes"]["count"] : '',
      "likes": fMedia.rawData["likes"],
      "latitude": fMedia.rawData["location"] ? fMedia.rawData["location"]['latitude'] : '',
      "longitude": fMedia.rawData["location"] ? fMedia.rawData["location"]['longitude'] : '',
      "tags": fMedia.rawData['tags'],
      "thumbnail": fMedia.rawData['images'] ? fMedia.rawData['images']["thumbnail"]["url"] : '',
      "downloadUrl": fMedia.rawData['images'] ? fMedia.rawData['images']["standard_resolution"]["url"] : ''
    };

    this.setPropertiesOnMediaMetaData(fMedia, properties);
  },

  /**
   * @method
   * @desc Utility method used for signing urls.
   * @param link url link to be signed
   * @param msg hash object used for signing the request.
   * @returns link signed url
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
   * @desc Method for checking for supported media
   * @param  media raw data of the media from the service response.
   */
  validateMedia: function (media) {
    if (media.images) {
      return this.checkMediaSupported(media.images["standard_resolution"]["url"], this.validationConstant.URL);
    }
    return false;
  }

});
