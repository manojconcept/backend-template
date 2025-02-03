import cron from 'node-cron'
import { mongoDBConnect } from "./db.js";
import TokenModel from "../models/Tokens.js";

async function removeExpiredTokens() {
  try {
    const currentDate = new Date();
    const result = await TokenModel.updateMany(
      {},
      { $pull: { logins: { refreshexp: { $lt: currentDate } } } }
    );
    console.log(`[${new Date().toISOString()}] Expired tokens removed:`, result.modifiedCount);
  } catch (error) {
    console.error("Error removing expired tokens:", error);
  }
}

async function startServer(app,PORT) {
    try {
      await mongoDBConnect("testingdb");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      cron.schedule("0 0 7,14,21,28 * *", removeExpiredTokens); // Token cleanup job scheduled to run on the 7th, 14th, 21st, and 28th of each month.
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      process.exit(1);
    }
  }
  

export default startServer;