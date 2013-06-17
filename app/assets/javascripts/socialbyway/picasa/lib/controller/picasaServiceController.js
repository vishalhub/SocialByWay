/**
 * @class  Picasa
 * @classdesc Picasa service implementation
 * @augments ServiceController
 * @constructor
 **/
SBW.Controllers.Services.Picasa = SBW.Controllers.Services.ServiceController.extend( /** @lends SBW.Controllers.Services.Picasa# */ {
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
  /** @property {Object} collectionSetRawData Holds raw data response of the collection set from picasa.
   *  @ignore
   */
  collectionSetRawData: null,
  /**
   * @method
   * @desc Initialize method to setup require items
   */
  init: function() {
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
  startActionHandler: function(callback) {
    var service = this,
      accessTokenListner = function(windowRef) {
        if (!windowRef.closed) {
          if (service.getCookie('picasaToken')) {
            windowRef.close();
            service.getAccessToken.call(service, callback);
          } else {
            setTimeout(function() {
              accessTokenListner(windowRef);
            }, 2000);
          }
        }
      };
    if (service.authWindowReference === undefined || service.authWindowReference === null || service.authWindowReference.closed) {
      service.authWindowReference = window.open(service.accessObject.accessTokenUrl, 'picasa' + new Date().getTime(), service.getPopupWindowParams({
        height: 500,
        width: 400
      }));
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
  checkUserLoggedIn: function(callback) {
    var service = this,
      access_token = service.accessObject.access_token,
      url = "https://accounts.google.com/o/oauth2/tokeninfo?v=2.1&access_token=" + access_token;
    SBW.Singletons.utils.ajax({
      url: url,
      type: "GET",
      dataType: "jsonp"
    }, function(response) {
      if (response.error) {
        service.eraseCookie('picasaToken');
        callback(false);
      } else {
        callback(true);
      }
    }, function(response) {
      service.eraseCookie('picasaToken');
      callback(false);
    });
  },
  /**
   * @method
   * @desc Retrieves access tokens from cookie and sets it to accessObject
   * @param {Callback} callback callback function to be called after fetching access token
   */
  getAccessToken: function(callback) {
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
  _generateMultipart: function(title, description, image, mimetype, isRaw) {
    if(!isRaw){
      image = new Uint8Array(image); // Wrap in view to get data
    }

    var before = ['Media multipart posting', "   \n", '--END_OF_PART', "\n", 'Content-Type: application/atom+xml', "\n", "\n", "<entry xmlns='http://www.w3.org/2005/Atom'>", '<title>', title, '</title>', '<summary>', description, '</summary>', '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/photos/2007#photo" />', '</entry>', "\n", '--END_OF_PART', "\n", 'Content-Type:', mimetype, "\n\n"].join(''),
      after = '\n--END_OF_PART--', imageSize = isRaw ? image.length : image.byteLength,
      size = before.length + imageSize + after.length,
      uint8array = new Uint8Array(size),
      i = 0,
      j = 0;

    // Append the string.
    for (i; i < before.length; i = i + 1) {
      uint8array[i] = before.charCodeAt(i) & 0xff;
    }

    // Append the binary data.
    for (j; j < imageSize; i = i + 1, j = j + 1) {
      uint8array[i] = isRaw ?  image.charCodeAt(j) : image[j];
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
  getAlbums: function(successCallback, errorCallback) {
    var service = this,
      getAlbumsCallback = function(successCallback, errorCallback) {
        var message = {
          action: service.feedUrl,
          method: "GET",
          parameters: {
            kind: 'album',
            access: 'all',
            alt: 'json',
            access_token: service.accessObject.access_token
          }
        },
        url = service.feedUrl + '?access_token=' + service.accessObject.access_token + '&alt=json';
        if (service.content.length > 0) {
          successCallback(service.content);
        } else {
          SBW.Singletons.utils.ajax({
            url: url,
            crossDomain: false,
            type: "GET",
            dataType: "jsonp"
          }, function(response) {
            var collection = null;
            service.content = [];
            response.feed.entry && $.each(response.feed.entry, function(key, value) {
              collection = new SBW.Models.AssetCollection({
                title: this.title.$t,
                createdTime: new Date().getTime(),
                status: this.gphoto$access.$t,
                serviceName: 'picasa',
                metadata: {
                  dateUpdated: new Date(this.updated.$t).toDateString(),
                  dateUploaded: new Date(this.published.$t).toDateString(),
                  numAssets: this.gphoto$numphotos.$t,
                  assetCollectionId: this.gphoto$id.$t,
                  commentCount: this.gphoto$commentCount.$t,
                  thumbnail: this.media$group.media$thumbnail[0].url || '',
                  fileName: this.gphoto$name.$t,
                  description: this.summary.$t,
                  author: this.author[0].name.$t
                }
              });
              collection.id = collection.getID();
              service.content.push(collection);
              service.collectionSetRawData = response;
            });
            successCallback(service.content);
          }, errorCallback);
        }
      },
      callback = (function(successCallback, errorCallback) {
        return function(isLoggedIn) {            
            getAlbumsCallback(successCallback, errorCallback);            
        };
      })(successCallback, errorCallback);

    service.startActionHandler(callback);
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
   * @param  {Callback} successCallback {@link SBW.Controllers.Services.ServiceController~uploadPhoto-successCallback Callback} to be executed on successful photo upload.
   * @param  {Callback} errorCallback {@link SBW.Controllers.Services.ServiceController~uploadPhoto-errorCallback Callback} to be executed on photo upload error.
   */
  uploadPhoto: function(mediaData, successCallback, errorCallback) {
    var service = this,
      mediaDataLength = mediaData.length,
      upload = function(mediaData, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '/albumid/default?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          uploadStatus = [];
        $.each(mediaData, function() {
          var filedata = this,
            reader = new FileReader();
          reader.onload = (function(mediaData) {
            return function(e) {
              SBW.Singletons.utils.ajax({
                url: url,
                data: service._generateMultipart(mediaData.title, mediaData.description, e.target.result, mediaData.file.type, false),
                contentType: 'multipart/related; boundary="END_OF_PART"',
                crossDomain: false,
                type: "POST",
                dataType: "json",
                processData: false
              }, function(response) {
                uploadStatus.push(new SBW.Models.UploadStatus({
                  serviceName: 'picasa',
                  id: response.entry.gphoto$id.$t,
                  rawData: response
                }));
                if (uploadStatus.length === mediaDataLength) {
                  successCallback(uploadStatus);
                }
              }, function() {
                uploadStatus.push(new SBW.Models.Error({
                  serviceName: 'picasa',
                  rawData: value
                }));
                if (uploadStatus.length === mediaData.length) {
                  errorCallback(uploadStatus);
                }
              });
            };
          })(filedata);

          // Read in the image file as a data URL.
          reader.readAsArrayBuffer(filedata.file);
        });
      },
      callback = (function(mediaData, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            upload(mediaData, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
              upload(mediaData, successCallback, errorCallback);
            });
          }
        };
      })(mediaData, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @desc Upload video to the user's dropbox album.
   * @param  {SBW.Models.UploadFileMetaData} mediaData Object containing media's file object and other metadata.
   * @param  {Callback} successCallback {@link SBW.Controllers.Services.ServiceController~uploadVideo-successCallback Callback} to be executed on successful video upload.
   * @param  {Callback} errorCallback {@link SBW.Controllers.Services.ServiceController~uploadVideo-errorCallback Callback} to be executed on video upload error.
   */
  uploadVideo: function(mediaData, successCallback, errorCallback) {
    var service = this;
    service.uploadPhoto(mediaData, successCallback, errorCallback);
  },

  /**
   * @method
   * @desc formats media to SBW.ImageAsset
   * Formats the picasa response into SBW.ImageAsset.
   * @param  {Object}    response  json response received from picasa api.
   * @return {SBW.ImageAsset} SBW.ImageAsset
   * @ignore
   */
  _formatMedia: function(media) {
    var asset = new SBW.Models.ImageAsset({
      title: media.title.$t,
      createdTime: media.gphoto$timestamp.$t,
      rawData: media,
      serviceName: 'picasa',
      src: media.content.src,
      metadata: {
        dateUpdated: new Date(media.updated.$t).toDateString(),
        downloadUrl: media.content.src,
        dateUploaded: new Date(media.published.$t).toDateString(),
        size: media.gphoto$size.$t,
        assetId: media.gphoto$id.$t,
        assetCollectionId: media.gphoto$albumid.$t,
        height: media.gphoto$height.$t,
        width: media.gphoto$width.$t,
        commentCount: media.gphoto$commentCount.$t,
        originalFormat: media.content.type,
        version: media.gphoto$imageVersion.$t,
        description: media.summary.$t,
        author: media.media$group.media$credit[0].$t
      }
    });
    asset.id = asset.getID();
    return asset;
  },

  /**
   * @method
   * @desc Post comment on the photo referred by the given albumId and photoId.
   * @param  {String}   comment         Comment text to be posted.
   * @param  {Object}   idObject        Cotanins Asset Id and AssetCollection Id for the asset.
   * @param  {Callback} successCallback  {@link SBW.Controllers.Services.ServiceController~postComment-successCallback Callback} to be executed on successful comment posting.
   * @param  {Callback} errorCallback  {@link SBW.Controllers.Services.ServiceController~postComment-errorCallback Callback} to be executed on comment posting error.
   */
  postComment: function(idObject, comment, successCallback, errorCallback) {
    var service = this,
      postCommentCallback = function(comment, idObject, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '/albumid/' + idObject.assetCollectionId + '/photoid/' + idObject.assetId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          data = "<?xml version='1.0' encoding='UTF-8'?> <entry xmlns='http://www.w3.org/2005/Atom'><content>" + comment + "</content><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/photos/2007#comment' /></entry>";
        SBW.Singletons.utils.ajax({
          url: url,
          data: data,
          contentType: 'application/atom+xml',
          crossDomain: false,
          type: "POST",
          processData: false
        }, successCallback, errorCallback);
      },
      callback = (function(comment, idObject, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            postCommentCallback(comment, idObject, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
              postCommentCallback(comment, idObject, successCallback, errorCallback);
            });
          }
        };
      })(comment, idObject, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc Fetch comments for the given photo from the given album
   * @param  {Object}   idObject        Cotanins Asset Id and AssetCollection Id for the asset.
   * @param {Callback} successCallback  {@link SBW.Controllers.Services.ServiceController~getComments-successCallback Callback} to be executed on successful comments retrieving.
   * @param {Callback} errorCallback  {@link SBW.Controllers.Services.ServiceController~getComments-errorCallback Callback} to be executed on retrieving comments error.
   */
  getComments: function(idObject, successCallback, errorCallback) {
    var service = this,
      getCommentsCallback = function(idObject, successCallback, errorCallback) {
        var url = service.feedUrl + '/albumid/' + idObject.assetCollectionId + '/photoid/' + idObject.assetId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          cachedAsset = service.getAsset('picasa', idObject.assetCollectionId, idObject.assetId);
        if (cachedAsset === undefined || cachedAsset.metadata.comments === null || cachedAsset.metadata.comments === undefined) {
          SBW.Singletons.utils.ajax({
            url: url,
            crossDomain: false,
            type: "GET",
            dataType: "json"
          }, function(response) {
            var commentsArray = [];
            if (response.feed.entry) {
              $.each(response.feed.entry, function(key, value) {
                var comment = new SBW.Models.Comment();
                comment.text = value.content.$t;
                comment.createdTime = value.updated.$t;
                comment.fromUser = value.author[0].name.$t;
                commentsArray.push(comment);
              });
              service._populateComments(idObject.assetCollectionId, idObject.assetId, commentsArray);
            }
            successCallback(commentsArray);
          }, errorCallback);
        } else {
          successCallback(cachedAsset.metadata.commentsArray);
        }
      },
      callback = (function(idObject, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            getCommentsCallback(idObject, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
              getCommentsCallback(idObject, successCallback, errorCallback);
            });
          }
        };
      })(idObject, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc Fetch photo details from album
   * @param {String}   albumId          Album Id from which to fetch the photo details.
   * @param {SBW.Controllers.Services.Picasa~getPhotosFromAlbum-successCallback} successCallback  callback function to be called with json response after fetching the photo details successfully.
   * @param {SBW.Controllers.Services.Picasa~getPhotosFromAlbum-errorCallback} errorCallback  callback function to be called in case of error while fetching photo details.
   */
  getPhotosFromAlbum: function(albumId, successCallback, errorCallback) {
    var service = this,
      getPhotosFromAlbumCallback = function(albumId, successCallback, errorCallback) {
        var url = service.feedUrl + '/albumid/' + albumId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          assetFound = false;
        service.content.forEach(function(collectionValue, collectionIndex, serviceContentArray) {
          if (collectionValue.metadata.assetCollectionId === albumId) {
            if (collectionValue.assets.length > 0) {
              successCallback(collectionValue.assets);
              assetFound = true;
            }
          }
        });
        if (!assetFound) {
          SBW.Singletons.utils.ajax({
            url: url,
            crossDomain: false,
            type: "GET",
            dataType: "json"
          }, function(response) {
            var photoArray = [];
            if (response.feed.entry) {
              $.each(response.feed.entry, function(key, value) {
                photoArray.push(service._formatMedia(value));
              });
              service._populateAssets(response.feed.gphoto$id.$t, photoArray);
            }
            successCallback(photoArray);
          }, errorCallback);
        }
      },
      callback = (function(albumId, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            getPhotosFromAlbumCallback(albumId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
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
  createAlbum: function(title, description, successCallback, errorCallback) {
    var service = this,
      createAlbumCallback = function(title, description, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          data = "<?xml version='1.0' encoding='UTF-8'?> <entry xmlns='http://www.w3.org/2005/Atom' xmlns:media='http://search.yahoo.com/mrss/' xmlns:gphoto='http://schemas.google.com/photos/2007'><title type='text'>" + title + "</title><summary type='text'>" + description + "</summary><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/photos/2007#album' /></entry>";
        SBW.Singletons.utils.ajax({
          url: url,
          data: data,
          contentType: 'application/atom+xml',
          crossDomain: false,
          type: "POST"
        }, successCallback, errorCallback);
      },
      callback = (function(title, description, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            createAlbumCallback(title, description, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
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
  deleteAlbum: function(albumId, successCallback, errorCallback) {
    var service = this,
      deleteAlbumCallback = function(albumId, successCallback, errorCallback) {
        var feedUrl = service.entryUrl + '/albumid/' + albumId + '?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl);
        SBW.Singletons.utils.ajax({
          url: url,
          crossDomain: false,
          type: "DELETE",
          customHeaders: {
            "Gdata-Version": "2",
            "If-match": "*"
          }
        }, successCallback, errorCallback);
      },
      callback = (function(albumId, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            deleteAlbumCallback(albumId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
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
   * @param {Callback} successCallback  {@link SBW.Controllers.Services.ServiceController~getProfilePic-successCallback Callback} to be executed on successful profile picture retrieval.
   * @param {Callback} errorCallback  {@link SBW.Controllers.Services.ServiceController~getProfilePic-errorCallback Callback} to be executed on profile picture retrieving error.
   */
  getProfilePic: function(userId, successCallback, errorCallback) {
    var service = this,
      getProfilePicCallback = function(successCallback, errorCallback) {
        var responseFeed = service.collectionSetRawData.feed;
        if (responseFeed.gphoto$thumbnail.$t) {
          successCallback(responseFeed.gphoto$thumbnail.$t);
        } else {
          errorCallback();
        }
      };
    if (service.collectionSetRawData) {
      getProfilePicCallback(successCallback, errorCallback);
    } else {
      service.getAlbums(function(response) {
        getProfilePicCallback(successCallback, errorCallback);
      }, errorCallback);
    }
  },
  /**
   * @method
   * @desc Logs user out of service.
   * @param {Function} successCallback  Callback to be executed on successful logging out.
   * @param {Function} errorCallback  Callback to be executed on logging out error.
   */
  logout: function(successCallback, errorCallback) {
    var service = this;
    service.accessObject.token = null;
    service.eraseCookie('picasaToken');
    service.content = [];
    successCallback();
  },

    /**
     * @method
     * @desc uploads raw image     
     * @param {Array} mediaData array of image meta data objects
     * @param {Function} successCallback  Callback to be executed on successful logging out.
     * @param {Function} errorCallback  Callback to be executed on logging out error.
     */
    uploadRawImage: function(mediaData, successCallback,errorCallback){
      var service = this,
      mediaDataLength = mediaData.length,
      upload = function(mediaData, successCallback, errorCallback) {
        var feedUrl = service.feedUrl + '/albumid/default?access_token=' + service.accessObject.access_token + '&alt=json',
          url = SBW.Singletons.config.proxyURL + '?url=' + encodeURIComponent(feedUrl),
          uploadStatus = [];
          $.each(mediaData, function() {
              var filedata = this;

              SBW.Singletons.utils.ajax({
                url: url,
                data: service._generateMultipart(filedata.title, filedata.description, filedata.file, "image/jpeg", true),
                contentType: 'multipart/related; boundary="END_OF_PART"',
                crossDomain: false,
                type: "POST",
                dataType: "json",
                processData: false
              }, function(response) {
                uploadStatus.push(new SBW.Models.UploadStatus({
                  serviceName: 'picasa',
                  id: response.entry.gphoto$id.$t,
                  rawData: response
                }));
                if (uploadStatus.length === mediaDataLength) {
                  successCallback(uploadStatus);
                }
              }, function(response) {
                uploadStatus.push(new SBW.Models.Error({
                  serviceName: 'picasa',
                  rawData: response
                }));
                if (uploadStatus.length === mediaData.length) {
                  errorCallback(uploadStatus);
                }
              });
        });
      },
      callback = (function(mediaData, successCallback, errorCallback) {
        return function(isLoggedIn) {
          if (isLoggedIn) {
            upload(mediaData, successCallback, errorCallback);
          } else {
            service.startActionHandler(function() {
              upload(mediaData, successCallback, errorCallback);
            });
          }
        };
      })(mediaData, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
    },   


  /**
   * @method
   * @desc Populate assets into asset collections.
   * @param {String} assetCollectionId Id of the asset collection
   * @param {Array} assets Array of {@link SBW.Models.Asset Assets}
   * @ignore
   */
  _populateAssets: function(assetcollectionId, assets) {
    var service = this;
    $.each(service.content, function() {
      if (this.metadata.assetCollectionId === assetcollectionId) {
        this.assets = assets;
        return false;
      }
    });
  },

  /**
   * @method
   * @desc Populate comments into asset.
   * @param {String} assetCollectionId Id of the asset collection
   * @param {String} assetId Id of the asset
   * @param {Array} comments Array of {@link SBW.Models.Comment Comments}
   * @ignore
   */
  _populateComments: function(assetcollectionId, assetId, comments) {
    var service = this;
    service.content.forEach(function(collectionValue, collectionIndex, serviceContentArray) {
      if (collectionValue.metadata.assetCollectionId === assetcollectionId) {
        collectionValue.assets.forEach(function(assetValue, assetIndex, assetArray) {
          if (assetValue.metadata.assetId === assetId) {
            assetValue.metadata.comments = comments;
            return assetValue;
          }
        });
      }
    });
  }
});