import { spawn } from 'child_process';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    try {
      // Path to the Python script
      const pythonScriptPath = path.join(process.cwd(), 'scripts', 'weather_scrapper.py');

      // Specify the path to the Python interpreter (can use env variable)
      const pythonInterpreter = process.env.NEXT_PUBLIC_PYTHON_PATH || "python"; // Use env var for flexibility

      // Spawn a child process to execute the Python script with the location as an argument
      const pythonProcess = spawn(pythonInterpreter, [pythonScriptPath, location]);

      let data = '';
      let error = '';

      // Collect data from Python script's stdout
      pythonProcess.stdout.on('data', (chunk) => {
        data += chunk;
      });

      // Collect errors from Python script's stderr
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
          const weatherData = JSON.parse(data); // Parse JSON data returned by Python script
          return res.status(200).json(weatherData);
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
