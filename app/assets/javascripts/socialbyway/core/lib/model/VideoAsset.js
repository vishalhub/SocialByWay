/**
 * @class
 * @name VideoAsset
 * @namespace SBW.Models.VideoAsset
 * @classdesc This is an video asset class
 * @property {String} [type = 'video'] - Video asset type
 * @property {String} url - Video url for playback
 * @property {Number} duration - Duration of the video playback
 * @augments Asset
 * @constructor
 */
SBW.Models.VideoAsset = SBW.Models.Asset.extend(/** @lends SBW.Models.VideoAsset# */{
  type:'video',
  url:'',
  duration:0
});