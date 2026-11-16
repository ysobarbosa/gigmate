const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: process.env['CI']
          ? 'npx nx run gigmate:serve-static'
          : 'npx nx run gigmate:serve',
        production: 'npx nx run gigmate:serve-static',
      },
      ciWebServerCommand: 'npx nx run gigmate:serve-static',
      ciBaseUrl: 'http://localhost:4200',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
