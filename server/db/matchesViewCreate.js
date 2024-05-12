module.exports = `CREATE VIEW "MatchesView" AS
SELECT id AS "matchID", CAST(state->'G'->>'score' AS JSON) AS score, state->'ctx' AS ctx, players, gameover, "updatedAt"
FROM "Games";
`;
