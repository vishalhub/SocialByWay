/**
 * @class
 * @name ImageAsset
 * @namespace SBW.Models.ImageAsset
 * @classdesc This is an image asset model
 * @property {String} [type = 'image'] - Image asset type
 * @property {String} src - Image source url
 * @augments Asset
 * @constructor
 */
SBW.Models.ImageAsset = SBW.Models.Asset.extend(/** @lends SBW.Models.ImageAsset# */{
 type: 'image',
 src:""
});

