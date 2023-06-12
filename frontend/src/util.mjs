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
  
  /* waits for callback to not Error/ return false and return true, returns promise
   * await waitFor( async () => {
   *  const request = await asyncRequest()
   *  return request.status === 200
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
              //console.log(e)
              await waitForSeconds(0.2) //retry delay
              await recur()
            }
      }
  
      const P = new Promise( async (resolve, reject) => {
          await recur()
          return resolve()
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


// utils
//

export function formatDisplayAddr(addr){
  return addr.slice(0, 4) +'...'+ addr.slice(Math.max(addr.length - 4, 0))
}