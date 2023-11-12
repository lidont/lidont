import * as ethers from 'ethers';
import lArtifact from '../abis/lidont.json' assert { type: 'json' };
import wArtifact from '../abis/withdrawler.json' assert { type: 'json' };
import pipeETHArtifact from '../abis/ETH-pipe.json' assert { type: 'json' };
import pipeRETHArtifact from '../abis/rETH-pipe.json' assert { type: 'json' };

// converts ABI to human readable short format
//


function convert(jsonAbi){
    const out = []
    const iface = new ethers.Interface(jsonAbi);
    iface.format("full");
    iface.fragments.forEach(fragment => {
        if(fragment.payable) return
        if(fragment.type === "constructor") return
        out.push(fragment.format('full'))
    });
    console.log(out)
    return out
}

console.log("lidont")
convert(lArtifact)
console.log("withdrawler")
convert(wArtifact)
console.log("pipe ETH")
convert(pipeETHArtifact)
console.log("pipe rETH")
convert(pipeRETHArtifact)
