const { app } = require('@azure/functions');
const sql = require('mssql');

app.http('leagueMembersAndLeaderboard', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        const leagueId = request.query.get('league_id');

        // Check if user_id is present
        if (!leagueId) {
            return {
                status: 400,
                body: "Missing league_id query parameter"
            };
        }

        let pool;
        try {
            pool = await sql.connect(connString);
        } catch (error) {
            return {
                status: 500,
                body: "Database connection failed"
            };
        }

        try {
            const checkLeagueLeaderboard = await pool.request()
                .input('league_id', sql.VarChar, leagueId)
                .query(`SELECT 
                            u.id AS user_id,
                            u.display_name,
                            ut.current_total,
                            ut.total_wins,
                            ut.total_losses,
                            ut.correct_bets,
                            ut.incorrect_bets
                        FROM 
                            UserTotal ut
                        JOIN 
                            users u ON ut.user_id = u.id
                        WHERE 
                            ut.league_id = @league_id
                        ORDER BY 
                            ut.current_total DESC;  -- Order by current_total to get the leaderboard`
                    );

            return {
                status: 200,
                body: JSON.stringify(checkLeagueLeaderboard.recordset)
            };
        } catch (error) {
            return {
                status: 500,
                body: 'An error occurred while searching for league leaderboard'
            };
        }
    }
});
