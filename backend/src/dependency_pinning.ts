import { getDependencies } from './dependency_parser';

export const calculateDependencyPinning = async (owner: string, repo: string): Promise<[number, number]> => {
  const start = Date.now();
  try {
    const dependencies = await getDependencies(owner, repo);
    
    // If no dependencies, return 1.0 as per spec
    if (dependencies.length === 0) {
      const latency = (Date.now() - start) / 1000;
      return [1.0, latency];
    }

    // Count dependencies pinned to specific major+minor version
    const pinnedDependencies = dependencies.filter(dep => {
      const version = dep.version;
      const cleanVersion = version.replace(/^[^0-9]*/, '');
      return /^\d+\.\d+(\.\d+)?$/.test(cleanVersion) &&
             !version.includes('^') &&
             !version.includes('~') &&
             !version.endsWith('x') &&
             !version.endsWith('*');
    });

    const score = pinnedDependencies.length / dependencies.length;
    const latency = (Date.now() - start) / 1000;
    return [score, latency];
  } catch (error) {
    const latency = (Date.now() - start) / 1000;
    return [-1, latency];
  }
};