// pages/api/news.ts
import { spawn } from 'child_process';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next'; // Import Next.js API types

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    try {
      // Construct the absolute path to your Python script
      const pythonScriptPath = path.join(process.cwd(), 'scripts', 'news_scraper.py');

      // Specify the path to the Python interpreter (use absolute path or "python" if in PATH)
      const pythonInterpreter = process.env.NEXT_PUBLIC_PYTHON_PATH || "/usr/local/bin/python3"; // Use env var for flexibility

      // Spawn a child process to execute the Python script
      const pythonProcess = spawn(pythonInterpreter, [pythonScriptPath, location]);

      let data = '';
      let error = '';

      // Collect data from the Python script's stdout
      pythonProcess.stdout.on('data', (chunk) => {
        data += chunk;
      });

      // Collect errors from the Python script's stderr
      pythonProcess.stderr.on('data', (chunk) => {
        error += chunk;
      });

      // Handle process exit
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}, error: ${error}`);
          return res.status(500).json({ error: `Python script failed: ${error}` });
        }

        try {
          const newsData = JSON.parse(data);
          return res.status(200).json(newsData);
        } catch (parseError) {
          console.error('Error parsing JSON from Python script:', parseError);
          return res.status(500).json({ error: 'Failed to parse JSON from Python script' });
        }
      });
    } catch (err) {
      console.error('Error spawning Python process:', err);
      return res.status(500).json({ error: 'Failed to spawn Python process' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}