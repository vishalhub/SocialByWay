/**
 * @class
 * @name AssetCollection
 * @namespace SBW.Models.AssetCollection
 * @property {String} id  Id of the Asset Collection
 * @property {String} title  Title of the Asset Collection
 * @property {String} createdTime  Created time of the Asset Collection
 * @property {Object} rawData  Raw data of the Asset Collection
 * @property {String} status  Status of the Asset Collection
 * @property {Array}  assets Array of {@link SBW.Models.Asset Assets} in the Asset Collection
 * @property {Object} metadata Metadata object of the Asset Collection
 *
 * @classdesc This is Asset Collection Model Class
 * @constructor
 */
SBW.Models.AssetCollection = SBW.Object.extend(/** @lends SBW.Models.AssetCollection# */{
  id:'',
  title:'',
  createdTime:'',
  rawData:[],
  status:'private',
  assets: [],
  /**
   * @inner
   * @type {Object}
   * @desc define the AssetCollection meta data
   *
   * @property {String} dateUpdated Date updated of the Asset Collection
   * @property {String} dateUploaded Date uploaded of the Asset Collection
   * @property {Number} numAssets Number of Assets in the Asset Collection
   * @property {String} assetCollectionId Id of the Asset Collection from the service
   * @property {String} serviceName Service name of the Asset Collection
   * @property {Number} commentCount Comment count of the Asset Collection
   * @property {String} Type type of the Asset Collection
   * @property {String} tags Tags of the Asset Collection
   * @property {String} fileName File name of the Asset Collection
   * @property {String} description Description of the Asset Collection
   * @property {String} thumbnail Thumbnail of the Asset Collection
   * @property {String} previewUrl Preview url of the Asset Collection
   * @property {String} author Author of the Asset Collection
   * @property {String} authorAvatar Author avatar of the Asset Collection
   *
   **/
  metadata:{
    
    dateUpdated:null,
    dateUploaded:null,
    numAssets:null,
    assetCollectionId:null,
    serviceName:null,
    commentCount:null,
    type:null,
    tags:null,
    fileName:null,
    description:null,
    thumbnail:null,
    previewUrl:null,
    author:null,
    authorAvatar:null
  },
  /**
   * @method
   * @desc Initialize the properties of the Asset Collection
   * @param {prop} property of the object
   */
  init:function (prop)
  {
    for (var p in prop) {
      this.constructor[p] = prop[p];
    }
  },
  /**
   * @method
   * @desc utility method to generate the id of Asset Collection object
   * @returns {string} id
   */
  getID:function ()
  {
    return 'collection' + Math.floor(Math.random() * 1000);
  }
});

