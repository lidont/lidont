export const abi = [
  "event Transfer(address indexed _from, address indexed _to, uint256 _value)",
  "event Approval(address indexed _owner, address indexed _spender, uint256 _value)",
  "event Mint(uint256 indexed amount)",
  "event Stake(address indexed who, uint256 indexed amount)",
  "event Unstake(address indexed who, uint256 indexed amount)",
  "event Swap(address indexed who, uint256 indexed stakedEther, uint256 indexed rocketEther)",
  "event ClaimMinipool(address indexed who, address indexed node, address indexed minipool)",
  "event ClaimEmission(address indexed who, uint256 indexed lidont)",
  "event WithdrawalRequest(uint256[] requestIds, uint256 indexed amount)",
  
  "function getStake(address who) view returns (uint256)",

  "function approve(address _spender, uint256 _value) returns (bool)",

  "function swap(uint256 stETHAmount, bool stake)",
  "function stake(uint256 rETHAmount)",
  "function unstake(uint256 rETHAmount)",
  "function claimEmission() returns (uint256)",
  "function claimMinipool(address nodeAddress, uint256 nodeIndex, uint256 index)",
  "function initiateWithdrawal(uint256 stETHAmount) returns (uint256[])",
  "function finaliseWithdrawal(uint256[] _requestIds, uint256[] _hints)",
  "function mintRocketEther(uint256 ethAmount)",

  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address arg0) view returns (uint256)",
  "function allowance(address arg0, address arg1) view returns (uint256)",

  "function rewardMinipoolsFromIndex() view returns (uint256)",
  "function minipoolClaimed(address arg0) view returns (bool)",
];
