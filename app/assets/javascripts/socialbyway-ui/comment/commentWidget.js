(function ($){
  /**
    * @class CommentWidget
    * @namespace CommentWidget
    * @classdesc SocialByWay Comment Widget to get and post comment on the objects
    * @augments JQuery.Widget
    * @alias CommentWidget
    * @constructor
    */
  var commentsDivCount;
  var months = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  $.widget("ui.CommentsWidget", /** @lends CommentWidget.prototype */ {
    /**
     * @method
     * @desc create comment Widget or post widget
     * @memberof CommentWidget
     * @private
     * @ignore
     * */
    _create:function ()
    {
      this.count = 0;
      commentsDivCount = commentsDivCount ? commentsDivCount + 1 : 1;
      this.instanceID = commentsDivCount;
      this.containerDiv = $(document.createElement('div')).attr('class', 'container-div');
      $(this.element).append($(this.containerDiv));
      /*create comment widget */
      if (this.options.commentWidget == true) {
        this.displayContainer = $(document.createElement("div")).attr({class:'comments', id:this.instanceID});
        this.profilePic = $(document.createElement('img')).attr({src:'../packages/socialbyway-ui/stylesheets/images/dummy_profile_pic.png', class:'profile-pic'});
        $(this.containerDiv).append($(this.profilePic));
        this.input = $(document.createElement('textarea')).attr({name:'comment', class:'comment-box', maxlength:5000, cols:62, rows:4, placeholder:'Write a Comment/Reply to this post'});
        $(this.containerDiv).append($(this.input));
        this.postBtn = $(document.createElement('button')).attr({class:'post-btn'}).text("post/send");
        $(this.displayContainer).insertBefore($(this.containerDiv));
      } else {
        /* create post widget */
        this.displayContainer = $(document.createElement("div")).attr({class:'posts', id:this.instanceID});
        this.input = $(document.createElement('textarea')).attr({name:'comment', class:'post-box', maxlength:5000, cols:62, rows:8, placeholder:'Write here....'});
        $(this.containerDiv).append($(this.input));
        this.postBtn = $(document.createElement('button')).attr({class:'post-btn'}).text("publish");
        $(this.displayContainer).insertAfter($(this.element).parent());
      }
      $(this.displayContainer).hide();
      this.checkBoxesDiv = $(document.createElement('div')).attr('class', 'check-container');
      var valueArray = ['facebook', 'linkedin', 'twitter', 'flicker', 'googlePlus', 'pinterest', 'cafemom', 'bing'];
      var classNameArray = ['facebook-checkbox', 'linkedIn-checkbox', 'twitter-checkbox', 'flickr-checkbox',
        'google-checkbox', 'pinterest-checkbox', 'cafemom-checkbox', 'bing-checkbox'];
      for (var i = 0; i < 8; i++) {
        var checkBoxObject = {value:valueArray[i], className:classNameArray[i]};
        this._createCheckBox(checkBoxObject);
      }
      $(this.checkBoxesDiv).insertAfter($(this.input));
      $(this.postBtn).insertAfter($(this.checkBoxesDiv));
      /*on clicking publish button call addCommentOrPost */
      $(this.postBtn).on("click", this, this._addCommentOrPost);
      this.aTag = $(document.createElement('a')).attr("class", "comment-link comment-style");
      $(this.aTag).insertAfter($(this.displayContainer));
      $(this.aTag).hide();
      var containerDiv = $(document.createElement("div")).attr({class:'container'});
      var childDiv1 = $(document.createElement("div")).attr({class:'deg0'});
      var childDiv2 = $(document.createElement("div")).attr({class:'deg45'});
      var childDiv3 = $(document.createElement("div")).attr({class:'deg90'});
      var childDiv4 = $(document.createElement("div")).attr({class:'deg135'});
      var childDiv5 = $(document.createElement("div")).attr({class:'deg180'});
      var childDiv6 = $(document.createElement("div")).attr({class:'deg225'});
      var childDiv7 = $(document.createElement("div")).attr({class:'deg270'});
      var childDiv8 = $(document.createElement("div")).attr({class:'deg315'});
      $(containerDiv).append(childDiv1, childDiv2, childDiv3, childDiv4, childDiv5, childDiv6, childDiv7, childDiv8);
      $(containerDiv).hide();
      /**
       *  perform authentication on clicking any services checkbox
       **/
      $(".facebook-checkbox input").click(function ()
      {
        SBW.Singletons.serviceFactory.getService("facebook").startActionHandler();
      });
      $(".linkedIn-checkbox input").click(function ()
      {
        SBW.Singletons.serviceFactory.getService("linkedin").startActionHandler();
      });
    },
    /**
     * @method
     * @memberof CommentWidget
     * @desc create necessary checkboxes for the widget
     * @param checkObject
     * @private
     * @ignore
     */
    _createCheckBox:function (checkObject)
    {
      var checkBoxDiv = $(document.createElement('div')).attr('class', 'check-div ' + checkObject.className + '');
      var check = document.createElement("input");
      check.setAttribute("type", 'checkbox');
      check.setAttribute("name", 'service');
      check.setAttribute("value", checkObject.value);
      $(checkBoxDiv).append($(check));
      $(checkBoxDiv).insertAfter($(this.input));
      $(this.checkBoxesDiv).append($(checkBoxDiv));

    },
    /**
     * @desc Options for the widget 
     * @inner
     * @type {Object}
     * @property {Number} commentCount The comment count tells how many comments to be displayed for a post. Setting to #2 ensures #2 comments are visible at
     * any point of time.  More than #2 will be hidden and can be shown on clicking "view all comments".
     * @property {Boolean} commentWidget Setting the option to true makes the widget behave as a comment widget, otherwise behaves as a post widget.
     * @property {String} id The id is being passed as an option internally within widget when widget behaves as commentWidget and id here is
     * the id of post.This helps for comment widget to know against which post it is acting as commentWidget.
     */

    options:{commentCount:2, commentWidget:true, id:""},
    /**
     * @method
     * @desc add comment or post.
     * whenever user enters message and clicks on "publish message" or "comment/reply" addCommentOrPost
     * function is called.
     * @private
     * @ignore
     **/
    _addCommentOrPost:function (e)
    {
      var self = e.data;
      var commentText = $(self.input).val();
      var ServiceArr = [];
      $("input:checked").each(function ()
      {
        ServiceArr.push(this.value);
      });
      /**
       * if commentWidget is false widget acts like a post widget and if block gets executed
       **/
      if (self.options.commentWidget == false) {
        //create a post div to display message and other information
        self.displayElement = $(document.createElement("div")).attr({class:"post"});
        self.postWidgetDiv = $(document.createElement('div')).attr("class", "post-widgets-div");
        self.widgetDiv = $(document.createElement('div')).attr("class", "widgets-div");
        //every post has comment/reply link create anchor elememt
        self.clickLink = $(document.createElement('a')).attr("class", "comment-style reply-link").text("comment/reply");
        $(self.displayElement).prepend($(self.postWidgetDiv));
        $(self.displayElement).prepend($(self.widgetDiv));
        $(self.widgetDiv).append($(self.clickLink));
        //create "like" div with data attribute isFirstLike which is a boolean to determine whether it is a first click or not.
        self.likeDiv = $(document.createElement('div')).attr('class', 'like-pic like-pic-style');
        $(self.likeDiv).attr("data-isfirstlike", false);
        //create a "share" div
        self.shareDiv = $(document.createElement('div')).attr({class:'share-pic share-pic-style'});
        $(self.widgetDiv).append($(self.shareDiv));
        $(self.widgetDiv).append($(self.likeDiv));
        //hover effect on like button
        $(self.likeDiv).hover(
          function ()
          {
            $(containerDiv).show();
            $(this).append($(containerDiv));
          },
          function ()
          {
            $(containerDiv).hide();
          }
        );
        /**
         *profilepicsuccesscallback gets executed on success ajax call of getProfilePic
         */
        var ProfilepicSuccessCallback = function (response)
        {
          $(self.displayContainer).show();
          //call to renderCommentOrPost to display the post with necessry data
          self._renderCommentOrPost(e, commentText, userName, response);
          //click on like button
          $(self.likeDiv).click(function ()
          {
            //if it is the first click call LikeWidget create method
            if (!$(this).data("isfirstlike")) {
              $(self.displayElement).LikeWidget({service:ServiceArr});
              $(self.displayElement).ShareWidget({service:ServiceArr});
              $(this).data("isfirstlike", true);
            }
            //if it is not the first click on like then call likeClickedOnPost method of likewidget
            else {
              $(self.displayElement).LikeWidget('handleLikeClickOnPost');
              $(self.displayElement).ShareWidget('handleLikeClickOnPost');
            }
          });
        };
        /**
         * ProfilepicFailureCallback gets executed on fail ajax call of getProfilePic
         */
        var ProfilepicFailureCallback = function (response)
        {
          alert('Some problem occurred while fetching profile pic');
        };
        var ProfileSuccessCallback = function (response)
        {
          var userName = response.name;
          var userId = response.id;
          if (response.photoUrl) {
            ProfilepicSuccessCallback(response.photoUrl);
          } else {
            SBW.Singletons.serviceFactory.getService("controller").getProfilePic(ServiceArr, userId,
              ProfilepicSuccessCallback, ProfilepicFailureCallback);
          }
        };
        var ProfileFailureCallback = function ()
        {
          alert('Some problem occurred while fetching profile');
        };
        /**
         *on successfully publishing a post or message successcallback gets executed
         */

        var successCallback = function (response)
        {
          var userId = SBW.Singletons.serviceFactory.getService(ServiceArr).accessObject['uid'];
          var getUseData = function ()
          {
            //setting the postid helps in identifying to which post a comment should be added in case of multiple posts on page
            $(self.displayElement).attr("id", responseId);
            //we have the userId from response of publishMessage call the getProfile to get profile information from userId
            SBW.Singletons.serviceFactory.getService("controller").getProfile(ServiceArr, userId,
              ProfileSuccessCallback, ProfileFailureCallback);
            $(self.clickLink).bind("click", function ()
            {
              id = $(this).parent().parent().attr("id");
              $(this).parent().next().CommentsWidget({commentWidget:true, id:id});
            });
          };
          if (response.id) {
            var responseId = response.id;
            getUseData();
          } else {
            var postIdFailureCallback = function ()
            {
              alert('failure postIdFailureCallback ');
            };
            var postIdSuccessCallback = function (postId)
            {
              responseId = postId;
              getUseData();
            };
            SBW.Singletons.serviceFactory.getService("linkedin").getRecentPostId(userId, postIdSuccessCallback,
              postIdFailureCallback);
          }
        };
        var failureCallback = function ()
        {
          alert('Some problem occurred while publishing message');
        };
        /**
         * call to publishMessage
         **/
        SBW.Singletons.serviceFactory.getService("controller").publishMessage(ServiceArr, commentText, successCallback,
          failureCallback);
      }
      /**
       * if commentWidget is true then it should have post id against which it acts as a comment widget.Enter this
       * block only if commentWidget is true and valid post id is given.
       **/
      else if (self.options.commentWidget == true && self.options.id != "") {
        /**
         * succeessCallback gets executed once we get all the comments for a particular post
         **/
        var successCallback = function (response)
        {
          var commentTime = [];
          var photoArray = [];
          var responseLength = response.length;
          self.displayContainer.empty();
          if (response.length > 0) {
            //fetch profile pic for every userId
            for (j = 0; j < response.length; j++) {
              /**
               * for loop finishes executing before ajax call to getProfilePic gets executed,so run as a
               * self executing function with "i" as parameter which ensures getProfilePic fetches
               * different profilePics for different userids
               **/
              (function (j)
              {
                var photoCount = 1;
                var time = response[j].time;
                commentTime[j] = new Date(time);
                var userId = response[j].fromId;
                var displayComments = function (j)
                {
                  $(self.displayContainer).show();
                  self.displayElement = $(document.createElement("div")).attr({class:"comment", id:response[j].id});
                  /**
                   *call renderCommenrOrPost which will render every comment and display appropriately
                   */

                  self._renderCommentOrPost(e, response[j].comment, response[j].fromName, response[j].fromUrl,
                    commentTime[j]);
                  /**
                   *loadComment ensures that only 2 comments are shown on page more than two are
                   * hidden and shown on clicking "view all comments" .
                   **/
                  self._loadComment(e, responseLength);
                  if (response[j].isLikable) {
                    //every comment has like button
                    self.likePic = $(document.createElement("span")).attr('class', 'like-pic like-style');
                    $(self.likePic).attr("data-iscommentfirstlike", false);
                    $(self.displayElement).append($(self.likePic));
                    self.countSpan = $(document.createElement('span')).attr('class', 'count-span');
                    $(self.displayElement).append($(self.countSpan));
                    //if likes is not 0 den show up the count span.
                    if (response[j].likeCount != 0) {
                      $(self.countSpan).text(response[j].likeCount);
                    }
                    //hover effect on like button
                    $(self.likePic).hover(
                      function ()
                      {
                        $(containerDiv).show();
                        $(this).append($(containerDiv));
                      },
                      function ()
                      {
                        $(containerDiv).hide();
                      }
                    );
                    //handle click on like pic
                    $(self.likePic).click(function ()
                    {
                      //iscommentfirstlike is boolean that determines whether the click is first click or not.
                      //If it is the first click call  LikeWidget default constructor
                      if (!$(this).data("iscommentfirstlike")) {
                        $(this).parent(".comment").LikeWidget({service:ServiceArr});
                        $(this).data("iscommentfirstlike", true);
                      }
                      //else call LikeWidget's method  likeClickedOnComment
                      else {
                        $(this).parent(".comment").LikeWidget('handleLikeClickOnComment');
                      }
                    });
                  }
                };
                var picSuccessCallback = function (picUrl)
                {
                  response[j].fromUrl = picUrl;
                  for (k = 0; k < responseLength; k++) {
                    if (response[k].fromUrl == undefined) {
                      photoCount = 0;
                    }
                  }
                  if (photoCount == 1) {
                    for (k = 0; k < responseLength; k++) {
                      displayComments(k);
                    }
                  }
                };
                var picFailureCallback = function (response)
                {
                  alert('Some problem occurred while publishing message');
                };
                if (response[j].fromUrl) {
                  displayComments(j);
                } else {
                  SBW.Singletons.serviceFactory.getService("controller").getProfilePic(ServiceArr, userId,
                    picSuccessCallback, picFailureCallback);
                }
              })(j);
            }
          }
        };
        var failureCallback = function (response)
        {
          alert('Some problem occurred while fetching comments');
        };
        //postcommentSuccessCallback gets called once comment is successfully posted
        var postcommentSuccessCallback = function (response)
        {
          SBW.Singletons.serviceFactory.getService("controller").getComments(ServiceArr, self.options.id,
            successCallback, failureCallback);
        };
        var postcommentFailureCallback = function (response)
        {
          alert('Some problem occurred while publishing comment');
        };
        SBW.Singletons.serviceFactory.getService("controller").postComment(ServiceArr, self.options.id, commentText,
          postcommentSuccessCallback, postcommentFailureCallback);
        self.displayElement = $(document.createElement("div")).attr("class", "comment");
      }
      $(self.input).val("");
    },

    /**
     * @method
     * @desc function to display posts or comments on to the page
     * @param e
     * @param {String} commentText comment or post
     * @param {String} name  username
     * @param {String} photoUrl user profile public url
     * @param {Date} commentDate date representing comment or post time
     * @private
     * @ignore
     */
    _renderCommentOrPost:function (e, commentText, name, photoUrl, commentDate)
    {
      var self = e.data;
      if (commentDate == undefined) {
        var myDate = new Date();
        var displayDate = (months[myDate.getMonth()]) + ' ' + (myDate.getDate()) + ',' + myDate.getFullYear();
        if (myDate.getHours() >= 12) {
          var displayTime = (myDate.getHours()) + ':' + myDate.getMinutes() + "PM";
        }
        else {
          var displayTime = myDate.getHours() + ':' + myDate.getMinutes() + "AM";
        }
      }
      else {
        var displayDate = (months[commentDate.getMonth()]) + ' ' + commentDate.getDate() + ',' +
          commentDate.getFullYear();
        if (commentDate.getHours() > 12) {
          var displayTime = (commentDate.getHours() - 12) + ':' + commentDate.getMinutes() + "PM";
        }
        else {
          var displayTime = commentDate.getHours() + ':' + commentDate.getMinutes() + "AM";
        }
      }
      self.dateSpan = $(document.createElement("span")).attr("class", "date-span");
      $(self.dateSpan).html(displayDate);
      self.timeSpan = $(document.createElement("span")).attr("class", "time-span");
      $(self.timeSpan).html(displayTime);
      self.image1 = $(document.createElement('img')).attr({src:photoUrl, class:'comment-profile-pic'});
      $(self.displayElement).prepend(self.timeSpan);
      $(self.displayElement).prepend(self.dateSpan);
      self.messageDispDiv = $(document.createElement("div")).attr("class", "comment-disp-div");
      self.nameSpan = $(document.createElement("span")).attr("class", "name-span");
      self.message = $(document.createElement("p")).attr("class", "message");
      $(self.nameSpan).html(name);
      $(self.message).html(commentText);
      $(self.messageDispDiv).prepend($(self.message));
      $(self.messageDispDiv).prepend($(self.nameSpan));
      $(self.displayElement).prepend($(self.messageDispDiv));
      $(self.displayElement).prepend(self.image1);
      $(self.displayContainer).append(self.displayElement);
      /* clear the post and comment textbox */
      $(".comment-box").val('');
      $(".post-box").val('');
      /*clear the checkbox */
      $("input:checked").each(function ()
      {
        $(this).attr('checked', false);
      });
    },
    /**
     * @method
     * @desc loadComment function ensures that only 2 comments are shown on page for a post more comments can be shown on
     * clicking "view comments" link.It accepts number of comments as parameter.
     * @param e
     * @param commentLength
     * @private
     * @ignore
     */
    _loadComment:function (e, commentLength)
    {
      var comment = "#" + $(e.currentTarget).parent().prev().prev().attr('id');
      var count = commentLength - this.options.commentCount;
      $(this.aTag).show();
      $(comment + " .comment").show();
      if (commentLength > this.options.commentCount) {
        $(" " + comment + " .comment:lt(" + count + ")").hide();
        $(this.aTag).html("view all" + " " + commentLength + " " + "comments/replies");
        $(this.aTag).click(function (e)
        {
          $(this).addClass("selected");
          $(this).prevAll('.comments').find('.comment').show();
          $(e.target).hide();
        });
      }
    },
    /**
     * @method
     * @desc Removes the widget from display 
     */
    destroy:function ()
    {
      $(this.containerDiv).hide();
    }
  });
})(jQuery);
