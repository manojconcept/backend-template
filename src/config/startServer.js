import { mongoDBConnect } from "./db.js";

async function startServer(app,PORT) {
    try {
      await mongoDBConnect("testingdb");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      process.exit(1);
    }
  }
  

export default startServer;