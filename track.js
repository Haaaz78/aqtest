const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
const infuraApiKey = process.env.INFURA_API_KEY;

if (!privateKey) {
    throw new Error("PRIVATE_KEY is not defined");
}
if (!infuraApiKey) {
    throw new Error("INFURA_API_KEY is not defined");
}

const provider = new ethers.providers.InfuraProvider("sepolia", infuraApiKey);
const wallet = new ethers.Wallet(privateKey, provider);

const fudTokenAddress = "0x5BAf2e8972E49956aE9C45a2959e54Eb166b2047";
const winTokenAddress = "0x986f54A464B3c53156964F18cF45743A69e9bA06";
const fudTokenABI = JSON.parse(fs.readFileSync("./artifacts/contracts/FUD.sol/FudToken.json")).abi;
const winTokenABI = JSON.parse(fs.readFileSync("./artifacts/contracts/WIN.sol/WinToken.json")).abi;

const fudToken = new ethers.Contract(fudTokenAddress, fudTokenABI, wallet);
const winToken = new ethers.Contract(winTokenAddress, winTokenABI, wallet);

const blockInterval = 10;
const rewardRatePerInterval = ethers.utils.parseUnits("0.0005", 18); 
const STAKING_CONTRACT_ADDRESS = "0x3dAC24FFF6b907C5794DB5a94c56Acf28a9F33E7";

let userBalances = {};

function emitEvent(action, address, amount, timestamp, transactionHash, blockNumber) {
    console.log(`Emitting ${action} event - Address: ${address}, Amount: ${amount}, Timestamp: ${timestamp}, Transaction Hash: ${transactionHash}, Block Number: ${blockNumber}`);

}

fudToken.on("Transfer", async (from, to, value, event) => {
    const currentBlockNumber = await provider.getBlockNumber();
    const timestamp = Date.now();

    if (to.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
        if (!userBalances[from]) {
            userBalances[from] = { balance: ethers.BigNumber.from(0), deposits: [], withdrawals: [] };
        }
        userBalances[from].balance = userBalances[from].balance.add(value);
        userBalances[from].deposits.push({ blockNumber: currentBlockNumber, amount: value });

        emitEvent("Deposit", from, value, timestamp, event.transactionHash, currentBlockNumber);
    } else if (from.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
        if (!userBalances[to]) {
            userBalances[to] = { balance: ethers.BigNumber.from(0), deposits: [], withdrawals: [] };
        }
        userBalances[to].balance = userBalances[to].balance.sub(value);
        userBalances[to].withdrawals.push({ blockNumber: currentBlockNumber, amount: value });

        emitEvent("Withdrawal", to, value, timestamp, event.transactionHash, currentBlockNumber);
    }
});

async function calculateAverageDeposit(deposits, withdrawals, currentBlockNumber, interval) {
    let totalFudTokens = ethers.BigNumber.from(0);
    let totalBlocks = 0;

    deposits.forEach(deposit => {
        let depositBlocks = Math.min(currentBlockNumber - deposit.blockNumber, interval);
        let adjustedAmount = deposit.amount;

        withdrawals.forEach(withdrawal => {
            if (withdrawal.blockNumber > deposit.blockNumber) {
                depositBlocks = Math.min(withdrawal.blockNumber - deposit.blockNumber, interval);
                adjustedAmount = adjustedAmount.sub(withdrawal.amount);
            }
        });

        totalFudTokens = totalFudTokens.add(adjustedAmount.mul(depositBlocks));
        totalBlocks += depositBlocks;
    });

    if (totalBlocks > 0) {
        return totalFudTokens.div(totalBlocks);
    } else {
        return ethers.BigNumber.from(0);
    }
}

async function airdropRewards(currentBlockNumber) {
    for (const [address, { balance, deposits, withdrawals }] of Object.entries(userBalances)) {
        if (balance.gt(0)) {
            const averageFudTokens = await calculateAverageDeposit(deposits, withdrawals, currentBlockNumber, blockInterval);

            if (averageFudTokens.gt(0)) {
                const winTokens = averageFudTokens.mul(rewardRatePerInterval).div(ethers.utils.parseUnits("1", 18));

                console.log(`Minting ${ethers.utils.formatUnits(winTokens, 18)} WIN tokens to ${address}`);

                try {
                    const tx = await winToken.mint(address, winTokens);
                    const receipt = await tx.wait();

                    console.log(`Mint transaction hash: ${receipt.transactionHash}`);
                    console.log(`Block number: ${receipt.blockNumber}`);
                    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
                    console.log(`Transaction status: ${receipt.status ? 'Success' : 'Failed'}`);
                } catch (error) {
                    console.error("Error minting WIN tokens:", error);
                }
            }
        }
    }
}

async function startAirdropService() {
    provider.on('block', async (blockNumber) => {
        if (blockNumber % blockInterval === 0) {
            console.log(`Checking for rewards at block ${blockNumber}`);
            await airdropRewards(blockNumber);
        }
    });
}

async function main() {
    console.log("Listening for Transfer events on FUD token...");
    await startAirdropService();
}

main().catch(console.error);
