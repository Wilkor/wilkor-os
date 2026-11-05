import axios from 'axios';
import { getGitRemoteInfo } from './gitHandler';
import { getAuthHeaders } from './bitbucketHandler';

/**
 * Adiciona um comentário em um Pull Request específico do Bitbucket.
 */
export async function addBitBucketPRComment(repoPath: string, prId: string, text: string) {
  const remoteInfo = await getGitRemoteInfo(repoPath);
  if (!remoteInfo) return { success: false, error: 'Remote info not found.' };

  const headers: any = getAuthHeaders();
  if (!headers) return { success: false, error: 'Bitbucket credentials not found.' };

  const url = `https://api.bitbucket.org/2.0/repositories/${remoteInfo.workspace}/${remoteInfo.repo}/pullrequests/${prId}/comments`;

  try {
    console.log(`📡 [API POST] Enviando comentário para PR #${prId}...`);
    await axios.post(url, { content: { raw: text } }, { headers });
    console.log(`✅ [API SUCCESS] Comentário postado no PR.`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [API ERROR] Erro ao adicionar comentário no PR:', err.response?.data || err.message);
    const errorMsg = err.response?.data?.error?.message || err.message;
    return { success: false, error: errorMsg };
  }
}

/**
 * Adiciona um comentário em um Commit específico do Bitbucket.
 */
export async function addBitBucketCommitComment(repoPath: string, commitHash: string, text: string, alternativePaths: string[] = []) {
  const headers: any = getAuthHeaders();
  if (!headers) return { success: false, error: 'Bitbucket credentials not found.' };

  const pathsToTry = [repoPath, ...alternativePaths.filter(p => p !== repoPath)];
  let lastError = 'Remote info not found.';

  for (const path of pathsToTry) {
    const remoteInfo = await getGitRemoteInfo(path);
    if (!remoteInfo) continue;

    const url = `https://api.bitbucket.org/2.0/repositories/${remoteInfo.workspace}/${remoteInfo.repo}/commit/${commitHash}/comments`;

    try {
      console.log(`📡 [API POST] Enviando comentário para commit ${commitHash} em ${remoteInfo.repo}...`);
      await axios.post(url, { content: { raw: text } }, { headers });
      console.log(`✅ [API SUCCESS] Comentário postado no commit.`);
      return { success: true };
    } catch (err: any) {
      lastError = err.response?.data?.error?.message || err.message;
    }
  }

  return { success: false, error: lastError };
}
