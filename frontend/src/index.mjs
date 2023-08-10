import * as ethers from './ethers.js';
import { RADIO } from "./util.mjs"


window.DEBUG = true
window.RADIO = RADIO
if(window.DEBUG){
    console.log("DEBUG MODE")
}


// register web components
import './template.mjs'
import './components.mjs'


window.RADIO.emit("msg", "App Loaded!")