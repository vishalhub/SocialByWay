/**
 * @class
 * @name AudioAsset
 * @namespace SBW.Models.AudioAsset
 * @classdesc This is an audio asset model
 * @property {String} [type = 'audio'] - Audio asset type
 * @property {String} url - Audio url for playback
 * @property {Number} duration - Duration of the audio playback
 * @augments Asset
 * @constructor
 */
SBW.Models.AudioAsset = SBW.Models.Asset.extend(/** @lends SBW.Models.AudioAsset# */{
  type: 'audio',
  url :'',
  duration: 0
});