'use client';

import React from 'react';
import { HugeiconsIcon as BaseHugeiconsIcon } from '@hugeicons/react';
import { GlobalSearchIcon } from '@hugeicons/core-free-icons';

type BaseProps = React.ComponentProps<typeof BaseHugeiconsIcon>;

export function HugeiconsIcon({ strokeWidth: _ignored, ...rest }: BaseProps) {
  const icon = Array.isArray(rest.icon) ? rest.icon : GlobalSearchIcon;
  return <BaseHugeiconsIcon {...rest} icon={icon} strokeWidth={1.5} />;
}

export default HugeiconsIcon;
