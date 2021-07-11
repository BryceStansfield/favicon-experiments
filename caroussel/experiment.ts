window.onload = function(){
var favilib = new FaviLib()

class ScrollerState{
    done: boolean
    last_tab_chan: BroadcastChannel
    latency: number
    str: string
    str_loc: number
}

// First, let's figure out if we're the controller or not, and setup the page if so
var queue_num = 0;
var is_last = false;

if(window.location.search == ''){
    queue_num = 1;
}
else{
    var spl = window.location.search.split(',')
    queue_num = parseInt(spl[0].slice(1))
    is_last = spl[1] == '1'
}

// And let's setup our BroadcastChannels
if(queue_num != 1){
    // post channel
    const post_channel = new BroadcastChannel((queue_num - 1).toString())
    var recv_channel = new BroadcastChannel((queue_num).toString())

    var cur_string = ''

    recv_channel.onmessage = function(ev){
        // Grab and display dataURL
        var string = (ev as MessageEvent<string>).data
        favilib.update_from_href(string)
        console.log(string)

        // And post it to the next person
        if(cur_string != ''){
            post_channel.postMessage(cur_string)
        }
        cur_string = string
    }

    // Setting up shutdown
    var shutdown_channel = new BroadcastChannel('shutdown')
    shutdown_channel.onmessage = function(){
        window.close()
    }

    // Sending a message to the startup channel
    var startup_channel = new BroadcastChannel('startup')
    startup_channel.postMessage('up')
    startup_channel.close()
}
else{
    var recv_channel = new BroadcastChannel('1')
    recv_channel.onmessage = function(ev){
        // Grab and display dataURL
        var string = (ev as MessageEvent<string>).data
        favilib.update_from_href(string)
        console.log('1: ' + string)
    }
}


if(queue_num == 1){
    // We're the controller, setup the controller page
    var num_tabs_select = document.createElement("input")
    num_tabs_select.type = "number"
    num_tabs_select.id = "num_tabs_select"
    var num_tabs_label = document.createElement("label")
    num_tabs_label.htmlFor = "num_tabs_select"
    num_tabs_label.innerHTML = "# tabs:"

    var string_element = document.createElement("input")
    string_element.type = "text"
    num_tabs_select.id = "string_element"
    var string_element_label = document.createElement("label")
    string_element_label.htmlFor = "string_element"
    string_element_label.innerHTML = "String to print:"

    var latency_element = document.createElement("input")
    latency_element.type = "number"
    latency_element.id = "latency_element"
    var latency_element_label = document.createElement("label")
    latency_element_label.htmlFor = "latency_element"
    latency_element_label.innerHTML = "latency (ms)"

    var start_button = document.createElement("button")
    start_button.innerHTML = "start!"

    var end_button = document.createElement("button")
    end_button.innerHTML = "stop!"

    var controller_div = document.getElementById("controller_div")

    controller_div.appendChild(num_tabs_label)
    controller_div.appendChild(num_tabs_select)
    controller_div.appendChild(string_element_label)
    controller_div.appendChild(string_element)
    controller_div.appendChild(latency_element_label)
    controller_div.appendChild(latency_element)
    controller_div.appendChild(start_button)
    controller_div.appendChild(end_button)

    // setting up our canvas
    var canvas = document.createElement("canvas")
    canvas.width = 32
    canvas.height = 32
    var ctx = canvas.getContext('2d')

    // Now that we've setup the page, let's write some of the actual logic
    var carossel_state = new ScrollerState()

    var done = function(){
        start_button.disabled = false
        carossel_state.done = true
        shutdown_channel.postMessage("stop")
    }

    var loop = function(){
        if(carossel_state.done){
            return
        }

        // Let's pass on our new character
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '20px Comic Sans MS'
        ctx.fillText(carossel_state.str[carossel_state.str_loc], 15, 15)      // Need a better way to print these chars... Maybe images?
        carossel_state.last_tab_chan.postMessage(canvas.toDataURL())

        // Then let's update our position
        carossel_state.str_loc = (carossel_state.str_loc + 1) % carossel_state.str.length
        setTimeout(loop, carossel_state.latency)
    }

    var shutdown_channel = new BroadcastChannel('shutdown')

    start_button.addEventListener("click", function(){
        shutdown_channel.postMessage('shutdown')

        carossel_state = new ScrollerState()
        carossel_state.done = false
        carossel_state.latency = latency_element.valueAsNumber
        carossel_state.str = string_element.value
        carossel_state.str_loc = 0
        
        var num_tabs = num_tabs_select.valueAsNumber
        carossel_state.last_tab_chan = new BroadcastChannel(num_tabs.toString())

        var startup_channel = new BroadcastChannel('startup')
        var tabs_up = 1
        startup_channel.onmessage = function(){
            tabs_up += 1
            if(tabs_up == num_tabs){
                // First, let's clean up the cached favicons
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                var dataURL = canvas.toDataURL()
                for(var i = 0; i < num_tabs; i += 1){
                    carossel_state.last_tab_chan.postMessage(dataURL)
                }

                // Then let's loop
                setTimeout(loop, carossel_state.latency)
            }
        }

        // Now let's open the new tabs, and let everything happen
        var cur_url = window.location.href
        for(var i = 2; i <= num_tabs; i += 1){
            window.open(cur_url + '?' + i.toString() + ',' + (i == num_tabs? '1' : '0'))
        }
    })

    end_button.addEventListener("click", function(){
        done()
    })
}}