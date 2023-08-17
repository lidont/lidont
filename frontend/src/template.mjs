import { store } from "./store.mjs";
import { RADIO, html } from "./util.mjs";


const template = html`
<main>
<logger-radio></logger-radio>
<sub class="text-light">beta-1</sub>
<div class="container">
    <div class="nav">
        <div class="stack">
            <button-connected class="icon flex-left pointer openMenu" icon data-action="openMenu">🍔</button-connected>
            <button-connect-wallet class="flex-right"></button-connect-wallet>
            <span class="flex-right force-center pill"><value-connected data-format="formatDecimals" data-path="balance"></value-connected>&nbsp; ETH</span>
        </div>
    </div>
    <div class="flex-center"><img class="logo" src="logo2.png" /></div>

    <admin-section></admin-section>

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
        <sub>3. After withdraw cycle your LST is staked to earn rewards:</sub>
        <hr/>
        <div class="stack flex-center">
            <button-deposit></button-deposit>
        </div>
        
    </div>

    <hr />
    <div class="card">
        <div class="flex flex-between">
            <span class="text-big">Rewards</span>
            <sub>Balance: <value-connected data-format="formatDecimals" data-path="balancesBySymbol.LIDONT.balance"></value-connected> LIDONT</sub>
        </div>
        <sub>lidont emission rewards</sub>
        <div class="flex flex-around">
            <button-connected data-action="claimEmission">Claim Emission</button-connected>
        </div>  
        <br/>
        <div class="flex flex-right">
            <sub>Claimable: <value-connected data-node="rainbow" data-path="rETHStakedDetails.rewardDebtFormatted" ></value-connected></sub>
        </div>
        <!--button-connected class="flex-right" data-action="claimEmissionStatic">update</button-connected-->
        <div class="flex flex-around">
            <button-connected data-action="claimEmission">Claim Bribes</button-connected>
        </div>  
    </div>

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
        <sub>Deposits:</sub>
        <value-connected data-path="deposits"></value-connected>
        <br/>
        <div class="stack flex-center">
            <button-connected class="flex-center" data-action="initiateWithdrawal">Initiate New Withdrawal</button-connected>
            <button-connected class="flex-center" data-action="finalizeWithdrawal">FInalize Withdrawal</button-connected>
        </div>
        <hr/>
        <list-pending-withdrawals></list-pending-withdrawals>
    </div>

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
        if(prevValue === state.pendingWithdrawals){ return }
        if(prevValue !== state.pendingWithdrawals){ 
          prevValue = state.pendingWithdrawals
          return this.render(state.pendingWithdrawals)
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
      const withdrawals = store.getState().pendingWithdrawals
      if(this.hidden){ return this.innerHTML = `` }
      this.innerHTML = html`
      <hr/>
      <div class="card">
          <div class="box">
            <div class="rainbow-bg"></div>
          </div>
      </div>
      `;
    }
  }
  );