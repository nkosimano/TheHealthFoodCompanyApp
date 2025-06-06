/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

Cypress.Commands.add('login', (): void => {
  localStorage.setItem('zoho_auth', JSON.stringify({
    client_id: 'test_client_id',
    organization_id: 'test_org_id',
    current_location_id: 'test_location_id',
    access_token: 'test_access_token',
    refresh_token: 'test_refresh_token',
    isLoggedIn: true,
    tokenExpiry: Date.now() + 3600000
  }));
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): void
    }
  }
}

export {};