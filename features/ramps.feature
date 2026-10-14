Feature: End user ramps with the published SDK
  An end user of a new app logs in with a Stellar wallet and asks for ramp quotes.

  Background:
    Given a new app with a publishable key
    And the app enables every ramp provider registered for its network

  Scenario: A new wallet logs in with the published SDK
    When a new Stellar wallet logs in with the SDK
    Then the session is authenticated

  Scenario: Every ramp country quotes a deposit and a withdrawal
    Given a new Stellar wallet is logged in with the SDK
    When the user lists the ramp countries
    Then at least one ramp country is offered
    And every ramp country quotes an onramp and an offramp
