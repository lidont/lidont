import { store } from "./store.mjs";
import { RADIO, html } from "./util.mjs";


const template = html`
<main>
<logger-radio></logger-radio>
<sub class="text-light">beta-1</sub>
<div class="container">
    <div class="nav">
        <div class="stack">
            <button-connected class="icon flex-left pointer openMenu" naked icon data-action="openMenu">🍔</button-connected>
            <button-connect-wallet class="flex-right"></button-connect-wallet>
            <span class="flex-right force-center pill"><value-connected data-format="formatDecimals" data-path="balance"></value-connected>&nbsp; ETH</span>
        </div>
    </div>
    <div class="flex-center"><img class="logo" src="logo2.png" /></div>

    <template-admin></template-admin>

    <hr/>
    <div class="card">
        <div class="flex flex-between">
            <span class="text-big">Deposit stETH</span>
            <div>
                <sub>Balance: <value-connected data-format="formatDecimals" data-path="balancesBySymbol.stETH.balance"></value-connected>  stETH</sub>
                <sub>Allowance: <value-connected data-format="formatDecimals" data-path="stETHAllowance"></value-connected> stETH</sub>
            </div>
        </div>
        <div class="flex-center">
            <icon-comp icon="stETH"></icon-comp><p class="spin">♻️</p><icon-comp icon="lidont"></icon-comp>
        </div>
        <sub>1. Send stETH to Withdrawler:</sub>
        <hr/>
        <div class="stack flex-center">
            <input-connected class="flex-7" type="number" placeholder="stETH amount to swap" name="stETHAmount"></input-connected>
        </div>
        <br/>
        <sub>2. Choose Output Pipe & Bribes:</sub>
        <hr/>
        <div class="stack flex-center">
            <input-connected class="flex-center radio" icon label="ETH" id="ETH" type="radio" name="selectedOutputPipe"></input-connected>
            <input-connected class="flex-center radio" icon label="rETH" id="rETH" type="radio" name="selectedOutputPipe"></input-connected>
        </div>
        <br/>
        <sub>3. Deposit:</sub>
        <hr/>
        <div class="stack flex-center">
            <button-deposit></button-deposit>
        </div>
        <sub>After the withdraw cycle your LST is staked to earn rewards</sub>
        
    </div>
    <emoji-rain></emoji-rain>
    <hr />
    <div class="card">
        <div class="flex flex-between">
            <span class="text-big">Receive Tokens</span>
            <sub>Balance: <value-connected data-format="formatDecimals" data-path="balancesBySymbol.LIDONT.balance"></value-connected> LIDONT</sub>
        </div>
        <div class="flex-center">
            <p class="spin"><icon-comp icon="lidont"></icon-comp></p>
        </div>
        <sub>Ouput Pipes:</sub>
        <hr/>

        <list-pipes></list-pipes>

    </div>
    <hr/>
    <div>
        <div class="stack flex-around">
            <sub>Initiative by:</sub>
        </div>
        <div class="stack flex-center">
            <icon-comp large icon="evm"></icon-comp>
            &
            <icon-comp large icon="rocketlion"></icon-comp>
        </div>
    </div>

    <div class="flex flex-around text-light">
        <h2>save the ethereum network</h2>
    </div>
</div>
</main>
`


customElements.define("template-main", class extends HTMLElement {
    constructor() { 
      super()
    }
    connectedCallback() { 
        this.render();
    }
    attributeChangedCallback() { this.render(); }
    render(){
      this.innerHTML = template
    }
  }
);

// admin
//
customElements.define("template-admin", class extends HTMLElement {
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
  
      RADIO.on("ADMIN", () => {
        this.hidden = !this.hidden
        this.render()
      })
      this.render(); 
  
    }
    attributeChangedCallback() { this.render(); }
    render(){
      if(this.hidden){ return this.innerHTML = `` }
      this.innerHTML = html`
      <section>
        <hr/>
        <div class="card">
            <div class="box">
            <div class="rainbow-bg"></div>
            </div>
            <div class="flex flex-between">
                <span class="text-big">Attack</span>
                <div>
                    <!--sub>Balance: <value-connected data-format="formatDecimals" data-path="balanceOfLidontSTETH"></value-connected> stETH available to withdraw</sub-->
                </div>
            </div>
            <sub>xxxx stETH waiting to be saved</sub>
            <div class="stack flex-center">
                <button-connected large class="flex-center" data-action="initiateWithdrawal">Initiate Withdraw</button-connected>
            </div>

            <div class="stack flex-center">
                <button-connected large class="flex-center" data-action="finalizeWithdrawal">Finalize Batch</button-connected>
            </div>
            
            <sub>Next Batch:</sub>
            <list-finalize></list-finalize>
        </div>
    </section>
      `;
    }
  }
  );