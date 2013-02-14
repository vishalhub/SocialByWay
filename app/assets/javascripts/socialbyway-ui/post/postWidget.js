(function ($) { /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global console, SBW*/
  /**
   * @class PostWidget
   * @namespace PostWidget
   * @classdesc SocialByWay Post Widget to  Post messages on to social sites
   * @augments JQuery.Widget
   * @alias PostWidget
   * @constructor
   */
  "use strict";
  $.widget("ui.PostWidget", /** @lends PostWidget.prototype */ {
    _create: function () {
      var self = this;
      self.serviceFactory = SBW.Singletons.serviceFactory;
      // Tabs UI
      self.$tabsDiv = $('<div/>').attr('class', "tabs sbw-widget sbw-post-widget-" + self.options.theme);
      self.$tabsUl = $('<ul/>').attr("class", "tabs-ul");
      self.element.append(self.$tabsDiv);
      self.$tabsDiv.append(self.$tabsUl);
      self.$postTab = $('<li/>');
      self.postTag = $('<a/>').addClass('tab-1').html("<span>" + self.options.title + "</span>");
      self.$postTab.append(self.postTag);
      self.$tabsUl.append(self.$postTab);
      // Container
      self.$postTabDiv = $('<div/>').addClass('tab-content');
      self.$postTabDiv.insertAfter(self.$tabsUl);
      self.$containerDiv = $('<div/>').addClass('sbw-post-container');
      self.$postTabDiv.append(self.$containerDiv);

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
      self.$checkBoxesDiv.insertAfter(self.$input);

      self.$postBtn.on("click", this, this._addPost);
      self.$containerDiv.find(".checkbox-container").on('click', '.checkbox input', function () {
        var value = this.value;
        if ($(this).is(":checked")) {
          self.$checkBoxesDiv.find(".service-container." + value).addClass('selected');
          self.serviceFactory.getService(value).startActionHandler(function () {
            self.serviceFactory.getService("controller").getProfilePic([value], null, function (response) {
              if (response) {
                self.$checkBoxesDiv.find('.' + value + " .userimage").css('background', 'url(' + response + ')');
              }
            }, function (error) {

            });
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
     * @property {String} labelPlaceholder Text for the Input placeholder.
     * @property {String} buttonText Text for post button.
     * @property {String} title Header for the widget.
     */
    options: {
      successMessage: '',
      services: ['facebook', 'twitter', 'linkedin'],
      limit: 10,
      offset: 0,
      theme: "default",
      labelPlaceholder: "Enter text..",
      buttonText: "Publish",
      title: "Feed"
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
     * @memberof PostWidget
     * @param e
     * @private
     */
    _addPost: function (e) {
      var self = e.data,
        postText = self.$input.val(),
        serviceArr = [],
        successCallback = function (response) {
          var elem = self.$containerDiv.find(".sbw-success-message");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.service + ".");
          } else {
            self.$containerDiv.append('<span class="sbw-success-message">Successfully posted on ' + response.service + '.</span>');
          }
        },
        failureCallback = function (response) {
          self.$containerDiv.append('<span class="sbw-error-message">Some problem in posting with ' + response.service + '.</span>');
        };
      self.$checkBoxesDiv.find("input:checked").each(function () {
        serviceArr.push(this.value);
        if (this.value === 'twitter') {
          postText = postText.substring(0, 140); //twitter character limit
        }
      });
      self.$containerDiv.find(".sbw-success-message").remove();
      self.$containerDiv.find(".sbw-error-message").remove();

      self.serviceFactory.getService("controller").publishMessage(serviceArr, postText, successCallback, failureCallback);

    }
  });
})(jQuery);