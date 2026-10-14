Feature: End user ramps with the published SDK
  An end user of a new app logs in with a Stellar wallet and asks each ramp for quotes.

  Scenario: A new wallet logs in with the published SDK
    Given a new app with a publishable key
    When a new Stellar wallet logs in with the SDK
    Then the session is authenticated

  # A provider that is not registered for the app network in this environment
  # is skipped with the reason in the report, not failed.
  Scenario Outline: <provider> quotes its ramps in <country>
    Given a new app with a publishable key
    And the "<provider>" ramp provider is registered for the app network
    And the app enables the "<provider>" ramp provider
    And a new Stellar wallet is logged in with the SDK
    When the user lists the ramp countries
    Then "<country>" is among the ramp countries
    And "<provider>" quotes <directions> in "<country>"

    Examples:
      | provider            | country | directions        |
      | Stellar Test Anchor | US      | onramp and offramp |
      | Abroad              | BR      | offramp           |
      | Abroad              | CO      | offramp           |
      | Stereum             | BO      | onramp and offramp |
      | Anclap              | AR      | onramp and offramp |
