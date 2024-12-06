import express, { Request, Response } from 'express';
import { Router } from 'express';
import dbConnectionPromise from './db';
import { getBusFactor } from '../bus_factor';
import { getCorrectness } from '../correctness';
import { calculateTotalTimeFromRepo } from '../ramp_up_metric';
import { getResponsive } from '../responsive_maintainer';
import { getLicense } from '../license';
import { getDependencies } from '../dependency_parser';
import { getPullRequestCodeReview } from '../pull_request_code_review';
import { parseURL } from '../url_parse';

const router: Router = express.Router();

// Separate handler function for testing
export const packageRateHandler = async (packageId: string) => {
  try {
    // Validate package ID
    if (!packageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing field(s) in PackageID' })
      };
    }

    // Validate package ID format
    if (!/^[a-zA-Z0-9\-]+$/.test(packageId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid PackageID format' })
      };
    }

    // Get package from database
    const db_connection = await dbConnectionPromise;
    const query = 'SELECT * FROM packages WHERE id = ?';
    const result = await db_connection.execute(query, [packageId]);

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
        busFactorResult,
        correctnessResult,
        rampUpResult,
        responsiveMaintainerResult,
        licenseResult,
        pullRequestResult,
        dependencies
      ] = await Promise.all([
        getBusFactor(owner, repo),
        getCorrectness(owner, repo),
        calculateTotalTimeFromRepo(repoUrl),
        getResponsive(owner, repo),
        getLicense(owner, repo),
        getPullRequestCodeReview(owner, repo),
        getDependencies(owner, repo)
      ]);

      // Calculate GoodPinningPractice
      const goodPinningPractice = dependencies.length === 0 ? 1.0 :
        dependencies.filter(dep => {
          const version = dep.version;
          const cleanVersion = version.replace(/^[^0-9]*/, '');
          return /^\d+\.\d+(\.\d+)?$/.test(cleanVersion) &&
                 !version.includes('^') &&
                 !version.includes('~') &&
                 !version.endsWith('x') &&
                 !version.endsWith('*');
        }).length / dependencies.length;

      // Format metrics
      const metrics = {
        RampUp: Number((Array.isArray(rampUpResult) ? rampUpResult[0] : rampUpResult).toFixed(5)),
        Correctness: Number((Array.isArray(correctnessResult) ? correctnessResult[0] : correctnessResult).toFixed(5)),
        BusFactor: Number((Array.isArray(busFactorResult) ? busFactorResult[0] : busFactorResult).toFixed(5)),
        ResponsiveMaintainer: Number((Array.isArray(responsiveMaintainerResult) ? responsiveMaintainerResult[0] : responsiveMaintainerResult).toFixed(5)),
        LicenseScore: Number((Array.isArray(licenseResult) ? licenseResult[0] : licenseResult).toFixed(5)),
        GoodPinningPractice: Number(goodPinningPractice.toFixed(5)),
        PullRequest: Number((Array.isArray(pullRequestResult) ? pullRequestResult[0] : pullRequestResult).toFixed(5))
      };

      // Check for failed metrics
      if (Object.values(metrics).some(metric => metric === -1)) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'The package rating system failed on at least one metric' })
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

      const netScore = Object.entries(metrics).reduce(
        (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
        0
      );

      const endTime = Date.now();
      const latency = (endTime - start) / 1000;

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...metrics,
          NetScore: Number(netScore.toFixed(5)),
          RampUpLatency: latency,
          CorrectnessLatency: latency,
          BusFactorLatency: latency,
          ResponsiveMaintainerLatency: latency,
          LicenseScoreLatency: latency,
          GoodPinningPracticeLatency: latency,
          PullRequestLatency: latency,
          NetScoreLatency: latency
        })
      };

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
router.get('/package/:id/rate', async (req: Request, res: Response) => {
  const packageId = req.params.id;
  const response = await packageRateHandler(packageId);
  res.status(response.statusCode).send(response.body);
});

export default router;