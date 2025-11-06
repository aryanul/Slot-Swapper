import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Event, { EventStatus } from '../models/Event';
import mongoose from 'mongoose';
import ICAL from 'ical.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept .ics, .ical, and .csv files
    if (file.mimetype === 'text/calendar' || 
        file.mimetype === 'text/plain' ||
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.ics') ||
        file.originalname.endsWith('.ical') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload .ics, .ical, or .csv files.'));
    }
  },
});

// Helper function to parse ICS file
function parseICSFile(buffer: Buffer): Array<{ title: string; startTime: Date; endTime: Date }> {
  const events: Array<{ title: string; startTime: Date; endTime: Date }> = [];
  const icalData = buffer.toString('utf-8');
  
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);
        const summary = event.summary || 'Untitled Event';
        
        if (!event.startDate) {
          console.log('Skipping event without start date:', summary);
          continue;
        }
        
        const startTime = event.startDate.toJSDate();
        const endTime = event.endDate ? event.endDate.toJSDate() : new Date(startTime.getTime() + 3600000); // Default 1 hour

        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.log('Skipping event with invalid dates:', summary);
          continue;
        }

        // Only import events that haven't passed (give 1 hour buffer for timezone issues)
        const now = new Date();
        now.setHours(now.getHours() - 1); // Subtract 1 hour to account for timezone differences
        
        if (startTime >= now) {
          events.push({
            title: summary,
            startTime,
            endTime,
          });
        } else {
          console.log('Skipping past event:', summary, 'Start:', startTime);
        }
      } catch (error) {
        console.error('Error parsing event:', error);
        continue;
      }
    }
  } catch (error) {
    throw new Error('Failed to parse ICS file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  return events;
}

// Helper function to parse CSV file
function parseCSVFile(buffer: Buffer): Array<{ title: string; startTime: Date; endTime: Date }> {
  const events: Array<{ title: string; startTime: Date; endTime: Date }> = [];
  const csvData = buffer.toString('utf-8');
  const lines = csvData.split('\n');

  // Skip header row if present
  let startIndex = 0;
  if (lines[0] && (lines[0].toLowerCase().includes('subject') || lines[0].toLowerCase().includes('title'))) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try to parse CSV (handling quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 2) {
      try {
        // Common CSV formats:
        // Format 1: Subject, Start Date, End Date
        // Format 2: Title, Start, End
        // Format 3: Event, Date, Time
        const title = values[0] || 'Untitled Event';
        const startStr = values[1];
        const endStr = values[2] || values[1]; // Use start if end not provided

        const startTime = new Date(startStr);
        const endTime = new Date(endStr);

        // Validate dates
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          // Only import events that haven't passed (give 1 hour buffer for timezone issues)
          const now = new Date();
          now.setHours(now.getHours() - 1); // Subtract 1 hour to account for timezone differences
          
          if (startTime >= now) {
            events.push({
              title: title.replace(/^"|"$/g, ''), // Remove quotes
              startTime,
              endTime: endTime > startTime ? endTime : new Date(startTime.getTime() + 3600000), // Default 1 hour
            });
          } else {
            console.log('Skipping past CSV event:', title, 'Start:', startTime);
          }
        }
      } catch (error) {
        // Skip invalid rows
        continue;
      }
    }
  }

  return events;
}

// POST /api/import/calendar - Import calendar events from file
router.post('/calendar', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    let events: Array<{ title: string; startTime: Date; endTime: Date }>;

    // Determine file type and parse accordingly
    if (file.originalname.endsWith('.ics') || file.originalname.endsWith('.ical') || file.mimetype === 'text/calendar') {
      // Parse ICS file
      events = parseICSFile(file.buffer);
    } else if (file.originalname.endsWith('.csv') || file.mimetype === 'text/csv') {
      // Parse CSV file
      events = parseCSVFile(file.buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload .ics, .ical, or .csv files.' });
    }

    if (events.length === 0) {
      return res.status(400).json({ error: 'No valid events found in the file. Make sure the file contains future events.' });
    }

    // Create events in database
    const createdEvents = [];
    const skippedEvents = [];

    console.log(`Attempting to import ${events.length} events for user ${userId}`);

    for (const eventData of events) {
      try {
        // Check if event already exists (same title and start time within 1 minute tolerance)
        const oneMinute = 60 * 1000;
        const existing = await Event.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          title: eventData.title,
          startTime: {
            $gte: new Date(eventData.startTime.getTime() - oneMinute),
            $lte: new Date(eventData.startTime.getTime() + oneMinute),
          },
        });

        if (existing) {
          skippedEvents.push(eventData.title);
          console.log('Skipping duplicate event:', eventData.title);
          continue;
        }

        // Validate time range
        if (eventData.endTime <= eventData.startTime) {
          skippedEvents.push(eventData.title);
          console.log('Skipping event with invalid time range:', eventData.title);
          continue;
        }

        const event = await Event.create({
          title: eventData.title,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          status: EventStatus.BUSY,
          userId: new mongoose.Types.ObjectId(userId),
        });

        console.log('Created event:', event._id, eventData.title);
        createdEvents.push({
          id: event._id.toString(),
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
        });
      } catch (error) {
        console.error('Error creating event:', eventData.title, error);
        skippedEvents.push(eventData.title);
        continue;
      }
    }

    console.log(`Import complete: ${createdEvents.length} created, ${skippedEvents.length} skipped`);

    res.json({
      message: `Successfully imported ${createdEvents.length} event(s)`,
      imported: createdEvents.length,
      skipped: skippedEvents.length,
      events: createdEvents,
      skippedEvents: skippedEvents.slice(0, 10), // Limit skipped events in response
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to import calendar file' 
    });
  }
});

export default router;

