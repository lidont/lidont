
customElements.define("game-lidohunt", class extends HTMLElement {
    constructor() { 
      super(); 
      this.hidden = true
    }
    connectedCallback() { 
  
      let prevValue = null // only re-render when value changed
      store.subscribe( () => {
        const state = store.getState()
        if(prevValue === state.withdrawEvents){ return }
        if(prevValue !== state.withdrawEvents){ 
          prevValue = state.withdrawEvents
          return this.render()
        }
      })
  
      RADIO.on("game::lidohunt", () => {
        this.hidden = !this.hidden
        this.render()
      })
      this.render(); 
  
    }
    attributeChangedCallback() { this.render(); }
    render(){
      if(this.hidden){ return this.innerHTML = `` }
      this.innerHTML = html`
      <game>
      </game>
      `;
    }
  }
  );