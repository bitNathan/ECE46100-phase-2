// dependency_parser.ts
import axios, { AxiosError } from 'axios';

export interface Dependency {
  name: string;
  version: string;
}

interface GitHubFileResponse {
  content: string;
  encoding: string;
}

interface PackageJson {
  dependencies?: Record<string, unknown>;
}

const isDependency = (entry: [string, unknown]): entry is [string, string] => {
  return typeof entry[1] === 'string';
};

export const getDependencies = async (owner: string, repo: string): Promise<Dependency[]> => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
  
  try {
    // Fetch package.json content
    const response = await axios.get<GitHubFileResponse>(apiUrl);
    
    // Decode base64 content
    const packageJsonContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    // Parse JSON
    let packageJson: PackageJson;
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (parseError) {
      console.error('Error parsing package.json:', parseError instanceof Error ? parseError.message : 'Unknown error');
      return [];
    }
    
    // Extract dependencies
    if (!packageJson.dependencies) {
      return [];
    }
    
    // Convert dependencies to array and filter invalid entries
    return Object.entries(packageJson.dependencies)
      .filter(isDependency)
      .map(([name, version]) => ({
        name,
        version: version.trim()
      }));
      
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(
        `Failed to fetch package.json for ${owner}/${repo}: ${axiosError.message}`,
        axiosError.response?.status ? `Status: ${axiosError.response.status}` : ''
      );
    } else if (error instanceof Error) {
      console.error(`Error processing dependencies for ${owner}/${repo}: ${error.message}`);
    } else {
      console.error(`Unexpected error while fetching dependencies for ${owner}/${repo}`);
    }
    return [];
  }
};