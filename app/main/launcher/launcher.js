var {remote, ipcRenderer, shell} = require('electron'),
    {dialog, webContents} = remote.require('electron'),
    settings = remote.require('./main/settings'),
    packageInfos = remote.require('./package.json')
    packageVersion = packageInfos.version,
    packageUrl = packageInfos.repository.url,
    argv_remote = settings.read('argv'),
    argv = {},
    $ = require('jquery/dist/jquery.slim.min.js')

for (i in argv_remote) {
    argv[i] = argv_remote[i]
}

$(document).ready(()=>{

    var form = $(`
        <form class="form" id="form">
            <div class="btn header"><span id="title">AV OSC Control</span> <span id="version">(v${packageVersion})</span><span id="new-version"</div>
        </form>
    `)

    $.each(settings.options, (i, option)=>{

        if (option.launcher === false) return

        var wrapper = $(`<div class="item-wrapper"></div>`),
            item = $(`
            <div class="input-wrapper">
                <label>${option.alias || i}</label>
            </div>
            `).appendTo(wrapper),
            input,
            cancel,
            value = argv[i] == undefined ? '' : argv[i]

        if (option.type=='boolean') {

            input = $(`<input name="${i}" class="checkbox" data-type="${option.type}" value="${value ? true : ''}" placeholder="${option.describe}"/>`)
            input.click(function(e){
                e.preventDefault()
                input.val(!eval(input.val())).trigger('change')
            })

        } else if (option.file) {

            input = $(`<input class="btn" name="${i}" value="${value}" placeholder="${option.describe}"/>`)
            input.click(function(e){
                e.preventDefault()
                dialog.showOpenDialog({filters:[{name:'js',extensions:['js']}]},function(file){
                    input.val(file).change()
                })
            })
        } else {

            input = $(`<input name="${i}" data-type="${option.type}" value="${value}" placeholder="${option.describe}"/>`)

        }


        input.appendTo(item)

        input.on('change',function(e,stop){
            var v = $(this).val()
            if (option.type == 'boolean') {
                v = v == 'true' ? true : ''
                input.val(v)
            } else if (v && option.type == 'array'){
                v = v.trim().split(' ')
            } else if (v && option.type == 'number'){
                v = parseFloat(v)
            }

            if (v != '' && option.check && option.check(v, argv) !== true) {
                wrapper.addClass('error')
                wrapper.find('.error-msg').remove()
                wrapper.append(`<div class="error-msg">${option.check(v, argv   )}</div>`)
            } else {
                wrapper.removeClass('error')
                wrapper.find('.error-msg').remove()
                argv[i] = v
            }

            if (option.restart && v!=value && !wrapper.hasClass('restart')) {
                wrapper.addClass('restart')
                wrapper.append(`<div class="restart-msg">The app must be restarted for this change to take effect.</div>`)
            } else if (option.restart && wrapper.hasClass('restart')) {
                wrapper.removeClass('restart')
                wrapper.find('.restart-msg').remove()
            }

            if (!stop) $('input').not(input).trigger('change',true)
        })

        cancel = $(`<div class="btn clear"><i class="fa fa-remove fa-fw"></i></div>`)
        cancel.click((e)=>{
            e.preventDefault()
            if (option.type == 'boolean') {
                input.val('false')
            } else {
                input.val('')
            }
            input.trigger('change')
        })
        cancel.appendTo(item)

        form.append(wrapper)

    })


    var save = $(`<div class="btn start save">Save</div>`).appendTo(form),
        saveWithCallback = function(callback) {
            $('input').change()
            if (form.find('.error').length) return

            setTimeout(()=>{

                for (i in argv) {
                    if (argv[i] === '') {
                        argv[i] = undefined
                    }
                }
                try {
                    settings.makeDefaultConfig(argv)
                    settings.write('argv',argv)
                    save.addClass('saved')
                    setTimeout(()=>{
                        save.removeClass('saved')
                    }, 250)
                    if (callback) callback()
                } catch (err) {

                }

            },1)
        }

    save.click((e)=>{

        e.preventDefault()
        saveWithCallback()

    })

    // Starter (oneshot)

    var start = $(`<div class="btn start">Start</div>`).appendTo(form)
    start.click((e)=>{

        e.preventDefault()
        saveWithCallback(()=>{
            start.off('click')
            save.off('click')
            $('input').attr('disabled','true')
            $('.clear').addClass('disabled')
            ipcRenderer.send('start')
        })

    })



    // server started callback
    ipcRenderer.on('started',function(){
        var addresses = settings.read('appAddresses').map((a)=>{return `<a href="${a}">${a}</a>`})
        start.addClass('started').html('App available at ' + addresses.join(' & '))
        save.remove()
    })


    // ready

    form.appendTo('#launcher')

    $('input').trigger('change')


    $('#loading').remove()
    setTimeout(()=>{
        form.addClass('loaded')
    },0)


    // open links in system's browser
    $(document).click((e,url)=>{
        var url = $(e.target).attr('href')
        if (url) {
            e.preventDefault()
            shell.openExternal(url)
        }
    })

    // New version info
    if (navigator.onLine) {

        var request = new XMLHttpRequest();
        request.open('GET', 'https://api.github.com/repos/xcezzz/av-osc-remote/tags', true);

        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);

            if (data[0].name != 'v' + packageVersion) {
                // $('#new-version').html(` [<a href="${packageUrl}/releases" target="_blank">${data[0].name} is availabe</a>]`)
            }

          }
        };

        request.send();

    }

})
