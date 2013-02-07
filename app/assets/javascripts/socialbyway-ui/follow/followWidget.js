(function ($) {
  /**
   * @class FollowWidget
   * @namespace FollowWidget
   * @classdesc SocialByWay Follow Widget to get the follow count based on the service and gives interaction to follow a page/UI
   * @property {Number} count - The aggregated follow count for all services.
   * @property {Object} options - The options for the widget.
   * @property {Object} serviceCount - An object containing the follow count of each service.
   * @augments JQuery.Widget
   * @alias FollowWidget
   * @constructor
   */

  $.widget("ui.FollowWidget",  /** @lends FollowWidget.prototype */ {   
    count: 0,
    options: {
      userDetails: null,
      services: ['facebook', 'twitter', 'linkedin'],
      theme: 'default'
    },
    serviceCount: null,
    /**
     * @method
     * @private
     * @desc Constructor for the widget.
     */
    _create: function () {
      var self = this, serviceFollowCountContainer;
      var theme = self.options.theme;
      var containerDiv = $("<div />", {
        'class': 'sbw-widget sbw-follow-widget-' + theme
      });
      var serviceDiv = $("<div />", {
        'class': 'service-container'
      });
      var followButton = $('<span />', {
        'class': 'follow-button'
      });
      var followCountContainer = $("<div />", {
        'class': 'count-container'
      }).text('nil');
      var minAngle = 360 / this.options.services.length;
      this.serviceCount = {};
      $.each(this.options.services, function (index, service) {
        var serviceContainer = self.createServiceElement(service, serviceDiv, (minAngle * index), self);
        serviceFollowCountContainer = $("<div />", {
          'class': service + '-count service-count-container'
        }).text('nil').appendTo(serviceContainer);
        SBW.Singletons.serviceFactory.getService(service).checkUserLoggedIn(function (isLoggedIn) {
          if (isLoggedIn) {
            SBW.Singletons.serviceFactory.getService(service).getFollowCount(self.options.userDetails[service], function (response) {
              if (response && response.count) {
                self.count += response.count;
                this.serviceCount[service] = response.count;
                serviceFollowCountContainer.text(response.count);
                followCountContainer.text(self.count);
              }
            });
          }
        });
      });
      $(serviceDiv).append(followButton, followCountContainer);
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
      var serviceContainer = $("<div></div>", {
        'class': service,
        'data-service': service,
        'click': function (event) {
          context.followForService(event, context);
        },
        'style': '-webkit-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-moz-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-ms-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-o-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          'transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg)'
      }).appendTo(parentContainer);
      return serviceContainer;
    },
    /**
     * @method
     * @desc Function to show services on mouse hover.
     */
    showServices: function () {
      $('.service-container div').show();
      $('.service-container div.count-container').hide();
    },
    /**
     * @method
     * @desc Function to hide services when the widget loses focus.
     */
    hideServices: function () {
      $('.service-container div').hide();
      $('.service-container div.count-container').show();
    },
    /**
     * @method
     * @desc Function to authenticate a user for a service and also update the follow count for the service.
     * @param {String} service Name of the registered service to be authenticated.
     */
    authenticateAndUpdate: function (service) {
      var self = this;
      SBW.Singletons.serviceFactory.getService(service).startActionHandler(function () {
        self.updateForService(service);
      });
    },
    /**
     * @method
     * @param {String} service Name of the registered service.
     */
    updateForService: function (service) {
      var self = this;
      SBW.Singletons.serviceFactory.getService(service).getFollowCount(self.options.userDetails[service], function (response) {
        if (response && response.count) {
          if (self.serviceCount[service]) {
            self.count -= self.serviceCount[service];
          }
          self.serviceCount[service] = response.count;
          self.count += response.count;
          $('.' + service + '-count').text(response.count);
          $('.count-container').text(self.count);
        }
      });
    },
    /**
     * @method
     * @desc Event handler that allows the user to follow the user specified in options.
     * @param {Object} event The Event object.
     * @param {Object} context The scope of the calling function.
     */
    followForService: function (event, context) {
      var sourceElement = event.srcElement || event.target;
      var service = sourceElement.dataset.service;
      var self = this;
      SBW.Singletons.serviceFactory.getService(service).checkUserLoggedIn(function (isLoggedIn) {
        if (isLoggedIn) {
          if (!self.serviceCount[service]) {
            self.updateForService(service);
          }
          SBW.Singletons.serviceFactory.getService(service).followUser(context.options.userDetails[service], function (response) {
          }, function (error) {
            console.log('error while posting: ', error);
          });
        } else {
          self.authenticateAndUpdate(service);
        }
      });
    },
    /**
     * @method
     * @desc Function to destroy the widget.
     */
    destroy: function () {
      $.Widget.prototype.destroy.call(this, arguments);
    }
  });
})(jQuery);
