export const EXTENDED_TOOLS = [
  {
    name: 'searchInFile',
    description: 'Searches for a text pattern or regex inside a specific file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        pattern: { type: 'string', description: 'The text or regex pattern to search for.' },
        isRegex: { type: 'boolean', description: 'Whether to treat the pattern as a regular expression (default: false).', default: false },
        caseSensitive: { type: 'boolean', description: 'Whether the search should be case sensitive (default: true).', default: true }
      },
      required: ['path', 'pattern']
    }
  },
  {
    name: 'searchInProject',
    description: 'Searches for a text pattern or regex across files in a project directory.',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'The root directory of the search.' },
        pattern: { type: 'string', description: 'The text or regex pattern to search for.' },
        isRegex: { type: 'boolean', description: 'Whether to treat the pattern as a regular expression (default: false).', default: false },
        fileExtensions: { type: 'array', items: { type: 'string' }, description: 'Optional list of file extensions to filter by (e.g. [".js", ".ts"]).' },
        excludeDirs: { type: 'array', items: { type: 'string' }, description: 'Optional list of directories to exclude (e.g. ["node_modules"]).' }
      },
      required: ['directory', 'pattern']
    }
  },
  {
    name: 'getFileLines',
    description: 'Reads specific lines from a file (inclusive, 1-based index).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        startLine: { type: 'number', description: 'The starting line number (1-based).' },
        endLine: { type: 'number', description: 'The ending line number (inclusive).' }
      },
      required: ['path', 'startLine', 'endLine']
    }
  },
  {
    name: 'replaceInFile',
    description: 'Replaces occurrences of text or regex in a file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        search: { type: 'string', description: 'The text or regex to search for replacement.' },
        replace: { type: 'string', description: 'The replacement text.' },
        isRegex: { type: 'boolean', description: 'Whether the search pattern is a regex (default: false).', default: false },
        replaceAll: { type: 'boolean', description: 'Whether to replace all occurrences or just the first one (default: true).', default: true }
      },
      required: ['path', 'search', 'replace']
    }
  },
  {
    name: 'replaceLineInFile',
    description: 'Replaces a specific line in a file with new content (1-based index).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        lineNumber: { type: 'number', description: 'The line number to replace (1-based).' },
        newContent: { type: 'string', description: 'The new content of the line.' }
      },
      required: ['path', 'lineNumber', 'newContent']
    }
  },
  {
    name: 'insertLineInFile',
    description: 'Inserts a line of content BEFORE a specific line number (1-based index).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        lineNumber: { type: 'number', description: 'The line number before which to insert the content.' },
        content: { type: 'string', description: 'The content to insert.' }
      },
      required: ['path', 'lineNumber', 'content']
    }
  },
  {
    name: 'deleteLineInFile',
    description: 'Deletes a single line or a range of lines from a file (1-based index).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        startLine: { type: 'number', description: 'The start line number to delete (1-based).' },
        endLine: { type: 'number', description: 'The end line number to delete (inclusive, optional. If omitted, only deletes startLine).' }
      },
      required: ['path', 'startLine']
    }
  },
  {
    name: 'appendToFile',
    description: 'Appends content to the end of a file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file.' },
        content: { type: 'string', description: 'The content to append.' },
        newLine: { type: 'boolean', description: 'Whether to add a newline (\\n) before the content (default: true).', default: true }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'getFileInfo',
    description: 'Returns metadata and stats of a file or directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the file or directory.' }
      },
      required: ['path']
    }
  },
  {
    name: 'moveFile',
    description: 'Moves or renames a file to a new destination.',
    parameters: {
      type: 'object',
      properties: {
        sourcePath: { type: 'string', description: 'The source file path.' },
        destinationPath: { type: 'string', description: 'The destination file path.' },
        overwrite: { type: 'boolean', description: 'Whether to overwrite destination if it exists (default: false).', default: false }
      },
      required: ['sourcePath', 'destinationPath']
    }
  },
  {
    name: 'copyFile',
    description: 'Copies a file to a new destination.',
    parameters: {
      type: 'object',
      properties: {
        sourcePath: { type: 'string', description: 'The source file path.' },
        destinationPath: { type: 'string', description: 'The destination file path.' },
        overwrite: { type: 'boolean', description: 'Whether to overwrite destination if it exists (default: false).', default: false }
      },
      required: ['sourcePath', 'destinationPath']
    }
  },
  {
    name: 'createDirectory',
    description: 'Creates a directory at the specified path.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the directory.' },
        recursive: { type: 'boolean', description: 'Whether to create parent directories if they do not exist (default: true).', default: true }
      },
      required: ['path']
    }
  }
];
