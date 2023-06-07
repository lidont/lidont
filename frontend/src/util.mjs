/*
    zustand state management library
    zustand/vanilla is a agnostic state management library with no dependencies

    this is the manually compiled js version from:
    https://github.com/pmndrs/zustand/blob/main/src/vanilla.ts

        CAVE! - edits: line 53: dispatch() method added

    Usage (Redux-like):

    import createStore from '...'
    const store = createStore(() => ({
        test: 1,
    }))
    const { getState, setState, subscribe, destroy, dispatch } = store
*/


export const createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

// Implementation
//
const createStoreImpl = (createState) => {
    let state;
    const listeners = new Set();
    const setState = (partial, replace) => {
        // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
        // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
        const nextState = typeof partial === 'function'
            ? partial(state)
            : partial;
        if (!Object.is(nextState, state)) {
            const previousState = state;
            state =
                (replace !== null && replace !== void 0 ? replace : typeof nextState !== 'object')
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
    const destroy = () => listeners.clear();
    const dispatch = async (name, ...rest) => {
        const state = getState()
        if(window.DEBUG){
            console.log("dispatch: "+name)
            console.log(rest)
            console.log(state)
        }
        if(state[name]){
            return await state[name](...rest)
        }
        console.log("no such action found in store")
        return
    }
    const api = { setState, getState, subscribe, destroy, dispatch };
    state = createState(setState, getState, api);
    return api;
  };



// waits for x seconds, returns promise
//
export function waitForSeconds(seconds){
    const P = new Promise( (resolve, reject) => {
        setTimeout( () => {
            resolve()
        }, seconds*1000)
    })

    return P
}


// event emitter
//
export class EventEmitter{
    constructor(){
        this.callbacks = {}
    }

    on(event, cb){
        if(!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb)
    }

    emit(event, data){
        let cbs = this.callbacks[event]
        if(cbs){
            setTimeout( () => {
                cbs.forEach(cb => cb(data))
            }, 0)
        }
    }
}