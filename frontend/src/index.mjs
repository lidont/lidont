import * as ethers from '../node_modules/ethers/dist/ethers.js';
import { EventEmitter } from './util.mjs';
import { walletStore } from './store.mjs';


window.DEBUG = true

// Global Event Bus optional but useful with minimal approaches
//
window.RADIO = new EventEmitter()


// Setup
//


// Input Handlers
//

document.addEventListener('click', async function (event) {
    // console.log(event.target)
	event.preventDefault();

    if(event.target.matches('[data-action="connectWallet"]')){
        await walletStore.getState().connectWallet()
    }

}, false);