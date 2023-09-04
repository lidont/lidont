import { store } from "./store.mjs";
import * as ethers from './ethers.js';
import { formatDisplayAddr, RADIO, RAINBOWS, debounce, html, shallowCompare } from "./util.mjs";
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
      data = '/icons/eth.png'
    }

    if(icon === "rETH"){
      data = 'data:image/webp;base64,UklGRs4IAABXRUJQVlA4WAoAAAAQAAAAXwAAXwAAQUxQSFQCAAABkCvbtmlb895nK7Nt27q2jeghs23bthld27Zt21jB0d5rjQ+IiAkgXqfo7H/wMzApr6QkLyno16OD+tMI6MLdb9OYhJkf9i3RAtDf5Hkuk7HgtcUgsVbdK2Gylz9eJ46pH+M0yEoMw3DGcawFf0u9GOcBqzm7wgS805+jtalMyJwt3Bxkwp7kY+B/JrDPSA7mZDGhi5fItrGTia4jkx4DaCmLDoNoIcN6BnKXZFN7UbC5EvUpYjBrhkjjxYCGS7KfQT0nwUIGdq1mhWgqNbrG4D7VYDoDvFi9CERpam1mkI3VScNUpMZOBtpKVQyqVBVzGexlyh7i+qhEuwFXxyAFPQbcVuEVsp8K5cia+hDNYtBXEu3GdpjoPbY/RDnYqrTHM/CzddBZH0B3/hG6d7/ReQWji0lGl5WPrrgUXTm+AnTFqeiyQtDF/kHn/QTdh8PoLuqjs52Ibh7lY6vpS5+w/Sfah+0Y0Vxsa4ioCllLPyJ6j+wfEZERMkeFvs24uoco0DNc30npYlxrlFEiqixSaYDKQRXlYKogNXUwWatD8YiySe25iFapRw/wvCdNK9E09NFoJZptpPlJLDdIyhAkiSTpoCoczaOlobk4lpPUO1CYkPQWGFxITksEriSvnnjmJPeSErFq15D8o/1ECh9LXJ4T5yrxujNHjGIj4rffQxFeDCGuN4bxFr2duLdL5inDlYR0CuMlyp2E3fS6Tr6mD9tJ6JEOX8vlqPrpMobEH7D28K9iKUr/Hls/mGD2mW919o1HdEZhWVlRRrTnu/O2C/sTp1ZQOCBUBgAA8B4AnQEqYABgAD5tKpJGpCIhoS8R7kiADYlqALaDpkcv2XnK2v/Vb6s970l+Kh0y/Mj54fpF/xHqAf07qOPQA8tX2X/3KgD7n3tbmPxCuS+sYGm+U59QszN8j7+pp1Q/rYVjWxJL7m86Kz0vzltAXr+H4BGMBjpEV3QZqZNggnX9jbIzD0iWY1R2ChzGzXcg7ZIFjLR0wdQX4t9BAZExbf3P8mfs0SLnoDha5NchkhFX1U39WwtATPvdSluVutLEGxmWcBNQcPSuy7AZfyLN6FChpKqkEDqq8ssLVhaSZf6TnFPavG+0dBi6e5qKyCoxyebpjeQ6o5cPJJn3xdyJmAD++bOX/5+Z/A/uls/+4FPF+zDEGNzN1lRqQnUZuxVfb1dzVuA9e5znOmW+lB52Mtxz0aLLcQIIiYOZcraWQjzczIpV57v+zrqQxi/6jXP2VkZhMElKjUtjobvsovV9K2rfTdy6qBE2ldnPCyfODxe9/4l4o6R+Mk8F4wysIeV4oepsa4biEkQhHHbPW4Z2IMMliF7kOmOfI/7a7e4P2TzP9EjOHn0AU7BCpgfhcCNmaHsN/qCp2Hwu3ROyB1PXn2pP6b0u6QWLrNac5YQ39Q70GRUYljMeuNYhpgbcSLATxqjmsu8GeKnxPwZvh1FUe1xEchYLPyn+MCwCi1Rv347K+0uvscQOLP81eImY3TZoo+MX/IMwvOzs6L3hUvruChjiXor9Ak8D+8PmBE6Z7sLhv6HwjttcZRp7JeVXN8zBw/1j4lkG/O5sPq0v3nvChhYijeuHk/z7jOueb7WW3DnT9b1fusJ8Fa3MjC1K0bp1PB4SkgW3SDla7FXkAV2g4MHGy9YSQVzW8+hhjXQfbmiDz9im+lz6Q+ZvgnCLMud5cIhO01JCsTSuviSAi+0IyMxnIyUzYq5zXpbRE/H5jwy/6v/TN+Af6c2AHL/5tKi2w6R0yf+EcJZN0Wy2MdO3fmtKTHOeR7X7tc6gDMaNdtpiDnilieI6mwBveSy6Yq/K8PrRNSVco5fcpw1aIb6qc9whVyC4lH1A+1gNO2eqw3v9S3ggWVi8PBFQ5d8tP216GXGr8y05oo46e8fq5aaGrSsmDT2nJLY58SpbbnFju7PWpWZXq1+ZyLgQBR4G3w5rKupaPxhk3F6YOHbrgEw/5/6tpI5zIcqT/qSfIHPfGRJn2rsbuTMgY6O8crISa/j1Ibtr8f9FH/a+j74uhehp+R2p2SYpxB0XpQacbsdla3rfA81VfhsEwWNKsIrsS1T+8vu4RccGjZ7sLfIwf4HTHcUlbXobr/sgC5cn4dzws9x4o0wY3CpI3goq30+iXl+8g5qhvGyOiz3+9T6GkVfsXxxGUV8ivVfx1hSIWmQuYAlf7gGb5XZf2Oi1QPaB4+JGULPBeFuDm+uYMz6fthiW7hxbDbgBymjRTpXTbChFqQLY51IwNsuoZJnHfOwNoFxz+GPsqM5Vva9Yu2lvur2dGfc0zgDYuKN/Wa63V31JxMR8FILd0R3FbGlw528WD/LDJCiUSE/VGP3rTKHZwiCcxitOOLMQ2mqC4ALbKyIo6v8SvEUZusL3pRARr2N6WU61muFa7Q8Xe2YDDguxzvKiDWGVFASvU53su4tDw0uLTx9Wgu+7EYQu+4mN/aS2p6RSyx21ajPeaZIsrppbVNlissC0UnTy8lRcxZ9AtkihqSRn4BBn6DoWzFjjGioWAn9k/ebl5ZNpRRufQNB9bzyHExeehUJnMZegGRNzKKKAzovmNYAcq/K9egRKSN0a/NGk/eMXIwJgnT99hGRjY4oq8jUyjMBx6hTXUx+oGUXTqJ5kHONsa7GwMx/JAnFJBK2e3eoi+I6ds4O0BTXkE3Oy8Z3DsKjQp6fW936CFxArbK/Nw8f2mlT9KbqO9cIAfzdLMUSrCjTLWgkFlgi1NAEbflTE/lnQHDzNtqwVNGE/Kyq+ELclEwwq44n8RhJmXzsiWf8tBWC7PTyxSnVf6nQmfflY3tQv8jrjtvxtPosHsn6KpyUzwi0bpKt9rGNiBems4LyJWnSKtT3MS7Hir+nfkAdJGLJnd+LdV/I8Rt7vWsYXN0lHW6l4D7oRiqMHPKLIRbjBzfvajKYBV6WLxFyQuw69Y7jAETHCpg/0swmsoA+AAAAA'
    }

    if(icon === "stETH"){
      data = '/icons/steth.png'
    }

    if(icon === "lidont"){
      data = '/icons/lidont_coin.png'
    }

    if(icon === "evm"){
      data = '/icons/logo_evm.png'
    }

    if(icon === "rocketlion"){
      data = '/icons/logo_rocketlion.png'
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
        const newState = Object.assign({},store.getState().inputs)
        newState[name] = event.target.value
        store.setState({inputs: newState});
        this.debounce()
      });
    }

    if(type === "checkbox"){
      this.addEventListener('change', function() {
        const isChecked = store.getState().inputs[name]
        const newState = Object.assign({},store.getState().inputs)
        newState[name] = !isChecked
        store.setState({inputs: newState});
      })
    }

    if(type === "radio"){
      this.addEventListener('change', function(event) {
        const newState = Object.assign({},store.getState().inputs)
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
      const isNaked = this.getAttribute("naked")
      if(isNaked === ""){
        this.innerHTML = this.innerText
      } else {
        this.innerHTML = html`<button class="button ${isLarge === "" ? "button--large":""} ${isIcon === "" ? "button--icon":""} ${isDisabled === "" || isDisabled ? "disabled" : ""}"><span class="force-center">${this.innerText}</span></button>`;
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
      this.innerHTML = html`
        <button-connected data-action="INIT">${!address ? "Connect" : formatDisplayAddr(address)}</button-connected>
      `;
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
  }
);


customElements.define("button-deposit", class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() { 
    this.prevValue = {} // only re-render when value changed
    store.subscribe( () => {
      const state = store.getState()
      if(shallowCompare(this.prevValue, state.inputs)){ return }
      if(!shallowCompare(this.prevValue, state.inputs)){ 
        this.prevValue = store.getState().inputs
        return this.render()
      }
    })
    this.render(); 
  }
  render(){
    const state = store.getState()
    const pipe = state.inputs && state.inputs.selectedOutputPipe
    const amount = state.inputs && state.inputs.stETHAmount
    console.log("rerender btn")
    if(!amount || !pipe || parseFloat(amount) <= 0){
      return this.innerHTML = html`
        <button-connected disabled large icon class="disabled vampire--off flex-center" data-action="deposit">🧛</button-connected>
      `;
    }
    this.innerHTML = html`
      <button-connected large icon class="vampire flex-center" data-action="deposit">🧛</button-connected>
      <sup>receive ${pipe} - stake for lidont & bribes*</sup>
    `;
  }
  attributeChangedCallback() { this.render(); }
}
);


// list of pipes and rewards / unclaim
//
customElements.define("list-pipes", class extends HTMLElement {
  constructor() { 
    super(); 
  }
  connectedCallback() { 

    this.prevValue = {} // only re-render when value changed

    store.subscribe( () => {
      const state = store.getState()
      if(shallowCompare(this.prevValue, state.outputPipes)){ return }
      if(!shallowCompare(this.prevValue, state.outputPipes)){ 
        this.prevValue = store.getState().outputPipes
        return this.render(store.getState().outputPipes)
      }
    })

    this.render(); 

  }
  attributeChangedCallback() { this.render(); }
  render(outPipes){
    if(!outPipes){ return this.innerHTML = "<div class='spinner'></div>" }
    const pipes = Object.values(outPipes)
    console.log("rerender pipes")
    this.innerHTML = `
    <div>
      ${pipes.map( (value, index) => { 
        return html`
          <div class="stack row flex-between">
          <sub>${index}</sub>
                  <div class="flex flex-around">
            <button-connected data-action="claimEmission">Claim</button-connected>
        </div>  
        <br/>
        <div class="flex flex-right">
            <sub>Claimable: <value-connected data-node="rainbow" data-path="rETHStakedDetails.rewardDebtFormatted" ></value-connected></sub>
        </div>
        <!--button-connected class="flex-right" data-action="claimEmissionStatic">update</button-connected-->
        </div>
          
        `.trim()}).join('')
      }
    </div>
    `
  }
}
);



// list of pending withdrawals and management of them
//
customElements.define("list-finalize", class extends HTMLElement {
  constructor() { 
    super(); 
  }
  connectedCallback() { 

    let prevValue = null // only re-render when value changed
    store.subscribe( () => {
      const state = store.getState()
      if(prevValue === state.withdrawEvents){ return }
      if(prevValue !== state.withdrawEvents){ 
        prevValue = state.withdrawEvents
        return this.render(state.withdrawEvents)
      }
    })
    this.render(); 

  }
  attributeChangedCallback() { this.render(); }
  render(requests){

    if(!requests || requests.length === 0){ return this.innerHTML = "<div class='spinner'></div>" }
    this.innerHTML = `
    <div>
      ${requests.map( (value, index) => { 

        let amount, shares, timestamp
        Object.keys(value).forEach( key => {
          const obj = value[key]
          amount = obj.amountOfStETH
          shares = obj.amountOfShares
          timestamp = obj.timestamp
        })

        if(!amount || !shares || !timestamp) return

        return html`
          <div class="stack row flex-between">
          <sub>${ethers.formatEther(shares)} shares bought on ${timestamp}</sub>
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


// rainin emojis background
//


function Circle(x, y, c, v, range) {
  var container = document.getElementById('animateEmoji');
  var _this = this;
  this.x = x;
  this.y = y;
  this.color = c;
  this.v = v;
  this.range = range;
  this.element = document.createElement('span');
  /*this.element.style.display = 'block';*/
  this.element.style.opacity = 0;
  this.element.style.position = 'absolute';
  this.element.style.fontSize = '26px';
  this.element.style.color = 'hsl('+(Math.random()*360|0)+',80%,50%)';
  this.element.innerHTML = c;
  container.appendChild(this.element);

  this.update = function(dt) {
    if (_this.y > 800) {
      _this.y = 80 + Math.random() * 4;
      _this.x = _this.range[0] + Math.random() * _this.range[1];
    }
    _this.y += _this.v.y;
    _this.x += _this.v.x;
    this.element.style.opacity = 0.77;
    this.element.style.transform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
    this.element.style.webkitTransform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
    this.element.style.mozTransform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
  };
}

customElements.define("emoji-rain", class extends HTMLElement {
  constructor() { super(); this.render() }
  render(address){
    this.innerHTML = html`
      <div id="containerEmoji">
        <div id="animateEmoji"></div>
      </div>
    `;
  }
  connectedCallback() { 
    this.render()
    RADIO.on("RAIN", this.letItRain)
  }
  letItRain() { 
    

    setTimeout( () => {
      var emoji = ['💰', '💎', '🏴‍☠️', '⚔️', '🍺', '🔓', '🦜', '💍', '💴', '💶', '🪙'];
      var circles = [];

      function addCircle(delay, range, color) {
        setTimeout(function() {
          var c = new Circle(range[0] + Math.random() * range[1], 80 + Math.random() * 4, color, {
            x: -0.15 + Math.random() * 0.3,
            y: 1 + Math.random() * 1
          }, range);
          circles.push(c);
        }, delay);
      }
  
      for (var i = 0; i < 15; i++) {
        addCircle(i * 150, [10 + 0, 300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 160, [10 + 0, -300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 170, [10 - 200, -300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 180, [10 + 200, 300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 190, [10 - 400, -300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 250, [10 + 400, 300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 260, [10 - 600, -300], emoji[Math.floor(Math.random() * emoji.length)]);
        addCircle(i * 270, [10 + 600, 300], emoji[Math.floor(Math.random() * emoji.length)]);
      }
  
      function animate(dt) {
        for (var i in circles) {
          circles[i].update(dt);
        }
        requestAnimationFrame(animate);
      }
  
      animate();
    }, 500)

  }
}
);