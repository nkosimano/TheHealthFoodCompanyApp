describe('Login Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('shows login page when not authenticated', () => {
    cy.contains('ZOHO LOGIN').should('be.visible');
    cy.contains('LOGIN WITH ZOHO').should('be.visible');
  });

  it('redirects to scanner after login', () => {
    cy.login();
    cy.reload(); // Reload to apply the login state
    cy.contains('READY TO SCAN', { timeout: 10000 }).should('be.visible');
  });
});