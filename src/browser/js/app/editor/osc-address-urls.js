var osc = require('../../osc'),
    shortid = require('shortid'),
    { widgetManager } = require('../../managers'),

class OSCAdmin {
    static createHash()  {
        return shortid.generate()
    }

    constructor(){
        this.urls = []
        this.targets = []
        
    }
}


module.exports = new OSCAdmin()