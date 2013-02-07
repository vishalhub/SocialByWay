/**
 * @class
 * @name Error
 * @namespace SBW.Models.Error
 * @classdesc This is Error Model Class
 * @property {String} message  Text Content of the Error message
 * @property {String} code  Error code of the error message
 * @property {String} serviceName  Name of the service(eg. facebook, twitter)
 * @property {Object} rawData Raw data from the serivce(eg. facebook, twitter)
 * @constructor
 */
SBW.Models.Error = SBW.Object.extend(/** @lends SBW.Models.Error# */ {
  message: '',
  code: null,
  serviceName:'',
  rawData:null
});
