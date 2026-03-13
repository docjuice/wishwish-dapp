import { ethers } from "ethers";
import deployments from "./localhost.json";

import LotteryABI from "./abis/ChainlinkLotteryV2.json";
import GovernTokenABI from "./abis/GovernToken.json";
import GovernorABI from "./abis/MyGovernor.json";
import TimelockABI from "./abis/Timelock.json";
import VRFMockABI from "./abis/VRFCoordinatorV2PlusMock.json";
import WishStakingABI from "./abis/WishStaking.json";

export { deployments };

export function getLotteryContract(signerOrProvider) {
  return new ethers.Contract(deployments.lottery, LotteryABI, signerOrProvider);
}

export function getGovernTokenContract(signerOrProvider) {
  return new ethers.Contract(deployments.governToken, GovernTokenABI, signerOrProvider);
}

export function getGovernorContract(signerOrProvider) {
  return new ethers.Contract(deployments.governor, GovernorABI, signerOrProvider);
}

export function getTimelockContract(signerOrProvider) {
  return new ethers.Contract(deployments.timelock, TimelockABI, signerOrProvider);
}

export function getVRFMockContract(signerOrProvider) {
  return new ethers.Contract(deployments.vrfMock, VRFMockABI, signerOrProvider);
}

export function getWishStakingContract(signerOrProvider) {
  return new ethers.Contract(deployments.wishStaking, WishStakingABI, signerOrProvider);
}
