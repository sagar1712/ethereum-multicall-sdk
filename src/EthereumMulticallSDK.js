const ethers = require('ethers');
const { MULTICALL_ABI } = require('./utils/abi')
const { encodeERC20Transfer, encodeMulticallParams, decodeMulticallResult, encodeFunctionCall } = require('./utils/encoding');

class EthereumMulticallSDK {
  /**
   * @param {string} providerUrl - The Ethereum provider URL
   * @param {string} multicallAddress - The address of the deployed Multicall contract
   */
  constructor(providerUrl, multicallAddress) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.multicallContract = new ethers.Contract(multicallAddress, MULTICALL_ABI, this.provider);
  }

  /**
   * Perform a batch of calls in a single transaction
   * @param {Array} calls - Array of call objects {target, callData, value}
   * @returns {Promise<Array>} - Array of results
   */
  async batchCalls(calls) {
    const encodedParams = encodeMulticallParams(calls);
    const totalValue = calls.reduce((sum, call) => sum + (call.value || BigInt(0)), BigInt(0));
    
    const gasEstimate = await this.multicallContract.estimateGas.multicall(encodedParams, { value: totalValue });
    
    const tx = await this.multicallContract.multicall(encodedParams, {
      gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
      value: totalValue
    });
    
    const receipt = await tx.wait();
    const result = receipt.events.find(e => e.event === 'MulticallResult').args.returnData;
    if (result === '0x') {
      return []; 
  }
    return decodeMulticallResult(result);
  }


  /**
   * Estimate gas for a transaction
   * @param {Object} transaction - The transaction object
   * @returns {Promise<BigNumber>} - Estimated gas
   */
  async estimateGas(transaction) {
    return await this.provider.estimateGas(transaction);
  }

  /**
   * Batch ERC20 transfers
   * @param {string} tokenAddress - The ERC20 token address
   * @param {Array} transfers - Array of transfer objects {to, amount}
   * @returns {Promise<Array>} - Array of transfer results
   */
  async batchERC20Transfers(tokenAddress, transfers) {
    const calls = transfers.map(transfer => ({
      target: tokenAddress,
      callData: encodeERC20Transfer(transfer.to, transfer.amount),
      value: 0
    }));

    return this.batchCalls(calls);
  }

  /**
   * Batch ETH transfers
   * @param {Array} transfers - Array of transfer objects {to, amount}
   * @returns {Promise<Array>} - Array of transfer results
   */
  async batchETHTransfers(transfers) {
    const calls = transfers.map(transfer => ({
      target: transfer.to,
      callData: '0x', // Empty calldata for ETH transfers
      value: BigInt(transfer.amount)
    }));

    return this.batchCalls(calls);
  }

  /**
   * Batch mixed transfers (ERC20 and ETH)
   * @param {Array} transfers - Array of transfer objects {to, amount, token}
   * @returns {Promise<Array>} - Array of transfer results
   */
  async batchMixedTransfers(transfers) {
    const calls = transfers.map(transfer => {
      if (transfer.token === 'ETH') {
        return {
          target: transfer.to,
          callData: '0x',
          value: ethers.BigNumber.from(transfer.amount)
        };
      } else {
        return {
          target: transfer.token,
          callData: encodeERC20Transfer(transfer.to, transfer.amount),
          value: 0
        };
      }
    });

    return this.batchCalls(calls);
  }

  /**
   * Perform a custom batch call
   * @param {string} contractAddress - The contract address
   * @param {string} functionSignature - The function signature
   * @param {Array} paramsList - Array of parameter arrays for each call
   * @param {Array} values - Array of ETH values to send with each call (optional)
   * @returns {Promise<Array>} - Array of call results
   */
  async customBatchCall(contractAddress, functionSignature, paramsList, values = []) {
    const calls = paramsList.map((params, index) => ({
      target: contractAddress,
      callData: encodeFunctionCall(functionSignature, params),
      value: values[index] || 0
    }));

    return this.batchCalls(calls);
  }
}

module.exports = EthereumMulticallSDK;