import * as ethers from '../node_modules/ethers/dist/ethers.js';
import { store } from './store.mjs';
import './components.mjs'


window.DEBUG = true
if(window.DEBUG){
    console.log("DEBUG MODE")
}






























// rainbow effect
// TODO: make WC
(function () {
    var angle = 0;
    var p = document.querySelector('h2');
    var text = p.textContent.split('');
    var len = text.length;
    var phaseJump = 360 / len;
    var spans;
  
    p.innerHTML = text.map(function (char) {
      return '<span class="heading-rainbow">' + char + '</span>';
    }).join('');
  
    spans = p.children;
  
    (function wheee () {
      for (var i = 0; i < len; i++) {
        spans[i].style.color = 'hsl(' + (angle + Math.floor(i * phaseJump)) + ', 55%, 70%)';
      }
      angle++;
      requestAnimationFrame(wheee);
    })();
  })();
















// Global Event Bus optional but useful with minimal approaches
//
//window.RADIO = new EventEmitter()


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