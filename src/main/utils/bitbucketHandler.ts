import axios from 'axios';
import Store from 'electron-store';

const store = new Store();

import { getGitRemoteInfo } from './gitHandler';

export function getAuthHeaders() {
  const email = (store.get('bitbucketUser') as string || '').trim();
  const token = (store.get('bitbucketToken') as string || '').trim();

  if (!email || !token) return null;

  // Se o token já começa com ATATT ou é muito longo, pode ser um App Password puro.
  // O Bitbucket SEMPRE quer base64(email:token) para Basic Auth.
  const authHeader = token.startsWith('Bearer ') 
    ? token 
    : `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

  console.log('--- [wOs AUTH DEBUG] ---');
  console.log('Email:', email);
  console.log('Token (primeiros 5 chars):', token.substring(0, 5));
  console.log('AuthHeader (primeiros 15 chars):', authHeader.substring(0, 15));
  console.log('-------------------------------');

  return {
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'wOs-Premium-Agent-v2'
  };
}

export async function getBitBucketPRs(repoPaths: string[], state: string = 'ALL', limit: number = 10) {
  const headers = getAuthHeaders();
  if (!headers) {
    return { success: false, error: 'Configuração do BitBucket incompleta (E-mail ou Token ausentes).' };
  }

  const allPRs: any[] = [];
  const errors: string[] = [];
  
  // Normalizar states para suportar consulta múltipla robusta no Bitbucket API v2
  let statesToFetch = ['OPEN', 'MERGED', 'DECLINED'];
  if (state !== 'ALL') {
    statesToFetch = state.split(',').map(s => s.trim().toUpperCase());
  }
  
  const stateParams = statesToFetch.map(s => `state=${s}`).join('&');
  
  for (const path of repoPaths) {
    try {
      const remoteInfo = await getGitRemoteInfo(path);
      if (!remoteInfo) {
        console.warn(`[BitBucket] Não foi possível detectar remote BitBucket para ${path}`);
        continue;
      }

      const { workspace, repo } = remoteInfo;
      const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/pullrequests?${stateParams}&sort=-created_on&pagelen=${limit}`;
      
      const response = await axios.get(url, {
        headers,
        timeout: 15000
      });

      const prs = response.data.values.map((pr: any) => ({
        repo: repo,
        fullPath: path,
        name: pr.source?.branch?.name || 'unknown-branch',
        sourceBranch: pr.source?.branch?.name,
        destinationBranch: pr.destination?.branch?.name,
        title: pr.title,
        id: pr.id,
        author: pr.author?.display_name || 'Unknown',
        authorAvatar: pr.author?.links?.avatar?.href || pr.author?.avatar?.href || '',
        date: pr.created_on,
        link: pr.links?.html?.href,
        links: pr.links,
        status: pr.state,
        comment_count: pr.comment_count || 0,
        task_count: pr.task_count || 0,
        draft: pr.draft || false,
        isRealPR: true
      }));

      allPRs.push(...prs);
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error?.message;
      const slug = path.split(/[\\/]/).pop();
      const msg = `Repo ${slug}: ${status || 'Error'} - ${apiMsg || err.message}`;
      console.error(`[BitBucket Error] ${msg}`);
      errors.push(msg);
    }
  }

  return { 
    success: true, 
    prs: allPRs, 
    apiErrors: errors.length > 0 ? errors : undefined 
  };
}

export async function getBitBucketDiff(diffUrl: string) {
  const headers = getAuthHeaders();
  if (!headers) return null;

  try {
    const response = await axios.get(diffUrl, {
      headers: {
        ...headers,
        'Accept': 'text/plain'
      },
      timeout: 20000
    });
    return response.data;
  } catch (err: any) {
    console.error(`[BitBucket Diff Error] ${err.message}`);
    return null;
  }
}

export async function actionBitBucketPR(repoPath: string, prId: number, action: 'approve' | 'unapprove' | 'request-changes' | 'unrequest-changes' | 'decline' | 'merge') {
  const headers = getAuthHeaders();
  if (!headers) return { success: false, error: 'Credenciais ausentes' };

  const remoteInfo = await getGitRemoteInfo(repoPath);
  if (!remoteInfo) return { success: false, error: 'Remote não detectado' };

  const { workspace, repo } = remoteInfo;
  
  let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/pullrequests/${prId}`;
  let method: 'post' | 'delete' = 'post' as any;

  if (action === 'approve') url += '/approve';
  else if (action === 'unapprove') { url += '/approve'; method = 'delete' as any; }
  else if (action === 'request-changes') url += '/request-changes';
  else if (action === 'unrequest-changes') { url += '/request-changes'; method = 'delete' as any; }
  else if (action === 'decline') url += '/decline';
  else if (action === 'merge') url += '/merge';

  try {
    const data: any = {};
    if (action === 'merge') {
      data.message = `Merged by wOs AI Control Center - PR #${prId}`;
      data.close_source_branch = false;
      data.merge_strategy = 'merge_commit';
    }

    await axios({
      method: action === 'merge' ? 'post' : method,
      url,
      headers,
      data: action === 'merge' ? data : undefined
    });
    return { success: true };
  } catch (err: any) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error(`[BitBucket Action Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

export const getBitBucketPRDiffstat = async (url?: string, workspace?: string, repo?: string, prId?: number): Promise<any[]> => {
  const headers = getAuthHeaders();
  if (!headers) return [];

  const targetUrl = url || `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/pullrequests/${prId}/diffstat`;

  console.log(`🚀 [API CALL] Buscando Diffstat em: ${targetUrl}`);

  try {
    const response = await axios.get(targetUrl, { headers });
    console.log(`✅ [API SUCCESS] Diffstat recebido para ${targetUrl}`);

    return (response.data.values || []).map((item: any) => ({
      path: item.new?.path || item.old?.path,
      additions: item.lines_added || 0,
      deletions: item.lines_removed || 0,
      status: item.status
    }));
  } catch (error: any) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[BitBucket Diffstat Error] Status: ${status}`, data);
    return [];
  }
};


export async function getBitBucketCommits(repoPaths: string[], limit: number = 10) {
  const headers = getAuthHeaders();
  if (!headers) {
    return { success: false, error: 'Configuração do BitBucket incompleta.' };
  }

  const allCommits: any[] = [];
  const errors: string[] = [];

  for (const path of repoPaths) {
    try {
      const remoteInfo = await getGitRemoteInfo(path);
      if (!remoteInfo) continue;

      const { workspace, repo } = remoteInfo;
      const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/commits?pagelen=${limit}`;

      const response = await axios.get(url, { headers, timeout: 15000 });

      const commits = response.data.values.map((c: any) => ({
        repo: repo,
        hash: c.hash.substring(0, 7),
        author: c.author?.display_name || c.author?.raw || 'Unknown',
        date: c.date,
        message: c.message.split('\n')[0],
        link: c.links?.html?.href
      }));

      allCommits.push({
        repo: repo,
        commits: commits
      });
    } catch (err: any) {
      errors.push(`${path}: ${err.message}`);
    }
  }

  return { success: true, data: allCommits, errors };
}

export async function getBitBucketCommitDetails(repoPath: string, commitHash: string = 'HEAD', alternativePaths: string[] = []) {
  const headers = getAuthHeaders();
  if (!headers) return { success: false, error: 'Credenciais ausentes' };

  const pathsToTry = [repoPath, ...alternativePaths.filter(p => p !== repoPath)];
  let lastError = 'Remote não detectado';

  for (const path of pathsToTry) {
    const remoteInfo = await getGitRemoteInfo(path);
    if (!remoteInfo) continue;

    const { workspace, repo } = remoteInfo;
    
    try {
      const commitUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/commit/${commitHash}`;
      const commitResponse = await axios.get(commitUrl, { headers, timeout: 15000 });
      const c = commitResponse.data;

      const diffstatUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/diffstat/${commitHash}`;
      const diffstatResponse = await axios.get(diffstatUrl, { headers, timeout: 15000 });
      const files = (diffstatResponse.data.values || []).map((item: any) => ({
        path: item.new?.path || item.old?.path,
        additions: item.lines_added || 0,
        deletions: item.lines_removed || 0,
        status: item.status
      }));

      return {
        success: true,
        commit: {
          hash: c.hash.substring(0, 7),
          fullHash: c.hash,
          author: c.author?.display_name || c.author?.raw || 'Unknown',
          date: c.date,
          message: c.message,
          files: files,
          repo: repo
        }
      };
    } catch (err: any) {
      lastError = err.response?.data?.error?.message || err.message;
      if (commitHash === 'HEAD') {
        break;
      }
    }
  }

  return { success: false, error: lastError };
}
