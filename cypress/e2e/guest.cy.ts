describe('guest login', () => {
  it('can log in as guest', () => {
    cy.visit('/guest');
    cy.contains('Login as Guest').click();
    cy.getBySel('guest-username').invoke('text').as('guestUsername');
  });

  it('can play as guest', () => {
    // start new match
    cy.visit(`/`);
    cy.contains('Basic').click();

    // redirected
    cy.url().should('include', '/match/');
    cy.get('@guestUsername');

    // make some moves
    cy.get('.player-one-piece').click();
  });
});
