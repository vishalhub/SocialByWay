/**
 * @class
 * @name Asset
 * @namespace SBW.Models.Asset
 * @property {String} type  Define the asset type
 * @property {String} id  Id of an asset
 * @property {String} title  Title of an asset
 * @property {String} createdTime  Created time for an asset
 * @property {String} serviceName Service name of the asset
 * @property {Object} rawData  Raw data of an asset
 * @property {String} status  Status of an asset
 * @property {Object} imgSizes Image size object
 * @property {Object} metadata Metadata object of an asset
 *
 * @classdesc This is asset Model Class
 * @constructor
 */
SBW.Models.Asset = SBW.Object.extend(/** @lends SBW.Models.Asset# */{
  type:'asset',
  id:'',
  title:'',
  createdTime:'',
  serviceName:null,
  rawData:[],
  status:'private',
  /**
     * @inner
     * @type {Object}
     * @property {String} t Thumbnail image url
     * @property {String} s Small image url
     * @property {String} m Medium image url
     * @property {String} l Large image url
   *
   **/
  imgSizes:{t:'', s:'', m:'', l:''},
  /**
   * @inner
   * @type {Object}
   * @desc define the asset meta data
   *
   * @property {String} caption Caption of an asset
   * @property {String} dateTaken Date taken of an asset
   * @property {String} dateUpdated Date updated of an asset
   * @property {String} dateUploaded Date uploaded of an asset
   * @property {Object} comments Comments on an asset
   * @property {String} size Size of an asset
   * @property {String} assetId Id of an asset from the service
   * @property {String} assetCollectionId Collection id of the of asset from service
   * @property {Number} height Height of an asset
   * @property {Number} width Width of an asset
   * @property {Number} commentCount Comment count
   * @property {String} Category Category of a asset
   * @property {String} exifMake Exif make data of asset
   * @property {String} exifModel Exif model data of asset
   * @property {String} iptcKeywords iptc keyword of asset
   * @property {String} orientation Orientation of asset
   * @property {String} tags Tags of an asset
   * @property {String} downloadUrl Download url of an asset
   * @property {String} originalFormat Original format of an asset
   * @property {String} fileName File name of an asset
   * @property {String} version Version of an asset
   * @property {String} description Description of the asset
   * @property {String} thumbnail Thumbnail of the asset
   * @property {String} previewUrl Preview url of the asset
   * @property {String} author Author of the asset
   * @property {String} authorAvatar Author avatar of the asset
   * @property {Number} likeCount like count of an asset
   * @property {Array} likes like object of an asset
   *
   **/
  metadata:{
    caption:null,
    type:null,
    dateTaken:null,
    dateUpdated:null,
    dateUploaded:null,
    comments:null,
    size:null,
    assetId:null,
    assetCollectionId:null,
    height:null,
    width:null,
    commentCount:null,
    category:null,
    exifMake:null,
    exifModel:null,
    iptcKeywords:null,
    orientation:null,
    tags:null,
    downloadUrl:null,
    originalFormat:null,
    fileName:null,
    version:null,
    description:null,
    thumbnail:null,
    previewUrl:null,
    author:null,
    authorAvatar:null,
    likeCount:0,
    likes:null
  },
  /**
   * @method
   * @desc Initialize the properties of an asset
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
   * @desc utility method to generate the id of asset object
   * @returns {string} id
   */
  getID:function ()
  {
    return this.type + Math.floor(Math.random() * 1000);
  }
});

