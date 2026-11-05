import axios from 'axios';
import { getAuthHeaders } from './bitbucketHandler';
import { getGitRemoteInfo } from './gitHandler';

/**
 * Consulta o status e histórico recente dos Pipelines de build (esteiras) do Bitbucket.
 */
export async function getBitBucketPipelines(repoPaths: string[], limit: number = 5) {
  const headers = getAuthHeaders();
  if (!headers) {
    return { success: false, error: 'Configuração do BitBucket incompleta (E-mail ou Token ausentes).' };
  }

  const allPipelines: any[] = [];
  const errors: string[] = [];

  for (const path of repoPaths) {
    try {
      const remoteInfo = await getGitRemoteInfo(path);
      if (!remoteInfo) continue;

      const { workspace, repo } = remoteInfo;
      const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/pipelines?sort=-created_on&pagelen=${limit}`;

      const response = await axios.get(url, { headers, timeout: 15000 });

      const pipelines = (response.data.values || []).map((p: any) => ({
        repo: repo,
        buildNumber: p.build_number,
        creator: p.creator?.display_name || 'Sistema/Trigger',
        state: p.state?.name || 'UNKNOWN',
        result: p.state?.result?.name || 'PENDING',
        createdOn: p.created_on,
        duration: p.duration_in_seconds || 0,
        commitHash: p.target?.commit?.hash?.substring(0, 7) || 'unknown',
        targetBranch: p.target?.selector?.pattern || p.target?.ref_name || 'unknown'
      }));

      allPipelines.push({
        repo: repo,
        pipelines: pipelines
      });
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error?.message;
      const slug = path.split(/[\\/]/).pop();
      const msg = `Repo ${slug}: ${status || 'Error'} - ${apiMsg || err.message}`;
      console.error(`[BitBucket Pipelines Error] ${msg}`);
      errors.push(msg);
    }
  }

  return { success: true, data: allPipelines, errors };
}
