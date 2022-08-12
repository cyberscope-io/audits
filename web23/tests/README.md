# Unit Tests

Full unit test coverage and scenario analysis for the Hbar project.
https://github.com/rahul-web23/HbarSmartContract

## Scenarios

- should receive a payment and mint successfully (1,6)
- should setDomainAsset successfully (1,2)
- should return empty value in an unregistered domain (1)
- should check if domain exist
- should check if sender is the owner
- should blacklist a domain (3)
- should not allow an unregistered domain
- should allow a registered domain (4,7)
- should update the site address (5,7)
- should update the site address only from owner (5)
- should not allow changing an unregistered site address (5)
- should book a domain when payment received (6)
- should get all registered domains (8)
- should check that domain exists (9)
- should receive multiple payments (7,9,10)

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
