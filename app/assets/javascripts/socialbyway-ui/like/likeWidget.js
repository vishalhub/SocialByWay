(function ($) {
  /**
   * @class LikeWidget
   * @namespace LikeWidget
   * @classdesc SocialByWay Like Widget to get the Like count based on the service and gives interaction to Like a page/UI
   * @property {Number} count - The aggregated Like count for all services.
   * @property {Object} options - The options for the widget.
   * @property {Object} serviceCount - An object containing the Like count of each service.
   * @augments JQuery.Widget
   * @alias LikeWidget
   * @constructor
   */
  $.widget("ui.LikeWidget", {
    count: 0,
    options: {
      objectId: '100004739166981_133948596773112',
      service: 'facebook',
      theme: 'default',
      objectType: 'POST',
      displayImage: 'false'
    },

    /**
     * @method
     * @private
     * @desc Constructor for the widget.
     */
    _create: function () {
      var self = this;
      var theme = self.options.theme;
      var container = $("<div />", {
        'class': 'sbw-like-widget-' + theme
      });
      self.likeCountContainer = $("<div />", {
        'class': 'count-container'
      });
      var likeContainer = $("<div />", {
        'class': 'like-container'
      });
      container.append(likeContainer);
      container.append(self.likeCountContainer);
      $(self.element).append(container);
      likeContainer.on('click', self, self.likeForService)
    },

    /**
     * @method
     * @desc Method to like for service.
     * @param {Event} event The event object
     */
    likeForService: function (event) {
      var self = event.data;
//      determine whether like is on post and call likeClickedOnPost
      if (self.options.objectType === 'POST') {
        self.handleLikeClickOnPost.call(self);
      } else {
        self.handleLikeClickOnComment.call(self);
      }
    },

    /**
     * @method
     * @desc Event handler for the like click on post.
     */
    handleLikeClickOnPost: function () {
      var self = this;
      var service = self.options.service;
      var postId = self.options.objectId;
      var ul = $("<ul/>").addClass("user-images");
      self.likeCountContainer.append(ul);
      var picSuccessCallback = function (response) {
        var li = $("<li/>").addClass("user-image");
        var image = $("<img/>").attr("src", response);
        $(li).append($(image));
        $(ul).append($(li));
      };
      var picFailureCallback = function () {
      };
      var likesSuccessCallback = function (response) {
        for (var i = 0; i < response.length; i++) {
          $(ul).empty();
          var userId = response[i].fromId;
          if (response[i].fromUrl) {
            picSuccessCallback(response[i].fromUrl);
          } else {
            SBW.Singletons.serviceFactory.getService("controller").getProfilePic(service, userId,
              picSuccessCallback, picFailureCallback);
          }
        }
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.Singletons.serviceFactory.getService("controller").getLikes(service, postId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.Singletons.serviceFactory.getService("controller").like(service, postId, likeSuccessCallback,
        likeFailureCallback);
    },

    /**
     * @method
     * @desc Event handler for the like click on comment.
     */
    handleLikeClickOnComment: function () {
      var self = this;
      var commentId = self.options.objectId;
      var service = self.options.service;
      var likesSuccessCallback = function (response) {
        var count = response.length;
        $(" .sbw-like-widget-default .count-container").html(count);
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.Singletons.serviceFactory.getService("controller").getLikes(service, commentId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.Singletons.serviceFactory.getService("controller").like(service, commentId, likeSuccessCallback,
        likeFailureCallback);
    },

    /**
     * @method
     * @desc Function to destroy the widget.
     * @ignore
     */
    destroy: function () {
      $.Widget.prototype.destroy.call(this, arguments);
    }
  });
})(jQuery);
