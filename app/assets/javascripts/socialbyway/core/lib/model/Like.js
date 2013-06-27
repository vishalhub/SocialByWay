/**
 * @class
 * @name Like
 * @namespace SBW.Models.Like
 * @classdesc This is Like(Favorite) Model Class
 * @property {String} user User object
 * @property {Object} rawData Raw data from the serivce(eg. facebook, twitter)
 * @constructor
 */
SBW.Models.Like = SBW.Object.extend(/** @lends SBW.Models.Like# */ {
  user: [],
  rawData:null
});