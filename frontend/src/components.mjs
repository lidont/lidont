import { store } from "./store.mjs";
import * as ethers from './ethers.js';
import { formatDisplayAddr, RADIO, RAINBOWS, debounce, html } from "./util.mjs";
import { lidontWeb3API } from "./lidontWeb3API.mjs";




// General Purpose Components
//

// icons
//
customElements.define("icon-comp", class extends HTMLElement {
  constructor() {
    super();
    const icon = this.getAttribute("icon")
    const isLarge = this.getAttribute("large") === "" || this.getAttribute("large") === true

    let data = ""
    if(icon === "ETH"){
      data = 'data:image/png;base64,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'
    }

    if(icon === "rETH"){
      data = 'data:image/webp;base64,UklGRs4IAABXRUJQVlA4WAoAAAAQAAAAXwAAXwAAQUxQSFQCAAABkCvbtmlb895nK7Nt27q2jeghs23bthld27Zt21jB0d5rjQ+IiAkgXqfo7H/wMzApr6QkLyno16OD+tMI6MLdb9OYhJkf9i3RAtDf5Hkuk7HgtcUgsVbdK2Gylz9eJ46pH+M0yEoMw3DGcawFf0u9GOcBqzm7wgS805+jtalMyJwt3Bxkwp7kY+B/JrDPSA7mZDGhi5fItrGTia4jkx4DaCmLDoNoIcN6BnKXZFN7UbC5EvUpYjBrhkjjxYCGS7KfQT0nwUIGdq1mhWgqNbrG4D7VYDoDvFi9CERpam1mkI3VScNUpMZOBtpKVQyqVBVzGexlyh7i+qhEuwFXxyAFPQbcVuEVsp8K5cia+hDNYtBXEu3GdpjoPbY/RDnYqrTHM/CzddBZH0B3/hG6d7/ReQWji0lGl5WPrrgUXTm+AnTFqeiyQtDF/kHn/QTdh8PoLuqjs52Ibh7lY6vpS5+w/Sfah+0Y0Vxsa4ioCllLPyJ6j+wfEZERMkeFvs24uoco0DNc30npYlxrlFEiqixSaYDKQRXlYKogNXUwWatD8YiySe25iFapRw/wvCdNK9E09NFoJZptpPlJLDdIyhAkiSTpoCoczaOlobk4lpPUO1CYkPQWGFxITksEriSvnnjmJPeSErFq15D8o/1ECh9LXJ4T5yrxujNHjGIj4rffQxFeDCGuN4bxFr2duLdL5inDlYR0CuMlyp2E3fS6Tr6mD9tJ6JEOX8vlqPrpMobEH7D28K9iKUr/Hls/mGD2mW919o1HdEZhWVlRRrTnu/O2C/sTp1ZQOCBUBgAA8B4AnQEqYABgAD5tKpJGpCIhoS8R7kiADYlqALaDpkcv2XnK2v/Vb6s970l+Kh0y/Mj54fpF/xHqAf07qOPQA8tX2X/3KgD7n3tbmPxCuS+sYGm+U59QszN8j7+pp1Q/rYVjWxJL7m86Kz0vzltAXr+H4BGMBjpEV3QZqZNggnX9jbIzD0iWY1R2ChzGzXcg7ZIFjLR0wdQX4t9BAZExbf3P8mfs0SLnoDha5NchkhFX1U39WwtATPvdSluVutLEGxmWcBNQcPSuy7AZfyLN6FChpKqkEDqq8ssLVhaSZf6TnFPavG+0dBi6e5qKyCoxyebpjeQ6o5cPJJn3xdyJmAD++bOX/5+Z/A/uls/+4FPF+zDEGNzN1lRqQnUZuxVfb1dzVuA9e5znOmW+lB52Mtxz0aLLcQIIiYOZcraWQjzczIpV57v+zrqQxi/6jXP2VkZhMElKjUtjobvsovV9K2rfTdy6qBE2ldnPCyfODxe9/4l4o6R+Mk8F4wysIeV4oepsa4biEkQhHHbPW4Z2IMMliF7kOmOfI/7a7e4P2TzP9EjOHn0AU7BCpgfhcCNmaHsN/qCp2Hwu3ROyB1PXn2pP6b0u6QWLrNac5YQ39Q70GRUYljMeuNYhpgbcSLATxqjmsu8GeKnxPwZvh1FUe1xEchYLPyn+MCwCi1Rv347K+0uvscQOLP81eImY3TZoo+MX/IMwvOzs6L3hUvruChjiXor9Ak8D+8PmBE6Z7sLhv6HwjttcZRp7JeVXN8zBw/1j4lkG/O5sPq0v3nvChhYijeuHk/z7jOueb7WW3DnT9b1fusJ8Fa3MjC1K0bp1PB4SkgW3SDla7FXkAV2g4MHGy9YSQVzW8+hhjXQfbmiDz9im+lz6Q+ZvgnCLMud5cIhO01JCsTSuviSAi+0IyMxnIyUzYq5zXpbRE/H5jwy/6v/TN+Af6c2AHL/5tKi2w6R0yf+EcJZN0Wy2MdO3fmtKTHOeR7X7tc6gDMaNdtpiDnilieI6mwBveSy6Yq/K8PrRNSVco5fcpw1aIb6qc9whVyC4lH1A+1gNO2eqw3v9S3ggWVi8PBFQ5d8tP216GXGr8y05oo46e8fq5aaGrSsmDT2nJLY58SpbbnFju7PWpWZXq1+ZyLgQBR4G3w5rKupaPxhk3F6YOHbrgEw/5/6tpI5zIcqT/qSfIHPfGRJn2rsbuTMgY6O8crISa/j1Ibtr8f9FH/a+j74uhehp+R2p2SYpxB0XpQacbsdla3rfA81VfhsEwWNKsIrsS1T+8vu4RccGjZ7sLfIwf4HTHcUlbXobr/sgC5cn4dzws9x4o0wY3CpI3goq30+iXl+8g5qhvGyOiz3+9T6GkVfsXxxGUV8ivVfx1hSIWmQuYAlf7gGb5XZf2Oi1QPaB4+JGULPBeFuDm+uYMz6fthiW7hxbDbgBymjRTpXTbChFqQLY51IwNsuoZJnHfOwNoFxz+GPsqM5Vva9Yu2lvur2dGfc0zgDYuKN/Wa63V31JxMR8FILd0R3FbGlw528WD/LDJCiUSE/VGP3rTKHZwiCcxitOOLMQ2mqC4ALbKyIo6v8SvEUZusL3pRARr2N6WU61muFa7Q8Xe2YDDguxzvKiDWGVFASvU53su4tDw0uLTx9Wgu+7EYQu+4mN/aS2p6RSyx21ajPeaZIsrppbVNlissC0UnTy8lRcxZ9AtkihqSRn4BBn6DoWzFjjGioWAn9k/ebl5ZNpRRufQNB9bzyHExeehUJnMZegGRNzKKKAzovmNYAcq/K9egRKSN0a/NGk/eMXIwJgnT99hGRjY4oq8jUyjMBx6hTXUx+oGUXTqJ5kHONsa7GwMx/JAnFJBK2e3eoi+I6ds4O0BTXkE3Oy8Z3DsKjQp6fW936CFxArbK/Nw8f2mlT9KbqO9cIAfzdLMUSrCjTLWgkFlgi1NAEbflTE/lnQHDzNtqwVNGE/Kyq+ELclEwwq44n8RhJmXzsiWf8tBWC7PTyxSnVf6nQmfflY3tQv8jrjtvxtPosHsn6KpyUzwi0bpKt9rGNiBems4LyJWnSKtT3MS7Hir+nfkAdJGLJnd+LdV/I8Rt7vWsYXN0lHW6l4D7oRiqMHPKLIRbjBzfvajKYBV6WLxFyQuw69Y7jAETHCpg/0swmsoA+AAAAA'
    }

    if(icon === "stETH"){
      data = 'data:image/webp;base64,UklGRqIEAABXRUJQVlA4TJYEAAAvMUAMEM/nKJIkQck4ffiXAi+2YpldNECOJElQk4D/FvLECZB2u9C2bRsq/x/cTnYQSZIipX+PJ4H5sRi4baRoGQ7cb8Dn+xJCBIHwxw8fhD9CCCfCgRvhxAvhmREjwoGwYcBrDNgRTvwQTvwRXkj+hRDXbj93oJWGKIQRjFEURhCiIYLYiiFd52MkwpMOojA8pgvpUIjGwE9tEEPtQhrCY7pZ/wy80WFIIyiMBmmjiEnQ5Ue5EvwJ06FBaowWYx1EQ3RpdBFiHRqiA1n/NCZ9w+jSOOwdRLBogrKDHokmiwjhefF6f+/P+f6NALVt28xo8pR6UlPVY9u2bdu2koxt27Ztq1M19Y5t27Z3N1l+TaqfJ5mN6L8Dt20jSW6R1p3Ze5O8IYSqaIHsmdMkSxyHsTiJk6XJkr1A0VBAFcqZMXmCMAMUTpA8Y85CgVbZ0iZkPpQwbbbCfimSK1085lPx0uUq4ouCWZOwAEqStaAP8mWIywIpboZ8KHlTMUwl8UWqvAh5UjIEWm5hQ4KOlHng09QMQ5v6aF4pfJkaOiyYgWGQJndfRXoSfGQoGE3WuKhXcr/zPGZdLYo/WNYociXBvbGfnedSzCjh40lzKRROj3v1bzsufK/hw0qv/OqyxUcpscO2PeSaGrgVP5sX0+LesI8qXEwpjoe0bsiRCPVqX3ds274fEVzs7oBbiXKEQpkYRrGNf9j2l1vbJq3nQq6ogluZQvmTo97At86Ph2fEGvPfuduFGFcMJUWB7Ng/kda4Yj+7cMiSa7rp+uBFe3e3Qa2E2bOEMW/1m2tHLc5dDEM3R6xaUhmzwlnSYPe0OX/K4jwKd9Fjcld0myYZtq8yeosUEGbnJpVRkiXG9hprMGu3BGhZrThFSRwHfkRzeSOmlWi7OCIV2v5dktKSrXojwJOWPvlh35gaRCvXb41c271j/TKMFq/eetHmerGZX2n9Pto3+dr+5TVSffSC5hUYLVaxWedhu+RY6jvQrY79/oSILGlfUmNVSlBWtmEn01wi5JqKFJyJoVnJ+yHf4lzumd2IEVqqTjvD0EfsEXxPCwJeAj0QafrC5fNpiwu5bWzN6q0MV92XCc55f5BkaaCTfz7aru5wV0Iu1E3DjWP3cc7lCJA0WcLQlV89vp21OOdyuWm49FglPEZChLNkTwjQ5Z2H/UAA6BMPco/hEAmzQ/8y0vCJ4/H9nBVNr3XCw+pLwH8Z9E+m5S4p2I9jotCnRZQPc1djiExwttBWqPy4aCno/21QolxalsLZonBagHav1PH0sMpMiysaQsCMhGS94ttVfrtsueiDtqhxdVUKZT0ss5JGt9Xx8phwmae4Yq9JwMyKZm9tyAtl/H6NLzeGbPeiiIyCkmXSXD4qBB3zVBmvjy8z5yvzwPjSFKoQvqoQ6XP1L8e2/7ixdOhOwYXcPKAkBauQv0qn1Vxy56fz56dNS2Ik3zq9PoUrnd9qSkmdCfuu3DuycsWcgXWLE7iaBqjYJBYrV6tO5bLFSGykYgfsCqgntCv4HzqPX97d5C4S8qnCATqoYF1apl/QpfnqBLME7ARD'
    }

    if(icon === "lidont"){
      data = '/lidont_coin.png'
    }

    if(icon === "evm"){
      data = '/logo_evm.png'
    }

    if(icon === "rocketlion"){
      data = '/logo_rocketlion.png'
    }

    this.innerHTML = html`<img class="img-icon ${isLarge ? "icon--large": ""}" src="${data}"/>`;
  }
}
);

// store an input value in the store
//
customElements.define("input-connected", class extends HTMLElement {
  constructor() {
    super();
    const name = this.getAttribute("name")
    const type = this.getAttribute("type")
    const debounceAction = this.getAttribute("debounceAction")

    this.debounce = () => {} //noop
    if(debounceAction){
      this.debounce = debounce(store.getState()[debounceAction])
    }

    if(type === "number"){
      this.addEventListener("keyup", (event) => {
        const newState = store.getState().inputs
        newState[name] = event.target.value
        store.setState({inputs: newState});
        this.debounce()
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

    if(type === "radio"){
      this.addEventListener('change', function(event) {
        const newState = store.getState().inputs
        newState[name] = event.target.id
        store.setState({inputs: newState});
        this.render(store.getState());
      })
    }

 }
 connectedCallback() { this.render(store.getState()); }
 attributeChangedCallback() { this.render(store.getState()); }
 render(state){
  const name = this.getAttribute("name")
  const type = this.getAttribute("type")
  const icon = this.getAttribute("icon")
  const id = this.getAttribute("id")
  const label = this.getAttribute("label")
  const placeholder = this.getAttribute("placeholder")

  const selectedOutputPipe = state.inputs.selectedOutputPipe

  if(icon !== ""){
    this.innerHTML = html`
    <div>
      <input 
        ${id ? `id=${id}` : ''} 
        ${name ? `name=${name}` : ''} 
        ${type ? `type=${type}` : ''} 
        ${placeholder ? `placeholder=${JSON.stringify(placeholder)}` : ''}
        ${selectedOutputPipe === this.id ? "checked": ""}
      />
      ${label ? `<sub>${label}</sub>`: ''}
    </div>`;
  }

  if(icon === ""){
    document.querySelectorAll("icon-comp.radio--icon--selected").forEach( x => {
      x.classList.remove("radio--icon--selected")
    })
    this.innerHTML = html`
    <div>
      <input 
        class="radio--icon--input"
        ${id ? `id=${id}` : ''} 
        ${name ? `name=${name}` : ''} 
        ${type ? `type=${type}` : ''} 
        ${selectedOutputPipe === this.id ? "checked": ""}
      />
      <icon-comp large class="radio--icon ${selectedOutputPipe === this.id ? "radio--icon--selected" : ""}" icon="${this.id}"></icon-comp>
      <div class="flex-center">${label ? `<sub>${label}</sub>`: ''}</div>
    </div>`;
  }
 }
});


// wait until a deep state value is defined by a string "my.deep.value"
//
customElements.define("value-connected", class extends HTMLElement {
constructor() {
  super();
  const path = this.getAttribute("data-path")

  let prevValue = null
  store.subscribe( () => {
    const nowState = store.getState()
    const stateValue = Object.byString(nowState, path) //!
    const isEqual = prevValue === stateValue
    if(isEqual){ return }
    if(!isEqual){ 
      prevValue = stateValue
      return this.render(stateValue)
    }
  })
}
render(stateValue){
  let node = "div"
  const propNode = this.getAttribute("data-node")
  if(propNode){ node = propNode }
  const format = this.getAttribute("data-format")
  const isDefined = stateValue !== undefined
  this.innerHTML = `${!isDefined ? '<div class="spinner"/>' : format ? `<${node}>${this.formatter(format)(stateValue)}</${node}>` : `<${node}>${stateValue}</${node}>` }`;
  if(node === "rainbow"){
    RAINBOWS()
  }
}
formatter(name){
  const formatters = {
    "toFixed": (val) => parseFloat(val).toFixed(3),
    "formatDecimals": (val) => parseFloat(ethers.formatUnits(val, 18)).toFixed(3),
  }
  return formatters[name]
}
connectedCallback() { this.render(); }
attributeChangedCallback() { this.render(); }
});



// a button that tries to execute a function from the state store
//
customElements.define("button-connected",class extends HTMLElement {
    constructor() { 
      super();
      const isLarge = this.getAttribute("large")
      const isDisabled = this.getAttribute("disabled")
      const isIcon = this.getAttribute("icon")
      if(isIcon === "" || isIcon === true) {
        this.innerHTML = this.innerText
      }
      else { 
        this.innerHTML = html`<button class="button ${isLarge === "" ? "button--large":""} ${isDisabled === "" || isDisabled ? "disabled" : ""}"><span class="force-center">${this.innerText}</span></button>`;
      }
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




// Specialized Components
//



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


// execute custom action and conditional rendering
//
customElements.define("button-finalize", class extends HTMLElement {
  constructor() { 
    super();
  }
  connectedCallback() { 
    const pendingRequestsIndex = this.getAttribute("data-pendingRequestsIndex");

    this.addEventListener("click",async (event) => {
        event.preventDefault();
        const details = store.getState().pendingRequests[pendingRequestsIndex]
        await store.getState().finalizeWithdrawal(details)
    }, false );

    this.render(); 
  }
  render(){
    this.innerHTML = `<button class="button"><span class="force-center">${this.innerText}</span></button>`;
  }

}
);



// list of pending withdrawals and management of them
//
customElements.define("list-pending-withdrawals", class extends HTMLElement {
  constructor() { 
    super(); 
  }
  connectedCallback() { 

    let prevValue = null // only re-render when value changed
    store.subscribe( () => {
      const state = store.getState()
      if(prevValue === state.pendingRequests){ return }
      if(prevValue !== state.pendingRequests){ 
        prevValue = state.pendingRequests
        return this.render(state.pendingRequests)
      }
    })
    this.render(); 

  }
  attributeChangedCallback() { this.render(); }
  render(requests){
    if(!requests || requests.length === 0){ return this.innerHTML = "<div class='spinner'></div>" }
    this.innerHTML = `
    <div>
      <span>Pending Withdrawals</span>

      ${requests.map( (value, index) => { 
        let amount, shares, timestamp
        Object.keys(value).forEach( key => {
          const obj = value[key]
          amount = obj.amountOfStETH
          shares = obj.amountOfShares
          timestamp = obj.timestamp
        })
        
        return html`
          <div class="stack row flex-between">
          <sub>${ethers.formatEther(shares)} shares bought on ${timestamp}</sub>
            <button-finalize data-pendingRequestsIndex=${index}>Draw ${ethers.formatEther(amount)} stETH</button-finalize>
          </div>
        `.trim()}).join('')
      }
    </div>
    `
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
    RADIO.on("msg", (msg) => { this.render(msg, false) })
    RADIO.on("err", (msg) => { this.render(msg, true) })
    RADIO.on("spinner", (msg) => { this.render(msg, false, true) })
  }
  render(msgObj, error = false, spinner = false){

    this.innerHTML = html`
    <div class="stack col">
      <div>${spinner ? `<div class="spinner float-r"></div>`: ''}</div>
      <sub>${msgObj}</sub>
    <div/>`;
  }
}
);

