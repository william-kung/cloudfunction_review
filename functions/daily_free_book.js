const {logger} = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");


admin.initializeApp();
const db = admin.firestore();

exports.setRecommendedFreeBookOfTheDay = functions.pubsub
  .schedule("0 0 * * *") // Run daily at midnight (00:00)
  .timeZone("Asia/Hong_Kong") // Set your desired timezone
  .onRun(async (context) => {
    try {
      // 1. Get all free books
      const snapshot = await db
        .collection("books")
        .where("status", "==", "publish") // Assuming 'publish' means free
        .get();

      // 2. Check if there are any free books
      if (snapshot.empty) {
        logger.warn("No free books found.");
        return null;
      }

      // 3. Pick a random book
      const randomIndex = Math.floor(Math.random() * snapshot.size);
      const randomBook = snapshot.docs[randomIndex];

      // 4. Store the recommended book ID and timestamp
      await db
        .collection("settings")
        .doc("today_free_book")
        .set({
          bookId: randomBook.id,
          timestamp: Timestamp.now(), // Store when the recommendation was set
        });

      logger.log(
        "Recommended book of the day set to:",
        randomBook.id,
        "at",
        Timestamp.now()
      );
      return null;
    } catch (error) {
      await db
        .collection("settings")
        .doc("today_free_book")
        .set({
          bookId: "58386",
          timestamp: Timestamp.now(), // Store when the recommendation was set
        });
      logger.error("Error setting recommended book:", error);
      return null;
    }
  });
