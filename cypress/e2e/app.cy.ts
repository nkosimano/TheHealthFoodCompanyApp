describe('RF Scanner App E2E', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should handle the complete login flow', () => {
    // Check initial state
    cy.contains('ZOHO LOGIN').should('be.visible');
    cy.contains('LOGIN WITH ZOHO').should('be.visible');

    // Login
    cy.login();
    cy.reload();

    // Verify logged in state
    cy.contains('READY TO SCAN').should('be.visible');
    cy.contains('LOGOUT').should('be.visible');
  });

  it('should handle item scanning and stock adjustment', () => {
    // Login first
    cy.login();
    cy.reload();

    // Enter SKU
    cy.get('input#sku').type('TEST-SKU-001{enter}');

    // Verify item lookup button is visible
    cy.contains('LOOKUP SKU').click();

    // Test ADD STOCK flow
    cy.contains('ADD STOCK').click();
    
    // Adjust quantity
    cy.get('input#quantity').clear().type('5');
    
    // Select reason
    cy.get('select#reason').select(0);
    
    // Confirm adjustment
    cy.contains('CONFIRM').click();
    
    // Verify success message
    cy.contains('ADD_STOCK operation').should('be.visible');
  });

  it('should handle offline mode', () => {
    // Login
    cy.login();
    cy.reload();

    // Toggle offline
    cy.contains('OFFLINE').click();
    cy.contains('Offline -').should('be.visible');

    // Perform adjustment
    cy.get('input#sku').type('TEST-SKU-001{enter}');
    cy.contains('LOOKUP SKU').click();
    cy.contains('ADD STOCK').click();
    cy.get('input#quantity').clear().type('3');
    cy.get('select#reason').select(0);
    cy.contains('CONFIRM').click();

    // Verify operation added to pending
    cy.contains('Offline - 1').should('be.visible');

    // Toggle online and verify sync
    cy.contains('ONLINE').click();
    cy.contains('SYNC (1)').should('be.visible');
  });

  it('should handle batch/serial number input', () => {
    // Login
    cy.login();
    cy.reload();

    // Scan batch-tracked item
    cy.get('input#sku').type('BATCH-SKU-001{enter}');
    cy.contains('LOOKUP SKU').click();

    // Add stock with batch details
    cy.contains('ADD STOCK').click();
    cy.get('input#batchNumber').type('BATCH123');
    cy.get('input[type="date"]').first().type('2024-03-01');
    cy.get('select#reason').select(0);
    cy.contains('CONFIRM').click();

    // Verify success
    cy.contains('ADD_STOCK operation').should('be.visible');
  });

  it('should display operation history', () => {
    // Login
    cy.login();
    cy.reload();

    // Perform an adjustment
    cy.get('input#sku').type('TEST-SKU-001{enter}');
    cy.contains('LOOKUP SKU').click();
    cy.contains('ADD STOCK').click();
    cy.get('input#quantity').clear().type('2');
    cy.get('select#reason').select(0);
    cy.contains('CONFIRM').click();

    // Switch to history tab
    cy.contains('History').click();

    // Verify operation in history
    cy.contains('TEST-SKU-001').should('be.visible');
    cy.contains('ADD_STOCK').should('be.visible');
  });
});