/**
 * @class  Picasa
 * @classdesc Picasa service implementation
 * @augments ServiceController
 * @constructor
 **/
SBW.Controllers.Services.Picasa = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.Picasa# */{
  /** @constant */
  name: 'picasa',
  /** @constant */
  icon: 'picasa',
  /** @constant */
  title: 'Picasa',
  /**
   * @property {Array} content {@link SBW.Models.AssetCollection Asset Collections} container for picasa.
   */
  content: [],
  /**
   * @method
   * @desc Initialize method to setup require items
   */
  init: function () {
    var clientID = SBW.Singletons.config.services.Picasa.clientID,
      callbackURL = SBW.Singletons.utils.callbackURLForService('Picasa');
    this.accessObject = {
      clientId: clientID,
      accessTokenUrl: 'https://accounts.google.com/o/oauth2/auth?client_id=' + clientID + '&scope=https://picasaweb.google.com/data&response_type=token&redirect_uri=' + callbackURL,
      access_token: null,
      apiKey: null
    };
    this.baseUrl = "https://picasaweb.google.com/data";
    this.feedUrl = this.baseUrl + "/feed/api/user/default";
    this.entryUrl = this.baseUrl + "/entry/api/user/default";
  },
  /**
   * @method
   * @desc Triggers authentication process to the picasa service.
   * @param {Callback} callback
   */
  startActionHandler: function (callback) {
    var service = this,
      accessTokenListner = function (windowRef) {
        if (!windowRef.closed) {
          if (service.getCookie('picasaToken')) {
            windowRef.close();
            service.getAccessToken.call(service, callback);
          } else {
            setTimeout(function () {
              accessTokenListner(windowRef);
            }, 2000);
          }
        }
      };
    if (service.authWindowReference === undefined || service.authWindowReference === null || service.authWindowReference.closed) {
      service.authWindowReference = window.open(service.accessObject.accessTokenUrl, 'picasa' + new Date().getTime(), service.getPopupWindowParams({height: 500, width: 400}));
      accessTokenListner(service.authWindowReference);
    } else {
      service.authWindowReference.focus();
    }
  },
  /**
   * @method
   * @desc Checks whether user is logged-in and has an authenticated session to service.
   * @param {Callback} callback Callback function to be called after checking login status
   */
  checkUserLoggedIn: function (callback) {
    var service = this,
      access_token = service.accessObject.access_token,
      url = "https://accounts.google.com/o/oauth2/tokeninfo?v=2.1&access_token=" + access_token;
    SBW.Singletons.utils.ajax({url: url, type: "GET", dataType: "jsonp"}, function (response) {
      if (response.error) {
        service.eraseCookie('picasaToken');
        callback(false);
      } else {
        callback(true);
      }
    }, function (response) {
      service.eraseCookie('picasaToken');
      callback(false);
    });
  },
  /**
   * @method
   * @desc Retrieves access tokens from cookie and sets it to accessObject
   * @param {Callback} callback callback function to be called after fetching access token
   */
  getAccessToken: function (callback) {
    var service = this,
      picasaCookie = service.getCookie('picasaToken');
    if (picasaCookie !== "undefined") {
      service.accessObject.access_token = picasaCookie;
      callback();
    }
  },


  /**
   * @method
   * @desc Utility method to create multipart/related request for posting images.
   * @param {String} title  Title of the image to post.
   * @param {String} description  Description about the image to post.
   * @param {File} image  Image file object.
   * @param {String} mimetype - Image file type.
   * @return {Binary} Buffer
   * @ignore
   */
  _generateMultipart: function (title, description, image, mimetype) {
    image = new Uint8Array(image); // Wrap in view to get data

    var before = ['Media multipart posting', "   \n", '--END_OF_PART', "\n", 'Content-Type: application/atom+xml', "\n", "\n", "<entry xmlns='http://www.w3.org/2005/Atom'>", '<title>', title, '</title>', '<summary>', description, '</summary>', '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/photos/2007#photo" />', '</entry>', "\n", '--END_OF_PART', "\n", 'Content-Type:', mimetype, "\n\n"].join(''),
      after = '\n--END_OF_PART--',
      size = before.length + image.byteLength + after.length,
      uint8array = new Uint8Array(size),
      i = 0,
      j = 0;

    // Append the string.
    for (i; i < before.length; i = i + 1) {
      uint8array[i] = before.charCodeAt(i) & 0xff;
    }

    // Append the binary data.
    for (j; j < image.byteLength; i = i + 1, j = j + 1) {
      uint8array[i] = image[j];
    }

    // Append the remaining string
    for (j = 0; i < size; i = i + 1, j = j + 1) {
      uint8array[i] = after.charCodeAt(j) & 0xff;
    }

    return uint8array.buffer; // <-- This is an ArrayBuffer object!
  },

  /**
   * @method
   * @desc Fetches album details of the logged in user from picasa through picasa API service.
   * The method doesn't require any authentication.
   * @param {SBW.Controllers.Services.Picasa~getAlbums-successCallback} successCallback callback function to be called with the json response after successfully fetching the album details.
   * @param {SBW.Controllers.Services.Picasa~getAlbums-errorCallback} errorCallback callback function to be called in case of error while fetching the album details.
   */
  getAlbums: function (successCallback, errorCallback) {
    var service = this,
      getAlbumsCallback = function (successCallback, errorCallback) {
        var message = {
            action: service.feedUrl,
            method: "GET",
            parameters: {kind: 'album', access: 'all', alt: 'json', access_token: service.accessObject.access_token}
          },
          url = service.feedUrl + '?access_token=' + service.accessObject.access_token + '&alt=json';
        SBW.Singletons.utils.ajax({url: url, crossDomain: false, type: "GET", dataType: "jsonp"}, function (response) {
          var collection = null;
          $.each(response.feed.entry, function (key, value){
            collection = new SBW.Models.AssetCollection({
              title: this.title.$t,
              status: this.gphoto$access.$t,
              metadata: {
                dateUpdated: this.updated.$t,
                dateUploaded: this.published.$t,
                numAssets: this.gphoto$numphotos.$t,
                assetCollectionId: this.gphoto$id.$t,
                serviceName: 'picasa',
                commentCount: this.gphoto$commentCount.$t,
                //type: this.gphoto$albumType.$t, 
                fileName: this.gphoto$name.$t,
                description: this.summary.$t,
                author: this.author[0].name.$t
              }
            });
            collection.id = collection.getID();
            service.content.push(collection);  
          });
          successCallback(service.content);
        }, errorCallback);
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getAlbumsCallback(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getAlbumsCallback(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for getAlbums method.
   * @callback SBW.Controllers.Services.Picasa~getAlbums-successCallback
   * @param {Object} response JSON response from the service
   **/
  /**
   * Error Callback for getAlbums method.
   * @callback SBW.Controllers.Services.Picasa~getAlbums-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc Upload photo to the user's dropbox album.
   * @param  {SBW.Models.UploadFileMetaData} mediaData Object containing media's file object and other metadata.
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~uploadPhoto-successCallback} callback function to be called with the xml response after successfully uploading the image.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~uploadPhoto-errorCallback} callback function to be called in case of error while uploading the image.
  */
  uploadPhoto: function (mediaData, successCallback, errorCallback) {
    var service = this,
      mediaData = mediaData[0] || mediaData,
      upload = function (mediaData, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '/albumid/default?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          data,
          i,
          f,
          reader = new FileReader();
        reader.onload = (function (mediaData) {
          return function (e) {
            SBW.Singletons.utils.ajax({url: url, data: service._generateMultipart(mediaData.title, mediaData.description, e.target.result, mediaData.file.type), contentType: 'multipart/related; boundary="END_OF_PART"', crossDomain: false, type: "POST", dataType: "json", processData: false}, function (response) {
              successCallback(new SBW.Models.UploadStatus({
                serviceName : 'picasa', 
                id : response.entry.gphoto$id.$t, 
                rawData : response
              }));
            }, errorCallback);
          };
        })(mediaData);

        // Read in the image file as a data URL.
        reader.readAsArrayBuffer(mediaData.file);
      },
      callback = (function (mediaData, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            upload(mediaData, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              upload(mediaData, successCallback, errorCallback);
            });
          }
        };
      })(mediaData, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
     * @method
     * @desc formats media to SBW.ImageAsset
     * Formats the picasa response into SBW.ImageAsset.
     * @param  {Object}    response  json response received from picasa api.
     * @return {SBW.ImageAsset} SBW.ImageAsset
     * @ignore
     */
  _formatMedia: function (media) {
    return new SBW.Models.ImageAsset({serviceName : 'picasa', id : media.gphoto$id.$t, src : media.content.src, title : media.title.$t, createdTime : media.published.$t});
  },

  /**
   * @method
   * @desc Post comment on the photo referred by the given albumId and photoId.
   * @param  {String}   comment         Comment text to be posted.
   * @param  {String}   albumId         Album Id of the photo.
   * @param  {String}   photoId         Photo Id of the photo.
   * @param  {SBW.Controllers.Services.Picasa~postComment-successCallback} successCallback callback function to be called after posting the comment successfully.
   * @param  {SBW.Controllers.Services.Picasa~postComment-errorCallback} errorCallback callback function to be called in case of error while posting comment.
   */
  postComment: function (comment, albumId, photoId, successCallback, errorCallback) {
    var service = this,
      postCommentCallback = function (comment, albumId, photoId, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '/albumid/' + albumId + '/photoid/' + photoId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          data = "<?xml version='1.0' encoding='UTF-8'?> <entry xmlns='http://www.w3.org/2005/Atom'><content>" + comment + "</content><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/photos/2007#comment' /></entry>";
        SBW.Singletons.utils.ajax({url: url, data: data, contentType: 'application/atom+xml', crossDomain: false, type: "POST", processData: false}, successCallback, errorCallback);
      },
      callback = (function (comment, albumId, photoId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            postCommentCallback(comment, albumId, photoId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              postCommentCallback(comment, albumId, photoId, successCallback, errorCallback);
            });
          }
        };
      })(comment, albumId, photoId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for postComment method.
   * @callback SBW.Controllers.Services.Picasa~postComment-successCallback
   * @param {Object} response Formatted JSON response from the service
   **/
  /**
   * Error Callback for postComment method.
   * @callback SBW.Controllers.Services.Picasa~postComment-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc Fetch comments for the given photo from the given album
   * @param {String}   photoId          photo Id of the photo.
   * @param {String}   albumId          Album Id of the photo.
   * @param {SBW.Controllers.Services.Picasa~getComments-successCallback} successCallback  callback function to be called with json response after fetching the comments successfully.
   * @param {SBW.Controllers.Services.Picasa~getComments-errorCallback} errorCallback  callback function to be called in case of error while fetching comments.
   */
  getComments: function (photoId, albumId, successCallback, errorCallback) {
    var service = this,
      getCommentsCallback = function (photoId, albumId, successCallback, errorCallback) {
        var url = service.feedUrl + '/albumid/' + albumId + '/photoid/' + photoId + '?access_token=' + service.accessObject.access_token + '&alt=json';
        SBW.Singletons.utils.ajax({url: url, crossDomain: false, type: "GET", dataType: "json"}, function (response) {
          var commentsArray = [];
          $.each(response.feed.entry, function (key, value) {
            var comment = new SBW.Models.Comment();
            comment.text = value.content.$t;
            comment.createdTime = value.updated.$t;
            comment.fromUser = new SBW.Models.User({id : value.author[0].gphoto$user.$t, name : value.author[0].name.$t});
            commentsArray.push(comment);
          });
          successCallback(commentsArray);
        }, errorCallback);
      },
      callback = (function (photoId, albumId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getCommentsCallback(photoId, albumId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getCommentsCallback(photoId, albumId, successCallback, errorCallback);
            });
          }
        };
      })(photoId, albumId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for getComments method.
   * @callback SBW.Controllers.Services.Picasa~getComments-successCallback
   * @param {Array} response Array of comments {@Link SBW.Models.Comment} from the service
   **/
  /**
   * Error Callback for getComments method.
   * @callback SBW.Controllers.Services.Picasa~getComments-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc Fetch photo details from album
   * @param {String}   albumId          Album Id from which to fetch the photo details.
   * @param {SBW.Controllers.Services.Picasa~getPhotosFromAlbum-successCallback} successCallback  callback function to be called with json response after fetching the photo details successfully.
   * @param {SBW.Controllers.Services.Picasa~getPhotosFromAlbum-errorCallback} errorCallback  callback function to be called in case of error while fetching photo details.
   */
  getPhotosFromAlbum: function (albumId, successCallback, errorCallback) {
    var service = this,
      getPhotosFromAlbumCallback = function (albumId, successCallback, errorCallback) {
        var url = service.feedUrl + '/albumid/' + albumId + '?access_token=' + service.accessObject.access_token + '&alt=json';
        SBW.Singletons.utils.ajax({url: url, crossDomain: false, type: "GET", dataType: "json"}, function (response) {
          var photoArray = [];
          $.each(response.feed.entry, function (key, value) {
            photoArray.push(service._formatMedia(value));
          });
          successCallback(photoArray);
        }, errorCallback);
      },
      callback = (function (albumId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            getPhotosFromAlbumCallback(albumId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              getPhotosFromAlbumCallback(albumId, successCallback, errorCallback);
            });
          }
        };
      })(albumId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for getPhotosFromAlbum method.
   * @callback SBW.Controllers.Services.Picasa~getPhotosFromAlbum-successCallback
   * @param {Array} response Array of photos {@Link SBW.Models.ImageAsset} from the service
   **/
  /**
   * Error Callback for getPhotosFromAlbum method.
   * @callback SBW.Controllers.Services.Picasa~getPhotosFromAlbum-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc Create a new album.
   * @param  {String}   title Title text of the album.
   * @param  {String}    description Description of the album.
   * @param  {SBW.Controllers.Services.Picasa~createAlbum-successCallback}  successCallback  callback function to be called with xml response after creating the album successfully.
   * @param  {SBW.Controllers.Services.Picasa~createAlbum-errorCallback}  errorCallback  callback function to be called in case of error while creating album.
   */
  createAlbum: function (title, description, successCallback, errorCallback) {
    var service = this,
      createAlbumCallback = function (title, description, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          data = "<?xml version='1.0' encoding='UTF-8'?> <entry xmlns='http://www.w3.org/2005/Atom' xmlns:media='http://search.yahoo.com/mrss/' xmlns:gphoto='http://schemas.google.com/photos/2007'><title type='text'>" + title + "</title><summary type='text'>" + description + "</summary><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/photos/2007#album' /></entry>";
        SBW.Singletons.utils.ajax({url: url, data: data, contentType: 'application/atom+xml', crossDomain: false, type: "POST"}, successCallback, errorCallback);
      },
      callback = (function (title, description, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            createAlbumCallback(title, description, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              createAlbumCallback(title, description, successCallback, errorCallback);
            });
          }
        };
      })(title, description, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for createAlbum method.
   * @callback SBW.Controllers.Services.Picasa~createAlbum-successCallback
   * @param {Object} response JSON response from the service
   **/
  /**
   * Error Callback for createAlbum method.
   * @callback SBW.Controllers.Services.Picasa~createAlbum-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc  Delete an Album
   * @param {String}     albumId          Album Id of the album to delete.
   * @param  {SBW.Controllers.Services.Picasa~deleteAlbum-successCallback}  successCallback  callback function to be called after deleting the album successfully
   * @param  {SBW.Controllers.Services.Picasa~deleteAlbum-errorCallback}  errorCallback  callback function to be called in case of error while deleting the album.
   */
  deleteAlbum: function (albumId, successCallback, errorCallback) {
    var service = this,
      deleteAlbumCallback = function (albumId, successCallback, errorCallback) {
        var feedUrl = service.entryUrl + '/albumid/' + albumId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl);
        SBW.Singletons.utils.ajax({url: url, crossDomain: false, type: "DELETE", customHeaders: {"Gdata-Version": "2", "If-match": "*"}}, successCallback, errorCallback);
      },
      callback = (function (albumId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            deleteAlbumCallback(albumId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              deleteAlbumCallback(albumId, successCallback, errorCallback);
            });
          }
        };
      })(albumId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * Success Callback for deleteAlbum method.
   * @callback SBW.Controllers.Services.Picasa~deleteAlbum-successCallback
   * @param {Object} response JSON response from the service
   **/
  /**
   * Error Callback for deleteAlbum method.
   * @callback SBW.Controllers.Services.Picasa~deleteAlbum-errorCallback
   * @param {Object} response JSON response from the service
   **/

  /**
   * @method
   * @desc Get profile picture of logged in user.
   * @param {Callback} successCallback callback function to be called with the url of the profile picture after successfully fetching the user details.
   * @param {Callback} errorCallback callback function to be called in case of error while fetching the user details.
   */
  getProfilePic: function (userId, successCallback, errorCallback) {
    var service = this;
      service.getAlbums(function (response) {
        var responseFeed = response.feed;
        if(responseFeed.gphoto$thumbnail.$t) {
          successCallback(responseFeed.gphoto$thumbnail.$t);
        } else{
          errorCallback();
        }
      }, errorCallback);
  }
  /**
   * Success Callback for getProfilePic method.
   * @callback SBW.Controllers.Services.Picasa~getProfilePic-successCallback
   * @param {String} response profile picture url.
   **/
  /**
   * Error Callback for getProfilePic method.
   * @callback SBW.Controllers.Services.Picasa~getProfilePic-errorCallback
   * @param {Object} response JSON response from the service
   **/
});
