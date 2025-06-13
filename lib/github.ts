interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  assignee: any;
  labels: any[];
  created_at: string;
  updated_at: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  head: { ref: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
}

export class GitHubIntegration {
  private static baseUrl = 'https://api.github.com';

  static async getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user/repos?sort=updated&per_page=10`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch repositories');
      return await response.json();
    } catch (error) {
      console.error('GitHub repos error:', error);
      return [];
    }
  }

  static async getRepoIssues(accessToken: string, owner: string, repo: string): Promise<GitHubIssue[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues?state=all&per_page=20`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch issues');
      return await response.json();
    } catch (error) {
      console.error('GitHub issues error:', error);
      return [];
    }
  }

  static async createIssue(
    accessToken: string,
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<GitHubIssue | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          labels: labels || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to create issue');
      return await response.json();
    } catch (error) {
      console.error('GitHub create issue error:', error);
      return null;
    }
  }

  static async getPullRequests(accessToken: string, owner: string, repo: string): Promise<GitHubPullRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/pulls?state=all&per_page=10`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pull requests');
      return await response.json();
    } catch (error) {
      console.error('GitHub PRs error:', error);
      return [];
    }
  }

  static async getCommits(accessToken: string, owner: string, repo: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=10`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch commits');
      return await response.json();
    } catch (error) {
      console.error('GitHub commits error:', error);
      return [];
    }
  }

  static async createBranch(
    accessToken: string,
    owner: string,
    repo: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<boolean> {
    try {
      // Get the SHA of the base branch
      const baseResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!baseResponse.ok) throw new Error('Failed to get base branch');
      const baseData = await baseResponse.json();

      // Create new branch
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseData.object.sha,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('GitHub create branch error:', error);
      return false;
    }
  }
}