const template = document.createElement('template');
template.innerHTML = `
  <style>
    * {
      font-size: 200%;
    }

    span {
      width: 4rem;
      display: inline-block;
      text-align: center;
    }

    button {
      width: 4rem;
      height: 4rem;
      border: none;
      border-radius: 10px;
      background-color: seagreen;
      color: white;
    }
  </style>
  <button id="dec">-</button>
  <span id="count"></span>
  <button id="inc">+</button>`;

class Component extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.getElementById('inc').onclick = () => this.inc();
    this.shadowRoot.getElementById('dec').onclick = () => this.dec();
    this.update(this.count);
  }

  inc() {
    this.update(++this.count);
  }

  dec() {
    this.update(--this.count);
  }

  update(count) {
    this.shadowRoot.getElementById('count').innerHTML = count;
  }
}

customElements.define('counter', Component);