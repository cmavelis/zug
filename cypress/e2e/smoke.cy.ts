describe('App loads', () => {
  it('visits the home page and sees title', () => {
    cy.visit('/')
    cy.contains('Matches Lobby', { matchCase: false })
  })
})
