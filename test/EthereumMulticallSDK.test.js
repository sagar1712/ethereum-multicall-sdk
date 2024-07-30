const sinon = require('sinon');
const { ethers } = require('ethers');
const EthereumMulticallSDK = require('../src/EthereumMulticallSDK');
const { encodeERC20Transfer, encodeMulticallParams } = require('../src/utils/encoding');

describe('EthereumMulticallSDK', function () {
  let provider;
  let multicallContract;
  let sdk;
  const providerUrl = 'https://rpc-amoy.polygon.technology/';
  const multicallAddress = '0xa88774b174fde5709df7e90d85ff973595bc7538';
  const tokenAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(() => {
    provider = sinon.createStubInstance(ethers.JsonRpcProvider);
    
    const ContractStub = sinon.stub(ethers, 'Contract').returns({
      multicall: sinon.stub().resolves({
        wait: sinon.stub().resolves({
          events: [{ event: 'MulticallResult', args: { returnData: '0x' } }]
        })
      }),
      estimateGas: {
        multicall: sinon.stub().resolves(ethers.getBigInt(21000))
      }
    });

    sdk = new EthereumMulticallSDK(providerUrl, multicallAddress);
    sdk.provider = provider;
    
    sdk.multicallContract = new ContractStub(multicallAddress, [], provider);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should batch ERC20 transfers', async () => {
    const transfers = [
      { to: '0x1111111111111111111111111111111111111111', amount: 100n },
      { to: '0x2222222222222222222222222222222222222222', amount: 200n }
    ];

    const calls = transfers.map(transfer => ({
      target: tokenAddress,
      callData: encodeERC20Transfer(transfer.to, transfer.amount),
      value: 0n
    }));

    const result = await sdk.batchERC20Transfers(tokenAddress, transfers);

    
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
    expect(sdk.multicallContract.multicall.calledOnce).toBe(true);
    expect(sdk.multicallContract.multicall.getCall(0).args[0]).toEqual(encodeMulticallParams(calls));
  });

  it('should batch ETH transfers', async () => {
    const transfers = [
      { to: '0x1111111111111111111111111111111111111111', amount: ethers.parseEther('1.0') },
      { to: '0x2222222222222222222222222222222222222222', amount: ethers.parseEther('2.0') }
    ];

    const calls = transfers.map(transfer => ({
      target: transfer.to,
      callData: '0x',
      value: BigInt(transfer.amount)
    }));

    const result = await sdk.batchETHTransfers(transfers);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
    expect(sdk.multicallContract.multicall.calledOnce).toBe(true);
    expect(sdk.multicallContract.multicall.getCall(0).args[0]).toEqual(encodeMulticallParams(calls));
  });
});