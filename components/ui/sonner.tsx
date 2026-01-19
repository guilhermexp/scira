'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toaster]:border-emerald-500/20 group-[.toaster]:text-emerald-600 dark:group-[.toaster]:text-emerald-400',
          error: 'group-[.toaster]:border-red-500/20 group-[.toaster]:text-red-600 dark:group-[.toaster]:text-red-400',
          warning: 'group-[.toaster]:border-neutral-500/20 group-[.toaster]:text-neutral-600 dark:group-[.toaster]:text-neutral-400',
          info: 'group-[.toaster]:border-neutral-500/20 group-[.toaster]:text-neutral-600 dark:group-[.toaster]:text-neutral-400',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
