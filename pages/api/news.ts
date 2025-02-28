import { spawn } from 'child_process';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let location = '';

  if (req.method === 'POST') {
    location = req.body.location;
  } else if (req.method === 'GET') {
    location = req.query.location as string;
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'news_scraper.py');
    const pythonInterpreter = process.env.NEXT_PUBLIC_PYTHON_PATH || 'python';

    const pythonProcess = spawn(pythonInterpreter, [pythonScriptPath, location]);

    let data = '';
    let error = '';

    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk;
    });

    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk;
    });

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
}
