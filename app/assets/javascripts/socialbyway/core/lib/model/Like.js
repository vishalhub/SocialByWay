/**
 * @class
 * @name Like
 * @namespace SBW.Models.Like
 * @classdesc This is Like(Favorite) Model Class
 * @property {String} fromUser User name
 * @property {String} fromId user Id of the User
 * @property {String} profilePic Url of the porfile picture of the user
 * @property {Object} rawData Raw data from the serivce(eg. facebook, twitter)
 * @constructor
 */
SBW.Models.Like = SBW.Object.extend(/** @lends SBW.Models.Like# */ {
  user: [],
  rawData:null
});