// import * as ethers from '../node_modules/ethers/dist/ethers.js';
// import { store } from './store.mjs';


// register web components
import './components.mjs'


window.DEBUG = true
if(window.DEBUG){
    console.log("DEBUG MODE")
}

















window.RAINBOWS = () => {
  // rainbow effect LOLZ
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

}