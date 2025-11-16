describe('guest login', () => {
  beforeEach(() => {
    cy.visit('/guest');
    cy.contains('Login as Guest').click();
    cy.getBySel('guest-username').invoke('text').as('guestUsername');
  });
  it('can start a match as guest', () => {
    // start new match
    cy.visit(`/`);
    cy.contains('Basic').click();

    // redirected
    cy.url().should('include', '/match/');
    cy.get('@guestUsername');
  });

  it('can make a move as guest', () => {
    // start new match
    cy.visit(`/`);
    cy.contains('Basic').click();

    // redirected
    cy.url().should('include', '/match/');
    cy.get('@guestUsername');

    // make some moves
    cy.get('div[data-zug-piece-id="0"]').click();
  });
});
