# Unit Tests

Full unit test coverage and scenario analysis for the Maxity Token.
https://github.com/BlockPay-LTD/MaxityToken

## Scenarios

Deployment

- Should set the right owner. 
- Should assign the total supply of tokens to the owner.
- Should have 18 decimals. 
- Should assign the name and symbol correctly. 
- Should have total supply equal to preMintedSupply.
 
Transactions

- Should transfer tokens between accounts. 
- Should fail if the sender doesn't have enough tokens. 
- Should fail if sender or receiver is zero address. 
- Should allowance to accounts[1] authority to spend account[0]'s token. 
- Should revert transfer where spender does not have the allowance. 
Allowance

- Should allowance to accounts[1] authority to account[0]'s token.
- Should increase and decrease allowance. 
- Decrease allowance should revert if the subtracted value is greater than the allowance. 
- Approve should revert to zero address.

Owner Role

- Should have the authority to add minter role. 
- addMinter should revert to zero address. 
- Should have the authority to remove minter role. 
- Should have the authority to view address of minters. 
- GetMinter should revert on out of index when not minters are added.
- GetMinter should revert on out of index. 
- Burn should revert on the burn amount exceeds the balance 
- Burn should revert to zero address.
- 
Minter Role

- Should be able to mint 
- Should revert max mint ability is exceeded. 
- Mint should revert if more tokens than max total supply are minted. 

Public functions

- Should be able to view if an address is a minter. 
- Should be able to view how many minters there are. 
ERC20 Events

- approve should emit an {Approval} event. 
- increaseAllowance should emit an {Approval} event. 
- decreaseAllowance should emit an {Approval} event. 
- transfer emit a {Transfer} event. 
- transferFrom should emit an {Approval} event and emit a {Transfer} event. 
- _mint should emit a {Transfer} event.
- burn should emit a {Transfer} event. 

## Setup

1. Add private key Add a `.env` file with a wallet private key to
   `TEST_PRIVATE_KEY` just like `env-sample`

2. Install

```
> yarn
```

3. Test

```
> yarn test
```
