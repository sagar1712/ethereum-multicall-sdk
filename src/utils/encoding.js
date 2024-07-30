const { ethers } = require('ethers');

/**
 * Encodes an ERC20 transfer function call.
 * @param {string} to - The recipient address.
 * @param {string|BigNumber} amount - The amount to transfer.
 * @returns {string} The encoded function call.
 */
function encodeERC20Transfer(to, amount) {
  const erc20Interface = new ethers.Interface([
    "function transfer(address to, uint256 amount) returns (bool)"
  ]);
  return erc20Interface.encodeFunctionData("transfer", [to, amount]);
}

/**
 * Encodes parameters for the multicall function.
 * @param {Array} calls - Array of call objects {target, callData}.
 * @returns {string} The encoded multicall parameters.
 */
function encodeMulticallParams(calls) {
  return new ethers.AbiCoder().encode(
    [{ type: 'tuple[]', components: [{ type: 'address', name: 'target' }, { type: 'bytes', name: 'callData' }] }],
    [calls]
  );
}

/**
 * Decodes the result of a multicall.
 * @param {string} result - The result from the multicall function.
 * @returns {Array} An array of decoded results.
 */
function decodeMulticallResult(result) {
  const decodedResult = new ethers.AbiCoder().decode(['bytes[]'], result);
  return decodedResult[0];
}

/**
 * Encodes a function call.
 * @param {string} functionSignature - The function signature (e.g., "transfer(address,uint256)").
 * @param {Array} params - The function parameters.
 * @returns {string} The encoded function call.
 */
function encodeFunctionCall(functionSignature, params) {
  const iface = new ethers.Interface([`function ${functionSignature}`]);
  const functionName = functionSignature.split('(')[0];
  return iface.encodeFunctionData(functionName, params);
}

module.exports = {
  encodeERC20Transfer,
  encodeMulticallParams,
  decodeMulticallResult,
  encodeFunctionCall
};
