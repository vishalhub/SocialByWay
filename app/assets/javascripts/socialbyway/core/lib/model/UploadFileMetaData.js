/**
 * @class
 * @name UploadFileMetaData
 * @namespace SBW.Models.UploadFileMetaData
 * @classdesc This is Upload File MetaData Model Class
 * @property {String} description - Description of the file
 * @property {String} title - Title of the file
 * @property {String} location - geo location metadata of the file
 * @property {Object} file - File Object
 * @constructor
 */
SBW.Models.UploadFileMetaData = SBW.Object.extend(/** @lends SBW.Models.UploadFileMetaData# */ {
  title: "",
  description: "",
  location: "",
  file: null
});
