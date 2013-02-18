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
    count: {linkedin: 0, twitter :0,facebook:0,flickr:0},
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
        {serviceName: 'twitter', objectId: '302413460564762624'},
        {serviceName: 'facebook', objectId: '100004207443785_161177570699157'},
        {serviceName: 'flickr', objectId: '8443995831'},
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
      var containerDiv = $('<div />').addClass('sbw-widget sbw-pageLike-widget-' + theme);
      var $serviceContainer = $('<div />').addClass('service-container');
      var $likeButton = $('<span />').addClass( 'like-button');
      self.$likeCountContainer = $("<span />").addClass('count-container');
      var minAngle = 360 / this.options.services.length;
      $.each(this.options.services, function (index, service) {
        var serviceView = self.createServiceElement(service.serviceName, $serviceContainer, (minAngle * index), self);
      });
      $($serviceContainer).append($likeButton, self.$likeCountContainer);
      $(containerDiv).append($serviceContainer);
      $(self.element).append(containerDiv);
      $serviceContainer.children('div').hide();
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
    showServices: function () {
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
        var count = response['likeCount'],totalCount = 0;
        var serviceLikeCountContainer = $("<span />").addClass('service-count-container').html(count).appendTo(sourceElement);
        context.count[response['serviceName']] = count;
        for(var key in context.count){
          totalCount = totalCount + context.count[key];
        }
        context.$likeCountContainer.addClass('liked').html(totalCount)
      };
      var likesFailureCallback = function () {
        alert('Some problem occurred while getting likes');
      };
      var likeSuccessCallback = function (response) {
        SBW.api.getLikes(serviceName, objectId, likesSuccessCallback,
          likesFailureCallback);
      };
      var likeFailureCallback = function () {
        alert('Some problem occurred while liking post');
      };
      SBW.api.like(serviceName, objectId, likeSuccessCallback,
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
