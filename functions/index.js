const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const moment = require("moment");

admin.initializeApp();

const db = admin.firestore();
const app = express();

app.use(express.json());

// Create event
app.post("/events", async (req, res) => {
  const { title, description, date, location, organizer, eventType } = req.body;
  try {
    const newEvent = {
      title,
      description,
      date: moment(date).format("YYYY-MM-DD HH:mm:ss"),
      location,
      organizer,
      eventType,
      updatedAt: moment().toISOString(),
    };
    const eventRef = await db.collection("events").add(newEvent);
    res.status(201).json({ id: eventRef.id, ...newEvent });
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Get all events
app.get("/events", async (req, res) => {
  const { eventType, startDate, endDate } = req.query;

  try {
    let query = db.collection("events");
    if (eventType) {
      query = query.where("eventType", "==", eventType);
    }

    if (startDate && endDate) {
      query = query
        .where(
          "date",
          ">=",
          admin.firestore.Timestamp.fromDate(new Date(startDate))
        )
        .where(
          "date",
          "<=",
          admin.firestore.Timestamp.fromDate(new Date(endDate))
        );
    }

    const eventsSnapshot = await query.get();
    const events = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to filter events" });
  }
});

// Get event by id
app.get("/events/:id", async (req, res) => {
  const eventId = req.params.id;

  try {
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({ id: eventDoc.id, ...eventDoc.data() });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Update event by id
app.put("/events/:id", async (req, res) => {
  const eventId = req.params.id;
  const { title, description, date, location, organizer, eventType } = req.body;

  try {
    const updatedEvent = {
      title,
      description,
      date: moment(date).format("YYYY-MM-DD HH:mm:ss"),
      location,
      organizer,
      eventType,
    };

    await db.collection("events").doc(eventId).update(updatedEvent);
    res.status(200).json({ id: eventId, ...updatedEvent });
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event by id
app.delete("/events/:id", async (req, res) => {
  const eventId = req.params.id;

  try {
    await db.collection("events").doc(eventId).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

exports.updateEventTimestamp = functions.firestore
  .document("/events/{eventId}")
  .onWrite(async (change) => {
    const eventDoc = change.after.exists ? change.after : null;

    if (eventDoc) {
      await eventDoc.ref.update({
        updatedAt: moment().toISOString(),
      });
    }

    return null;
  });

// Export your Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
