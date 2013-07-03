(function ($) { /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global console, SBW*/
  /**
   * @class CommentWidget
   * @namespace CommentWidget
   * @classdesc SocialByWay Post Widget to  Post messages on to social sites
   * @augments JQuery.Widget
   * @alias CommentWidget
   * @constructor
   */
  "use strict";
  $.widget("ui.CommentWidget", /** @lends CommentWidget.prototype */ {
    _create: function () {
      var self = this;
      self.serviceFactory = SBW.Singletons.serviceFactory;
      // Tabs UI
      self.$tabsDiv = $('<div/>').attr('class', "sbw-widget sbw-comment-widget-" + self.options.theme);
      self.$commentsContainer = $('<div/>').attr('class', "comments-container");
      self.$textBox = $('<textarea/>', {
        name: 'comment',
        'class': 'comment-box',
        maxlength: 5000,
        cols: 62,
        placeholder: self.options.labelPlaceholder || "Enter your comment..."
      });

      self.$postBtn = $('<button/>').addClass('post-comment').text(self.options.buttonText || "Comment");

      self.$postBtn.on("click", this, this._addPost);

      self.$tabsDiv.append(self.$commentsContainer, self.$textBox, self.$postBtn);
      self.element.append(self.$tabsDiv);
      self._populateComments(self);
    },
    /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {String} successMessage The success message to be displayed.
     * @property {String[]} service Name of the registered service.
     * @property {Number} offset The offset for the widget.
     * @property {String} theme The theme for the widget.
     * @property {String} labelPlaceholder Text for the Input placeholder.
     * @property {String} buttonText Text for post button.
     * @property {String} title Header for the widget.
     * @property {Object} Id object of the post
     * @property {Boolean} displayResponse success message and error message display on the screen.
     * @property {Boolean} displayComments to display the comments of the post.
     * @property {Boolean} displayImage to display the image of the user of the respective comment.
     * @property {Boolean} displayPost to display the post.
     */
    options: {
      successMessage: '',
      service: '',
      offset: 0,
      theme: "default",
      labelPlaceholder: "Enter text..",
      buttonText: "Comment",
      title: "Comment",
      postIdObject: {assetId : '',
                     assetCollectionId : ''},
      displayResponse: false,
      displayComments: true,
      displayImage: true,
      displayPost: false
    },
    /**
     * @method
     * @desc Sets the Post Id for comment widget instace
     * $param id Id of the Post.
     */
    setPostId: function (postIdObject) {
      var self = this;
      self.options.postIdObject = postIdObject;
    },
    /**
     * @method
     * @desc Removes the widget from display
     */
    destroy: function () {
      this.$tabsDiv.remove();
      $.Widget.prototype.destroy.call(this);
    },
    /**
     * @method
     * @memberof CommentWidget
     * @param context
     * @private
     */
    _populateComments: function (context) {
      var self = context,
        populateComments = function (comments) {
          var temp = [];
          comments.forEach(function (comment) {
            if(!self.options.displayImage) {
              temp.push("<div class='comment'><span class='frmuser'>" + comment.fromUser + ' : ' + "</span><span class='msg'>" + comment.text + "</span></div>");
            } else {
              var populateCommentsWithImage = function(profilePicUrl){
                temp.push('<div class="comment"><img class="comment-image" src="' + profilePicUrl + '"><span class="frmuser">' + comment.fromUser + ' : ' + "</span><span class='msg'>" + comment.text + "</span></div>");
              }
               SBW.api.getProfilePic(self.options.service,comment.fromUserId, populateCommentsWithImage, function(resp){console.log(resp)});
            }
          });
          self.$commentsContainer.empty();
          self.$commentsContainer.append(temp);
        },
        failureCallback = function () {
          self.$commentsContainer.append("<p>Unable to fetch Comments from" + self.options.service + "</p>");
        };
      SBW.api.getComments(self.options.service, self.options.postIdObject , populateComments, failureCallback);
    },
    /**
     * @method
     * @memberof CommentWidget
     * @param e
     * @private
     */
    _addPost: function (e) {
      var self = e.data,
        postText = self.$textBox.val(),
        successCallback = function (response) {
          if (self.displayResponse) {
            var elem = self.$tabsDiv.find(".sbw-success-message");
            if (elem.length !== 0) {
              elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.serviceName + ".");
            } else {
              self.$tabsDiv.append('<span class="sbw-success-message">Successfully posted on ' + response.serviceName + '.</span>');
            }
          }
          if (self.options.displayComments) {
            self._populateComments(self);
          }
        },
        failureCallback = function (response) {
          if (self.displayResponse) {
            self.$tabsDiv.append('<span class="sbw-error-message">Some problem in posting with ' + response.serviceName + '.</span>');
          }
        };
      self.$textBox.val('');
      if (self.displayResponse) {
        self.$tabsDiv.find(".sbw-success-message").remove();
        self.$tabsDiv.find(".sbw-error-message").remove();
      }

      SBW.api.postComment(self.options.service, self.options.postIdObject, postText, successCallback, failureCallback);

    }
  });
})(jQuery);