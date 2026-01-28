/**
 * LLM Tools Service
 *
 * LLM Agent가 사용하는 도구들의 정의 및 실행
 */

import { prisma } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * OpenAI Function Calling 형식의 도구 정의
 */
export function getToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'add_folder',
        description: '새 폴더를 생성합니다. 경로는 /로 시작해야 합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '폴더 경로 (예: /projects/aipo)',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'undo_add_folder',
        description: '방금 생성한 폴더를 삭제합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '삭제할 폴더 경로',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'edit_folder_name',
        description: '폴더 이름을 변경합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '현재 폴더 경로',
            },
            newName: {
              type: 'string',
              description: '새 폴더 이름',
            },
          },
          required: ['path', 'newName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_file',
        description: '새 파일(노트)을 생성합니다. content는 BlockNote JSON 형식이어야 합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '파일 경로 (예: /projects/meeting-notes.md)',
            },
            content: {
              type: 'string',
              description: '파일 내용 (BlockNote JSON 형식)',
            },
          },
          required: ['path', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'undo_add_file',
        description: '방금 생성한 파일을 삭제합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '삭제할 파일 경로',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: '파일 내용을 읽습니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '읽을 파일 경로',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'edit_file',
        description: '파일 내용을 수정합니다. before와 현재 내용이 일치해야 수정됩니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '수정할 파일 경로',
            },
            before: {
              type: 'string',
              description: '현재 파일 내용 (일치 검증용)',
            },
            after: {
              type: 'string',
              description: '변경할 내용',
            },
          },
          required: ['path', 'before', 'after'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'edit_file_name',
        description: '파일 이름을 변경합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '현재 파일 경로',
            },
            newName: {
              type: 'string',
              description: '새 파일 이름',
            },
          },
          required: ['path', 'newName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'move_file',
        description: '파일을 다른 위치로 이동합니다.',
        parameters: {
          type: 'object',
          properties: {
            fromPath: {
              type: 'string',
              description: '현재 파일 경로',
            },
            toPath: {
              type: 'string',
              description: '이동할 경로',
            },
          },
          required: ['fromPath', 'toPath'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_file',
        description: '파일을 휴지통으로 이동합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '삭제할 파일 경로',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_folder',
        description: '빈 폴더를 삭제합니다.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '삭제할 폴더 경로',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'complete',
        description: '작업을 완료하고 결과를 반환합니다.',
        parameters: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: '수행한 작업 요약',
            },
            searchResults: {
              type: 'array',
              description: '검색 결과 (검색 요청인 경우)',
              items: {
                type: 'object',
                properties: {
                  fileId: { type: 'string' },
                  path: { type: 'string' },
                  title: { type: 'string' },
                  snippet: { type: 'string' },
                  relevanceScore: { type: 'number' },
                },
              },
            },
          },
          required: ['summary'],
        },
      },
    },
  ];
}

/**
 * 도구 실행
 */
export async function executeTool(
  spaceId: string,
  toolName: string,
  args: Record<string, any>,
  loginid: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'add_folder':
        return await addFolder(spaceId, args.path);

      case 'undo_add_folder':
        return await deleteFolder(spaceId, args.path);

      case 'edit_folder_name':
        return await editFolderName(spaceId, args.path, args.newName);

      case 'add_file':
        return await addFile(spaceId, args.path, args.content, loginid);

      case 'undo_add_file':
        return await deleteFile(spaceId, args.path);

      case 'read_file':
        return await readFile(spaceId, args.path);

      case 'edit_file':
        return await editFile(spaceId, args.path, args.before, args.after, loginid);

      case 'edit_file_name':
        return await editFileName(spaceId, args.path, args.newName);

      case 'move_file':
        return await moveFile(spaceId, args.fromPath, args.toPath);

      case 'delete_file':
        return await deleteFile(spaceId, args.path);

      case 'delete_folder':
        return await deleteFolder(spaceId, args.path);

      default:
        return { success: false, message: `Unknown tool: ${toolName}`, error: 'UNKNOWN_TOOL' };
    }
  } catch (error) {
    console.error(`[Tools] Error executing ${toolName}:`, error);
    return {
      success: false,
      message: `Error executing ${toolName}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 경로 정규화
 */
function normalizePath(path: string): string {
  // 앞에 / 없으면 추가
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  // 끝에 / 있으면 제거
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);
  }
  return path;
}

/**
 * 경로에서 폴더와 파일명 분리
 */
function parseFilePath(path: string): { folderPath: string; fileName: string } {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === 0) {
    return { folderPath: '', fileName: normalized.slice(1) };
  }

  return {
    folderPath: normalized.slice(0, lastSlash),
    fileName: normalized.slice(lastSlash + 1),
  };
}

/**
 * 폴더 생성
 */
async function addFolder(spaceId: string, path: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  // 이미 존재하는지 확인
  const existing = await prisma.folder.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
  });

  if (existing) {
    return { success: true, message: `Folder already exists: ${normalizedPath}` };
  }

  // 상위 폴더 찾기 또는 생성
  const pathParts = normalizedPath.split('/').filter(Boolean);
  let parentId: string | null = null;
  let currentPath = '';

  for (let i = 0; i < pathParts.length; i++) {
    currentPath += '/' + pathParts[i];
    const isLast = i === pathParts.length - 1;

    let folder = await prisma.folder.findUnique({
      where: { spaceId_path: { spaceId, path: currentPath } },
    });

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          spaceId,
          name: pathParts[i],
          path: currentPath,
          parentId,
        },
      });
    }

    parentId = folder.id;
  }

  return {
    success: true,
    message: `Folder created: ${normalizedPath}`,
    data: { path: normalizedPath },
  };
}

/**
 * 폴더 삭제
 */
async function deleteFolder(spaceId: string, path: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const folder = await prisma.folder.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
    include: {
      files: { select: { id: true } },
      children: { select: { id: true } },
    },
  });

  if (!folder) {
    return { success: false, message: `Folder not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  if (folder.files.length > 0 || folder.children.length > 0) {
    return { success: false, message: `Folder is not empty: ${normalizedPath}`, error: 'NOT_EMPTY' };
  }

  await prisma.folder.delete({
    where: { id: folder.id },
  });

  return {
    success: true,
    message: `Folder deleted: ${normalizedPath}`,
  };
}

/**
 * 폴더 이름 변경
 */
async function editFolderName(spaceId: string, path: string, newName: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const folder = await prisma.folder.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
  });

  if (!folder) {
    return { success: false, message: `Folder not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  // 새 경로 계산
  const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
  const newPath = parentPath + '/' + newName;

  // 중복 체크
  const existing = await prisma.folder.findUnique({
    where: { spaceId_path: { spaceId, path: newPath } },
  });

  if (existing) {
    return { success: false, message: `Folder already exists: ${newPath}`, error: 'ALREADY_EXISTS' };
  }

  await prisma.folder.update({
    where: { id: folder.id },
    data: { name: newName, path: newPath },
  });

  // 하위 폴더와 파일 경로도 업데이트
  await updateChildPaths(spaceId, normalizedPath, newPath);

  return {
    success: true,
    message: `Folder renamed: ${normalizedPath} -> ${newPath}`,
    data: { oldPath: normalizedPath, newPath },
  };
}

/**
 * 하위 경로 업데이트
 */
async function updateChildPaths(spaceId: string, oldPath: string, newPath: string): Promise<void> {
  // 하위 폴더
  const childFolders = await prisma.folder.findMany({
    where: {
      spaceId,
      path: { startsWith: oldPath + '/' },
    },
  });

  for (const folder of childFolders) {
    const updatedPath = folder.path.replace(oldPath, newPath);
    await prisma.folder.update({
      where: { id: folder.id },
      data: { path: updatedPath },
    });
  }

  // 하위 파일
  const childFiles = await prisma.file.findMany({
    where: {
      spaceId,
      path: { startsWith: oldPath + '/' },
    },
  });

  for (const file of childFiles) {
    const updatedPath = file.path.replace(oldPath, newPath);
    await prisma.file.update({
      where: { id: file.id },
      data: { path: updatedPath },
    });
  }
}

/**
 * 파일 생성
 */
async function addFile(spaceId: string, path: string, content: string, loginid: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);
  const { folderPath, fileName } = parseFilePath(normalizedPath);

  // 이미 존재하는지 확인
  const existing = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
  });

  if (existing) {
    return { success: false, message: `File already exists: ${normalizedPath}`, error: 'ALREADY_EXISTS' };
  }

  // 폴더 확인/생성
  let folderId: string | null = null;
  if (folderPath) {
    const folderResult = await addFolder(spaceId, folderPath);
    if (!folderResult.success) {
      return folderResult;
    }

    const folder = await prisma.folder.findUnique({
      where: { spaceId_path: { spaceId, path: folderPath } },
    });
    folderId = folder?.id || null;
  }

  // 파일 생성
  const file = await prisma.file.create({
    data: {
      spaceId,
      folderId,
      name: fileName,
      path: normalizedPath,
      createdBy: loginid,
    },
  });

  // 한국어 버전 생성
  await prisma.fileVersion.create({
    data: {
      fileId: file.id,
      language: 'KO',
      content,
    },
  });

  return {
    success: true,
    message: `File created: ${normalizedPath}`,
    data: { fileId: file.id, path: normalizedPath },
  };
}

/**
 * 파일 읽기
 */
async function readFile(spaceId: string, path: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const file = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
    include: {
      versions: {
        where: { language: 'KO' },
      },
    },
  });

  if (!file) {
    return { success: false, message: `File not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  const version = file.versions[0];

  return {
    success: true,
    message: `File read: ${normalizedPath}`,
    data: {
      fileId: file.id,
      path: normalizedPath,
      name: file.name,
      content: version?.content || '',
      updatedAt: version?.updatedAt || file.updatedAt,
    },
  };
}

/**
 * 파일 수정
 */
async function editFile(
  spaceId: string,
  path: string,
  before: string,
  after: string,
  loginid: string
): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const file = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
    include: {
      versions: {
        where: { language: 'KO' },
      },
    },
  });

  if (!file) {
    return { success: false, message: `File not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  const version = file.versions[0];

  if (!version) {
    return { success: false, message: `No Korean version found: ${normalizedPath}`, error: 'NO_VERSION' };
  }

  // 동시성 제어: before와 현재 내용 비교
  if (version.content !== before) {
    return {
      success: false,
      message: `Content mismatch. File has been modified. Please read_file again.`,
      error: 'CONTENT_MISMATCH',
      data: { currentContent: version.content },
    };
  }

  // 히스토리 저장 (30일 후 만료)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.history.create({
    data: {
      fileVersionId: version.id,
      content: before,
      changedBy: loginid,
      expiresAt,
    },
  });

  // 파일 업데이트
  await prisma.fileVersion.update({
    where: { id: version.id },
    data: { content: after },
  });

  await prisma.file.update({
    where: { id: file.id },
    data: { updatedAt: new Date() },
  });

  return {
    success: true,
    message: `File updated: ${normalizedPath}`,
    data: { fileId: file.id, path: normalizedPath },
  };
}

/**
 * 파일 이름 변경
 */
async function editFileName(spaceId: string, path: string, newName: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const file = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
  });

  if (!file) {
    return { success: false, message: `File not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  // 새 경로 계산
  const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
  const newPath = folderPath + '/' + newName;

  // 중복 체크
  const existing = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: newPath } },
  });

  if (existing) {
    return { success: false, message: `File already exists: ${newPath}`, error: 'ALREADY_EXISTS' };
  }

  await prisma.file.update({
    where: { id: file.id },
    data: { name: newName, path: newPath },
  });

  return {
    success: true,
    message: `File renamed: ${normalizedPath} -> ${newPath}`,
    data: { oldPath: normalizedPath, newPath },
  };
}

/**
 * 파일 이동
 */
async function moveFile(spaceId: string, fromPath: string, toPath: string): Promise<ToolResult> {
  const normalizedFromPath = normalizePath(fromPath);
  const normalizedToPath = normalizePath(toPath);

  const file = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedFromPath } },
  });

  if (!file) {
    return { success: false, message: `File not found: ${normalizedFromPath}`, error: 'NOT_FOUND' };
  }

  // 대상 경로 중복 체크
  const existing = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedToPath } },
  });

  if (existing) {
    return { success: false, message: `File already exists: ${normalizedToPath}`, error: 'ALREADY_EXISTS' };
  }

  // 대상 폴더 확인/생성
  const { folderPath, fileName } = parseFilePath(normalizedToPath);
  let folderId: string | null = null;

  if (folderPath) {
    const folderResult = await addFolder(spaceId, folderPath);
    if (!folderResult.success) {
      return folderResult;
    }

    const folder = await prisma.folder.findUnique({
      where: { spaceId_path: { spaceId, path: folderPath } },
    });
    folderId = folder?.id || null;
  }

  await prisma.file.update({
    where: { id: file.id },
    data: {
      name: fileName,
      path: normalizedToPath,
      folderId,
    },
  });

  return {
    success: true,
    message: `File moved: ${normalizedFromPath} -> ${normalizedToPath}`,
    data: { fromPath: normalizedFromPath, toPath: normalizedToPath },
  };
}

/**
 * 파일 삭제 (휴지통으로)
 */
async function deleteFile(spaceId: string, path: string): Promise<ToolResult> {
  const normalizedPath = normalizePath(path);

  const file = await prisma.file.findUnique({
    where: { spaceId_path: { spaceId, path: normalizedPath } },
  });

  if (!file) {
    return { success: false, message: `File not found: ${normalizedPath}`, error: 'NOT_FOUND' };
  }

  await prisma.file.update({
    where: { id: file.id },
    data: { deletedAt: new Date() },
  });

  return {
    success: true,
    message: `File moved to trash: ${normalizedPath}`,
    data: { fileId: file.id, path: normalizedPath },
  };
}
