// This prevents argv parsing to be breaked when the app is packaged (executed without 'electron' prefix)
if (process.argv[1]&&process.argv[1].indexOf('-')==0) process.argv.unshift('')

var baseDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
    configFile = require('path').join(baseDir, '.av-osc-control'),
    fs = require('fs'),
    ifaces = require('os').networkInterfaces()


var options = {
    's':{alias:'sync',type:'array',describe:'synchronized hosts (ip:port pairs)',
         check: (s)=>{
             return (s.join(' ').match('^([^:\s]*:[0-9]{4,5}[\s]*)*$') != null) ?
                 true : 'Sync hosts must be ip:port pairs & port must be >= 1024'
         }
    },
    'l':{alias:'load',type:'string',file:'js',describe:'session file to load'},
    'b':{alias:'blank',type:'boolean',describe:'load a blank session and start the editor'},
    'c':{alias:'custom-module',type:'string',file:'js',describe:'custom module file to load'},
    'p':{alias:'port',type:'number',describe:'http port of the server (default to 8080)',
         check: (p)=>{
             return (!isNaN(p) && p > 1023 && parseInt(p)===p) ?
                true : 'Port must be an integer >= 1024'
         }
     },
     'o':{alias:'osc-port',type:'number',describe:'osc input port (default to --port)',
          check: (o)=>{
              return (!isNaN(o) && o > 1023 && parseInt(o)===o) ?
                 true : 'Port must be an integer >= 1024'
          }
     },
    'm':{alias:'midi',type:'array',describe:'midi router settings (requires python-pyo)'},
    'd':{alias:'debug',type:'boolean',describe:'log received osc messages in the console'},
    'n':{alias:'no-gui',type:'boolean',describe:'disable default gui',
         check: (n,argv)=>{
             return (!n || !argv.g) ?
                true : 'no-gui and gui-only can\'s be enabled simultaneously'
         }
     },
    'g':{alias:'gui-only',type:'string',describe:'app server\'s url. If true, local port (--port) is used',
         check: (g,argv)=>{
             return (!g || !argv.n) ?
                true : 'no-gui and gui-only can\'s be enabled simultaneously'
         }
    },
    't':{alias:'theme',type:'array',describe:'theme name or path (mutliple values allowed)'},
    'e':{alias:'examples',type:'boolean',describe:'list examples instead of recent sessions',
         check: (e,argv)=>{
             return (!e || !argv.l) ?
                true : 'examples can\'t be listed if --load is set'
         }
    },
    'x':{alias:'sessions',type:'boolean',describe:'list sessions',
         check: (x,argv)=>{
             return (!x || !argv.l) ?
                true : 'sessions can\'t be listed if --load is set'
         }
    },
    'url-options':{type:'array',describe:'url options (opt=value pairs)',
        check: (u, argv)=>{
            return (!u || !argv.n) ?
            true : 'url options can\'t be passed in no-gui mode'
        }
    },
    'disable-vsync':{type:'boolean',describe:'disable gui\'s vertical synchronization', restart: true},
    'read-only':{type:'boolean',describe:'disable session editing and session history changes',
         check: (r, argv)=>{
             return (!r || !argv.b) ?
                true : 'blank session can\'t be started in read-only mode'
         }
    },
}


var argv = require('yargs')
        .help('help').usage(`\nUsage:\n  $0 [options]`).alias('h', 'help')
        .options(options)
        .check((argv)=>{
            var err = []
            for (key in options) {
                if (options[key].check && argv[key] != undefined) {
                    var c = options[key].check(argv[key],argv)
                    if (c!==true) {
                        err.push(`-${key}: ${c}`)
                    }
                }
            }
            return err.length ? err.join('\n') : true
        })
        .strict()
        .version().alias('v','version')

argv = argv.argv

var config = function(){try {return JSON.parse(fs.readFileSync(configFile,'utf-8'))} catch(err) {return {}}}(),
    defaultConfig

var makeDefaultConfig = function(argv){
    defaultConfig = {
        argv:argv,
        presetPath : process.cwd(),
        sessionPath: process.cwd(),
        recentSessions: [],

        appName: 'AV OSC Control',
        syncTargets: argv.s || false,
        oscInPort: argv.o || 0,
        httpPort: argv.p || 8080,
        debug: argv.d || false,
        sessionFile:  argv.l || false,
        newSession:  argv.b || false,
        customModule: argv.c || false,
        noGui: argv.n || false,
        guiOnly: typeof argv.g == 'string' ? argv.g.length ? argv.g : true : false,
        urlOptions: argv['url-options'] ? '?' + argv['url-options'].join('&') : '',
        noVsync: argv['disable-vsync'] || false,
        readOnly: argv['read-only'] || false,
        midi: argv.m,
        appAddresses:function(){
            var appAddresses = []

            Object.keys(ifaces).forEach(function (ifname) {
                for (i=0;i<ifaces[ifname].length;i++) {
                    if (ifaces[ifname][i].family == 'IPv4') {
                        appAddresses.push('http://' + ifaces[ifname][i].address + ':' + (argv.p || 8080))
                    }
                }
            })

            return appAddresses
        }(),
        examples: argv.e,
        sessions: argv.x,
        theme: function(){
            if (!argv.t) return
            var style = []
            for (i in argv.t) {
                try {style.push(fs.readFileSync(__dirname + '/themes/' + argv.t[i] + '.css','utf-8'))}
                catch(err) {
                    try {style.push(fs.readFileSync(argv.t[i],'utf-8'))}
                    catch(err) {
                        console.log('Theme "' + argv.t[i] + '" not found.')
                    }
                }
            }
            return style
        }()
    }
}

makeDefaultConfig(argv)

module.exports = {
    argv:argv,
    options:options,
    makeDefaultConfig:makeDefaultConfig,
    read:function(key){
        var x = config[key] || defaultConfig[key]
        return x
    },
    write:function(key,value,tmp) {
        config[key] = value
        if (tmp) return
        fs.writeFile(configFile,JSON.stringify(config,null,4), function (err, data) {
            if (err) throw err
        })
    }

}
