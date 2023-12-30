import * as ethers from './ethers.js';
import { RADIO } from "./util.mjs"
import { store } from "./store.mjs"


window.DEBUG = false
window.RADIO = RADIO
if(window.DEBUG){
    console.log("DEBUG MODE")
}


// register web components
import './template.mjs'
import './components.mjs'


window.RADIO.emit("msg", "App Init!")

async function boot(){
    const actions = store.getState()
    await actions.INIT()
    await actions.getAllOutputPipes()
}

try {
    boot()
}
catch (e) {
    console.log(e)
}

