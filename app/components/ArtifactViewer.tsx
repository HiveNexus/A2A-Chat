import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Part } from '@/types/a2a';
import 'github-markdown-css/github-markdown-light.css';
import 'highlight.js/styles/github.css';
import type { Components } from 'react-markdown';

interface ArtifactViewerProps {
  part: Part;
  name?: string;
}

const getLanguageFromFileName = (fileName: string = ''): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'py': 'python',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
  };

  return languageMap[extension || ''] || 'plaintext';
};

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ part, name }) => {
  if (part.type === 'text') {
    const fileName = name || '';
    const language = getLanguageFromFileName(fileName);
    const components: Partial<Components> = {
      pre: ({ children, ...props }) => <pre className="p-0 m-0" {...props}>{children}</pre>,
      code: ({ children, ...props }) => (
        <code className={`hljs language-${language}`} {...props}>{children}</code>
      ),
    };

    // 检查是否包含错误信息（如 429 Too Many Requests）
    const errorMatch = part.text.match(/\[(\d+)\s+([^\]]+)\]/);
    if (errorMatch) {
      const statusCode = errorMatch[1];
      const statusText = errorMatch[2];
      return (
        <div className="markdown-body">
          <div className="text-red-600 font-medium mb-1">
            服务器错误: {statusCode} {statusText}
          </div>
          <div>{part.text}</div>
        </div>
      );
    }

    // 统一用 Markdown 渲染
    return (
      <div className="markdown-body bg-transparent">
        <ReactMarkdown
          components={components}
          rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
          remarkPlugins={[remarkGfm]}
        >
          {part.text}
        </ReactMarkdown>
      </div>
    );
  }

  if (part.type === 'data') {
    const components: Partial<Components> = {
      pre: ({ children, ...props }) => <pre className="p-0 m-0" {...props}>{children}</pre>,
      code: ({ children, ...props }) => (
        <code className="hljs language-json" {...props}>{children}</code>
      ),
    };

    return (
      <div className="rounded-lg border border-gray-200">
        <div className="bg-gray-100 rounded-t-lg text-gray-700 px-4 py-2 text-sm border-b  border-gray-200">
          JSON Data
        </div>
          <div className="markdown-body bg-transparent">
            <ReactMarkdown
              components={components}
              rehypePlugins={[[rehypeHighlight, { detect: true }]]}
            >
              {'```json\n' + JSON.stringify(part.data, null, 2) + '\n```'}
            </ReactMarkdown>
          </div>
      </div>
    );
  }

  if (part.type === 'file') {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <a href={part.file.uri || '#'} className="text-blue-500 hover:underline">
          {part.file.name || 'File'}
        </a>
      </div>
    );
  }

  return null;
};

export default ArtifactViewer;