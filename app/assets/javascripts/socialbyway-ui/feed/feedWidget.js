(function ($) {
  /**
   * @class FeedWidget
   * @namespace FeedWidget
   * @classdesc SocialByWay Feed Widget to get feed and  Post messages on to social sites
   * @augments JQuery.Widget
   * @alias FeedWidget
   * @constructor
   */
  "use strict";
  $.widget("ui.FeedWidget", /** @lends FeedWidget.prototype */ {
    _create: function () {
      var self = this;
      self.serviceFactory = SBW.Singletons.serviceFactory;
      //UI TAB
      self.$tabsDiv = $('<div/>').addClass("tabs sbw-widget sbw-feed-widget-" + self.options.theme);
      self.$tabsUl = $('<ul/>').addClass("tabs-ul");
      self.element.append(self.$tabsDiv);
      self.$tabsDiv.append(self.$tabsUl);
      self.$postTab = $('<li/>');
      self.$postTag = $('<a/>').addClass('tab-1').html("<span>" + self.options.title + "</span>");
      self.$postTab.append(self.$postTag);
      self.$tabsUl.append(self.$postTab);
      //
      self.$postTabDiv = $('<div/>').addClass('tab-content');
      self.$postTabDiv.insertAfter(self.$tabsUl);
      self.$containerDiv = $('<div/>').addClass('sbw-feed-container');
      self.$commentsDiv = $('<div/>').addClass('comment-container');
      self.$postTabDiv.append(self.$containerDiv);
      self.$tabsUl.after(self.$commentsDiv);

      self.$input = $('<textarea/>', {
        name: 'comment',
        'class': 'post-box',
        maxlength: 5000,
        cols: 62,
        rows: 8,
        placeholder: self.options.labelPlaceholder
      }).on('keyup', this, function () {
        self.$charsleft.html(this.value.length);
      });
      self.$charsleft = $("<p/>").addClass('chars-count').text('0');
      self.$containerDiv.append('<p class="sharemessage">' + self.options.shareMessage + '</p>');
      self.$containerDiv.append(self.$input);
      self.$postBtn = $('<button/>').addClass('post-btn').text(self.options.buttonText);
      self.$checkBoxesDiv = $('<div/>').addClass('checkbox-container');

      self.options.services.forEach(function (value) {
        var temp = $('<div/>').addClass("checkbox " + value).
        append("<input type='checkbox' name='service' value='" + value + "'/>").
        append("<div class='userimage'></div>").
        append("<div class='service-container " + value + "'></div>");
        self.$checkBoxesDiv.append(temp);
      });
      self.$checkBoxesDiv.append(self.$postBtn).
      append(self.$charsleft).
      append('<div class="clear"></div>');

      var successCallback = function (data) {
          var htmlElArr = [],
            date = '',
            text = '';
          data.forEach(function (value) {
            date = new Date(value['createdTime']);
            text = date.toDateString();
            htmlElArr = [];
            htmlElArr.push('<div class="comments"><img class="uimg" width="50" height="50" src="' + value['picUrl'] + '"/>');
            htmlElArr.push('<p class="details"><span class="name">' + value['fromUser'] + '</span><span class="time">' + text + '</span></p>');
            htmlElArr.push('<p class="message">' + value['text'] + '</p>');
            htmlElArr.push('<p class="likes"><span>Like/Favorite  ' + value['likeCount'] + '</span><span class="service ' + value['serviceName'] + '">&nbsp;</span></p></div>');
            self.$commentsDiv.append(htmlElArr.join(''));
          });
        },
        failureCallback = function () {};

      SBW.api.getCommentsForUrl(self.options.services, {
        url: self.options.id,
        limit: self.options.limit,
        offset: self.options.offset
      }, successCallback, failureCallback);
      self.$checkBoxesDiv.insertAfter(self.$input);
      self.$postBtn.on("click", this, this._addPost);
      self.$containerDiv.find(".checkbox-container").on('click', '.checkbox input', function (e) {
        var that = this,
          value = that.value;
        if ($(that).is(":checked")) {
          $(that).prop('checked', false);
          self.serviceFactory.getService(value).startActionHandler(function () {
            $(that).prop('checked', true);
            self.$checkBoxesDiv.find(".service-container." + value).addClass('selected');
            SBW.api.getProfilePic([value], null, function (response) {
              if (response) {
                self.$checkBoxesDiv.find('.' + value + " .userimage").css('background', 'url(' + response + ')');
              }
            }, function (error) {});
          });
        } else {
          self.$checkBoxesDiv.find(".service-container." + value).removeClass('selected');
        }
      });

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
     * @property {String} id Url of the site.
     * @property {String} labelPlaceholder Text for the Input placeholder.
     * @property {String} buttonText Text for post button.
     * @property {String} title Header for the widget.
     * @property {String} shareMessage Message.
     */
    options: {
      successMessage: '',
      services: ['facebook', 'twitter', 'linkedin'],
      limit: 10,
      offset: 0,
      theme: "default",
      id: location.href,
      labelPlaceholder: "Enter text..",
      buttonText: "Publish",
      title: "Feed",
      shareMessage: "Share this page"
    },
    /**
     * @method
     * @desc Removes the widget from display
     */
    destroy: function () {
      this.tabsDiv.remove();
      $.Widget.prototype.destroy.call(this);
    },
    /**
     * @method
     * @memberof PostWidget
     * @param e
     * @private
     */
    _addPost: function (e) {
      var self = e.data,
        postText = self.$input.val(),
        serviceArr = [],
        successCallback = function (response) {
          var elem = self.$containerDiv.find(".sbw-success-info");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.service + ".");
          } else {
            self.$containerDiv.append('<span class="sbw-success-info">Successfully posted on ' + response.service + '.</span>');
          }
        },
        failureCallback = function (response) {
          self.$containerDiv.append('<span class="sbw-success-info">Some problem in posting with ' + (response.service) + '.</span>');
        };
      self.$checkBoxesDiv.find("input:checked").each(function () {
        serviceArr.push(this.value);
        if (this.value === 'twitter') {
          postText = postText.substring(0, 117); //twitter character limit
        }
      });
      postText = window.location.href + " " + postText;
      self.$containerDiv.find(".sbw-success-message").remove();
      self.$containerDiv.find(".sbw-error-message").remove();

      SBW.api.publishMessage(serviceArr, postText, successCallback, failureCallback);

    }
  });
})(jQuery);