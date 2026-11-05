import { getRoots } from '../utils/fs';
import { getBitBucketPRs, getBitBucketCommits, getBitBucketCommitDetails } from '../utils/bitbucketHandler';
import { addBitBucketPRComment, addBitBucketCommitComment } from '../utils/bitbucketCommentsHandler';

export async function executeGitTool(name: string, args: any, signal?: AbortSignal): Promise<string> {
  if (signal) {
    void signal.aborted;
  }

  switch (name) {
    case 'getBitbucketPRs': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const state = args.state || 'ALL';
      const limit = args.limit || 15;
      const result = await getBitBucketPRs(repoPaths, state, limit);
      if (result.success && result.prs) {
        if (result.prs.length === 0) return `Nenhum PR com estado "${state}" encontrado no Bitbucket.`;
        return JSON.stringify(result.prs.map((pr: any) => ({
          id: pr.id,
          title: pr.title,
          author: pr.author,
          repo: pr.repo,
          source: pr.sourceBranch,
          destination: pr.destinationBranch,
          link: pr.link,
          date: pr.date,
          status: pr.status
        })), null, 2);
      }
      return `Erro ao buscar PRs: ${result.error}`;
    }

    case 'getBitbucketCommits': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const limit = args.limit || 10;
      
      const result = await getBitBucketCommits(repoPaths, limit);
      if (result.success) {
        return JSON.stringify(result.data, null, 2);
      }
      return `Erro ao buscar commits: ${result.error}`;
    }

    case 'getBitbucketCommitDetails': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      
      const path = args.repoPath || repoPaths[0];
      const hash = args.commitHash || 'HEAD';
      
      const result = await getBitBucketCommitDetails(path, hash, repoPaths);
      if (result.success) {
        return JSON.stringify(result.commit, null, 2);
      }
      return `Erro ao buscar detalhes do commit: ${result.error}`;
    }

    case 'addBitbucketPRComment': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const path = args.repoPath || repoPaths[0];
      if (!args.prId || !args.text) return 'Erro: addBitbucketPRComment requer "prId" e "text".';
      
      const result = await addBitBucketPRComment(path, String(args.prId), args.text);
      if (result.success) {
        return 'Comentário postado com sucesso no PR do Bitbucket. 💬';
      }
      return `Erro ao postar comentário no PR: ${result.error}`;
    }

    case 'addBitbucketCommitComment': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const path = args.repoPath || repoPaths[0];
      if (!args.commitHash || !args.text) return 'Erro: addBitbucketCommitComment requer "commitHash" e "text".';
      
      const result = await addBitBucketCommitComment(path, args.commitHash, args.text, repoPaths);
      if (result.success) {
        return 'Comentário postado com sucesso no commit do Bitbucket. 💬';
      }
      return `Erro ao postar comentário no commit: ${result.error}`;
    }

    case 'generateGitReportPDF': {
      const repoPaths = args.repoPaths || getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const { generateGitReportPDF } = await import('../utils/pdfGenerator');
      const since = args.since || '7 days ago';
      const result = await generateGitReportPDF(since, repoPaths);
      return JSON.stringify({
        success: true,
        filePath: result.filePath,
        totalCommits: result.totalCommits,
        totalPRs: result.totalPRs,
        topCommitter: result.topCommitter
      }, null, 2);
    }

    case 'getBitbucketPipelines': {
      const repoPaths = args.repoPaths || getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const { getBitBucketPipelines } = await import('../utils/bitbucketPipelinesHandler');
      const limit = args.limit || 5;
      const result = await getBitBucketPipelines(repoPaths, limit);
      if (result.success) {
        return JSON.stringify(result.data, null, 2);
      }
      return `Erro ao consultar pipelines do Bitbucket: ${result.error || result.errors?.join('; ')}`;
    }

    case 'getLocalGitCommits':
    case 'getCommitsByPeriod': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      const { getCommitsByPeriod } = await import('../utils/localCommitAuditHandler');
      const period = args.period || 'today';
      const result = await getCommitsByPeriod(repoPaths, period, args.author);
      return JSON.stringify(result, null, 2);
    }

    case 'getLocalCommitDetails': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      if (!args.commitHash) return 'Erro: getLocalCommitDetails requer o parâmetro "commitHash".';
      const { getLocalCommitDetails } = await import('../utils/localCommitAuditHandler');
      const result = await getLocalCommitDetails(repoPaths, args.commitHash, args.repoPath);
      if (!result.found) return result.error || 'Commit não encontrado.';
      return JSON.stringify(result, null, 2);
    }

    case 'auditCommitCode': {
      const repoPaths = getRoots();
      if (repoPaths.length === 0) return 'Nenhum repositório aberto no workspace.';
      if (!args.commitHash) return 'Erro: auditCommitCode requer o parâmetro "commitHash".';
      const { auditCommitCode } = await import('../utils/localCommitAuditHandler');
      const result = await auditCommitCode(repoPaths, args.commitHash, args.repoPath, args.filePath);
      if (!result.found) return result.error || 'Commit não encontrado para auditoria.';
      return JSON.stringify(result, null, 2);
    }

    default:
      return `Erro: Ferramenta Git/Bitbucket "${name}" não implementada no gitToolExecutor.`;
  }
}
