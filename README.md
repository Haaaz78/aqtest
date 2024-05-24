Smart Contract development- 
For the developmentof the smart contracts openzeppelin library was used to maintain the secuirty of the contracts moving on the with the compilation and unit testing the use of hardhat was done after which the use of remix plugin was done to make a new unit test for the contract .

  Lock
    Deployment
      1) Should set the right unlockTime
      2) Should set the right owner
      3) Should receive and store the funds to lock
      4) Should fail if the unlockTime is not in the future
    Withdrawals
      Validations
        5) Should revert with the right error if called too soon
        6) Should revert with the right error if called from another account
        7) Shouldn't fail if the unlockTime has arrived and the owner calls it
      Events
        8) Should emit an event on withdrawals
      Transfers
        9) Should transfer the funds to the owner

 the result for the unit test as these functions were not necessary for the challenge given but would be mandatory in a production contract. 

backend development - 
The backend service written in Node.js will interact with the Ethereum blockchain using Web3.js to monitor events emitted by the smart contracts. The best approach for sending the rewards would be having two script one which is responsible for the deposit withdrawal of the fun token and storing them into a db and another which would calculate the rewards and mint the win token on the total average of the tokens the store of the private key would be best in a env file as using services like enclave might also pose the same threat as the organizatons server. 