'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';

interface SignInPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInPromptDialog({ open, onOpenChange }: SignInPromptDialogProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSignIn = () => {
    onOpenChange(false);
    router.push('/sign-in');
  };

  const content = (
    <>
      {/* Compact Header */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-foreground mb-1">{t('auth.signInToContinue')}</h2>
        <p className="text-sm text-muted-foreground">{t('auth.saveConversations')}</p>
      </div>

      {/* Sign In Button */}
      <Button onClick={handleSignIn} className="w-full mb-4">
        Sign in to Scira AI
      </Button>

      {/* Guest Option */}
      <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-10 font-normal text-sm">
        Continue without account
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] px-6 pb-6">
          <DrawerHeader className="px-0 pt-4 pb-0 font-be-vietnam-pro">
            <DrawerTitle className="text-lg font-medium">{t('auth.signInToContinue')}</DrawerTitle>
            <p className="text-sm text-muted-foreground pt-1">{t('auth.saveConversations')}</p>
          </DrawerHeader>
          <div className="overflow-y-auto pt-4">
            {/* Sign In Button */}
            <Button onClick={handleSignIn} className="w-full mb-4">
              Sign in to Scira AI
            </Button>

            {/* Guest Option */}
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-10 font-normal text-sm">
              {t('auth.continueWithoutAccount')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-6 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('auth.signInToContinue')}</DialogTitle>
          <DialogDescription>{t('auth.saveConversations')}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
