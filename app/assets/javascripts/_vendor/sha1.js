/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

/*********************************************************************************************************/
/*****************************ADDED FOR ZENFOLIO ********************************************************/
/*********************************************************************************************************/

var sha256Init = [ 0x6A09E667, -0x4498517B, 0x3C6EF372, -0x5AB00AC6, 0x510E527F, -0x64FA9774, 0x1F83D9AB, 0x5BE0CD19 ];
var sha256Roots = [ 0x428A2F98, 0x71374491, -0x4A3F0431, -0x164A245B, 0x3956C25B, 0x59F111F1, -0x6DC07D5C, -0x54E3A12B, -0x27F85568, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, -0x7F214E02, -0x6423F959, -0x3E640E8C, -0x1B64963F, -0x1041B87A, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, -0x67C1AEAE, -0x57CE3993, -0x4FFCD838, -0x40A68039, -0x391FF40D, -0x2A586EB9, 0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, -0x7E3D36D2, -0x6D8DD37B, -0x5D40175F, -0x57E599B5, -0x3DB47490, -0x3893AE5D, -0x2E6D17E7, -0x2966F9DC, -0x0BF1CA7B, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, -0x7B3787EC, -0x7338FDF8, -0x6F410006, -0x5BAF9315, -0x41065C09, -0x398E870E ];
var sha256Tail = [ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ];

function sha256(data) {
	data = sha256Pad(data);
	var res = sha256Init.slice(0);
	var s = data.length;
	var k = 0;
	do {
		var k2 = k + 16;
		sha256Round(res,data.slice(k, k2));
		k = k2;
	}
	while (k < s);
	var out = [];
	s = res.length;
	for (var i = 0; i < s;i++) {
		var w = res[i];
		out.push((w >>> 24) & 0xFF);
		out.push((w >>> 16) & 0xFF);
		out.push((w >>>8) & 0xFF);
		out.push(w & 0xFF);
	}

	return out;
}

function sha256Pad(data)
{
	var blen = data.length * 8;
	var len = ((data.length + 72) & ~63) - 8;
	data = data.concat(sha256Tail.slice(0,len - data.length));
	var out = [];
	var i = 0;
	do {
		var w = data[i++] << 24;
		w |= data[i++] << 16;
		w |= data[i++] << 8;
		w |= data[i++];
		out.push(w);
	} while (i < len);
	out.push(0);
	out.push(blen);
	return out;
}

function sha256Round(res, data)
{
	for (var i = 16; i < 64; i++) {
		var x = data[i- 15];
		var y = data[i - 2];
		var x7 = (x >>> 7) | (x << 25);
		var x18 = (x >>> 18) | (x << 14);
		var y17 = (y >>> 17) | (y << 15);
		var y19 = (y >>> 19) | (y << 13);
		var s0 = x7 ^ x18 ^ (x >>> 3);
		var s1 = y17 ^ y19 ^ (y >>> 10);
		data.push((data[i - 16] + s0 + data[i - 7] + s1) & -1);
	}

	var a = res[0];
	var b = res[1];
	var c = res[2];
	var d = res[3];
	var e = res[4];
	var f = res[5];
	var g = res[6];
	var h = res[7];

	for (i = 0; i < 64; i++) {
		var a2 = (a >>> 2) | (a << 30);
		var a13 = (a >>> 13) | (a << 19);
		var a22 = (a >>> 22) | (a << 10);
		var e6 = (e >>> 6) | (e << 26);
		var e11 = (e >>> 11) | (e << 21);
		var e25 = (e >>> 25) | (e << 7);
		var ss0 = a2 ^ a13 ^ a22;
		var maj = (a & b) ^ (a & c) ^ (b & c);
		var t2 = ss0 + maj;
		var ss1 = e6 ^ e11 ^ e25;
		var ch = (e & f) ^ (~e & g);
		var t1 = h + ss1 + ch + sha256Roots[i] + data[i];
		h = g;
		g = f;
		f = e;
		e = (d + t1) & -1;
		d = c;
		c = b;
		b = a;
		a = (t1 + t2) & -1;
	}

	res[0] = (res[0] + a) & -1;
	res[1] = (res[1] + b) & -1;
	res[2] = (res[2] + c) & -1;
	res[3] = (res[3] + d) & -1;
	res[4] = (res[4] + e) & -1;
	res[5] = (res[5] + f) & -1;
	res[6] = (res[6] + g) & -1;
	res[7] = (res[7] + h) & -1;
}