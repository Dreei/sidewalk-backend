import express from 'express';
import OpenAI from 'openai';
import Report from '../models/report.models.js';
import Emotion from '../models/emotion.models.js';
import dotenv from 'dotenv';
import Location from '../models/location.models.js';
dotenv.config();

const analyticsRouter = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate GPT-4 Report
analyticsRouter.get('/llm-report', async (req, res) => {
  try {
    console.log('Generating report...');
    // Fetch reports and emotions
    const reports = await Report.find().populate('location');
    const emotions = await Emotion.find().populate('location');

    // Prepare data for GPT-4
    const data = {
      totalReports: reports.length,
      totalEmotions: emotions.length,
      topIssues: getTopIssues(reports),
      overallSentiment: getOverallSentiment(emotions),
    };

    // Generate report using GPT-4
    const report = await generateGPT4Report(data);

    res.json({ report });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ message: err.message });
  }
});

// Detailed Area Report
analyticsRouter.get('/detailed-report-area', async (req, res) => {
  try {
    const { area_name } = req.query;
    if (!area_name) {
      return res.status(400).json({ message: 'Area parameter is required' });
    }
    console.log('Generating detailed report for area:', area_name);
    // Array of locations
    const theArea = await Location.find({ 'area': area_name });
    const areaName = area_name;

    
    const areaReports = [];
    const areaEmotions = [];
    for (const location of theArea) {
        const reports = await Report.find({ 'location': location._id }).populate('location');
        const emotions = await Emotion.find({ 'location': location._id }).populate('location');
        areaReports.push(...reports);
        areaEmotions.push(...emotions);
    }
    
   
    
    const areaData = {
      name: areaName,
      totalReports: areaReports.length,
      totalEmotions: areaEmotions.length,
      issues: getAreaIssueBreakdown(areaReports),
      emotions: getAreaEmotionBreakdown(areaEmotions)
    };

    const report = await generateAreaReport(areaData);
    res.json({ report });
  } catch (err) {
    console.error('Error generating detailed report:', err);
    res.status(500).json({ message: err.message });
  }
});

analyticsRouter.get('/detailed-report-location', async (req, res) => {
    try {
      const { location_id } = req.query;
      if (!location_id) {
        return res.status(400).json({ message: 'Area parameter is required' });
      }
      const theLocation = await Location.findById(location_id);
      const locationReports = await Report.find({ 'location': location_id }).populate('location');
      const locationEmotions = await Emotion.find({ 'location': location_id }).populate('location');
      
      const areaData = {
        name: theLocation.name,
        totalReports: locationReports.length,
        totalEmotions: locationEmotions.length,
        issues: getAreaIssueBreakdown(locationReports),
        emotions: getAreaEmotionBreakdown(locationEmotions)
      };
      const report = await generateAreaReport(areaData);
      res.json({ report });
    } catch (err) {
      console.error('Error generating detailed report:', err);
      res.status(500).json({ message: err.message });
    }
  });

// Area Analysis
analyticsRouter.get('/area-analysis', async (req, res) => {
  try {
    const reports = await Report.find().populate('location');
    const emotions = await Emotion.find().populate('location');

    // Group data by area
    const areas = await aggregateAreaData(reports, emotions);
    res.json({ areas });
  } catch (err) {
    console.error('Error generating area analysis:', err);
    res.status(500).json({ message: err.message });
  }
});

analyticsRouter.get('/location-reports', async (req, res) => {
    try {
        const { location_id } = req.query;
        const reports = await Report.find({ 'location': location_id}).populate('location');
        const reportsBreakdown = getAreaIssueBreakdown(reports);
        console.log("reports",reportsBreakdown);
        res.json({ report: reportsBreakdown });
      
    } catch (err) {
      console.error('Error generating area analysis:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

analyticsRouter.get('/location-emotions', async (req, res) => {
    try {
        const { location_id } = req.query;
        const emotions = await Emotion.find({ 'location': location_id }).populate('location');
        const emotionsBreakdown = getAreaEmotionBreakdown(emotions);
        console.log(emotionsBreakdown);
        console.log("emotions",emotionsBreakdown);
        res.json({ report: emotionsBreakdown });
    } catch (err) {
        console.error('Error generating area analysis:', err);
        res.status(500).json({ message: err.message });
    }
    }
);

// Original Helper Functions
function getTopIssues(reports) {
  const issues = reports.reduce((acc, report) => {
    acc[report.issueType] = (acc[report.issueType] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(issues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue, count]) => `${issue} (${count})`);
}

function getOverallSentiment(emotions) {
  const sentiments = emotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(sentiments).reduce((a, b) => a + b, 0);
  return Object.entries(sentiments)
    .map(([emotion, count]) => `${emotion}: ${((count / total) * 100).toFixed(1)}%`)
    .join(', ');
}

// New Helper Functions
function getAreaIssueBreakdown(reports) {
  const breakdown = reports.reduce((acc, report) => {
    acc[report.issueType] = (acc[report.issueType] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return Object.entries(breakdown).map(([type, count]) => ({
    type,
    count,
    percentage: ((count / total) * 100).toFixed(1)
  }));
}

function getAreaEmotionBreakdown(emotions) {
  const breakdown = emotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return Object.entries(breakdown).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: ((count / total) * 100).toFixed(1)
  }));
}

async function aggregateAreaData(reports, emotions) {
  const areaMap = new Map();

  // Process reports
  reports.forEach(report => {
    const areaName = report.location?.name || 'Unknown';
    if (!areaMap.has(areaName)) {
      areaMap.set(areaName, {
        area: areaName,
        statistics: {
          totalReports: 0,
          totalEmotions: 0,
          issueBreakdown: {},
          emotionBreakdown: {},
          userTypeDistribution: {}
        }
      });
    }
    const areaData = areaMap.get(areaName);
    areaData.statistics.totalReports++;
    areaData.statistics.issueBreakdown[report.issueType] = 
      (areaData.statistics.issueBreakdown[report.issueType] || 0) + 1;
  });

  // Process emotions
  emotions.forEach(emotion => {
    const areaName = emotion.location?.name || 'Unknown';
    if (!areaMap.has(areaName)) {
      areaMap.set(areaName, {
        area: areaName,
        statistics: {
          totalReports: 0,
          totalEmotions: 0,
          issueBreakdown: {},
          emotionBreakdown: {},
          userTypeDistribution: {}
        }
      });
    }
    const areaData = areaMap.get(areaName);
    areaData.statistics.totalEmotions++;
    areaData.statistics.emotionBreakdown[emotion.emotion] = 
      (areaData.statistics.emotionBreakdown[emotion.emotion] || 0) + 1;
  });

  // Calculate percentages
  for (let [, areaData] of areaMap) {
    // Calculate issue percentages
    const totalIssues = Object.values(areaData.statistics.issueBreakdown).reduce((a, b) => a + b, 0);
    areaData.statistics.issueBreakdown = Object.entries(areaData.statistics.issueBreakdown)
      .reduce((acc, [issue, count]) => ({
        ...acc,
        [issue]: {
          count,
          percentage: ((count / totalIssues) * 100).toFixed(1)
        }
      }), {});

    // Calculate emotion percentages
    const totalEmotions = Object.values(areaData.statistics.emotionBreakdown).reduce((a, b) => a + b, 0);
    areaData.statistics.emotionBreakdown = Object.entries(areaData.statistics.emotionBreakdown)
      .reduce((acc, [emotion, count]) => ({
        ...acc,
        [emotion]: {
          count,
          percentage: ((count / totalEmotions) * 100).toFixed(1)
        }
      }), {});
  }

  return Array.from(areaMap.values());
}

async function generateGPT4Report(data) {
    console.log(data.name);
  try {
    const systemPrompt = `You are an AI analyst specialized in analyzing urban infrastructure data. 
    Generate a professional, concise report about sidewalk conditions based on the provided data. 
    Focus on key insights and actionable recommendations.`;

    const userPrompt = `Generate a detailed analysis based on the following data:
    Area Name: ${data.name}
    Total Reports: ${data.totalReports}
    Total Emotions Recorded: ${data.totalEmotions}
    Top Issues: ${data.topIssues.join(', ')}
    Overall Sentiment: ${data.overallSentiment}

    Please include:
    1. Summary of key findings
    2. Analysis of top issues
    3. Sentiment analysis
    4. Recommendations for improvement`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating GPT-4 report:', error);
    throw new Error('Failed to generate report using GPT-4');
  }
}

async function generateAreaReport(data) {
    console.log("generating data for ", data.name);
  try {
    const systemPrompt = `Analyze sidewalk condition data for a specific area. 
    Provide concise insights and targeted recommendations.`;

    const userPrompt = `Generate a focused analysis for ${data.area}:
    Reports: ${data.totalReports}
    Emotions: ${data.totalEmotions}
    Issue Breakdown: ${JSON.stringify(data.issues)}
    Emotion Distribution: ${JSON.stringify(data.emotions)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating area report:', error);
    throw new Error('Failed to generate area report');
  }
}

export default analyticsRouter;