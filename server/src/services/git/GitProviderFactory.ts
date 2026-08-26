import { IGitProvider } from './GitProvider';
import { GitHubProvider } from './GitHubProvider';
import { GitLabProvider } from './GitLabProvider';
import { BitbucketProvider } from './BitbucketProvider';

export class GitProviderFactory {
  private static github = new GitHubProvider();
  private static gitlab = new GitLabProvider();
  private static bitbucket = new BitbucketProvider();

  public static getProvider(providerOrUrl: string): IGitProvider {
    const lower = (providerOrUrl || '').toLowerCase();
    if (lower.includes('gitlab')) return this.gitlab;
    if (lower.includes('bitbucket')) return this.bitbucket;
    return this.github; // default to GitHub
  }

  public static parseRepoUrl(url: string): {
    provider: 'github' | 'gitlab' | 'bitbucket';
    owner: string;
    repo: string;
    cleanUrl: string;
  } {
    if (!url) throw new Error('Repository URL is required');

    let clean = url.trim();
    let provider: 'github' | 'gitlab' | 'bitbucket' = 'github';

    if (clean.includes('gitlab.com')) provider = 'gitlab';
    else if (clean.includes('bitbucket.org')) provider = 'bitbucket';

    // Handle SSH format git@github.com:owner/repo.git
    if (clean.startsWith('git@')) {
      const match = clean.match(/git@[^:]+:([^/]+)\/(.+?)(\.git)?$/);
      if (match) {
        return {
          provider,
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
          cleanUrl: `https://${provider === 'github' ? 'github.com' : provider === 'gitlab' ? 'gitlab.com' : 'bitbucket.org'}/${match[1]}/${match[2].replace(/\.git$/, '')}`,
        };
      }
    }

    // Handle standard HTTPS https://github.com/owner/repo(.git)?
    try {
      const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, '');
        return {
          provider,
          owner,
          repo,
          cleanUrl: `https://${parsed.host}/${owner}/${repo}`,
        };
      }
    } catch (e) {
      // ignore
    }

    // Fallback: owner/repo
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 2) {
      return {
        provider: 'github',
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, ''),
        cleanUrl: `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/, '')}`,
      };
    }

    throw new Error(`Invalid Git repository format "${url}". Expected format: https://github.com/owner/repository`);
  }
}
