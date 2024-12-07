import express, { Request, Response } from 'express';
import { Router } from 'express';
import dbConnectionPromise from './db';

const router: Router = express.Router();

// Helper function to calculate package size in MB
const calculatePackageSize = (content: string): number => {
  const bytes = Buffer.from(content, 'base64').length;
  return Number((bytes / (1024 * 1024)).toFixed(2));
};

// Helper function to get dependencies
const getPackageDependencies = async (packageId: string): Promise<string[]> => {
  const db_connection = await dbConnectionPromise;
  const query = 'SELECT dependencies FROM packages WHERE id = $1';
  const result = await db_connection.execute(query, [packageId]);
  
  if (!result.rows?.[0]?.dependencies) return [];
  return result.rows[0].dependencies.split(',').map((dep: string) => dep.trim());
};

export const packageCostHandler = async (packageId: string, includeDependencies: boolean = false) => {
  try {
    if (!packageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing field(s) in PackageID' })
      };
    }

    // Get package from database
    const db_connection = await dbConnectionPromise;
    const query = 'SELECT id, content, dependencies FROM packages WHERE id = $1';
    
    try {
      const result = await db_connection.execute(query, [packageId]);

      if (!result.rows || result.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Package does not exist' })
        };
      }

      const packageData = result.rows[0];
      const standaloneCost = calculatePackageSize(packageData.content);
      let totalCost = standaloneCost;

      if (includeDependencies) {
        try {
          const dependencies = await getPackageDependencies(packageId);
          console.log('Dependencies found:', dependencies);

          const dependencyCosts = await Promise.all(
            dependencies.map(async (depId) => {
              const depQuery = 'SELECT content FROM packages WHERE id = $1';
              const depResult = await db_connection.execute(depQuery, [depId]);
              if (depResult.rows?.[0]?.content) {
                return calculatePackageSize(depResult.rows[0].content);
              }
              return 0;
            })
          );

          totalCost += dependencyCosts.reduce((sum, cost) => sum + cost, 0);
        } catch (error) {
          console.error('Error calculating dependency costs:', error);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to calculate dependency costs' })
          };
        }
      }

      const response: any = {
        [packageId]: {
          totalCost
        }
      };

      if (includeDependencies) {
        response[packageId].standaloneCost = standaloneCost;
      }

      return {
        statusCode: 200,
        body: JSON.stringify(response)
      };

    } catch (error) {
      console.error('Database query error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  } catch (error) {
    console.error('Error in packageCostHandler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

router.get('/package/:id/cost', async (req: Request, res: Response) => {
  const packageId = req.params.id;
  const includeDependencies = req.query.dependency === 'true';
  console.log('Calculating cost for package:', packageId, 'with dependencies:', includeDependencies);
  
  const response = await packageCostHandler(packageId, includeDependencies);
  res.status(response.statusCode).send(response.body);
});

export default router;