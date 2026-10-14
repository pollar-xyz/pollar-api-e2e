// Reports land in reports/: an HTML page to read (feature > scenario > step,
// with the failing step and its error), plus JSON and JUnit for tooling.
export default {
  paths: ['features/**/*.feature'],
  import: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
  format: ['progress-bar', 'summary', 'html:reports/cucumber.html', 'json:reports/cucumber.json', 'junit:reports/junit.xml'],
  formatOptions: { snippetInterface: 'async-await' },
  // The SDK keeps timers open after the last scenario.
  forceExit: true,
};
