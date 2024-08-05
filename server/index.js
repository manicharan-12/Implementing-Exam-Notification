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


app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNotification = async (user, subject, message) => {
  if (user.notificationPreferences.includes('email')) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      text: message,
    });
  }

  if (user.notificationPreferences.includes('sms')) {
    console.log(`SMS sent to ${user.phoneNumber}: ${message}`);
  }

  if (user.notificationPreferences.includes('in-app')) {
    console.log(`In-app notification for user ${user._id}: ${message}`);
  }
};

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://implementing-exam-notification.onrender.com/oauth2callback'
);

const getAuthUrl = (userId) => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: JSON.stringify({ userId }),
  });
};

const addEventToCalendar = async (user, exam) => {
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

const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

app.get('/users', getUser, (req, res) => {
  res.json(req.user);
});

app.get('/users/registeredExams', getUser, async (req, res) => {
  await req.user.populate('examRegistrations');
  res.json(req.user.examRegistrations);
});

app.post('/users/updatePreferences', getUser, async (req, res) => {
  const { notificationPreferences, reminderFrequency } = req.body;
  req.user.notificationPreferences = notificationPreferences;
  req.user.reminderFrequency = reminderFrequency;
  await req.user.save();
  res.json(req.user);
});

app.get('/users/notifications', getUser, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort('-date');
  res.json(notifications);
});

app.post('/exams', async (req, res) => {
  const { name, date, venue, preparationMaterials, announcements } = req.body;
  const newExam = new Exam({ name, date, venue, preparationMaterials, announcements });
  await newExam.save();

  const users = await User.find();

  for (const user of users) {
    const notification = new Notification({
      userId: user._id,
      examId: newExam._id,
      message: `New exam "${name}" has been scheduled for ${new Date(date).toLocaleDateString()}.`,
      type: 'announcement',
    });
    await notification.save();

    await sendNotification(user, 'New Exam Scheduled', notification.message);
  }

  res.status(201).json({ message: 'Exam created and notifications sent', exam: newExam });
});

app.get('/exams', async (req, res) => {
  const exams = await Exam.find();
  res.json(exams);
});

app.post('/exams/register', getUser, async (req, res) => {
  const { examId } = req.body;
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  req.user.examRegistrations.push(examId);
  await req.user.save();

  await createExamNotifications(req.user, exam);

  await sendNotification(req.user, 'Exam Registration Confirmation', 
    `You have successfully registered for the exam: ${exam.name} on ${new Date(exam.date).toLocaleDateString()}.`);

  if (req.user.calendarToken) {
    await addEventToCalendar(req.user, exam);
  }

  const exams = await Exam.find();
  const registeredExams = await User.findOne().populate('examRegistrations');

  const availableExams = exams.filter(exam => !registeredExams.examRegistrations.some(regExam => regExam._id.equals(exam._id)));

  const authUrl = getAuthUrl(req.user._id);

  res.json({ message: 'Registered successfully. Please authorize to add event to calendar.', authUrl, availableExams, registeredExams: req.user.examRegistrations });
});

app.post('/exams/:examId/announcements', async (req, res) => {
  const { examId } = req.params;
  const { announcement } = req.body;
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  exam.announcements.push(announcement);
  await exam.save();

  const users = await User.find({ examRegistrations: examId });
  for (const user of users) {
    await createAndSendNotification(user, exam, 'announcement', announcement);
  }

  res.json({ message: 'Announcement added and notifications sent' });
});

app.post('/exams/:examId/materials', async (req, res) => {
  const { examId } = req.params;
  const { material } = req.body;
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  exam.preparationMaterials.push(material);
  await exam.save();

  const users = await User.find({ examRegistrations: examId });
  for (const user of users) {
    await createAndSendNotification(user, exam, 'material', `New preparation material available: ${material}`);
  }

  res.json({ message: 'Preparation material added and notifications sent' });
});

app.post('/notifications/send', async (req, res) => {
  const notifications = await Notification.find({ sent: false });

  for (const notification of notifications) {
    const user = await User.findById(notification.userId);
    await sendNotification(user, 'Exam Notification', notification.message);
    notification.sent = true;
    await notification.save();
  }

  res.json({ message: 'Notifications sent' });
});

app.get('/oauth2callback', async (req, res) => {
  const { code, state } = req.query;
  const { userId } = JSON.parse(state);

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const user = await User.findById(userId);
    user.calendarToken = tokens.refresh_token;
    await user.save();

    const examId = user.examRegistrations[user.examRegistrations.length - 1];
    const exam = await Exam.findById(examId);

    await addEventToCalendar(user, exam);

    res.redirect('https://implementing-exam-notification.vercel.app');
  } catch (error) {
    await console.error('Error during OAuth2 callback:', error);
    res.status(500).send('Error during OAuth2 callback');
  }
});

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

async function createAndSendNotification(user, exam, type, message) {
  const notification = new Notification({
    userId: user._id,
    examId: exam._id,
    message,
    type,
    sent: false
  });

  await notification.save();
  await sendNotification(user, `Exam ${type.charAt(0).toUpperCase() + type.slice(1)}`, message);
  notification.sent = true;
  await notification.save();
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An error occurred', error: err.message });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});