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
  // 新协议兼容：kind/type
  const kind = (part as any).kind || (part as any).type;
  if (kind === 'text') {
    const fileName = name || '';
    const language = getLanguageFromFileName(fileName);
    const components: Partial<Components> = {
      pre: ({ children, ...props }) => <pre className="p-0 m-0" {...props}>{children}</pre>,
      code: ({ children, ...props }) => (
        <code className={`hljs language-${language}`} {...props}>{children}</code>
      ),
    };
    // 检查是否包含错误信息（如 429 Too Many Requests）
    const errorMatch = (part as any).text.match?.(/\[(\d+)\s+([^\]]+)\]/);
    if (errorMatch) {
      const statusCode = errorMatch[1];
      const statusText = errorMatch[2];
      return (
        <div className="markdown-body">
          <div className="text-red-600 font-medium mb-1">
            服务器错误: {statusCode} {statusText}
          </div>
          <div>{(part as any).text}</div>
        </div>
      );
    }
    return (
      <div className="markdown-body bg-transparent">
        <ReactMarkdown
          components={components}
          rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
          remarkPlugins={[remarkGfm]}
        >
          {(part as any).text}
        </ReactMarkdown>
      </div>
    );
  }
  if (kind === 'data') {
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
            {'```json\n' + JSON.stringify((part as any).data, null, 2) + '\n```'}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  if (kind === 'file') {
    const file = (part as any).file;
    // bytes: base64 图片
    if (file && file.bytes) {
      // 尝试推断 mimeType，否则默认 image/png
      const mimeType = file.mimeType || 'image/png';
      const src = `data:${mimeType};base64,${file.bytes}`;
      console.log('图片base64 src:', src);

      return (
        <div className="flex flex-col items-start space-y-2 p-2 bg-gray-50 rounded-lg">
          <img src={src} alt  ={file.name || '图片'} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8 }} />
          <div className="text-xs text-gray-500">{file.name || '图片'} ({mimeType})</div>
        </div>
      );
    }
    // uri: 普通下载/跳转链接
    if (file && file.uri) {
      return (
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <a href={file.uri} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
            {file.name || 'File'}
          </a>
        </div>
      );
    }
    // 兜底
    return <div className="text-gray-400 text-xs">未知文件类型</div>;
  }
  return null;
};

export default ArtifactViewer;