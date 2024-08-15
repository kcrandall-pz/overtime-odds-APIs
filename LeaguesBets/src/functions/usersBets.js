const { app, input } = require('@azure/functions');
const sql = require('mssql');
require('dotenv').config();

app.http('usersBets', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        const userId = request.query.get('user_id');

        // Check if user_id is present
        if (!userId) {
            return {
                status: 400,
                body: "Missing user_id query parameter"
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
            const userBets = await pool.request()
                .input('user_id', sql.VarChar, userId)
                .query(`SELECT 
                            b.bet_id,
                            b.user_id,
                            b.league_id,
                            l.name AS league_name,
                            b.game_id,
                            b.bet_amount,
                            b.team_bet_on,
                            b.odds,
                            b.bet_placed_at,
                            b.result
                        FROM 
                            Bets b
                        INNER JOIN 
                            Leagues l ON b.league_id = l.id
                        WHERE 
                            b.user_id = @user_id
                        ORDER BY 
                            b.bet_placed_at DESC;`);

            return {
                status: 200,
                body: JSON.stringify(userBets.recordset)
            };
        } catch (error) {
            return {
                status: 500,
                body: 'An error occurred while fetching user bets'
            };
        }
    }
});
