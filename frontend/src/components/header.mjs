customElements.define(
  "lidont-header",
  class Component extends HTMLElement {
    constructor() {
      super();

      this.innerHTML = `
      <div>
        <lidont-button-connect></lidont-button-connect>
        <lidont-input name="amountRETH"></lidont-input>
      </div>
    `;
    
    }
  }
);