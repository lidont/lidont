import * as ethers from '../node_modules/ethers/dist/ethers.js';
import { store } from './store.mjs';
import './components.mjs'


window.DEBUG = true
if(window.DEBUG){
    console.log("DEBUG MODE")
}





















// Global Event Bus optional but useful with minimal approaches
//
//window.RADIO = new EventEmitter()

/*
function render(){
    document.getElementById("root").innerHTML = template(store.getState())
}
*/

// Initial Render
//
// render()

// Subscriptions
//
/*
store.subscribe( (args) => {
    console.log("updated Store -> render", args)
})
*/

// Input Handlers
//
/*
document.addEventListener('click', async function (event) {
    // console.log(event.target)
	event.preventDefault();

    if(event.target.matches('[data-action="connectWallet"]')){
        await store.getState().connectWallet()
    }

}, false);
*/