import * as ethers from 'ethers';
import lArtifact from '../.build/lidont.json' assert { type: 'json' };
import wArtifact from '../.build/withdrawler.json' assert { type: 'json' };
import pipeETHArtifact from '../.build/ETH-pipe.json' assert { type: 'json' };
import pipeRETHArtifact from '../.build/rETH-pipe.json' assert { type: 'json' };

// converts ABI to human readable short format
//


function convert(jsonAbi){
    const out = []
    const iface = new ethers.Interface(jsonAbi);
    iface.format("full");
    iface.fragments.forEach(fragment => {
        out.push(fragment.format('full'))
    });
    console.log(out)
    return out
}

convert(lArtifact.abi)
convert(wArtifact.abi)
convert(pipeETHArtifact.abi)

