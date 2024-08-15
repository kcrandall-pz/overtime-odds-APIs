const { app, input } = require('@azure/functions');
const sql = require('mssql');
require('dotenv').config();

app.http('placeBet', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        const userId = request.query.get('user_id');
        const leagueId = request.query.get('league_id');
        const betAmount = parseFloat(request.query.get('bet_amount'));
        const gameId = request.query.get('game_id');
        const teamBetOn = request.query.get('team_bet_on');
        const odds = parseFloat(request.query.get('odds'));

        if (!userId || !leagueId || !betAmount || !gameId || !teamBetOn || !odds) {
            return {
                status: 400,
                body: "Missing required query parameters"
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
            const userTotalQuery = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('league_id', sql.Int, leagueId)
                .query(`SELECT current_total FROM UserTotal WHERE user_id = @user_id AND league_id = @league_id`);

            const currentTotal = userTotalQuery.recordset[0].current_total;

            if (betAmount > currentTotal) {
                return {
                    status: 400,
                    body: "Insufficient funds to place this bet"
                };
            }

            await pool.request()
                .input('user_id', sql.Int, userId)
                .input('league_id', sql.Int, leagueId)
                .input('game_id', sql.VarChar, gameId)
                .input('bet_amount', sql.Decimal(10, 2), betAmount)
                .input('team_bet_on', sql.VarChar, teamBetOn)
                .input('odds', sql.Decimal(10, 2), odds)
                .query(`
                    INSERT INTO Bets (user_id, league_id, game_id, bet_amount, team_bet_on, odds)
                    VALUES (@user_id, @league_id, @game_id, @bet_amount, @team_bet_on, @odds)
                `);

            return {
                status: 200,
                body: "Bet placed successfully"
            };
        } catch (error) {
            return {
                status: 500,
                body: "An error occurred while placing the bet"
            };
        }
    }
});
