class Component extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    this.getElementById('inc').onclick = () => this.inc();
    this.getElementById('dec').onclick = () => this.dec();
    this.render(this.count);
  }

  inc() {
    this.render(++this.count);
  }

  dec() {
    this.render(--this.count);
  }

  render(count){
    this.innerHTML = `
      <div>
        <button id="inc">inc</button>
        <button id="dec">inc</button>
        ${count}
      </div>
    `;
  }

  connectedCallback() { this.render(); }

  attributeChangedCallback() { this.render(); }
}

customElements.define('counter', Component);