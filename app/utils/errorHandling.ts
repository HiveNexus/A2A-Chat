import { 
  ErrorCodeParseError,
  ErrorCodeInvalidRequest,
  ErrorCodeMethodNotFound,
  ErrorCodeInvalidParams,
  ErrorCodeInternalError,
  ErrorCodeTaskNotFound,
  ErrorCodeTaskNotCancelable,
  ErrorCodePushNotificationNotSupported,
  ErrorCodeUnsupportedOperation
} from '@/types/a2a_old';

/**
 * Maps error codes to user-friendly error messages
 */
export const errorMessages: Record<number, string> = {
  [ErrorCodeParseError]: '服务器无法解析请求数据',
  [ErrorCodeInvalidRequest]: '无效的请求格式',
  [ErrorCodeMethodNotFound]: '请求的方法不存在',
  [ErrorCodeInvalidParams]: '无效的请求参数',
  [ErrorCodeInternalError]: '服务器内部错误',
  [ErrorCodeTaskNotFound]: '找不到指定的任务',
  [ErrorCodeTaskNotCancelable]: '无法取消当前任务',
  [ErrorCodePushNotificationNotSupported]: '不支持推送通知',
  [ErrorCodeUnsupportedOperation]: '不支持的操作',
};

/**
 * Gets a user-friendly error message based on error code or message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle RpcError with code and message
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const rpcErr = error as { code: number; message: string; data?: any };
    // Return mapped error message if available, otherwise use the original message
    return errorMessages[rpcErr.code] || rpcErr.message;
  } 
  
  // Handle regular Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Default error message
  return '发送消息失败';
}
