Feature: The user's wallet after login
  The wallet a user logs in with becomes their wallet in the app, for the SDK and for the dashboard.

  Scenario: A user who logs in with a Stellar wallet has it linked to the app
    Given a new app with a publishable key
    When a new Stellar wallet logs in with the SDK
    Then the SDK reports that Stellar wallet as the user's wallet
    And the dashboard lists the user with that wallet
    And the dashboard lists that wallet for the app
