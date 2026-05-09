import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  resumeName: String,
  score: Number,
  summary: String,
  strengths: [String],
  missingSkills: [String],
  improvements: String,
  userEmail: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Analysis', analysisSchema);

