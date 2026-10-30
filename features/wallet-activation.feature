Feature: Activating the user's wallet on testnet
  A wallet the platform does not hold gets its Stellar account created by the SDK.
  New apps are born on credits, so Pollar's pool sponsors the reserve, not a wallet of the app.

  Scenario: Pollar sponsors the account of a user's external wallet
    Given a new app with a publishable key
    And a new Stellar wallet is logged in with the SDK
    When the user creates their Stellar account through the SDK
    Then the SDK reports the account on the ledger with an XLM balance
    And the account reserve is sponsored on Stellar testnet
