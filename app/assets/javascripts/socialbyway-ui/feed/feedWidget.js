/**
 * @class FeedWidget
 * @classdesc This is Feed Widget
 * @constructor
 */
(function ($) {
  "use strict";
  $.widget("ui.FeedWidget", /** @lends FeedWidget.prototype */{
    _create: function () {
      var self = this;
      self.tabsDiv = $('<div/>').attr('class', "tabs sbw-post-widget");
      self.tabsUl = $('<ul/>').attr("class", "tabs-ul");
      self.element.append(self.tabsDiv);
      self.tabsDiv.append(self.tabsUl);
      self.postTab = $('<li/>');
      self.postTag = $('<a/>').attr({
        'class': "tab-1"
      }).html("<span>Post</span>");
      self.postTab.append(self.postTag);
      self.tabsUl.append(self.postTab);
      self.postTabDiv = $('<div/>').attr({
        'class': "tab-content"
      });

      self.postTabDiv.insertAfter(self.tabsUl);
      $('#tabs .tab-content').hide();
      $('#tabs div:first').show();

      self.containerDiv = $('<div/>').attr('class', 'sbw-post-div container-div');
      self.commentsDiv = $('<div/>').attr('class', 'comment-div');
      self.postTabDiv.append(self.containerDiv);
      self.postTabDiv.after(self.commentsDiv);

      self.input = $('<textarea/>').attr({
        name: 'comment',
        'class': 'post-box',
        maxlength: 5000,
        cols: 62,
        rows: 8,
        placeholder: 'Write here....'
      }).on('keyup', this, function () {
          self.charsleft.html(this.value.length);
        });
      self.charsleft = $("<p/>").attr({
        'class': 'chars-left'
      }).text('0');
      self.containerDiv.append(self.input);
      self.postBtn = $('<button/>').attr({
        'class': 'post-btn'
      }).text("publish");
      self.checkBoxesDiv = $('<div/>').attr('class', 'check-container');

      self.options.services.forEach(function (value) {
        var temp = $('<div/>').attr({
          "class": "check-div " + value + "-checkbox"
        }).append("<input type='checkbox' name='service' value='" + value + "'/>");
        self.checkBoxesDiv.append(temp);
      });
      self.checkBoxesDiv.append(self.postBtn).append(self.charsleft).append('<div class="clear"></div>');
      var successCallback = function (data) {
          var temp = '',
            date = '',
            text = '';
          data.forEach(function (value) {
            date = new Date(value['createdTime']);
            text = date.toDateString();
            temp = '<div class="comments"><img class="uimg" width="50" height="50" src="' + value['picUrl'] + '"/>' + '<p class="details"><span class="name">' + value['from_user'] + '</span><span class="time">' + text + '</span></p>' + '<p class="message">' + value['text'] + '</p>' + '<p class="likes">Like/Favorite  ' + value['like_count'] + '</p></div>';
            self.commentsDiv.append(temp);
          });
        },
        failureCallback = function () {};

      self.checkBoxesDiv.insertAfter(self.input);


      self.postBtn.on("click", this, this._addPost);
      $('#tabs ul li:first').addClass('active selected');
      $(".sbw-post-div .check-container").on('click', '.check-div input', function () {
        if ($(this).is(":checked")) {
          SBW.Singletons.serviceFactory.getService(this.value).startActionHandler(function () {});
        }
      });

    },
     /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {String} successMessage The success message to be displayed
     * @property {String[]} services Name of the registered services
     * @property {Number} limit The widget post limit
     * @property {Number} offset The offset for the widget
     */
    options: {
      successMessage: '',
      services: ['facebook', 'twitter', 'linkedin'],
      limit: 10,
      offset: 0
    },
    /**
     * @method
     * @desc Removes the widget from display 
     */
    destroy: function () {
      this.tabsDiv.remove();
      $.Widget.prototype.destroy.call(this);
    },
    _addPost: function (e) {
      var self = e.data,
        postText = location.href + " " + $(self.input).val(),
        ServiceArr = [],
        successCallback = function (response) {
          var elem = $(".sbw-post-div .sbw-success-info");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.service + ".");
          } else {
            self.containerDiv.append('<span class="sbw-success-info">Successfully posted on ' + response.service + '.</span>');
          }
        },
        failureCallback = function (response) {
          self.containerDiv.append('<span class="sbw-success-info">Some problem in posting.</span>');
        };
      self.checkBoxesDiv.find("input:checked").each(function () {
        ServiceArr.push(this.value);
      });
      $(".sbw-post-div .sbw-success-info").remove();

      SBW.Singletons.serviceFactory.getService("controller").publishMessage(ServiceArr, postText, successCallback, failureCallback);

    }
  });
})(jQuery);
