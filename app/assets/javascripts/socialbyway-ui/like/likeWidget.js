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
      objectId: '100004207443785_161177570699157',
      service: 'facebook',
      theme: 'default',
      objectType: 'Comment',
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
      var $container = $("<div />").addClass('sbw-like-widget-' + theme);
      var $likeContainer = $("<div />").addClass('like-container');
      self.$likeCountContainer = $("<div />").addClass('count-container');
      $container.append($likeContainer).append(self.$likeCountContainer);
      $(self.element).append($container);
      $likeContainer.on('click', self, self.likeForService)
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
      var picSuccessCallback = function (response) {
        var $image = $("<img/>").attr("src", response);
        self.$likeCountContainer.append($($image));
      };
      var picFailureCallback = function () {
      };
      var likesSuccessCallback = function (response) {
        for (var i = 0; i < response['likeCount']; i++) {
          self.$likeCountContainer.empty();
          var userId = response['likes'][i]['user']['id'];
          if (response['likes'][i]['user']['userImage']) {
            picSuccessCallback(response['likes'][i]['user']['userImage']);
          } else {
            SBW.api.getProfilePic(service, userId,
              picSuccessCallback, picFailureCallback);
          }
        }
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.api.getLikes(service, postId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.api.like(service, postId, likeSuccessCallback,
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
        var count = response['likeCount'];
        self.$likeCountContainer.addClass('comment').html(count);
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.api.getLikes(service, commentId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.api.like(service, commentId, likeSuccessCallback,
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
