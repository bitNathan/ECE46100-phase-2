import { getDependencies } from '../dependency_parser';

function isMajorMinorPinned(version: string): boolean {
  // Remove any leading special characters (^, ~, v)
  const cleanVersion = version.replace(/^[^0-9]*/, '');
  
  // Match versions like "2.3" or "2.3.4" but not "2.3.x" or "~2.3.4"
  const majorMinorRegex = /^\d+\.\d+(\.\d+)?$/;
  
  return majorMinorRegex.test(cleanVersion) && 
         !version.includes('^') && 
         !version.includes('~') && 
         !version.endsWith('x') && 
         !version.endsWith('*');
}

export async function getPinnedDependencies(owner: string, repo: string): Promise<[number, number]> {
  const start = performance.now();
  
  const dependencies = await getDependencies(owner, repo);
  
  // If no dependencies, rating = 1.0
  let score = 1.0;
  
  if (dependencies.length > 0) {
    // Count dependencies pinned to major+minor
    const pinnedDeps = dependencies.filter(dep => isMajorMinorPinned(dep.version));
    score = pinnedDeps.length / dependencies.length;
  }

  const latency = (performance.now() - start)/1000;

  return [score, latency];
}
