(function ($) {
  "use strict";
  /*jslint nomen: true*/
  /*jslint plusplus: true */
  /*global console, SBW*/
  /**
   * @class LikeWidget
   * @namespace LikeWidget
   * @classdesc SocialByWay Like Widget to get the Like count and functionality to like a page
   * @property {Number} count
   * @property {Object} options
   * @augments JQuery.Widget
   * @alias LikeWidget
   * @constructor
   */
  $.widget("ui.PageLikeWidget", /** @lends LikeWidget.prototype */  {
    count: 0,
    /**
     * @desc Options for the widget.
     * @inner
     * @type {Object}
     * @property {Array} services an Array of objects, each containing a service name and the objectId corresponding to the service.
     * @property {String} theme The theme for the widget.
     */
    options: {
      services: [
        {serviceName: 'linkedin', objectId: 'UNIU-214108097-5681285247195418624-SHARE'},
        {serviceName: 'twitter', objectId: ''},
        {serviceName: 'facebook', objectId: '100004739166981_133948596773112'},
        {serviceName: 'flickr', objectId: '8219507855'},
        {serviceName: 'picasa', objectId: ''}
      ],
      theme: 'default'
    },
    /**
     * @method
     * @private
     * @desc Constructor for the widget.
     */
    _create: function () {
      var self = this;
      var theme = self.options.theme;
      var containerDiv = $("<div />", {
        'class': 'sbw-widget sbw-pageLike-widget-' + theme
      });
      var serviceDiv = $("<div />", {
        'class': 'service-container'
      });
      var likeButton = $('<span />', {
        'class': 'like-button'
      });
      self.likeCountContainer = $("<div />", {
        'class': 'count-container'
      });
      var minAngle = 360 / this.options.services.length;
      $.each(this.options.services, function (index, service) {
        var serviceContainer = self.createServiceElement(service.serviceName, serviceDiv, (minAngle * index), self);
      });
      $(serviceDiv).append(likeButton, self.likeCountContainer);
      $(containerDiv).append(serviceDiv);
      $(self.element).append(containerDiv);
      serviceDiv.children('div').hide();
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
      return $("<div></div>", {
        'class': service,
        'data-service': service,
        'click': function (event) {
          context.likeForService(event, context);
        },
        'style': '-webkit-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-moz-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-ms-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          '-o-transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg); ' +
          'transform : rotate(' + angle + 'deg)' + 'translate(3em) rotate(-' + angle + 'deg)'
      }).appendTo(parentContainer);
    },
    /**
     * @method
     * @desc Function to show services on mouse hover.
     */
    showServices: function (e) {
      var self = this;
      $(self).find('.count-container').hide();
      $(self).find('.service-container div').show();
    },
    /**
     * @method
     * @desc Function to hide services when the widget loses focus.
     */
    hideServices: function () {
      var self = this;
      $(self).find('.count-container').show();
      $(self).find('.service-container div').hide();
    },
    /**
     * @method
     * @desc Event handler that allows the user to like the url specified in options.
     * @param {Object} event The Event object.
     * @param {Object} context The scope of the calling function.
     */
    likeForService: function (event, context) {
      var sourceElement = event.srcElement || event.target;
      var serviceName = sourceElement.dataset.service;
      var objectId;
//      $.each(context.options.services,function(index,service){
//        if(service['serviceName']===serviceName){
//          objectId = service['objectId'];
//        };
//      });
      for (var key in context.options.services) {
        if (context.options.services[key]['serviceName'] === serviceName) {
          objectId = context.options.services[key]['objectId'];
        }
      }
      var likesSuccessCallback = function (response) {
        var count = response.length;
        var serviceLikeCountContainer = $("<div />").addClass('service-count-container').html(count).appendTo(sourceElement);
        context.count += count;
        context.likeCountContainer.addClass('liked').html(context.count)
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.Singletons.serviceFactory.getService("controller").getLikes(serviceName, objectId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.Singletons.serviceFactory.getService("controller").like(serviceName, objectId, likeSuccessCallback,
        likeFailureCallback);
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
