import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import fs from 'fs';
import Analysis from './Models/Analysis.js';
import User from './Models/User.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import OpenAI from 'openai';
import crypto from 'crypto';

dotenv.config({ path: './.env' });

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const openai = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.MISTRAL_API_KEY ? "https://api.mistral.ai/v1" : undefined,
});

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in backend/.env');
} else {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed. Backend will still start (dev mode).');
    console.error(err);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// API: Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const newUser = new User({
      name,
      email,
      password: hashPassword(password),
    });
    await newUser.save();
    res.json({ message: 'Registration successful', user: { name: newUser.name, email: newUser.email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// API: Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to securely login user' });
  }
});

// Setup file storage
const upload = multer({ dest: 'uploads/' });

// API: Analyze & Save
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded' });
  }

  try {
    const dataBuffer = await fs.promises.readFile(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text; // Use this text in your OpenAI prompt
    const { jd, userEmail } = req.body;

    // Call OpenAI API for actual analysis
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) and technical recruiter.
I will provide you with a Job Description and a candidate's Resume Text.
Your task is to analyze the resume against the job description and output a JSON response exactly matching the following structure:
{
  "score": <a number between 0 and 100 representing the overall match percentage>,
  "summary": "<a 1-2 sentence overall summary of the candidate's fit>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "missingSkills": ["<missing skill 1>", "<missing skill 2>"],
  "improvements": "<a 1-2 sentence actionable advice on what they can do to improve their chances>"
}
Ensure the output is strictly valid JSON.`;

    const chatCompletion = await openai.chat.completions.create({
      model: process.env.MISTRAL_API_KEY ? 'mistral-large-latest' : 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Job Description:\n${jd}\n\nResume Text:\n${resumeText}` }
      ],
      response_format: { type: 'json_object' }
    });

    const aiContent = chatCompletion.choices[0].message.content;
    const realResults = JSON.parse(aiContent);

    // Save to MongoDB
    const newAnalysis = new Analysis({
      resumeName: req.file.originalname,
      jdText: jd,
      userEmail: userEmail || undefined,
      ...realResults,
    });
    await newAnalysis.save();

    res.json(newAnalysis);
  } catch (error) {
    console.error('\n!!! ====== ANALYSIS PIPELINE ERROR ====== !!!');
    console.error('Time:', new Date().toISOString());
    console.error('Error Object:', error);
    console.error('Root Message:', error.message || String(error));
    console.error('Full Stack:', error.stack || 'No stack available');
    console.error('!!! ======================================= !!!\n');
    res.status(500).json({ error: error.message || 'Failed to process analysis' });
  } finally {
    // Cleanup uploaded file
    if (req.file && req.file.path) {
      await fs.promises.unlink(req.file.path).catch(err => console.error('Failed to clean up temp file:', err));
    }
  }
});


// API: Get History
app.get('/api/history', async (req, res) => {
  try {
    // If Analysis isn't a Mongoose model for some reason, return a helpful error
    if (!Analysis || typeof Analysis.find !== 'function') {
      return res.status(500).json({
        error: 'Analysis model is not initialized correctly',
        analysisType: typeof Analysis,
      });
    }

    const { email } = req.query;
    const queryObject = email ? { $or: [{ userEmail: email }, { userEmail: { $exists: false } }] } : {};

    const history = await Analysis.find(queryObject).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// API: Delete History Item
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAnalysis = await Analysis.findByIdAndDelete(id);
    if (!deletedAnalysis) {
      return res.status(404).json({ error: 'History item not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));

