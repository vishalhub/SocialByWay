/**
 * @class User
 * @classdesc This is an user class
 * @property {String} name - User name
 * @property {String} id - User id
 * @property {String} userImage - User profile picture
 * @constructor
 */
SBW.Models.User = SBW.Object.extend(/** @lends SBW.Models.User# */{
  name:null,
  id:null,
  userImage:""
});
