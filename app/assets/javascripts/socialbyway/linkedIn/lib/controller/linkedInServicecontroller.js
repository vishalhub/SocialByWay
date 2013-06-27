/**
 * @class  LinkedIn
 * @classdesc This is Linkedin service implementation
 * @augments ServiceController
 * @constructor
 **/
SBW.Controllers.Services.LinkedIn = SBW.Controllers.Services.ServiceController.extend(/** @lends SBW.Controllers.Services.LinkedIn# */{
  /**
   * @constant
   * @type {string}
   * @desc The service name
   **/
  name: 'linkedin',
  /**
   * @constant
   * @desc The icon class
   * @type {string}
   **/
  icon: 'linkedin',
  /**
   * @constant
   * @desc The title of the service
   * @type {string}
   **/
  title: 'linkedin',
  /** Instance variable.
   * @desc To check if linkedin is initialized or not
   * @type {boolean}
   */
  linkedInInit: false,
  /**
   * @method
   * @desc Initial parameter initialization or setup
   */
  init: function () {
    this.accessObject = {
      appId: SBW.Singletons.config.services.LinkedIn.apiKey,
      token: null
    };
    this.setup();
  },
  /**
   * @method
   * @desc Resetting the class values
   */
  setup: function () {
    var self = this;
    $(document).ready(function () {
      var scriptEle = document.createElement('script'), done = false;
      scriptEle.src = "//platform.linkedin.com/in.js?async=true";
      scriptEle.onload = scriptEle.onreadystatechange = function () {
        if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
          done = true;
          IN.init({
            api_key: self.accessObject.appId,
            // scope parameters are required based upon on the member permissions
            //  Permission                Scope
            //  User Profile Overview     r_basicprofile
            //  User Full Profile         r_fullprofile
            //  User Email Address		    r_emailaddress
            //  User Connections	        r_network
            //  User Contact Info		      r_contactinfo
            //  Network Updates           rw_nus
            //  Group Discussions		      rw_groups
            //  Invitations and Messages	w_messages
            scope: 'r_network rw_nus r_fullprofile',
            authorize: true
          });
          // Handle memory leak in IE
          scriptEle.onload = scriptEle.onreadystatechange = null;
          self.linkedInInit = true;
        }
      };
      var head = document.getElementsByTagName("head")[0] || document.documentElement;
      head.insertBefore(scriptEle, head.firstChild);
    });
  },

  /**
   * @method
   * @triggers authentication process to the linkedin service.
   **/
  startActionHandler: function (callback) {
    var service = this;
    if (service.linkedInInit && IN.User) {
      if (IN.User.isAuthorized()) {
        callback();
      } else {
        IN.User.authorize(function (response) {
          callback();
        });
      }
    } else {
      setTimeout(function () {
        service.startActionHandler();
      }, 1000);
    }
  },

  /**
   * @method
   * @desc Method to check whether user is logged in(has an authenticated session to service).
   * @param {callback} callback Callback function that will be called after checking login status
   **/
  checkUserLoggedIn: function (callback) {
    var service = this;
    if (service.linkedInInit && IN.User) {
      if (IN.User.isAuthorized()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      setTimeout(function () {
        service.checkUserLoggedIn(callback);
      }, 1000);
    }
  },

  /**
   * @method
   * @desc To post a message to LinkedIn through its API service
   * @param {string} message the message to be published
   * @param {callback} successCallback - success callback will get called if publishing is successful
   * @param {callback} errorCallback - failure callback will get called in case of any error while publishing
   */
  publishMessage: function (message, successCallback, errorCallback) {
    var service = this,
      publish = function (message, successCallback, errorCallback) {
        IN.API.Raw("/people/~/current-status")
          .method("PUT")
          .body(JSON.stringify(message))
          .result(function (result) {
            successCallback({id: "n/a", serviceName: "linkedin"}, result);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            SBW.logger.debug("Could not publish message");
            errorCallback(errorObject);
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
      })(message, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To post a comment to LinkedIn through its API service
   * @param {String} objectId The id of the object against which the comment would be posted
   * @param {string} comment the text to be posted as a comment
   * @param {callback} successCallback - success callback will get called if posting is successful
   * @param {callback} errorCallback - failure callback will get called in case of any error while posting
   */
  postComment: function (objectId, comment, successCallback, errorCallback) {
    var service = this,
      publish = function (objectId, comment, successCallback, errorCallback) {
        var content = {"comment": comment};
        IN.API.Raw("/people/~/network/updates/key=" + objectId + "/update-comments")
          .method("POST")
          .body(JSON.stringify(content))
          .result(function (result) {
            successCallback(result);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            SBW.logger.debug("Could not post message");
            errorCallback(errorObject);
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
   * @desc To like an object on LinkedIn through its API service
   * @param {String} objectId The object to like
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~like-successCallback Callback} will be called if like is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~like-errorCallback Callback} will be called in case of any error while liking
   */
  like: function (objectId, successCallback, errorCallback) {
    var service = this,
      postLike = function (objectId, successCallback, errorCallback) {
        IN.API.Raw("/people/~/network/updates/key=" + objectId + "/is-liked")
          .method("PUT")
          .body("true")
          .result(function (result) {
            successCallback(result);
          })
          .error(function (error) {
            errorCallback(error);
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
   * @desc To undo a like( or unlike) on an object in LinkedIn through its API service
   * @param {String} objectId The object to dislike
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~unlike-successCallback Callback} will be called if unlike is successful
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~unlike-errorCallback Callback} will be called in case of any error while un liking
   */
  unlike: function (objectId, successCallback, errorCallback) {
    var service = this,
      postLike = function (objectId, successCallback, errorCallback) {
        IN.API.Raw("/people/~/network/updates/key=" + objectId + "/is-liked")
          .method("PUT")
          .body("false")
          .result(function (result) {
            successCallback(result);
          })
          .error(function (error) {
            errorCallback(error);
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
   * @desc To share a url in LinkedIn through its API service
   * @param {String} url The url to be shared
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~share-successCallback Callback} will be called if successfully shared the link.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~share-errorCallback Callback} will be called if case of any error in sharing the link.
   */
  share: function (url, successCallback, errorCallback) {
    var service = this,
      shareLink = function (url, successCallback, errorCallback) {
        IN.UI.Share().params({
          url: url
        }).place();
      },
      callback = (function (url, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            shareLink(url, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              shareLink(url, successCallback, errorCallback);
            });
          }
        };
      })(url, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get share count for a url in LinkedIn through its API service
   * @param {String} url The url for which share count is required
   * @param  {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getShareCount-successCallback Callback} will be called if the share count is fetched successfully.
   * @param  {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getShareCount-errorCallback Callback} will be called in case of any error while fetching share count.
   */
  getShareCount: function (url, successCallback, errorCallback) {
    var service = this;
    if (service.linkedInInit && IN.Tags) {
      var success = function (response) {
        successCallback({count: response});
      };
      IN.Tags.Share.getCount(url, success);
    } else {
      setTimeout(function () {
        service.getShareCount(url, successCallback, errorCallback);
      }, 1000);
    }
  },
  /**
   * @method
   * @desc To get comments posted on an object(post) of a LinkedIn user through its API service
   * @param  {Object} idObject the id  object, against which comments posted are to retrieved
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getComments-successCallback Callback} will be called if comments are fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getComments-errorCallback Callback} will be called in case of any error while fetching comments
   */
  getComments: function (idObject, successCallback, errorCallback) {
    var service = this,
      comments = function (idObject, successCallback, errorCallback) {
        IN.API.Raw("/people/~/network/updates/key=" + idObject.assetId + "/update-comments")
          .result(function (result) {
            var commentsData = [], comments = result.values;
            for (var i = 0; i < comments.length; i++) {
              commentsData[i] = new SBW.Models.Comment({
                createdTime: comments[i].timestamp,
                fromUser: comments[i].person.firstName + ' ' + comments[i].person.lastName,
                likeCount: null,
                text: comments[i].comment,
                rawData: comments[i],
                serviceName: "linkedin",
                id: comments[i].id,
                userImage: comments[i].person.pictureUrl
              });
            }
            successCallback(commentsData);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (idObject, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            comments(idObject, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              comments(idObject, successCallback, errorCallback);
            });
          }
        };
      })(idObject, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },
  /**
   * @method
   * @param  {String} url
   * @param  {Callback} successCallback  {@link  SBW.Controllers.Services.ServiceController~getCommentsForUrl-successCallback Callback} will be called if data is fetched successfully
   * @param  {Callback} errorCallback  {@link  SBW.Controllers.Services.ServiceController~getCommentsForUrl-errorCallback Callback} will be called in case of any error while fetching data
   * @ignore
   */
  getCommentsForUrl: function (url, successCallback, errorCallback) {
    //Implement it when Linked In supports comment  for URL
  },
  /**
   * @method
   * @desc To get likes on an object(post) of a LinkedIn user through its API service
   * @param  objectId the id of the object, against which likes posted are to retrieved
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getLikes-errorCallback Callback} will be called in case of any error while fetching data
   */
  getLikes: function (objectId, successCallback, errorCallback) {
    var service = this,
      likes = function (objectId, successCallback, errorCallback) {
        IN.API.Raw("/people/~/network/updates/key=" + objectId + "/likes")
          .result(function (response) {
            var likesData = [];
            var likes = response.values;
            for (var i = 0; i < likes.length; i++) {
              var user = new SBW.Models.User({
                name: likes[i].person.firstName + ' ' + likes[i].person.lastName,
                id: likes[i].person.id,
                userImage: likes[i].person.pictureUrl
              });
              likesData[i] = new SBW.Models.Like({
                user: user,
                rawData: likes[i]
              });
            }
            var likesObject = {
              serviceName: 'linkedin',
              likes: likesData,
              likeCount: likesData.length,
              rawData: response
            };
            // Todo Populating the asset object with the like and user objects
            successCallback(likesObject);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (objectId, successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            likes(objectId, successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              likes(objectId, successCallback, errorCallback);
            });
          }
        };
      })(objectId, successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get updates from a LinkedIn user through its API service
   * @param {String} userId The Id of the user
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getPosts-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getPosts-errorCallback Callback} will be called in case of any error while fetching data
   */
  getPosts: function (userId, successCallback, errorCallback) {
    userId = userId || 'me';
    var service = this,
      updates = function (successCallback, errorCallback) {
        IN.API.MemberUpdates(userId)
          .result(function (result) {
            successCallback(result.values);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            updates(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              updates(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);

    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get Id of the recent post by the logged in user through its API service
   * @param {String} userId The Id of the user
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - failure callback will get called in case of any error while fetching data
   */
  getRecentPostId: function (userId, successCallback, errorCallback) {
    userId = userId || 'me';
    var service = this,
      updates = function (successCallback, errorCallback) {
        IN.API.MemberUpdates(userId)
          .result(function (result) {
            successCallback(result.values[0].updateKey);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            updates(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              updates(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get connections of a LinkedIn user through its API service
   * @param {String} userId The Id of the user
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getFriends-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getFriends-errorCallback Callback} will be called in case of any error while fetching data
   */
  getFriends: function (userId, successCallback, errorCallback) {
    var service = this,
      connections = function (successCallback, errorCallback) {
        IN.API.Raw("people/~/connections")
          .result(function (result) {
            successCallback(JSON.stringify(result));
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            connections(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              connections(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To follow a company in LinkedIn through its API service
   * @param {string} companyId - Id of the company to be followed
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - error callback will get called in case of any error while fetching data
   */
  follow: function (companyId, successCallback, errorCallback) {
    var service = this,
      connections = function (successCallback, errorCallback) {
        var url = '/people/~/following/companies', body = {"id": companyId}, unfollowFlag = false;
        IN.API.Raw()
          .url(url)
          .result(function (result) {
            if(result.values){
              result.values.forEach(function (value) {
              if (Number(companyId) === Number(value.id)) {
                unfollowFlag = true;
                IN.API.Raw()
                  .url(url + '/id=' + companyId)
                  .method('DELETE')
                  .result(function (result) {
                    setTimeout(function () {
                      successCallback(result);
                    }, 1000);
                  })
                  .error(function (error) {
                    errorCallback(error);
                  });
              }
            });
          }
            if (!unfollowFlag) {
              IN.API.Raw()
                .url(url)
                .method('POST')
                .body(JSON.stringify(body))
                .result(function (result) {
                  setTimeout(function () {
                    successCallback(result);
                  }, 1000);
                })
                .error(function (error) {
                  errorCallback(error);
                });
            }
          })
          .error(function (error) {
            errorCallback(error);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            connections(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              connections(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get follow count of a LinkedIn object/company through its API service
   * @param {string} companyId - Id of the company for which follow count is required
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - error callback will get called in case of any error while fetching data
   */
  getFollowCount: function (companyId, successCallback, errorCallback) {
    var service = this,
      url = 'companies/' + companyId + ':(num-followers)';
    if (service.linkedInInit && IN.API) {
      IN.API.Raw()
        .url(url)
        .result(function (result) {
          successCallback({count: result.numFollowers, serviceName: 'linkedin'});
        })
        .error(function (error) {
          var errorObject = new SBW.Models.Error({
            message: error.message,
            serviceName: 'linkedin',
            rawData: error,
            code: error.errorCode
          });
          errorCallback(errorObject);
        });
    } else {
      setTimeout(function () {
        service.getFollowCount(companyId, successCallback, errorCallback);
      }, 1000);
    }
  },

  /**
   * @method
   * @desc To get recommend count from LinkedIn through its API service
   * @param {string} companyId - Id of the company for which recommend count is required
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - error callback will get called in case of any error while fetching data
   */
  getRecommendCount: function (companyId, successCallback, errorCallback) {
    var service = this,
      body = {"id": companyId},
      url = '/companies/' + companyId + '/products:(id,name,type,num-recommendations,recommendations:(recommender))';
    if (service.linkedInInit && IN.API) {
      IN.API.Raw()
        .url(url)
        .result(function (result) {
          successCallback(result);
        })
        .error(function (error) {
          errorCallback(error);
        });
    } else {
      setTimeout(function () {
        service.getRecommendCount(companyId, successCallback, errorCallback);
      }, 1000);
    }
  },

  /**
   * @method
   * @desc To get profile data from a LinkedIn user through its API service
   * @param {String} userId The Id of the user
   * @param {callback} successCallback - success callback will get called if data is fetched successfully
   * @param {callback} errorCallback - error callback will get called in case of any error while fetching data
   */
  getProfile: function (userId, successCallback, errorCallback) {
    userId = userId || 'me';
    var service = this,
      profile = function (successCallback, errorCallback) {
        IN.API.Profile(userId)
          .fields(["id", "firstName", "lastName", "pictureUrl"])
          .result(function (result) {
            var profile = result.values[0];
            var profileData = {"id": profile.id, "name": profile.firstName + ' ' + profile.lastName, "photoUrl": profile.pictureUrl };
            successCallback(profileData);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            profile(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              profile(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  },

  /**
   * @method
   * @desc To get profile data from a LinkedIn user through its API service
   * @param {String} userId The Id of the user
   * @param {Callback} successCallback {@link  SBW.Controllers.Services.ServiceController~getProfilePic-successCallback Callback} will be called if data is fetched successfully
   * @param {Callback} errorCallback {@link  SBW.Controllers.Services.ServiceController~getProfilePic-errorCallback Callback} will be called in case of any error while fetching data
   */
  getProfilePic: function (userId, successCallback, errorCallback) {
    userId = userId || 'me';
    var service = this,
      profilePic = function (successCallback, errorCallback) {
        IN.API.Profile(userId)
          .fields(["pictureUrl"])
          .result(function (result) {
            var profile = result.values[0];
            successCallback(profile.pictureUrl);
          })
          .error(function (error) {
            var errorObject = new SBW.Models.Error({
              message: error.message,
              serviceName: 'linkedin',
              rawData: error,
              code: error.errorCode
            });
            errorCallback(errorObject);
          });
      },
      callback = (function (successCallback, errorCallback) {
        return function (isLoggedIn) {
          if (isLoggedIn) {
            profilePic(successCallback, errorCallback);
          } else {
            service.startActionHandler(function () {
              profilePic(successCallback, errorCallback);
            });
          }
        };
      })(successCallback, errorCallback);
    service.checkUserLoggedIn(callback);
  }
});
