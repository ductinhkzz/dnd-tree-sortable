import { useDroppable } from '@dnd-kit/react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';
import { pointerDistance } from '@dnd-kit/collision';
import { FolderRootIcon } from 'lucide-react';
import { cn } from 'cn';

export function TreeRootDropZone({
  id,
  active,
  dragging,
}: {
  id: UniqueIdentifier;
  active: boolean;
  dragging: boolean;
}) {
  const { ref } = useDroppable({ id, collisionDetector: pointerDistance });
  return (
    <div
      ref={ref}
      data-root-drop-zone=''
      className={cn(
        'flex min-h-10 items-center gap-2 border-b border-border px-3 text-xs text-muted-foreground',
        dragging && 'border-dashed',
        active && 'bg-accent text-accent-foreground ring-2 ring-inset ring-ring',
      )}
    >
      <FolderRootIcon aria-hidden='true' className='size-4 shrink-0' />
      <span className='shrink-0'>Workspace root</span>
      <span className='ml-auto truncate'>{dragging ? 'Drop here to move to root' : 'Drop files or folders here'}</span>
    </div>
  );
}
