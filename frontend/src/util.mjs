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
    console.log('  applying', args)
    set(...args)
    console.log('  new state', get())
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


// Sanitize HTML
//

/*!
 * Sanitize an HTML string
 * (c) 2021 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {String}          str   The HTML string to sanitize
 * @param  {Boolean}         nodes If true, returns HTML nodes instead of a string
 * @return {String|NodeList}       The sanitized string or nodes
 */
export function sanitizeHTML (str, nodes) {
	/**
	 * Convert the string to an HTML document
	 */
	function stringToHTML () {
		let parser = new DOMParser();
		let doc = parser.parseFromString(str, 'text/html');
		return doc.body || document.createElement('body');
	}

	/**
	 * Remove <script> elements
	 * @param  {Node} html The HTML
	 */
	function removeScripts (html) {
		let scripts = html.querySelectorAll('script');
		for (let script of scripts) {
			script.remove();
		}
	}
	/**
	 * Check if the attribute is potentially dangerous
	 */
	function isPossiblyDangerous (name, value) {
		let val = value.replace(/\s+/g, '').toLowerCase();
		if (['src', 'href', 'xlink:href'].includes(name)) {
			if (val.includes('javascript:') || val.includes('data:')) return true;
		}
		if (name.startsWith('on')) return true;
	}
	/**
	 * Remove potentially dangerous attributes from an element
	 */
	function removeAttributes (elem) {
		// Loop through each attribute
		// If it's dangerous, remove it
		let atts = elem.attributes;
		for (let {name, value} of atts) {
			if (!isPossiblyDangerous(name, value)) continue;
			elem.removeAttribute(name);
		}

	}
	/**
	 * Remove dangerous stuff from the HTML document's nodes
	 */
	function clean (html) {
		let nodes = html.children;
		for (let node of nodes) {
			removeAttributes(node);
			clean(node);
		}
	}
	let html = stringToHTML();
	// Sanitize it
	removeScripts(html);
	clean(html);
	// If the user wants HTML nodes back, return them
	// Otherwise, pass a sanitized string back
	return nodes ? html.childNodes : html.innerHTML;

}