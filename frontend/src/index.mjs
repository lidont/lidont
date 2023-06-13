import * as ethers from './ethers.min.js';
import { RADIO } from "./util.mjs"

window.DEBUG = true
window.RADIO = RADIO
if(window.DEBUG){
    console.log("DEBUG MODE")
}

// register web components
import './components.mjs'



window.RADIO.emit("msg", "App Loaded!")







// lol burger
window.RAINBOWS = () => {
  // rainbow effect 
  (function () {

      var elems = document.getElementsByTagName('rainbow')

      Array.prototype.forEach.call(elems, rain)

      function rain(elem){
        var angle = 0;
        var text = elem.textContent.split('');
        var len = text.length;
        var phaseJump = 360 / len;
        var spans;
      
        elem.innerHTML = text.map(function (char) {
          return '<span class="text-rainbow">' + char + '</span>';
        }).join('');
      
        spans = elem.children;
      
        (function wheee () {
          for (var i = 0; i < len; i++) {
            spans[i].style.color = 'hsl(' + (angle + Math.floor(i * phaseJump)) + ', 55%, 70%)';
          }
          angle++;
          requestAnimationFrame(wheee);
        })();
      }


    })();

}