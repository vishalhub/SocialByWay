/**
 * @ignore
 * @param namespaceString
 */

SBW.registerNamespace = function (namespaceString) {
  var parts = namespaceString.split('.'),
    parent = SBW,
    currentPart = '';

  for (var i = 0, length = parts.length; i < length; i++) {
    currentPart = parts[i];
    parent[currentPart] = parent[currentPart] || {};
    parent = parent[currentPart];
  }

  return parent;
};
/**
 * @class
 * @namespace SBW.Object
 * @constructor
 * @ignore
 */
SBW.Object = function () {};
/**
 * @class
 * @param _instance
 * @param _static
 * @return {Function}
 * @ignore
 */
SBW.Object.extend = function (_instance, _static) {
  var extend = SBW.Object.prototype.extend;

  // build the prototype
  SBW.Object._prototyping = true;
  var proto = new this;
  extend.call(proto, _instance);
  proto.base = function () {
    // call this method from any other method to invoke that method's ancestor
  };
  delete SBW.Object._prototyping;

  // create the wrapper for the constructor function
  //var constructor = proto.constructor.valueOf(); //-dean
  var constructor = proto.constructor;
  var nClass = proto.constructor = function () {
    if (!SBW.Object._prototyping) {
      if (this._constructing || this.constructor == nClass) { // instantiation
        this._constructing = true;
        constructor.apply(this, arguments);
        delete this._constructing;
      } else if (arguments[0] != null) { // casting
        return (arguments[0].extend || extend).call(arguments[0], proto);
      }
    }
  };

  // build the class interface
  nClass.ancestor = this;
  nClass.extend = this.extend;
  nClass.forEach = this.forEach;
  nClass.implement = this.implement;
  nClass.set = this.set;
  nClass.get = this.get;
  nClass.prototype = proto;
  nClass.toString = this.toString;
  nClass.valueOf = function (type) {
    //return (type == "object") ? klass : constructor; //-dean
    return (type == "object") ? nClass : constructor.valueOf();
  };
  extend.call(nClass, _static);
  // class initialisation
  if (typeof nClass.init == "function") nClass.init();
  return nClass;
};
/**
 * @class
 * @augments SBW.Object
 * @type {Object}
 * @ignore
 */
SBW.Object.prototype = {
  extend:function (source, value) {
    if (arguments.length > 1) { // extending with a name/value pair
      var ancestor = this[source];
      if (ancestor && (typeof value == "function") && // overriding a method?
        // the valueOf() comparison is to avoid circular references
        (!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
        /SBW.\bbase\b/.test(value)) {
        // get the underlying method
        var method = value.valueOf();
        // override
        value = function () {
          var previous = this.parent || SBW.Object.prototype.base;
          this.parent = ancestor;
          var returnValue = method.apply(this, arguments);
          this.parent = previous;
          return returnValue;
        };
        // point to the underlying method
        value.valueOf = function (type) {
          return (type == "object") ? value : method;
        };
        value.toString = SBW.Object.toString;
      }
      this[source] = value;
    } else if (source) { // extending with an object literal
      var extend = SBW.Object.prototype.extend;
      // if this object has a customised extend method then use it
      if (!SBW.Object._prototyping && typeof this != "function") {
        extend = this.extend || extend;
      }
      var proto = {toSource:null};
      // do the "toString" and other methods manually
      var hidden = ["constructor", "toString", "valueOf"];
      // if we are prototyping then include the constructor
      var i = SBW.Object._prototyping ? 0 : 1;
      while (key = hidden[i++]) {
        if (source[key] != proto[key]) {
          extend.call(this, key, source[key]);

        }
      }
      // copy each of the source object's properties to this object
      for (var key in source) {
        if (!proto[key]) extend.call(this, key, source[key]);
      }
    }
    return this;
  },
  set:function (key, value) {
    this[key] = value;
  },
  get:function (key) {
    return this[key];
  }
};

/**
 * @desc Initializing the SBW Object
 * @type {*}
 * @ignore
 */
SBW.Object = SBW.Object.extend({
  constructor:function () {
    this.extend(arguments[0]);
  }
}, {
  ancestor:Object,
  version:"1.1",

  forEach:function (object, block, context) {
    for (var key in object) {
      if (this.prototype[key] === undefined) {
        block.call(context, object[key], key, object);
      }
    }
  },

  implement:function () {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == "function") {
        // if it's a function, call it
        arguments[i](this.prototype);
      } else {
        // add the interface using the extend method
        this.prototype.extend(arguments[i]);
      }
    }
    return this;
  },

  toString:function () {
    return String(this.valueOf());
  }
});
