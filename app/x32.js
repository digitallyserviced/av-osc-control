function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// var Buffer = require('buffer')

(function(){

    // Do whatever you want, initialize some variables, declare some functions, ...
    var x32 = "localhost:10023"
    var x32Host = "10.10.13.40"
    var x32Port = "10023"

    var intervals = 9.8

    function watcher(){
        console.log("watcher")
        for (var ch = 1; ch <= 32; ch++) {
            var d = {
                address: "/subscribe", 
                args: [{type: "s", value: "/ch/" + pad(ch, 2) + "/mix/fader"}, {type: 'i', value: 1}], 
                host: x32Host, 
                port: x32Port
            }
            // console.log(d);
            sendOsc(d)
        }

         var d = {
            address: "/meters", 
            args: [{type: "s", value: "/meters/0"}, {type: 'i', value: 1}], 
            host: x32Host, 
            port: x32Port
        }

        sendOsc(d);

    }

    return {
        init: function(){
            // this will be executed once when the osc server starts
            watcher()
            setInterval(watcher, intervals * 1000)
        },
        runtime: function(){

        },
        oscInFilter:function(data){
            // Filter incomming osc messages
            
            var {address, args, host, port} = data

            if (!/ch\/[0-9]+\//.test(address))
                // console.log(address)

            if (address.toString('ascii') == "/meters/0"){
                
                if (args && args.length > 0 && args[0].type == "b"){
                    var meters = args[0].value;
                    var buf = Buffer.from(meters)
                    var goods = buf.slice(18)
                    
                    for (var index = 0; index < (goods.length / 4); index++) {
                        var d = parseFloat(goods.readFloatLE(index)).toFixed(4);
                        if (index < 32){
                            var ch = pad(index + 1, 2);
                            var url = "/ch/" + ch + "/mix/meter";
                        } else if (index < 40){
                            var ch = pad(index - 31, 2);
                            var url = "/aux/" + ch + "/mix/meter";
                        } else if (index < 48){
                            var ch = pad(index - 39, 2);
                            var url = "/fx/" + ch + "/mix/meter";
                        } else if (index < 64){
                            var ch = pad(index - 47, 2);
                            var url = "/bus/" + ch + "/mix/meter";
                        } else if (index < 70){
                            var ch = pad(index - 63, 2);
                            var url = "/matrix/" + ch + "/mix/meter";
                        }
                        var d = {
                            address: url,
                            args: [{
                                type: 'f',
                                value: parseFloat(d)
                            }],
                            host, port
                        };
                        receiveOsc(d);

                    }
                }
            }

            // address = string
            // args = array of {value, type} objects
            // host = string
            // port = integer

            // return data if you want the message to be processed

        
            return {address, args, host, port}

        },
        oscOutFilter:function(data){
            // Filter outgoing osc messages

            var {address, args, host, port} = data
            // console.log(data)
            // same as oscInFilter
            // sendOsc: function({address, args, host, port})

            // return data if you want the message to be and sent
            return {address, args, host, port}
        }
    }

})()
