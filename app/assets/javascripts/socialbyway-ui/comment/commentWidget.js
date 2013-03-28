(function($) { /*jslint nomen: true*/
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
    _create: function() {
      var self = this;
      self.serviceFactory = SBW.Singletons.serviceFactory;
      // Tabs UI
      self.$tabsDiv = $('<div/>').attr('class', "sbw-widget sbw-comment-widget-" + self.options.class);
      self.$textBox = $('<textarea/>', {
        name: 'comment',
        'class': 'comment-box',
        maxlength: 5000,
        cols: 62,
        rows: 8,
        placeholder: self.options.labelPlaceholder || "Enter your comment..."
      });
      self.$actionStrip = $('<div/>', {
        'class': "actions-strip"
      });

      self.$tabsDiv.on('click', '.service-box input', function(e) {
        var that = this,
          value = that.value;
        if ($(that).is(":checked")) {
          $(that).prop('checked', false);
          self.serviceFactory.getService(value).startActionHandler(function() {
            $(that).prop('checked', true);
            self.$actionStrip.find(".service-container." + value).addClass('selected');
          });
        } else {
          self.$actionStrip.find(".service-container." + value).removeClass('selected');
        }
      });

      self.options.services.forEach(function(value) {
        self.$actionStrip.append("<div class='service-box'> <input type='checkbox' name='service' value='" + value + "'/> <div class='service-container " + value + "'></div></div>");
      });
      self.$postBtn = $('<button/>').addClass('post-comment').text(self.options.buttonText || "Comment");

      self.$postBtn.on("click", this, this._addPost);

      self.$actionStrip.append(self.$postBtn).append('<div class="clear"></div>');
      self.$tabsDiv.append(self.$textBox).append(self.$actionStrip);
      self.element.append(self.$tabsDiv);
    },
    /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {String} successMessage The success message to be displayed.
     * @property {String[]} services Name of the registered services.
     * @property {Number} limit The widget post limit.
     * @property {Number} offset The offset for the widget.
     * @property {String} theme The theme for the widget.
     * @property {String} labelPlaceholder Text for the Input placeholder.
     * @property {String} buttonText Text for post button.
     * @property {String} title Header for the widget.
     */
    options: {
      successMessage: '',
      services: ['facebook'],
      limit: 10,
      offset: 0,
      class: "default",
      labelPlaceholder: "Enter text..",
      buttonText: "comment",
      title: "Comment",
      postId: null
    },
    /**
     * @method
     * @desc Sets the Post Id for comment widget instace
     * $param id Id of the Post.
     */
    setPostId: function(id) {
      var self = this;
      self.options.postId = id;
    },
    /**
     * @method
     * @desc Removes the widget from display
     */
    destroy: function() {
      this.$tabsDiv.remove();
      $.Widget.prototype.destroy.call(this);
    },
    /**
     * @method
     * @memberof CommentWidget
     * @param e
     * @private
     */
    _addPost: function(e) {
      var self = e.data,
        postText = self.$textBox.val(),
        serviceArr = [],
        successCallback = function(response) {
          var elem = self.$tabsDiv.find(".sbw-success-message");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.serviceName + ".");
          } else {
            self.$tabsDiv.append('<span class="sbw-success-message">Successfully posted on ' + response.serviceName + '.</span>');
          }
        },
        failureCallback = function(response) {
          self.$tabsDiv.append('<span class="sbw-error-message">Some problem in posting with ' + response.serviceName + '.</span>');
        };
      self.$actionStrip.find("input:checked").each(function() {
        serviceArr.push(this.value);
        if (this.value === 'twitter') {
          postText = postText.substring(0, 140); //twitter character limit
        }
      });
      self.$tabsDiv.find(".sbw-success-message").remove();
      self.$tabsDiv.find(".sbw-error-message").remove();

      SBW.api.postComment(serviceArr, {
        assetId: self.options.postId
      }, postText, successCallback, failureCallback);

    }
  });
})(jQuery);