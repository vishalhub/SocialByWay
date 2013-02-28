(function ($) {
  "use strict";
  /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global console, SBW*/
  /**
   * @class UploadWidget
   * @namespace UploadWidget
   * @classdesc SocialByWay Upload Widget to upload files to the services
   * @augments JQuery.Widget
   * @alias UploadWidget
   * @constructor
   */
  $.widget("ui.UploadWidget",
    /** @lends UploadWidget.prototype */
    {
      /**
       * @method
       * @private
       * @desc Constructor for the widget.
       * @ignore
       */
      _create: function () {
        var self = this, supportedServices = ['facebook', 'flickr', 'twitter', 'picasa'];
        // to check whether the service is supported or not
        self.options.serviceArray.forEach(function (element, index, array) {
          if (supportedServices.indexOf(element) === -1) {
            array.splice(array.indexOf(element), 1);
          }
        });
        // display embedded initializing creates a widget container with specified functionality
        // display stand-alone initializing creates two tabs for image and video upload separately
        self.$widgetContainer = $('<div/>').addClass("sbw-widget sbw-upload-widget-" + self.options.theme);
        if (self.options.display === 'stand-alone') {
          // Define Tab container
          self.$tabContainer = $('<div/>').addClass('tab-container');
          self.$tabs = $('<ul/>').addClass("tabs");
          self.$tabContainer.append(self.$tabs);

          // Define Tabs
          self.$imageTab = $('<li/>').attr({
            class: 'image-tab selected',
            value: 'image'
          }).html("Upload Image");
          self.$videoTab = $('<li/>').attr({
            class: 'video-tab',
            value: 'video'
          }).html("Upload Video");

          //Append tabs to the tab container...
          self.$tabs.append(self.$imageTab, self.$videoTab);
          self.$widgetContainer.append(self.$tabContainer);
        }

        self.element.append(self.$widgetContainer);

        // Define content in the tab container...
        self.$helpMessage = $("<p/>").text("Select media for upload");
        self.$browseButton = $('<input/>').attr("type", "file").html("Choose file");
        self.$errorAlert = $('<div/>').addClass('error-display').hide();
        self.$loader = $('<div/>').addClass('loader').hide();
        self.$mediaContainer = $('<div/>').addClass('media-container ');

        self.$description = $('<textarea/>').attr({
          'class': 'description-container',
          maxlength: 5000,
          placeholder: 'Enter text....'
        });

        self.$titleInput = $('<textarea/>').attr({
          'class': 'title-container',
          maxlength: 5000,
          placeholder: 'Title'
        });

        self.$mediaContainer.append(self.$helpMessage, self.$browseButton, self.$errorAlert, self.$loader, self.$titleInput, self.$description);
        self.$widgetContainer.append(self.$mediaContainer);

        self.$uploadButton = $('<button/>').addClass('upload-button').text("publish");

        //Create the checkbox container...
        self.$checkBoxContainer = $('<div/>').addClass('checkBox-container');
        var $checkContainer = [];
        self.options.serviceArray.forEach(function (value) {
          var $serviceCheckbox = $('<div/>').addClass("check-container " + value)
              .append($("<input/>", {
                'type': 'checkbox',
                'name': 'service',
                'value': value
              })),
            $userView = $("<div/>").addClass("user-image "),
            $serviceView = $('<div/>').addClass("service-container " + value);
          $serviceCheckbox.append($userView, $serviceView);
          $checkContainer.push($serviceCheckbox);
        });
        self.$checkBoxContainer.append($checkContainer);
        self.$mediaContainer.append(self.$checkBoxContainer, self.$uploadButton);
        self.$uploadButton.on("click", this, this._publishPhoto);

        $(self.$tabs).on('click', 'li', function () {
          var $currentTab = $(this);
          $currentTab.addClass('selected').siblings('li').removeClass('selected');
          self.options.functionality = $currentTab.attr('value');
          if ($currentTab.attr('value') == 'video') {
            self.$checkBoxContainer.find('.check-container.twitter').hide();
          } else {
            self.$checkBoxContainer.find('.check-container.twitter').show();
          }
        });
        if (self.options.functionality == 'video') {
          self.$checkBoxContainer.find('.check-container.twitter').hide();
        } else {
          self.$checkBoxContainer.find('.check-container.twitter').show();
        }
        $(self.$checkBoxContainer).on('click', 'div.check-container input', function (e) {
          var that = this;
          self.service = this.value;
          if ($(this).is("input:checked")) {
            $(that).prop('checked', false);
            var loginSuccessHandler = function (response) {
              var userId = (response === undefined) ? undefined : response.id, picSuccess, picFailure;
              $(that).siblings('div.service-container').toggleClass('selected');
              $(that).prop('checked', true);
              picSuccess = function (profilePicUrl) {
                if (profilePicUrl) {
                  $(self.$checkBoxContainer).find('.check-container' + '.' + self.service + ' .user-image').css("background", 'url("' + profilePicUrl + '")');
                }
              };
              picFailure = function (error) {
              };
              SBW.api.getProfilePic(self.service, userId, picSuccess, picFailure);
            };
            self.authenticate(self.service, loginSuccessHandler);
          } else {
            $(that).siblings('div.service-container').toggleClass('selected');
          }
        });
      },
      /**
       * @desc Options for the widget.
       * @inner
       * @type {Object}
       * @property {String} theme Theme for the upload widget
       * @property {String} display Display type of the widget
       * @property {String} functionality The functionality of the widget
       */
      options: {
        theme: 'default',
        display: 'stand-alone',
        functionality: 'image',
        serviceArray: ['facebook', 'flickr', 'picasa', 'twitter'],
        // limit in kilobytes
        sizeLimit: {image: 1024, video: 20480}
      },
      services: 0,
      /**
       * @method
       * @desc Authenticate to the specified service to upload files.
       * @param {String} service Name of the registered service to be authenticated.
       * @param {Function} loginSuccessHandler The callback to be executed on successful login.
       */
      authenticate: function (service, loginSuccessHandler) {
        SBW.Singletons.serviceFactory.getService(service).startActionHandler(loginSuccessHandler);
      },
      /**
       * @method
       * @desc Method to call the upload media methods of the service.
       * @private
       * @ignore
       */
      _publishPhoto: function (e) {
        var self = e.data, serviceCheck = 0, description = $(self.$description).val(), title = $(self.$titleInput).val(), serviceArr = [],
          fileData = {
            'description': description,
            'title': title,
            'location': '',
            'file': self.$browseButton[0].files[0]
          }, successCallback = function (uploadStatus) {
            serviceCheck = serviceCheck + 1;
            if (serviceCheck === self.services) {
              self.$loader.hide();
            }
            if ((!self.$successText) || (self.$successText.text() === '')) {
              self.$successText = $("<p/>").text("Successfully published media in " + uploadStatus[0].serviceName);
              self.$widgetContainer.append(self.$successText);
            } else {
              self.$successText.text(self.$successText.text() + ', ' + uploadStatus[0].serviceName);
            }
          }, errorCallback = function (uploadStatus) {
            serviceCheck = serviceCheck + 1;
            if (serviceCheck === self.services) {
              self.$loader.hide();
            }
            if ((!self.$failureText) || (self.$failureText.text() === '')) {
              self.$failureText = $("<p/>").text("Error while publishing media in " + uploadStatus[0].serviceName);
              self.$widgetContainer.append(self.$failureText);
            } else {
              self.$failureText.text(self.$failureText.text() + ', ' + uploadStatus[0].serviceName);
            }
          };
        if (self.$successText) {
          self.$successText.empty();
        }
        if (self.$failureText) {
          self.$failureText.empty();
        }
        self.$checkBoxContainer.find("input:checked").each(function () {
          serviceArr.push(this.value);
        });
        if (self.options.functionality === 'image') {
          if (self.$browseButton[0].files[0].size / 1024 < self.options.sizeLimit.image) {
            self.$errorAlert.hide();
            if (serviceArr.length !== 0) {
              self.$loader.show();
              self.services = serviceArr.length;
            }
            SBW.api.uploadPhoto(serviceArr, [fileData], successCallback, errorCallback);
          } else {
            self.$errorAlert.show().text('Maximum upload size for image : 1MB')
          }
        } else {
          if (self.$browseButton[0].files[0].size / 1024 < self.options.sizeLimit.video) {
            self.$errorAlert.hide();
            if (serviceArr.length !== 0) {
              self.$loader.show();
              self.services = serviceArr.length;
            }
            SBW.api.uploadVideo(serviceArr, [fileData], successCallback, errorCallback);
          } else {
            self.$errorAlert.show().text('Maximum upload size for video : 20MB')
          }
        }
      }
    });
})(jQuery);
