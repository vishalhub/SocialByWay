(function($) {"use strict";
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
		_create : function() {
			var self = this, serviceArray = ['facebook', 'flickr', 'twitter', 'picasa'];
			// display embedded initializing creates a widget container with specified functionality
			// display stand-alone initializing creates two tabs for image and video upload separately
			self.widgetContainer = $('<div/>', {
				'class' : "sbw-upload-widget-" + self.options.theme
			});

			if (self.options.display === 'stand-alone') {
				// Define Tab container
				self.tabContainer = $('<div/>', {
					'class' : 'tab-container'
				});
				self.tabs = $('<ul/>').addClass("tabs");
				self.tabContainer.append(self.tabs);

				// Define Tabs
				self.imageTab = $('<li/>').addClass('image-tab').html("Upload Image");
				self.videoTab = $('<li/>').addClass('video-tab').html("Upload Video");

				//Append tabs to the tab container...
				self.tabs.append(self.imageTab).append(self.videoTab);
				self.widgetContainer.append(self.tabContainer);
			}

			self.element.append(self.widgetContainer);

			// Define content in the tab container...
			self.helpMessage = $("<p>").text("Select media from your computer for upload");
			self.browseButton = $('<input/>').attr("type", "file").html("Choose file");
			self.mediaContainer = $('<div/>').attr('class', 'media-container ');
			self.mediaContainer.append(self.helpMessage).append(self.browseButton);
			self.widgetContainer.append(self.mediaContainer);

			self.description = $('<textarea/>').attr({
				'class' : 'description-container',
				maxlength : 5000,
				placeholder : 'Write your description/caption here....'
			});

			self.titleInput = $('<textarea/>').attr({
				'class' : 'title-container',
				maxlength : 5000,
				placeholder : 'Title'
			});

			$(self.mediaContainer).append(self.titleInput).append(self.description);

			self.uploadButton = $('<button/>').attr({
				'class' : 'upload-button'
			}).text("publish");

			//Create the checkbox container...
			self.checkBoxContainer = $('<div/>').attr('class', 'checkBox-container');

			serviceArray.forEach(function(value) {
				var temp = $('<div/>').attr({
					"class" : "check-container "
				}).append($("<input/>", {
					'type' : 'checkbox',
					'name' : 'service',
					'value' : value
				})), userView = $("<div/>", {
					"class" : "user-image " + value
				}), serviceView = $('<div/>').attr({
					"class" : "service-container " + value
				});

				temp.append(userView).append(serviceView);
				self.checkBoxContainer.append(temp);
			});

			self.checkBoxContainer.insertAfter(self.description);
			self.uploadButton.insertAfter(self.checkBoxContainer);
			self.uploadButton.on("click", this, this._publishPhoto);

			$('#upload-widget div.tab-container ul li:first').addClass('selected');
			$('#upload-widget div.tab-container ul li').click(function() {
				$(this).toggleClass('selected');
				$(this).siblings().toggleClass('selected');
			});

			$("#upload-widget div.media-container  div.checkBox-container").on('click', 'div.check-container input', function() {
				self.service = this.value;
				$(this).siblings('div.service-container').toggleClass('selected');
				if ($(this).is("input:checked")) {
					var loginSuccessHandler = function(response) {
						var userId = (response === undefined) ? undefined : response.id, picSuccess, picFailure;
						picSuccess = function(profilePicUrl) {
							$('div.user-image' + '.' + self.service).css("background", 'url("' + profilePicUrl + '")');
						};
						picFailure = function(error) {
							console.log(error);
						};
						SBW.Singletons.serviceFactory.getService(self.service).getProfilePic(userId, picSuccess, picFailure);
					};
					self.authenticate(self.service, loginSuccessHandler);
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
		options : {
			theme : 'default',
			display : 'stand-alone',
			functionality : 'image'
		},
		/**
		 * @method
		 * @desc Authenticate to the specified service to upload files.
		 * @param {String} service Name of the registered service to be authenticated.
		 * @param {Function} loginSuccessHandler The callback to be executed on successful login.
		 */
		authenticate : function(service, loginSuccessHandler) {
			SBW.Singletons.serviceFactory.getService(service).startActionHandler(loginSuccessHandler);
		},
		/**
		 * @method
		 * @desc Method to call the upload media methods of the service.
		 * @private
		 * @ignore
		 */
		_publishPhoto : function(e) {
			var self = e.data, description = $(self.description).val(), title = $(self.titleInput).val(), serviceArr = [], fileData = {
				'description' : description,
				'title' : title,
				'location' : '',
				'file' : self.browseButton[0].files[0]
			}, successCallback = function(uploadStatus) {
				if (self.responseText) {
					self.responseText.text("Successfully published photo in " + uploadStatus[0].serviceName);
				} else {
					self.responseText = $("<p/>").text("Successfully published photo in " + uploadStatus[0].serviceName);
					self.widgetContainer.append(self.responseText);
				}
			}, errorCallback = function(uploadStatus) {
				if (self.responseText) {
					self.responseText.text("Failure while publishing photo in " + uploadStatus[0].serviceName);
				} else {
					self.responseText = $("<p/>").text("Failure while publishing photo in " + uploadStatus[0].serviceName);
					self.widgetContainer.append(self.responseText);
				}
			};
			self.checkBoxContainer.find("input:checked").each(function() {
				serviceArr.push(this.value);
			});
			if (self.options.display === 'stand-alone') {
				if ($('#upload-widget div.tab-container ul li.selected').html() === self.imageTab.html()) {
					SBW.Singletons.serviceFactory.getService("controller").uploadPhoto(serviceArr, [fileData], successCallback, errorCallback);
				} else {
					SBW.Singletons.serviceFactory.getService("controller").uploadVideo(serviceArr, [fileData], successCallback, errorCallback);
				}
			} else {
				if (self.options.functionality === 'image') {
					SBW.Singletons.serviceFactory.getService("controller").uploadPhoto(serviceArr, [fileData], successCallback, errorCallback);
				} else {
					SBW.Singletons.serviceFactory.getService("controller").uploadVideo(serviceArr, [fileData], successCallback, errorCallback);
				}
			}
		}
	});
})(jQuery);
