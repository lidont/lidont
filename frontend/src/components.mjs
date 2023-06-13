import { store } from "./store.mjs";
import { formatDisplayAddr, RADIO } from "./util.mjs";
 

// icons
//
customElements.define("icon-comp", class extends HTMLElement {
  constructor() {
    super();
    const icon = this.getAttribute("icon")
    let data = ""
    if(icon === "rETH"){
      data = 'data:image/webp;base64,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'
    }

    if(icon === "stETH"){
      data = 'data:image/webp;base64,UklGRqIEAABXRUJQVlA4TJYEAAAvMUAMEM/nKJIkQck4ffiXAi+2YpldNECOJElQk4D/FvLECZB2u9C2bRsq/x/cTnYQSZIipX+PJ4H5sRi4baRoGQ7cb8Dn+xJCBIHwxw8fhD9CCCfCgRvhxAvhmREjwoGwYcBrDNgRTvwQTvwRXkj+hRDXbj93oJWGKIQRjFEURhCiIYLYiiFd52MkwpMOojA8pgvpUIjGwE9tEEPtQhrCY7pZ/wy80WFIIyiMBmmjiEnQ5Ue5EvwJ06FBaowWYx1EQ3RpdBFiHRqiA1n/NCZ9w+jSOOwdRLBogrKDHokmiwjhefF6f+/P+f6NALVt28xo8pR6UlPVY9u2bdu2koxt27Ztq1M19Y5t27Z3N1l+TaqfJ5mN6L8Dt20jSW6R1p3Ze5O8IYSqaIHsmdMkSxyHsTiJk6XJkr1A0VBAFcqZMXmCMAMUTpA8Y85CgVbZ0iZkPpQwbbbCfimSK1085lPx0uUq4ouCWZOwAEqStaAP8mWIywIpboZ8KHlTMUwl8UWqvAh5UjIEWm5hQ4KOlHng09QMQ5v6aF4pfJkaOiyYgWGQJndfRXoSfGQoGE3WuKhXcr/zPGZdLYo/WNYociXBvbGfnedSzCjh40lzKRROj3v1bzsufK/hw0qv/OqyxUcpscO2PeSaGrgVP5sX0+LesI8qXEwpjoe0bsiRCPVqX3ds274fEVzs7oBbiXKEQpkYRrGNf9j2l1vbJq3nQq6ogluZQvmTo97At86Ph2fEGvPfuduFGFcMJUWB7Ng/kda4Yj+7cMiSa7rp+uBFe3e3Qa2E2bOEMW/1m2tHLc5dDEM3R6xaUhmzwlnSYPe0OX/K4jwKd9Fjcld0myYZtq8yeosUEGbnJpVRkiXG9hprMGu3BGhZrThFSRwHfkRzeSOmlWi7OCIV2v5dktKSrXojwJOWPvlh35gaRCvXb41c271j/TKMFq/eetHmerGZX2n9Pto3+dr+5TVSffSC5hUYLVaxWedhu+RY6jvQrY79/oSILGlfUmNVSlBWtmEn01wi5JqKFJyJoVnJ+yHf4lzumd2IEVqqTjvD0EfsEXxPCwJeAj0QafrC5fNpiwu5bWzN6q0MV92XCc55f5BkaaCTfz7aru5wV0Iu1E3DjWP3cc7lCJA0WcLQlV89vp21OOdyuWm49FglPEZChLNkTwjQ5Z2H/UAA6BMPco/hEAmzQ/8y0vCJ4/H9nBVNr3XCw+pLwH8Z9E+m5S4p2I9jotCnRZQPc1djiExwttBWqPy4aCno/21QolxalsLZonBagHav1PH0sMpMiysaQsCMhGS94ttVfrtsueiDtqhxdVUKZT0ss5JGt9Xx8phwmae4Yq9JwMyKZm9tyAtl/H6NLzeGbPeiiIyCkmXSXD4qBB3zVBmvjy8z5yvzwPjSFKoQvqoQ6XP1L8e2/7ixdOhOwYXcPKAkBauQv0qn1Vxy56fz56dNS2Ik3zq9PoUrnd9qSkmdCfuu3DuycsWcgXWLE7iaBqjYJBYrV6tO5bLFSGykYgfsCqgntCv4HzqPX97d5C4S8qnCATqoYF1apl/QpfnqBLME7ARD'
    }
    this.innerHTML = `<img class="img-icon" src="${data}"/>`;
  }
}
);


// reacts to window.RADIO msg channel
//
customElements.define("logger-radio", class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback(){
    RADIO.on("err", (msg) => { this.render(msg, true) })
  }
  render(msgObj, error){
    this.innerHTML = `<div>
      <sub>${msgObj}</sub>
    <div/>`;
  }
}
);


// a button that tries to execute a function from the state store
//
customElements.define("button-connected",class extends HTMLElement {
    constructor() { super();
      this.innerHTML = `<button class="button"><span class="force-center">${this.innerText}</span></button>`;
      // executes store action with same name on click if found
      const actionName = this.getAttribute("data-action");
      if (actionName) {
        this.addEventListener("click",async (event) => {
            event.preventDefault();
            const actions = store.getState();
            if (actions[actionName]) {
              await actions[actionName]();
            }
        }, false );
      }
    }

  }
);


// execute custom action and conditional rendering
//
customElements.define("button-connect-wallet", class extends HTMLElement {
    constructor() {
      super();

      let prevValue = null // only re-render when value changed
      store.subscribe( () => {
        const state = store.getState()
        if(prevValue === state.address){ return }
        if(prevValue !== state.address){ 
          prevValue = state.address
          return this.render(state.address)
        }
      })
    }
    render(address){
      this.innerHTML = `
        <button-connected data-action="INIT">${!address ? "Connect" : formatDisplayAddr(address)}</button-connected>
      `;
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
  }
);


// store this input value in the store
//
customElements.define("input-connected", class extends HTMLElement {
    constructor() {
      super();
      const name = this.getAttribute("name")
      const type = this.getAttribute("type")
      const label = this.getAttribute("label")
      const placeholder = this.getAttribute("placeholder")
      this.innerHTML = `<div><input checked ${type ? `type=${type}` : ''} ${placeholder ? `placeholder=${JSON.stringify(placeholder)}` : ''}/>${label ? `<sub>${label}</sub>`: ''}</div>`;

      if(type === "number"){
        this.addEventListener("keyup", (event) => {
          
          const newState = store.getState().inputs
          newState[name] = event.target.value
          store.setState({inputs: newState});
        });
      }

      if(type === "checkbox"){
        this.addEventListener('change', function() {
          const isChecked = store.getState().inputs[name]
          const newState = store.getState().inputs
          newState[name] = !isChecked
          store.setState({inputs: newState});
        })
      }

   }
});



// wait until a specific erc20 balance from the balances {} is available and display its value
//
customElements.define("balance-erc20", class extends HTMLElement {
    constructor() { super() }
    render(balance){
      this.innerHTML = `${!balance ? '<div class="spinner"/>' : parseFloat(balance.balanceFormatted).toFixed(2)}`;
    }
    connectedCallback() { 
      const symbol = this.getAttribute("data-symbol")
      let prevValue = null

      store.subscribe( () => {
        const balance = store.getState()["balancesBySymbol"][symbol]
        if(prevValue === balance) return
        prevValue = balance
        return this.render(balance)
      })

      this.render(); 
    }
    attributeChangedCallback() { this.render(); }
  }
);


// wait until "balanceFormatted" is available and display it formatted to 2 decimals
//
customElements.define("balance-ether", class extends HTMLElement {
  constructor() {  super()  }
  render(balance){ 
    this.innerHTML = `${!balance ? '<div class="spinner"/>' : parseFloat(balance).toFixed(2)}` 
  }
  connectedCallback() { 
    const symbol = this.getAttribute("data-symbol")
    let prevValue = null

    store.subscribe( () => {
      const balance = store.getState()["balanceFormatted"]
      prevValue = balance
      return this.render(balance)
    })

    this.render(); 
  }
  attributeChangedCallback() { this.render(); }
});


// wait until a state key is not undefined, then display that value
//
customElements.define("wait-for-value", class extends HTMLElement {
  constructor() {
    super();
    const stateKey = this.getAttribute("data-stateKey")

    let prevValue = null
    store.subscribe( () => {
      const stateValue = store.getState()[stateKey]
      const isEqual = prevValue === stateValue
      if(isEqual){ return }
      if(!isEqual){ 
        prevValue = stateValue
        return this.render(stateValue)
      }
    })
  }
  render(){
    const stateKey = this.getAttribute("data-stateKey")
    const state = store.getState()
    const isDefined = !!state[stateKey]
    this.innerHTML = `${!isDefined ? '<div class="spinner"/>' : state[stateKey]}`;
  }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
});


// wait until a state key in an object is not undefined, then display that value
//
customElements.define("wait-for-object-value", class extends HTMLElement {
  constructor() {
    super();
    const stateKey = this.getAttribute("data-stateKey")
    const objectKey = this.getAttribute("data-objectKey")

    let prevValue = null
    store.subscribe( () => {
      const stateValue = store.getState()[stateKey][objectKey]
      const isEqual = prevValue === stateValue
      if(isEqual){ return }
      if(!isEqual){ 
        prevValue = stateValue
        return this.render(stateValue)
      }
    })
  }
  render(value){
    let node = "div"
    const propNode = this.getAttribute("data-node")
    if(propNode){ node = propNode }
    const isDefined = !!value
    this.innerHTML = `${!isDefined ? '<div class="spinner"/>' : `<${node}>${value}</${node}>`}`;
    if(isDefined) window.RAINBOWS()
  }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
});