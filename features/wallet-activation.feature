Feature: Activating the user's wallet on testnet
  A wallet the platform does not hold gets its Stellar account created by the SDK,
  with the reserve sponsored by the app's own wallet.

  Scenario: The app sponsors the account of a user's external wallet
    Given a new app with a publishable key
    And the app's own wallet is funded by the testnet friendbot
    And a new Stellar wallet is logged in with the SDK
    When the user creates their Stellar account through the SDK
    Then the SDK reports the account on the ledger with an XLM balance
    And the account is sponsored by the app's wallet on Stellar testnet
