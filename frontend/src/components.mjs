import { store } from "./store.mjs";
import { formatDisplayAddr } from "./util.mjs";

customElements.define(
  "lidont-button",
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
  "lidont-button-connect",
  class Component extends HTMLElement {
    constructor() {
      super();
      //re-render guard
      let prevValue = null
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
        <lidont-button data-action="connectWallet">${!address ? "Connect" : formatDisplayAddr(address)}</lidont-button>
      `;
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
  }
);

customElements.define(
  "lidont-input",
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
