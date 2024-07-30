const EthereumMulticallSDK = require('./EthereumMulticallSDK');
const { encodeERC20Transfer, encodeFunctionCall } = require('./utils/encoding');
const { MULTICALL_ABI } = require('./utils/abi');

module.exports = EthereumMulticallSDK;

module.exports.utils = {
  encodeERC20Transfer,
  encodeFunctionCall
};

module.exports.constants = {
  MULTICALL_ABI
};

module.exports.createSDK = (providerUrl, multicallAddress) => {
  return new EthereumMulticallSDK(providerUrl, multicallAddress);
};