import { NextRequest, NextResponse } from 'next/server';
import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/mongodb';
import { IUserDocument } from '@/models/User';

// In-memory idempotency cache for fast deduping (with TTL)
const idempotencyCache = new Map<string, { timestamp: number; response: any }>();
const IDEMPOTENCY_TTL_MS = 120 * 1000; // 2 minutes

export interface AuditLogParams {
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  requestId?: string;
  status?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
}

/**
 * Creates an immutable audit trail record in MongoDB.
 */
export async function createAuditEntry(params: AuditLogParams): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      beforeState: params.beforeState,
      afterState: params.afterState,
      reason: params.reason || 'Operational action taken',
      requestId: params.requestId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: params.status || 'SUCCESS',
      ipAddress: params.ipAddress || 'internal',
      timestamp: new Date(),
    });
  } catch (err: any) {
    console.error('[AUDIT_ERROR] Failed to record immutable audit log:', err.message);
  }
}

/**
 * Checks for duplicate requests using the Idempotency-Key header.
 */
export function checkIdempotency(req: NextRequest): { isDuplicate: boolean; cachedResponse?: any; key?: string } {
  const key = req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key');
  if (!key) return { isDuplicate: false };

  const now = Date.now();
  const cached = idempotencyCache.get(key);

  if (cached && now - cached.timestamp < IDEMPOTENCY_TTL_MS) {
    return { isDuplicate: true, cachedResponse: cached.response, key };
  }

  return { isDuplicate: false, key };
}

/**
 * Stores the result for a given idempotency key.
 */
export function recordIdempotencyResult(key: string, response: any): void {
  if (!key) return;
  idempotencyCache.set(key, { timestamp: Date.now(), response });

  // Cleanup old keys periodically
  if (idempotencyCache.size > 2000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    Array.from(idempotencyCache.entries()).forEach(([k, v]) => {
      if (v.timestamp < cutoff) idempotencyCache.delete(k);
    });
  }
}

/**
 * Validates organizational tenant boundary to prevent cross-tenant data access.
 */
export function enforceTenantBoundary(
  user: IUserDocument,
  targetOrgId?: string,
  targetUserId?: string
): boolean {
  if (user.role === 'ADMIN') return true;

  if (targetUserId && user._id.toString() === targetUserId.toString()) {
    return true;
  }

  if (targetOrgId && user.organizationId) {
    const orgIdVal = (user.organizationId as any)?._id || user.organizationId;
    const userOrgId = orgIdVal ? orgIdVal.toString() : '';
    if (userOrgId === targetOrgId.toString()) {
      return true;
    }
  }

  return false;
}
