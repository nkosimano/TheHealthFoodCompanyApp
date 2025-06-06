/// <reference types="cypress" />

declare namespace Cypress {
  interface CustomConfigOptions extends Cypress.ConfigOptions {
    projectId?: string;
  }
} 