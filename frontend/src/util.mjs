/*
    zustand state management library
    zustand/vanilla is a agnostic state management library with no dependencies

    this is the manually compiled js version from:
    https://github.com/pmndrs/zustand/blob/main/src/vanilla.ts

    Usage:
    import createStore from '...'
    const store = createStore(() => ({
        test: 1,
    }))
    const { getState, setState, subscribe, destroy } = store
*/

// zustand/vanilla
//
const createStoreImpl = (createState) => {
  let state;
  const listeners = new Set();

  const setState = (partial, replace) => {
    // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
    // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state =
        replace ?? typeof nextState !== "object"
          ? nextState
          : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);
    // Unsubscribe
    return () => listeners.delete(listener);
  };

  const destroy = () => {
    if (import.meta.env?.MODE !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };

  const api = { setState, getState, subscribe, destroy };
  state = createState(setState, getState, api);
  return api;
};

export const createStore = (createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl;


// Logger
//
export const log = (config) => (set, get, api) =>
config(
  (...args) => {
    console.log("Action: ", args[0] )
    set(...args)
    // console.log('  new state', get())
  },
  get,
  api
)


// waits for x seconds, returns promise
//
export function waitForSeconds(seconds) {
    const P = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000);
    });
  
    return P;
  }
  


// event emitter
//
export class EventEmitter {
  constructor() {
    this.callbacks = {};
  }

  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
  }

  emit(event, data) {
    if(window.DEBUG) console.log("<- emit: ", event, data)
    let cbs = this.callbacks[event];
    if (cbs) {
      setTimeout(() => {
        cbs.forEach((cb) => cb(data));
      }, 0);
    }
  }
}
export const RADIO = new EventEmitter()

// toggle dark mode
//
var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme)

export function toggleTheme () {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var targetTheme = "light";

    if (currentTheme === "light") {
        targetTheme = "dark";
    }

    document.documentElement.setAttribute('data-theme', targetTheme)
    localStorage.setItem('theme', targetTheme);
};


/* waits for callback to not Error and return true, returns promise
 * await waitForCallback( async () => {
 *  const request = await somethingAsync()
 *  return request.status === 200 // return true to resolve
 * })
 */
export function waitForCallback(cb) {
  async function recur(){
      try {
          const done = await cb()
          if(!done){
              throw Error()
          }
          return
        } catch (e) {
          // console.log(e)
          await waitForSeconds(1)
          await recur()
        }
  }

  const P = new Promise( async (resolve, reject) => {
      await recur()
      return resolve()
  });

return P;
}



// utils
//

export function formatDisplayAddr(addr){
  return addr.slice(0, 4) +'...'+ addr.slice(Math.max(addr.length - 4, 0))
}


//  https://stackoverflow.com/a/6491621
//  const myObj = {my: 1, myArray: [1,{value: 2},3], two: { deep: { object: { myKey: 1}} } }
//  myObj.byString("myArray[1].value"); myObj.byString("deep.object.myKey")
//
Object.byString = function(o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, '');           // strip a leading dot
  var a = s.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
          o = o[k];
      } else {
          return;
      }
  }
  return o;
}


// debounce
//
export const debounce = (callback, wait = 1000) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}


// stupid rainbow effect, replacing text
//
export const RAINBOWS = () => {
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

