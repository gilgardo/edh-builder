'use client';

import { Badge } from '@/components/ui/badge';
import type { CollaboratorRole, InviteStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface CollaborationBadgeProps {
  role: CollaboratorRole;
  status?: InviteStatus;
  className?: string;
}

const roleConfig: Record<CollaboratorRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  VIEWER: { label: 'Viewer', variant: 'outline' },
  EDITOR: { label: 'Editor', variant: 'secondary' },
  ADMIN: { label: 'Admin', variant: 'default' },
};

const statusConfig: Record<InviteStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  ACCEPTED: { label: 'Active', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  DECLINED: { label: 'Declined', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export function CollaborationBadge({ role, status, className }: CollaborationBadgeProps) {
  const roleInfo = roleConfig[role];

  if (status && status !== 'ACCEPTED') {
    const statusInfo = statusConfig[status];
    return (
      <Badge variant="outline" className={cn(statusInfo.className, className)}>
        {statusInfo.label}
      </Badge>
    );
  }

  return (
    <Badge variant={roleInfo.variant} className={className}>
      {roleInfo.label}
    </Badge>
  );
}
