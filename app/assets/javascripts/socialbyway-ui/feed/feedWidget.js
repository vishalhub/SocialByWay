(function ($) {
  /**
   * @class FeedWidget
   * @namespace FeedWidget
   * @classdesc SocialByWay Feed Widget to get feed and  Post messages on to social sites
   * @augments JQuery.Widget
   * @alias FeedtWidget
   * @constructor
   */
  "use strict";
  $.widget("ui.FeedWidget", {
    _create: function () {
      var self = this;
      self.tabsDiv = $('<div/>').attr('class', "tabs sbw-feed-widget-" + self.options.theme);
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
      self.containerDiv = $('<div/>').attr('class', 'sbw-feed-container');
      self.commentsDiv = $('<div/>').attr('class', 'comment-container');
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
      self.checkBoxesDiv = $('<div/>').attr('class', 'checkbox-container');

      self.options.services.forEach(function (value) {
        var temp = $('<div/>').attr({
          "class": "checkbox " + value
        }).append("<input type='checkbox' name='service' value='" + value + "'/><div class='userimage'></div><div class='service-container " + value + "'></div>");
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
            temp = '<div class="comments"><img class="uimg" width="50" height="50" src="' + value['picUrl'] + '"/>' + '<p class="details"><span class="name">' + value['fromUser'] + '</span><span class="time">' + text + '</span></p>' + '<p class="message">' + value['text'] + '</p>' + '<p class="likes">Like/Favorite  ' + value['likeCount'] || "0" + '</p></div>';
            self.commentsDiv.append(temp);
          });
        },
        failureCallback = function () {};
      SBW.Singletons.serviceFactory.getService('controller').getCommentsForUrl(self.options.services, {
        url: self.options.id,
        limit: self.options.limit,
        offset: self.options.offset
      }, successCallback, failureCallback);
      self.checkBoxesDiv.insertAfter(self.input);
      self.postBtn.on("click", this, this._addPost);
      self.containerDiv.find(".checkbox-container").on('click', '.checkbox input', function () {
        var value = this.value;
        if ($(this).is(":checked")) {
          self.checkBoxesDiv.find(".service-container." + value).addClass('selected');
          SBW.Singletons.serviceFactory.getService(value).startActionHandler(function () {
            SBW.Singletons.serviceFactory.getService("controller").getProfilePic([value], null, function (response) {
              if (response) {
                self.checkBoxesDiv.find('.' + value + " .userimage").css('background', 'url(' + response + ')');
              }
            }, function (error) {});
          });
        } else {
          self.checkBoxesDiv.find(".service-container." + value).removeClass('selected');
        }
      });

    },
    options: {
      successMessage: '',
      services: ['facebook', 'twitter', 'linkedin'],
      limit: 10,
      offset: 0,
      theme: "default",
      id: location.href
    },
    destroy: function () {
      this.tabsDiv.remove();
      $.Widget.prototype.destroy.call(this);
    },
    _addPost: function (e) {
      var self = e.data,
        postText = self.input.val(),
        ServiceArr = [],
        successCallback = function (response) {
          var elem = self.containerDiv.find(".sbw-success-info");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.service + ".");
          } else {
            self.containerDiv.append('<span class="sbw-success-info">Successfully posted on ' + response.service + '.</span>');
          }
        },
        failureCallback = function (response) {
          self.containerDiv.append('<span class="sbw-success-info">Some problem in posting with ' + (response.service) + '.</span>');
        };
      self.checkBoxesDiv.find("input:checked").each(function () {
        ServiceArr.push(this.value);
      });
      self.containerDiv.find(".sbw-success-message").remove();
      self.containerDiv.find(".sbw-error-message").remove();

      SBW.Singletons.serviceFactory.getService("controller").publishMessage(ServiceArr, postText, successCallback, failureCallback);

    }
  });
})(jQuery);