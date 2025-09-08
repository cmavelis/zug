// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// You can use this file to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

Cypress.Commands.add('getBySel', (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add('getBySelLike', (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});

export {};
