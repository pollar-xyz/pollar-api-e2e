Feature: App setup through the dashboard API
  A developer sets up an app the way the dashboard does, without a browser.

  Scenario: A developer creates a testnet app and a publishable key
    When the developer creates a new app
    Then the app is on testnet
    And the developer can create a publishable key for it

  Scenario: The app can enable a ramp provider for its network
    Given a new app with a publishable key
    Then at least one ramp provider is registered for the app network
    And the app enables every ramp provider registered for its network
