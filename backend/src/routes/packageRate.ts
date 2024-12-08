import express from 'express';
import { Router } from 'express';
import dbConnectionPromise from './db';
import { getBusFactor } from '../metrics/bus_factor';
import { getCorrectness } from '../metrics/correctness';
import { calculateTotalTimeFromRepo } from '../metrics/ramp_up_metric';
import { getResponsive } from '../metrics/responsive_maintainer';
import { getLicense } from '../metrics/license';
import { calculateDependencyPinning } from '../metrics/dependency_pinning';
import { getPullRequestCodeReview } from '../metrics/pull_request_code_review';
import { parseURL } from '../url_parse';
import AdmZip from 'adm-zip';

const router: Router = express.Router();

// Separate handler function for testing
export const packageRateHandler = async (packageId: string) => {
  try {
    // Validate package ID
    if (!packageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'PackageID not given' })
      };
    }

    // Get package from database
    const db_connection = await dbConnectionPromise;

    // check db connection status
    if (!db_connection) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database connection failed' })
      };
    }

    const query = 'SELECT * FROM packages WHERE id = ?';
    const result = await db_connection.execute(query, [packageId]);
    console.log(result);

    if (result[0].length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Package does not exist' })
      };
    }
    
    // assumes only one package with the given ID
    const packageData = result[0][0];
    let owner = '';
    let repo = '';

    if (packageData.url) {
      [owner, repo] = await parseURL(packageData.url);
    } else {
      try {
        // Decode the base64 content to binary
        const buffer = Buffer.from(packageData.content, 'base64');

        // Initialize zip handler
        const zip = new AdmZip(buffer);

        // Search for package.json in the zip file
        const zipEntries = zip.getEntries();
        let packageJsonContent = null;

        zipEntries.forEach((entry) => {
          if (entry.entryName.endsWith('package.json')) {
            packageJsonContent = entry.getData().toString('utf8');
          }
        });        

        if (!packageJsonContent) {
          throw new Error("package.json not found in the uploaded content.");
        }

        // Parse the package.json content
        const packageJson = JSON.parse(packageJsonContent);

        // Extract the repository field
        const repository = packageJson.repository;

        // Handle different formats of the repository field
        let url = null;
        if (typeof repository === 'string') {
          // Direct string format like "bendrucker/smallest"
          url = `https://github.com/${repository}`;
        } else if (typeof repository === 'object' && repository.url) {
          // Object format with a URL field
          url = repository.url;
        }

        if (!url) {
          throw new Error("Repository URL not found in the package.json.");
        }

        // Parse the URL (if needed to get specific parts like owner and repo)
        [owner, repo] = await parseURL(url);

        console.log('Extracted URL:', url);
      } catch (error) {
        console.error('Error extracting package.json:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to extract url from package.json' })
        };
      }
    }

    if (!owner || !repo) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Invalid repository URL' })
      };
    }

    const start = Date.now();
    const repoUrl = `https://github.com/${owner}/${repo}`;

    try {
      const [
        [busFactorResult, busFactorLatency],
        [correctnessResult, correctnessLatency],
        [rampUpResult, rampUpLatency],
        [responsiveMaintainerResult, responsiveMaintainerLatency],
        [licenseResult, licenseLatency],
        [pullRequestResult, pullRequestLatency],
        [goodPinningPractice, goodPinningPracticeLatency]
      ] = await Promise.all([
        getBusFactor(owner, repo),
        getCorrectness(owner, repo),
        calculateTotalTimeFromRepo(repoUrl),
        getResponsive(owner, repo),
        getLicense(owner, repo),
        getPullRequestCodeReview(owner, repo),
        calculateDependencyPinning(owner, repo)
      ]);

      // Check for failed metrics
      if (busFactorResult === -1 || correctnessResult === -1 || rampUpResult === -1 || responsiveMaintainerResult === -1 || licenseResult === -1 || pullRequestResult === -1 || goodPinningPractice === -1) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to calculate one or more metrics' })
        };
      }

      // check for null as well
      if (busFactorResult === null || correctnessResult === null || rampUpResult === null || responsiveMaintainerResult === null || licenseResult === null || pullRequestResult === null || goodPinningPractice === null) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to calculate one or more metrics' })
        };
      }

      // check for NaN
      if (isNaN(busFactorResult) || isNaN(correctnessResult) || isNaN(rampUpResult) || isNaN(responsiveMaintainerResult) || isNaN(licenseResult) || isNaN(pullRequestResult) || isNaN(goodPinningPractice)) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to calculate one or more metrics' })
        };
      }

      // Calculate NetScore
      const weights = {
        RampUp: 0.2,
        Correctness: 0.2,
        BusFactor: 0.1,
        ResponsiveMaintainer: 0.2,
        LicenseScore: 0.1,
        GoodPinningPractice: 0.1,
        PullRequest: 0.1
      };

      const netScore = (rampUpResult * weights.RampUp) + (correctnessResult * weights.Correctness) + 
                        (busFactorResult * weights.BusFactor) + (responsiveMaintainerResult * weights.ResponsiveMaintainer) + 
                        (licenseResult * weights.LicenseScore) + (goodPinningPractice * weights.GoodPinningPractice) + (pullRequestResult * weights.PullRequest);

      const endTime = Date.now();
      const net_latency = (endTime - start) / 1000;

      let response = {
        statusCode: 200,
        body: JSON.stringify({
          BusFactor: busFactorResult,
          Correctness: correctnessResult,
          RampUp: rampUpResult,
          ResponsiveMaintainer: responsiveMaintainerResult,
          LicenseScore: licenseResult,
          GoodPinningPractice: goodPinningPractice,
          PullRequest: pullRequestResult,
          NetScore: netScore,
          RampUpLatency: rampUpLatency,
          CorrectnessLatency: correctnessLatency,
          BusFactorLatency: busFactorLatency,
          ResponsiveMaintainerLatency: responsiveMaintainerLatency,
          LicenseScoreLatency: licenseLatency,
          GoodPinningPracticeLatency: goodPinningPracticeLatency,
          PullRequestLatency: pullRequestLatency,
          NetScoreLatency: net_latency
        })
      };

      // check if any value is null, assign as -1
      let responseBody = JSON.parse(response.body);
      for (let key in responseBody) {
        if (responseBody[key] === null) {
          responseBody[key] = -1;
        }
      }
      response.body = JSON.stringify(responseBody);

      return response;

    } catch (error) {
      console.error('Error rating package:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Rating system failed' })
      };
    }
  } catch (error) {
    console.error('Error rating package:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Express route handler
router.get('/package/:id/rate', async (req, res) => {
  try {
    const packageId = req.params.id;
    const response = await packageRateHandler(packageId);
    res.status(response.statusCode).send(response.body);
    return;
  } catch (error){
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;