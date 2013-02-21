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
        var self = this, serviceArray = ['facebook', 'flickr', 'twitter', 'picasa'];
        // display embedded initializing creates a widget container with specified functionality
        // display stand-alone initializing creates two tabs for image and video upload separately
        self.$widgetContainer = $('<div/>').addClass("sbw-widget sbw-upload-widget-" + self.options.theme);
        if (self.options.display === 'stand-alone') {
          // Define Tab container
          self.$tabContainer = $('<div/>').addClass('tab-container');
          self.$tabs = $('<ul/>').addClass("tabs");
          self.$tabContainer.append(self.$tabs);

          // Define Tabs
          self.$imageTab = $('<li/>').addClass('image-tab').html("Upload Image");
          self.$videoTab = $('<li/>').addClass('video-tab').html("Upload Video");

          //Append tabs to the tab container...
          self.$tabs.append(self.$imageTab).append(self.$videoTab);
          self.$widgetContainer.append(self.$tabContainer);
        }

        self.element.append(self.$widgetContainer);

        // Define content in the tab container...
        self.$helpMessage = $("<p>").text("Select media for upload");
        self.$browseButton = $('<input/>').attr("type", "file").html("Choose file");
        self.$mediaContainer = $('<div/>').addClass('media-container ');
        self.$mediaContainer.append(self.$helpMessage).append(self.$browseButton);
        self.$widgetContainer.append(self.$mediaContainer);

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

        $(self.$mediaContainer).append(self.$titleInput).append(self.$description);

        self.$uploadButton = $('<button/>').addClass('upload-button').text("publish");

        //Create the checkbox container...
        self.$checkBoxContainer = $('<div/>').addClass('checkBox-container');
        self.$checkContainer = [];
        serviceArray.forEach(function (value) {
          var $serviceCheckbox = $('<div/>').addClass("check-container " + value)
              .append($("<input/>", {
                'type': 'checkbox',
                'name': 'service',
                'value': value
              })),
            $userView = $("<div/>").addClass("user-image "),
            $serviceView = $('<div/>').addClass("service-container " + value);
          $serviceCheckbox.append($userView).append($serviceView);
          self.$checkContainer.push($serviceCheckbox);
        });
        self.$checkBoxContainer.append(self.$checkContainer);
        self.$checkBoxContainer.insertAfter(self.$description);
        self.$uploadButton.insertAfter(self.$checkBoxContainer);
        self.$uploadButton.on("click", this, this._publishPhoto);
        $(self.$imageTab).addClass('selected');
        $(self.$tabs).children().click(function () {
          $(this).toggleClass('selected');
          $(this).siblings().toggleClass('selected');
        });
        $(self.$checkBoxContainer).on('click', 'div.check-container input', function (e) {
          var that=this;
          self.service = this.value;
          if ($(this).is("input:checked")) {
            $(that).prop('checked', false);
            var loginSuccessHandler = function (response) {
              var userId = (response === undefined) ? undefined : response.id, picSuccess, picFailure;
              $(that).siblings('div.service-container').toggleClass('selected');
              $(that).prop('checked', true);
              picSuccess = function (profilePicUrl) {
                if(profilePicUrl){
                  $(self.$checkBoxContainer).find('.check-container' + '.' + self.service + ' .user-image').css("background", 'url("' + profilePicUrl + '")');
                }
              };
              picFailure = function (error) {
              };
              SBW.api.getProfilePic(self.service,userId, picSuccess, picFailure);
            };
            self.authenticate(self.service, loginSuccessHandler);
          }else{
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
        functionality: 'image'
      },
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
        var self = e.data, description = $(self.$description).val(), title = $(self.$titleInput).val(), serviceArr = [],
          fileData = {
            'description': description,
            'title': title,
            'location': '',
            'file': self.$browseButton[0].files[0]
          }, successCallback = function (uploadStatus) {
            if (self.$responseText) {
              self.$responseText.text("Successfully published media in " + uploadStatus[0].serviceName);
            } else {
              self.$responseText = $("<p/>").text("Successfully published media in " + uploadStatus[0].serviceName);
              self.$widgetContainer.append(self.$responseText);
            }
          }, errorCallback = function (uploadStatus) {
            if (self.$responseText) {
              self.$responseText.text("Failure while publishing media in " + uploadStatus[0].serviceName);
            } else {
              self.$responseText = $("<p/>").text("Failure while publishing media in " + uploadStatus[0].serviceName);
              self.$widgetContainer.append(self.$responseText);
            }
          };
        self.$checkBoxContainer.find("input:checked").each(function () {
          serviceArr.push(this.value);
        });
        if (self.options.display === 'stand-alone') {
          if ($(self.$tabs).children('.selected').html() === self.$imageTab.html()) {
            SBW.api.uploadPhoto(serviceArr, [fileData], successCallback, errorCallback);
          } else {
            SBW.api.uploadVideo(serviceArr, [fileData], successCallback, errorCallback);
          }
        } else {
          if (self.options.functionality === 'image') {
            SBW.api.uploadPhoto(serviceArr, [fileData], successCallback, errorCallback);
          } else {
            SBW.api.uploadVideo(serviceArr, [fileData], successCallback, errorCallback);
          }
        }
      }
    });
})(jQuery);
