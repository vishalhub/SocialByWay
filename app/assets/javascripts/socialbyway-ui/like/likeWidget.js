(function ($)
{
  /**
   * @class LikeWidget
   * @namespace LikeWidget
   * @classdesc SocialByWay Like Widget to get the Like count and functionality to like a page
   * @augments JQuery.Widget
   * @alias LikeWidget
   * @constructor
   */
  $.widget("ui.LikeWidget", /** @lends LikeWidget.prototype */ {
    _create:function ()
    {
      var self = this;
      var containerDiv = $("<div />", {
        'class':'container'
      });
      var serviceDiv = $("<div />", {
        'class':'service-container'
      });
      var flickrDiv = $("<div />", {
        'class':'deg0',
        'data-service':'flickr'
      });
      var googlePlusDiv = $("<div />", {
        'class':'deg45',
        'data-service':'googleplus'
      });
      var linkedInDiv = $("<div />", {
        'class':'deg90',
        'data-service':'linkedin'
      });
      var pinterestDiv = $("<div />", {
        'class':'deg135',
        'data-service':'pinterest'
      });
      var myspaceDiv = $("<div />", {
        'class':'deg180',
        'data-service':'myspace'
      });
      var bingDiv = $("<div />", {
        'class':'deg225',
        'data-service':'bing'
      });
      var facebookDiv = $("<div />", {
        'class':'deg270',
        'data-service':'facebook'
      });
      var twitterDiv = $("<div />", {
        'class':'deg315',
        'data-service':'twitter'
      });
      var likeButton = $('<span />', {
        'class':'like-button-style'
      });
      $(serviceDiv).append(flickrDiv, twitterDiv, facebookDiv, bingDiv, myspaceDiv, pinterestDiv, linkedInDiv,
        googlePlusDiv);
      $(serviceDiv).children().on('click', self, self.likeForService);
      $(serviceDiv).append(likeButton);
      $(containerDiv).append(serviceDiv);
      $(self.element).append(containerDiv);
      self.hideServices();
      $(containerDiv).hover(self.showServices, self.hideServices);
    },
     /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {String} objectId The id of the object
     * @property {String} objectType The type of the object
     */
    options:{
      objectId:'',
      objectType:''
    },
    /**
     * @method
     * @desc Method to show services.
     */
    showServices:function ()
    {
      $('.service-container div').show();
    },
    /**
     * @method
     * @desc Method to hide services.
     */
    hideServices:function ()
    {
      $('.service-container div').hide();
    },
    /**
     * @method
     * @desc Method to authenticate to a service.
     * @param {String} service The name of the registered service.
     */
    authenticate:function (service)
    {
      SBW.Singletons.serviceFactory.getService(service).startActionHandler(function ()
      {
        console.log('User authenticated for service: ', service);
      });
    },
    /**
     * @method
     * @desc Method to like for service.
     * @param {Event} event The event object
     */
    likeForService:function (event)
    {
      var service = this.getAttribute('data-service');
      var self = event.data;
      self.service = service;
      //determine whether like is on post and call likeClickedOnPost
      if (self.options.objectType === 'POST') {
        self.handleLikeClickOnPost.call(self);
      } else {
        self.handleLikeClickOnComment.call(self);
      }
    },
    /**
     * @method
     * @desc Event handler for the like click on post.
     * @param {Event} event The event object.
     */
    handleLikeClickOnPost:function ()
    {
      var self = this;
      var ul = $(document.createElement("ul")).attr("class", "likes-list");
      $(self.element).find(".comment-style").append(ul);
      var postId = self.options.objectId;
      var picSuccessCallback = function (response)
      {
        var li = $(document.createElement("li")).attr("class", "like-photo");
        var image = $(document.createElement("img")).attr("src", response);
        $(li).append($(image));
        $(ul).append($(li));
      };
      var picFailureCallback = function ()
      {
      };
      var likesSuccessCallback = function (response)
      {
        for (var i = 0; i < response.length; i++) {
          $(ul).empty();
          var userId = response[i].fromId;
          if (response[i].fromUrl) {
            picSuccessCallback(response[i].fromUrl);
          } else {
            SBW.Singletons.serviceFactory.getService("controller").getProfilePic(self.service, userId,
              picSuccessCallback, picFailureCallback);
          }
        }
      };
      var likesFailureCallback = function ()
      {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response)
      {
        SBW.Singletons.serviceFactory.getService("controller").getLikes(self.service, postId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function ()
      {
        alert('Some problem occurred while liking post');
      };
      SBW.Singletons.serviceFactory.getService("controller").like(self.service, postId, likeSuccessCallback,
        likeFailureCallback);
    },
    /**
     * @method
     * @desc Event handler for the like click on comment.
     * @param {Event} event The event object.
     */
    handleLikeClickOnComment:function (event)
    {
      var self = this;
      var likeNames = $(document.createElement("div")).attr("class", "likes-names-div");
      $(likeNames).hide();
      var commentId = self.options.objectId;
      var likesSuccessCallback = function (response)
      {
        var count = response.length;
        for (var i = 0; i < response.length; i++) {
          var names = $(document.createElement("p")).text(response[i].fromName);
          $(likeNames).append(names);
          $(likeNames).show();
          $(self.element).append($(likeNames));
        }
        $(self.element).children(".count-span").text(count);
      };
      var likesFailureCallback = function ()
      {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response)
      {
        SBW.Singletons.serviceFactory.getService("controller").getLikes(self.service, commentId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function ()
      {
        alert('Some problem occurred while liking post');
      };
      SBW.Singletons.serviceFactory.getService("controller").like(self.service, commentId, likeSuccessCallback,
        likeFailureCallback);
    },
	/**
     * @method
     * @desc Removes the widget from display 
     */
    destroy:function ()
    {
      $.Widget.prototype.destroy.call(this, arguments);
    }
  });
})(jQuery);
