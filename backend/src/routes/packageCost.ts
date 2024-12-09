import express, { Request, Response } from 'express';
import { Router } from 'express';
import dbConnectionPromise from './db';
import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import * as tar from 'tar-stream'; // to extract package.json from tarball
import { gunzipSync } from 'zlib';
import semver from 'semver'; // Install using `npm install semver`

const router: Router = express.Router();

// Calculate size in MB from a Buffer
const calculateSizeMB = (buffer: Buffer): number => {
  const bytes = buffer.length;
  return Number((bytes / (1024 * 1024)));//.toFixed(2));
};

// Extract package.json from a zip buffer
export const extractPackageJsonFromZip = (zipBuffer: Buffer): any => {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // Find an entry that ends with 'package.json', even if it's in a subdirectory
  const packageJsonEntry = entries.find((entry) => entry.entryName.endsWith('package.json'));

  if (!packageJsonEntry) {
    return null;
  }

  const packageJsonStr = packageJsonEntry.getData().toString('utf8');
  return JSON.parse(packageJsonStr);
};


// Extract package.json from a tarball buffer (.tgz from npm)
export const extractPackageJsonFromTarball = async (tarballBuffer: Buffer): Promise<any> => {
  const ungzipped = gunzipSync(tarballBuffer);
  const extract = tar.extract();
  
  return new Promise((resolve, reject) => {
    let packageJson: any = null;

    extract.on('entry', (header, stream, next) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        if (header.name.endsWith('package.json')) {
          const data = Buffer.concat(chunks).toString('utf8');
          try {
            packageJson = JSON.parse(data);
          } catch (err) {
            return reject(err);
          }
        }
        next();
      });
      stream.on('error', reject);
    });

    extract.on('finish', () => {
      resolve(packageJson);
    });

    extract.on('error', reject);

    extract.end(ungzipped);
  });
};

// Fetch package from npm registry given name and version
// Returns { packageJson, standaloneCost } or null if not found
const fetchPackageFromNpm = async (name: string, versionRange: string): Promise<{packageJson: any, standaloneCost: number} | null> => {
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  const resp = await fetch(registryUrl);
  
  if (!resp.ok) {
    return null;
  }

  const meta = await resp.json();
  const versions = Object.keys(meta.versions); // All available versions for this package
  const resolvedVersion = semver.maxSatisfying(versions, versionRange); // Resolve the version that matches the range

  if (!resolvedVersion) {
    console.error(`No matching version found for ${name}@${versionRange}`);
    return null;
  }

  const tarballUrl = meta.versions[resolvedVersion].dist?.tarball;
  if (!tarballUrl) {
    console.error(`No tarball URL found for ${name}@${resolvedVersion}`);
    return null;
  }

  const tarballResp = await fetch(tarballUrl);
  if (!tarballResp.ok) {
    console.error(`Failed to fetch tarball for ${name}@${resolvedVersion}`);
    return null;
  }

  const tarballBuffer = Buffer.from(await tarballResp.arrayBuffer());

  // Use the tarball size as standalone cost
  const standaloneCost = calculateSizeMB(tarballBuffer);
  const packageJson = await extractPackageJsonFromTarball(tarballBuffer);

  if (!packageJson) {
    console.error(`Failed to extract package.json from tarball for ${name}@${resolvedVersion}`);
    return null;
  }

  return { packageJson, standaloneCost };
};

// Extract dependencies (not devDependencies) from a package.json object
const getDependenciesFromPackageJson = (packageJson: any): Record<string, string> => {
  return packageJson.dependencies || {};
};

// Load the main package from local DB by ID
const loadLocalPackage = async (db_connection: any, packageId: string): Promise<{packageJson: any, standaloneCost: number, packageName: string, packageVersion: string} | null> => {
  const query = 'SELECT content, package_name, package_version FROM packages WHERE id = ?';
  const [result] = await db_connection.execute(query, [packageId]);

  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  const row = result[0];
  if (!row.content) {
    return null;
  }

  const contentBuffer = Buffer.from(row.content, 'base64');

  const packageJson = extractPackageJsonFromZip(contentBuffer);
  if (!packageJson) {
    return null;
  }

  const standaloneCost = calculateSizeMB(contentBuffer);
  return {
    packageJson,
    standaloneCost,
    packageName: row.package_name,
    packageVersion: row.package_version
  };
};

// Resolve package data:
// - If we have a main packageId, we load it locally. If not found, 404.
// - For dependencies, we always use npm.
const resolvePackageData = async (
  db_connection: any,
  visited: Map<string, {standaloneCost: number; totalCost: number;}>,
  stack: Set<string>,
  packageId: string | null,
  packageName: string | null, 
  packageVersion: string | null,
  isMainPackage: boolean
): Promise<{ packageKey: string, packageJson: any, standaloneCost: number }> => {
  
  let packageKey: string;
  if (packageName && packageVersion) {
    packageKey = `${packageName}@${packageVersion}`;
  } else if (packageId) {
    packageKey = packageId;
  } else {
    throw new Error("Cannot resolve package without either packageId or packageName+Version");
  }

  if (stack.has(packageKey)) {
    throw new Error(`Circular dependency detected at ${packageKey}`);
  }
  stack.add(packageKey);

  if (visited.has(packageKey)) {
    stack.delete(packageKey);
    const { standaloneCost } = visited.get(packageKey)!;
    return { packageKey, packageJson: null, standaloneCost };
  }

  let resolvedPackageJson: any;
  let standaloneCost = 0;
  let finalName = packageName;
  let finalVersion = packageVersion;

  if (isMainPackage && packageId) {
    // For main package, we must load locally
    const localResult = await loadLocalPackage(db_connection, packageId);
    if (!localResult) {
      throw new Error(`Main package ${packageId} not found locally`);
    }
    resolvedPackageJson = localResult.packageJson;
    standaloneCost = localResult.standaloneCost;
    finalName = localResult.packageName;
    finalVersion = localResult.packageVersion;
  } else {
    // For dependencies, always use npm
    if (!finalName || !finalVersion) {
      // If we don't have name & version for dependency, we can't fetch from npm
      // Treat as no-dependency package with zero cost
      standaloneCost = 0;
      resolvedPackageJson = { dependencies: {} };
    } else {
      const npmResult = await fetchPackageFromNpm(finalName, finalVersion);
      if (npmResult) {
        resolvedPackageJson = npmResult.packageJson;
        standaloneCost = npmResult.standaloneCost;
      } else {
        // Not found on npm - treat as no dependencies and zero size
        standaloneCost = 0;
        resolvedPackageJson = { dependencies: {} };
      }
    }
  }

  const dependencies = getDependenciesFromPackageJson(resolvedPackageJson);
  let totalCost = standaloneCost;

  for (const [depName, depVersion] of Object.entries(dependencies)) {
    // Dependencies always resolved from npm, no local attempts
    await resolvePackageAndCalculateCosts(db_connection, visited, stack, null, depName, depVersion, false);
    const depKey = `${depName}@${depVersion}`;
    totalCost += visited.get(depKey)!.totalCost;
  }

  visited.set(packageKey, { standaloneCost, totalCost });
  stack.delete(packageKey);

  return { packageKey, packageJson: resolvedPackageJson, standaloneCost };
};

const resolvePackageAndCalculateCosts = async (
  db_connection: any,
  visited: Map<string, {standaloneCost: number; totalCost: number}>,
  stack: Set<string>,
  packageId: string | null,
  packageName: string | null,
  packageVersion: string | null,
  isMainPackage: boolean
) => {
  await resolvePackageData(db_connection, visited, stack, packageId, packageName, packageVersion, isMainPackage);
};

// Main handler function
export const packageCostHandler = async (packageId: string, includeDependencies: boolean = false) => {
  try {
    if (!packageId) {
      return {
        statusCode: 400,
        body: { error: 'Missing field(s) in PackageID' }
      };
    }

    const db_connection = await dbConnectionPromise;
    if (!db_connection) {
      return {
        statusCode: 500,
        body: { error: 'Database connection failed' }
      };
    }

    // Confirm package existence
    const checkQuery = 'SELECT package_name, package_version FROM packages WHERE id = ?';
    const [checkResult] = await db_connection.execute(checkQuery, [packageId]);

    if (!Array.isArray(checkResult) || checkResult.length === 0) {
      return {
        statusCode: 404,
        body: { error: 'Package does not exist' }
      };
    }

    const mainName = checkResult[0].package_name;
    const mainVersion = checkResult[0].package_version;

    if (!includeDependencies) {
      // Just load locally and return standalone cost
      const localResult = await loadLocalPackage(db_connection, packageId);
      if (!localResult) {
        return {
          statusCode: 404,
          body: { error: 'Package does not exist locally' }
        };
      }
      return {
        statusCode: 200,
        body: {
          [packageId]: {
            totalCost: localResult.standaloneCost
          }
        }
      };
    }

    // With dependencies
    const visited = new Map<string, {standaloneCost: number; totalCost: number}>();
    const stack = new Set<string>();

    await resolvePackageAndCalculateCosts(db_connection, visited, stack, packageId, mainName, mainVersion, true);

    const mainKey = `${mainName}@${mainVersion}`;
    const mainResult = visited.get(mainKey);
    if (!mainResult) {
      return {
        statusCode: 500,
        body: { error: 'Could not resolve main package costs' }
      };
    }

    const finalOutput: Record<string, {standaloneCost?: number; totalCost: number}> = {};

    for (const [key, val] of visited) {
      let outputKey = key;
      const { standaloneCost, totalCost } = val;
      if (key === mainKey) {
        outputKey = packageId;
      }
      finalOutput[outputKey] = { totalCost, standaloneCost };
    }

    return {
      statusCode: 200,
      body: finalOutput
    };

  } catch (error: any) {
    console.error('Error in packageCostHandler:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' }
    };
  }
};


router.get('/package/:id/cost', async (req: Request, res: Response) => {
  try {
    const packageId = req.params.id;
    const includeDependencies = req.query.dependency === 'true';
    console.log('Calculating cost for package:', packageId, 'with dependencies:', includeDependencies);
    
    const response = await packageCostHandler(packageId, includeDependencies);
    res.status(response.statusCode).send(response.body);
  } catch (error) {
    console.error('Error in GET /package/:id/cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
