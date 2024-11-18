import db from './connection';

interface PackageMetadata {
  id: string;
  name: string;
  version: string;
  upload_type: string;
  dependencies?: string;
  code_review_status?: string;
  created_at: Date;
  updated_at: Date;
}

interface PackageRating {
  score: number;
  metrics: {
    dependencyPinning: number;
    codeReview: number;
  };
}

export const packageRateHandler = async (id: string, authToken: string): Promise<any> => {
  if (!id) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Missing field(s) in PackageID' }) 
    };
  }

  if (!authToken) {
    return { 
      statusCode: 403, 
      body: JSON.stringify({ error: 'Authentication failed due to invalid or missing AuthenticationToken' }) 
    };
  }

  try {
    // Query detailed package metadata
    const [rows] = await db.promise().query(
      `SELECT 
        p.*, 
        GROUP_CONCAT(d.dependency_name, ':', d.version) as dependencies,
        cr.status as code_review_status
       FROM PackageMetadata p
       LEFT JOIN PackageDependencies d ON p.id = d.package_id
       LEFT JOIN CodeReviews cr ON p.id = cr.package_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );

    if (!Array.isArray(rows)) {
      throw new Error('Invalid database response format');
    }

    if (rows.length === 0) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Package does not exist' }) 
      };
    }

    const packageData = rows[0] as PackageMetadata;
    const rating = computePackageRating(packageData);

    if (!rating) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'The package rating system choked on at least one of the metrics' }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ rating }) 
    };

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal Server Error' }) 
    };
  }
};

function computePackageRating(packageData: PackageMetadata): PackageRating | null {
  try {
    // Compute dependency pinning score
    let dependencyPinning = 1.0;
    if (packageData.dependencies) {
      const deps = packageData.dependencies.split(',');
      const unpinnedDeps = deps.filter(dep => {
        const [_, version] = dep.split(':');
        return version.startsWith('^') || version.startsWith('~') || version === '*';
      });
      dependencyPinning = 1 - (unpinnedDeps.length / deps.length);
    }

    // Compute code review score
    let codeReview = 0.0;
    if (packageData.code_review_status) {
      switch (packageData.code_review_status.toLowerCase()) {
        case 'approved':
          codeReview = 1.0;
          break;
        case 'pending_changes':
          codeReview = 0.5;
          break;
        case 'in_review':
          codeReview = 0.3;
          break;
        default:
          codeReview = 0.0;
      }
    }

    // Compute overall score (weighted average)
    const score = (dependencyPinning * 0.6) + (codeReview * 0.4);

    return {
      score: Number(score.toFixed(2)),
      metrics: {
        dependencyPinning: Number(dependencyPinning.toFixed(2)),
        codeReview: Number(codeReview.toFixed(2)),
      },
    };
  } catch (error) {
    console.error('Error computing rating:', error);
    return null;
  }
}