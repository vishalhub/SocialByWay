/**
 * @class
 * @name AssetCollection
 * @namespace SBW.Models.AssetCollection
 * @property {String} id  Id of the asset collection
 * @property {String} title  Title of the asset collection
 * @property {String} createdTime  Created time of the asset collection
 * @property {Object} rawData  Raw data of the asset collection
 * @property {String} status  Status of the asset collection
 * @property {String} serviceName Service name of the asset collection
 * @property {Array}  assets Array of {@link SBW.Models.Asset Assets} in the asset collection
 * @property {Object} metadata Metadata object of the asset collection
 * @classdesc This is an asset collection class
 * @constructor
 */
SBW.Models.AssetCollection = SBW.Object.extend(/** @lends SBW.Models.AssetCollection# */{
  id:'',
  title:'',
  createdTime:'',
  rawData:[],
  status:'private',
  serviceName:null,
  assets: [],
  /**
   * @inner
   * @type {Object}
   * @desc define the AssetCollection meta data
   *
   * @property {String} dateUpdated Date updated of the asset collection
   * @property {String} dateUploaded Date uploaded of the asset collection
   * @property {Number} numAssets Number of Assets in the asset collection
   * @property {String} assetCollectionId Id of the asset collection from the service
   * @property {String} Type type of the asset collection
   * @property {String} tags Tags of the asset collection
   * @property {String} fileName File name of the asset collection
   * @property {String} description Description of the asset collection
   * @property {String} thumbnail Thumbnail of the asset collection
   * @property {String} previewUrl Preview url of the asset collection
   * @property {String} author Author of the asset collection
   * @property {String} authorAvatar Author avatar of the asset collection
   * @property {Number} commentCount Comment count of the asset collection
   * @property {Object} comments Comments on an asset collection
   * @property {Number} likeCount like count of an asset collection
   * @property {Array} likes like object of an asset collection
   *
   **/
  metadata:{
    dateUpdated:null,
    dateUploaded:null,
    numAssets:null,
    assetCollectionId:null,
    type:null,
    tags:null,
    fileName:null,
    description:null,
    thumbnail:null,
    previewUrl:null,
    author:null,
    authorAvatar:null,
    commentCount:null,
    comments:null,
    likeCount:0,
    likes:null
  },
  /**
   * @method
   * @desc Initialize the properties of the asset collection
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
   * @desc utility method to generate the id of asset collection object
   * @returns {string} id
   */
  getID:function ()
  {
    return 'collection' + Math.floor(Math.random() * 1000);
  }
});

