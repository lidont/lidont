import * as ethers from '../node_modules/ethers/dist/ethers.js';
import { EventEmitter, sanitizeHTML } from './util.mjs';
import { store } from './store.mjs';


window.DEBUG = true

// Global Event Bus optional but useful with minimal approaches
//
window.RADIO = new EventEmitter()


// Markup
//
const MARKUP = (state) => {
    return sanitizeHTML(`
    <div class="container">
        <button class="button" type="button" data-action="connectWallet">${state.address ? state.address : 'Click to Connect Wallet'}</button>
    <div>
    `)
}

function render(){
    document.getElementById("root").innerHTML = MARKUP(store.getState())
}


// Initial Render
//
render()


// Subscriptions
//
store.subscribe( (args) => {
    console.log("updated Store -> render", args)
    render()
})

// Input Handlers
//

document.addEventListener('click', async function (event) {
    // console.log(event.target)
	event.preventDefault();

    if(event.target.matches('[data-action="connectWallet"]')){
        await store.getState().connectWallet()
    }

}, false);