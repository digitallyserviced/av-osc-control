var settings = require('./settings')
var sdNotify = require('sd-notify')

var cli = false
for (i in settings.argv) {
    if (i != '_' && i != '$0' && (settings.argv[i]!=undefined && settings.argv[i]!==false)) cli = true
}

var serverStarted

var start = function(readyApp) {

    if (!settings.read('guiOnly') && !serverStarted) {

        var server = require('./server'),
            osc = require('./osc'),
            callbacks = require('./callbacks')

        sdNotify.ready()
        sdNotify.startWatchdogMode(9500)
        
        server.bindCallbacks(callbacks)

        serverStarted = true

        process.on('exit',()=>{
            if (osc.midi) osc.midi.stop()
        })

    }

    if (!settings.read('noGui')) {

        var app = require('./electron-app')
        var address = typeof settings.read('guiOnly')=='string'? 'http://' + settings.read('guiOnly') : settings.read('appAddresses')[0]
        address += settings.read('urlOptions')
        if (app.isReady()) {
            var win = require('./electron-window')({address:address, shortcuts:true})
            app.on('before-quit',()=>{
                process.exit()
            })
            return win
        } else {
            app.on('ready',function(){
                var win = require('./electron-window')({address:address, shortcuts:true})
                app.on('before-quit',()=>{
                    process.exit()
                })
            })
        }
    }

}



if (cli) {

    start()

} else {

    var app = require('./electron-app'),
        path = require('path'),
        address = 'file://' + path.resolve(__dirname + '/launcher/' + 'index.html'),
        {ipcMain} = require('electron'),
        launcher

    app.on('ready',function(){
        launcher = require('./electron-window')({address:address, shortcuts:false, width:680, height:540})
    })

    ipcMain.on('start',function(e, options){

        var gui = start()

        if (settings.read('guiOnly')) {
            launcher.hide()
            gui.on('close',()=>{
                launcher.close()
            })
        } else {
            launcher.webContents.send('started')
        }


    })


}
