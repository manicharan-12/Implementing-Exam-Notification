const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Models
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  notificationPreferences: {
    type: [String],
    enum: ['email', 'sms', 'in-app'],
    default: ['email'],
  },
  reminderFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  examRegistrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
  }],
  calendarToken: String,
});

const examSchema = new mongoose.Schema({
  name: String,
  date: Date,
  venue: String,
  preparationMaterials: [String],
  announcements: [String],
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  message: String,
  type: {
    type: String,
    enum: ['reminder', 'announcement', 'result', 'material'],
  },
  sent: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Exam = mongoose.model('Exam', examSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Helper functions
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

const sendSMS = async (to, message) => {
  // Implement SMS sending logic here
  console.log(`SMS sent to ${to}: ${message}`);
};

const getAuthUrl = (user) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:5000/oauth2callback'
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: JSON.stringify({ userId: user._id }),
  });

  return authUrl;
};

const addEventToCalendar = async (user, exam) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:5000/oauth2callback'
  );

  oAuth2Client.setCredentials({ refresh_token: user.calendarToken });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const event = {
    summary: exam.name,
    location: exam.venue,
    description: 'Exam Date',
    start: {
      dateTime: exam.date.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(exam.date.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
    },
  };

  await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
};

// Routes
app.get('/users', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user settings', error });
  }
});

app.post('/exams', async (req, res) => {
    try {
      const { name, date, venue, preparationMaterials, announcements } = req.body;
      const newExam = new Exam({ name, date, venue, preparationMaterials, announcements });
      await newExam.save();
  
      // Fetch all users
      const users = await User.find();
  
      // Send notifications to all users
      for (const user of users) {
        // Create a notification
        const notification = new Notification({
          userId: user._id,
          examId: newExam._id,
          message: `New exam "${name}" has been scheduled for ${new Date(date).toLocaleDateString()}.`,
          type: 'announcement',
        });
        await notification.save();
  
        // Send email notification
        if (user.notificationPreferences.includes('email')) {
          await sendEmail(
            user.email,
            'New Exam Scheduled',
            `A new exam "${name}" has been scheduled for ${new Date(date).toLocaleDateString()} at ${venue}.`
          );
        }
  
        // Send SMS notification
        if (user.notificationPreferences.includes('sms')) {
          await sendSMS(
            user.phoneNumber,
            `New exam "${name}" scheduled for ${new Date(date).toLocaleDateString()} at ${venue}.`
          );
        }
      }
  
      res.status(201).json({ message: 'Exam created and notifications sent', exam: newExam });
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ message: 'Error creating exam', error: error.message });
    }
  });

app.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error });
  }
});

app.get('/users/registeredExams', async (req, res) => {
  try {
    const user = await User.findOne().populate('examRegistrations');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.examRegistrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registered exams', error });
  }
});

app.post('/exams/register', async (req, res) => {
  try {
    const { examId } = req.body;
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    user.examRegistrations.push(examId);
    await user.save();

    // Create notifications for the registered exam
    await createExamNotifications(user, exam);

    // Send email notification
    const subject = 'Exam Registration Confirmation';
    const text = `You have successfully registered for the exam: ${exam.name} on ${new Date(exam.date).toLocaleDateString()}.`;
    await sendEmail(user.email, subject, text);

    // Add event to Google Calendar if user has authorized
    if (user.calendarToken) {
      await addEventToCalendar(user, exam);
    }

    const exams = await Exam.find();
    const registeredExams = await User.findOne().populate('examRegistrations');

    const availableExams = exams.filter(exam => !registeredExams.examRegistrations.some(regExam => regExam._id.equals(exam._id)));

    const authUrl = getAuthUrl(user);

    res.json({ message: 'Registered successfully. Please authorize to add event to calendar.', authUrl, availableExams, registeredExams: user.examRegistrations });
  } catch (error) {
    res.status(500).json({ message: 'Error registering for exam', error });
  }
});

app.get('/oauth2callback', async (req, res) => {
  const { code, state } = req.query;
  const { userId } = JSON.parse(state);

  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:5000/oauth2callback'
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const user = await User.findById(userId);
    user.calendarToken = tokens.refresh_token;
    await user.save();

    const examId = user.examRegistrations[user.examRegistrations.length - 1];
    const exam = await Exam.findById(examId);

    await addEventToCalendar(user, exam);

    res.redirect('http://localhost:3000');
  } catch (error) {
    console.error('Error during OAuth2 callback:', error);
    res.status(500).send('Error during OAuth2 callback');
  }
});

app.post('/users/updatePreferences', async (req, res) => {
  try {
    const { notificationPreferences, reminderFrequency } = req.body;
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.notificationPreferences = notificationPreferences;
    user.reminderFrequency = reminderFrequency;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences', error });
  }
});

app.post('/exams/addToCalendar', async (req, res) => {
  try {
    const { examId } = req.body;
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (user.calendarToken) {
      await addEventToCalendar(user, exam);
      res.json({ message: 'Exam added to calendar successfully' });
    } else {
      const authUrl = getAuthUrl(user);
      res.json({ authUrl });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding exam to calendar', error });
  }
});

app.post('/notifications/send', async (req, res) => {
  try {
    const notifications = await Notification.find({ sent: false });

    for (const notification of notifications) {
      const user = await User.findById(notification.userId);
      const exam = await Exam.findById(notification.examId);

      if (user.notificationPreferences.includes('email')) {
        await sendEmail(user.email, 'Exam Notification', notification.message);
      }

      if (user.notificationPreferences.includes('sms')) {
        await sendSMS(user.phoneNumber, notification.message);
      }

      if (user.notificationPreferences.includes('in-app')) {
        // Logic for in-app notifications would go here
        console.log(`In-app notification for user ${user._id}: ${notification.message}`);
      }

      notification.sent = true;
      await notification.save();
    }

    res.json({ message: 'Notifications sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending notifications', error });
  }
});

// New route to get user notifications
app.get('/users/notifications', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const notifications = await Notification.find({ userId: user._id }).sort('-date');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
});

// New route to add exam announcement
app.post('/exams/:examId/announcements', async (req, res) => {
  try {
    const { examId } = req.params;
    const { announcement } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.announcements.push(announcement);
    await exam.save();

    // Create and send notifications for the announcement
    const users = await User.find({ examRegistrations: examId });
    for (const user of users) {
      await createAndSendNotification(user, exam, 'announcement', announcement);
    }

    res.json({ message: 'Announcement added and notifications sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding announcement', error });
  }
});

// New route to add preparation material
app.post('/exams/:examId/materials', async (req, res) => {
  try {
    const { examId } = req.params;
    const { material } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.preparationMaterials.push(material);
    await exam.save();

    // Create and send notifications for the new material
    const users = await User.find({ examRegistrations: examId });
    for (const user of users) {
      await createAndSendNotification(user, exam, 'material', `New preparation material available: ${material}`);
    }

    res.json({ message: 'Preparation material added and notifications sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding preparation material', error });
  }
});

// Helper function to create exam notifications
async function createExamNotifications(user, exam) {
  const reminderDates = [
    { days: 30, message: '1 month' },
    { days: 7, message: '1 week' },
    { days: 1, message: '1 day' },
    { days: 0, message: 'today' }
  ];

  for (const reminder of reminderDates) {
    const reminderDate = new Date(exam.date);
    reminderDate.setDate(reminderDate.getDate() - reminder.days);

    const notification = new Notification({
      userId: user._id,
      examId: exam._id,
      message: `Your exam "${exam.name}" is ${reminder.message} away.`,
      type: 'reminder',
      date: reminderDate
    });

    await notification.save();
  }
}

// Helper function to create and send a notification
async function createAndSendNotification(user, exam, type, message) {
  const notification = new Notification({
    userId: user._id,
    examId: exam._id,
    message,
    type,
    sent: false
  });

  await notification.save();

  if (user.notificationPreferences.includes('email')) {
    await sendEmail(user.email, `Exam ${type.charAt(0).toUpperCase() + type.slice(1)}`, message);
  }

  if (user.notificationPreferences.includes('sms')) {
    await sendSMS(user.phoneNumber, message);
  }

  if (user.notificationPreferences.includes('in-app')) {
    // Logic for in-app notifications would go here
    console.log(`In-app notification for user ${user._id}: ${message}`);
  }

  notification.sent = true;
  await notification.save();
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});