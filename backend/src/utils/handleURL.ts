import axios from 'axios';
import { c } from 'tar';

export const getGithubRepoFromNpm = async (packageName: string): Promise<string | null> => {
    try {
      // Fetch package metadata from npm Registry
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      const data = response.data;
  
      // Extract repository URL from metadata
      const repository = data.repository;
      if (repository && repository.type === 'git') {
        // Return the GitHub repository URL if it's a git repository
        return repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
      }
  
      // Repository URL is not available or it's not a GitHub URL
      return null;
    } catch (error) {
      console.log(`Error fetching data for package ${packageName}: ${error}`);
      return null;
    }
  }

export const resolveURL = async (url: string): Promise<string> => {

    if (url.includes("npmjs.com")) {
      const packageName = url.split('/').pop();
      if (!packageName) {
        return url;
      }
      const githubRepo = await getGithubRepoFromNpm(packageName);

      if (githubRepo) {
        return githubRepo;
      } else {
        return url;
      }
    }
    return url;
}

export const getOwnerAndRepoFromURL = async (URL: string): Promise<{ owner: string, repo: string }> => {
    const urlParts = URL.split('/');
    return { owner: urlParts[3], repo: urlParts[4] };
}

export const extractNameAndVersionFromURL = async (URL: string): Promise<{ extractedName: string | null, extractedVersion: string | null }> => {
    console.log(URL);
    const resolvedURL = await resolveURL(URL);
    console.log(resolvedURL);
    const {owner, repo} = await getOwnerAndRepoFromURL(resolvedURL);
    console.log(owner);
    console.log(repo);
    try {
        // GitHub API URL for raw package.json content
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            // Try 'master' branch if 'main' fails
            const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/package.json`;
            const masterResponse = await fetch(masterUrl);
            
            if (!masterResponse.ok) {
                throw new Error(`Failed to fetch package.json. Status: ${response.status}`);
            }
            
            const data = await masterResponse.json();
            return {extractedName: data.name, extractedVersion: data.version};
        }
        
        const data = await response.json();
        return {extractedName: data.name, extractedVersion: data.version};
    } catch (error) {
        throw new Error(`Error fetching package info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
