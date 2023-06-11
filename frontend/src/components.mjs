import { store } from "./store.mjs";
import { formatDisplayAddr } from "./util.mjs";

customElements.define(
  "button-connected",
  class Component extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `<button class="button"><span class="force-center">${this.innerText}</span></button>`;

      // executes store action with same name on click if found
      const actionName = this.getAttribute("data-action");
      if (actionName) {
        this.addEventListener(
          "click",
          async (event) => {
            event.preventDefault();
            const actions = store.getState();
            if (actions[actionName]) {
              await actions[actionName]();
            }
          },
          false
        );
      }
    }

  }
);

customElements.define(
  "button-connect-wallet",
  class Component extends HTMLElement {
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
        <button-connected data-action="connectNetworkAndWallet">${!address ? "Connect" : formatDisplayAddr(address)}</button-connected>
      `;
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
  }
);

customElements.define(
  "input-connected",
  class Component extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `<input type="number"/>`;

      this.addEventListener("keyup", (event) => {
        const name = this.getAttribute("name")
        const newState = store.getState().inputs
        newState[name] = event.target.value
        store.setState({inputs: newState});
      });

    }
  }
);

customElements.define(
  "icon-comp",
  class Component extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `<img height="32px" src="data:image/webp;base64,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"/>`;
    }
  }
);




customElements.define(
  "wait-for-connected",
  class Component extends HTMLElement {
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
    render(address){
      const stateKey = this.getAttribute("data-stateKey")
      const isDefined = store.getState()[stateKey]
      this.innerHTML = `${!isDefined ? '<div class="spinner"/>' : ''}`;
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
  }
);




/*

<input id="inputEl" placeholder="Enter a number..." type="text" />
<span id="val"></span>
<button id="incrementVal">Increment</button>
// JavaScript
const data = {
  value: ''
};
const el = document.getElementById('inputEl');
Object.defineProperty(data, 'prop', {
  get: function() {
    console.log('Getter called');
    return this.value;
  },
  set: function(value) {
    console.log('Setter called');
    this.value = value;
    el.value = value;
    printVal();
  }
});
// attaching the event listener on keyup events
el.addEventListener('keyup', (event) => {
  data.prop = event.target.value;
});
function printVal() {
  const el = document.getElementById('val');
  el.innerText = data.prop;
}
const btn = document.getElementById('incrementVal');
btn.addEventListener('click', () => {
 data.prop = Number(data.prop) + 1;
});

*/
