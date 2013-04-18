(function ($) {
  "use strict";
  /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global console, SBW*/
  /**
   * @class SharePageWidget
   * @namespace SharePageWidget
   * @classdesc SocialByWay Share Page Widget to get the Share count based on the service and gives interaction to Share a page/UI
   * @property {Number} count - The aggregated Share count for all services.
   * @property {Object} options - The options for the widget.
   * @property {Object} serviceCount - An object containing the Share count of each service.
   * @augments JQuery.Widget
   * @alias SharePageWidget
   * @constructor
   */
  $.widget("ui.SharePageWidget", /** @lends SharePageWidget.prototype */ {
    count: 0,
    /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {String} url The url to share.
     * @property {String[]} services Name of the registered services.
     * @property {String} theme The theme for the widget.
     */
    options: {
      url: null,
      services: ['facebook', 'twitter', 'linkedin'],
      theme: 'default'
    },
    /**
     * @method
     * @private
     * @desc Constructor for the widget.
     */
    _create: function () {
      var self = this,
        serviceShareCountContainer, theme, containerDiv, serviceDiv, shareButton, shareCountContainer, minAngle;
      theme = self.options.theme;
      containerDiv = $("<div />", {
        'class': 'sbw-widget sbw-share-page-widget-' + theme
      });
      serviceDiv = $("<div />", {
        'class': 'service-container'
      });
      shareButton = $('<span />', {
        'class': 'share-button'
      });
      shareCountContainer = $("<div />", {
        'class': 'count-container'
      });

      minAngle = 360 / this.options.services.length;
      $.each(this.options.services, function (index, service) {
        var serviceContainer = self.createServiceElement(service, serviceDiv, (minAngle * index), self);
        SBW.api.getShareCount([service], self.options.url, function (response) {
          if (response && response.count) {
            self.count += response.count;
            serviceShareCountContainer = $("<div />", {
              'class': 'service-count-container'
            }).text(response.count).appendTo(serviceContainer);
            shareCountContainer.text(self.count);
          }
        });
      });

      $(serviceDiv).append(shareButton, shareCountContainer);
      $(containerDiv).append(serviceDiv);
      $(self.element).append(containerDiv);
      self.hideServices();
      $(containerDiv).hover(self.showServices, self.hideServices);
    },
    /**
     * @method
     * @desc Function to create a service div and place it at the required position in the widget.
     * @param {String} service The social network for which the container is being created.
     * @param {Object} parentContainer The DOM element to which the service container must be added.
     * @param {Number} angle The angle at which the service container has to be placed.
     * @param {Object} context The context for the function call.
     * @return {Object} The DOM element for the service.
     */
    createServiceElement: function (service, parentContainer, angle, context) {
      var serviceContainer = $("<div/>", {
        'class': service,
        'data-service': service,
        'click': function (event) {
          context.shareForService(event, context);
        },
        'style': '-webkit-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' + '-moz-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' + '-ms-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' + '-o-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' + 'transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg)'
      }).appendTo(parentContainer);
      return serviceContainer;
    },
    /**
     * @method
     * @desc Function to show services on mouse hover.
     */
    showServices: function () {
      var servicesContainer = $("div.service-container");
      servicesContainer.find("div").show();
      servicesContainer.find("div.count-container").hide();
    },
    /**
     * @method
     * @desc Function to hide services when the widget loses focus.
     */
    hideServices: function () {
      var servicesContainer = $("div.service-container");
      servicesContainer.find("div").hide();
      servicesContainer.find("div.count-container").show();
    },
    /**
     * @method
     * @desc Event handler that allows the user to share the url specified in options.
     * @param {Object} event The Event object.
     * @param {Object} context The scope of the calling function.
     */
    shareForService: function (event, context) {
      var sourceElement = event.srcElement || event.target,
        service = sourceElement.dataset.service,
        successCallback = function (response) {
          var elem = context.element.find(".sbw-success-message");
          if (elem.length !== 0) {
            elem.html(elem.text().substr(0, elem.text().length - 1) + ", " + response.serviceName + ".");
          } else {
            context.element.append('<span class="sbw-success-message">Successfully shared on '/*+ response.message */ + response.serviceName + '.</span>');
          }
        },
        failureCallback = function (response) {
          context.element.append('<span class="sbw-error-message">' + response.serviceName + ' says,' + response.message + '.</span>');
        };
      context.element.find(".sbw-success-message").remove();
      context.element.find(".sbw-error-message").remove();
      SBW.api.publishMessage([service], (context.options.url || document.url), successCallback, failureCallback);
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