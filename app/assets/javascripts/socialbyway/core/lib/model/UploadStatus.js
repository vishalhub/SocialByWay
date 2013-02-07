/**
 * @class
 * @name UploadStatus
 * @namespace SBW.Models.UploadStatus
 * @classdesc This is Upload Status Model Class
 * @property {String} serviceName Name of the service
 * @property {String} id  Id
 * @property {String} postId Id of the post object
 * @property {String} status Status of the file upload
 * @property {Object} rawData rawdata from the service
 * @constructor
 */
SBW.Models.UploadStatus = SBW.Object.extend( /** @lends SBW.Models.UploadStatus# */ {
    serviceName: "",
    id: "",
    postId: "",
    status: '',
    rawData:null
});