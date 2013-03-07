/**
 * @class
 * @name Comment
 * @namespace SBW.Models.Comment
 * @classdesc This is Comment Model Class
 * @property {String} text  Text Content of the comment
 * @property {String} id  Id of the comment
 * @property {String} createTime  Time in string format
 * @property {String} fromUser User name
 * @property {String} likeCount Number of likes for the comment
 * @property {String} profilePic Url of the porfile picture of the user
 * @property {Object} rawData Raw data from the serivce(eg. facebook, twitter)
 * @property {String} serviceName  Name of the service(eg. facebook, twitter)
 * @constructor
 */
SBW.Models.Comment = SBW.Object.extend(/** @lends SBW.Models.Comment# */{
  text: '',
  id: '',
  createdTime: null,
  fromUser: "",
  likeCount: null,
  profilePic: "",
  rawData: null,
  serviceName: ''
});