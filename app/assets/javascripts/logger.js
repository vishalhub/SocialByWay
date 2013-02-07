/*
 Class : Logger
 This utility class has methods to set the logs levels and show messages in the console.

 Constants:
 DISPLAY - level 1 display type logging object
 ERROR - level 2 error type logging object
 SUCCESS - level 3 success type logging object
 INFO - level 4 info type logging object
 DEBUG - level 5 debug type logging object

 Attributes:
 level - current level of the logger. Set this value to log the messages in console.
 */

SBW.Logger = SBW.Object.extend({
    DISPLAY:{name:'Display', level:1},
    ERROR:{name:'Error', level: 2},
    SUCCESS:{name: 'Success', level:3},
    INFO:{name: 'Info', level: 4},
    DEBUG:{name: 'Debug', level:5},
    on:false,

    /*
     Function: log
     Call this function to set the log message

     Parameters:
     level - level object of type DISPLAY, ERROR, SUCCESS, INFO, DEBUG
     msg - message string
     */

    log:function(level, msg){
    var logger = this;
      if(!window.jasmine) { // don't log when running unit tests
        if (console.log && logger.on) {
            console.log('[' + level.name + '] ' + msg);
        }
      }
    },

    debug: function(msg) {
      this.log(this.DEBUG, msg);
    },

    info: function(msg) {
      this.log(this.INFO, msg);
    },

    error: function(msg) {
      this.log(this.ERROR, msg);
    },

    /*
    Function: logDisplay
    Message to be displayed to the user in the UI

    Parameters:
    msg - message string
    */
    logDisplay: function(msg) {
        this.log(this.DISPLAY, msg);
    }
});