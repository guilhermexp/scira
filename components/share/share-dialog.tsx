'use client';

import React, { useState, useEffect } from 'react';
import {
  CopyIcon,
  CheckIcon,
  GlobeIcon,
  LockIcon,
  LinkedinLogoIcon,
  XLogoIcon,
  RedditLogoIcon,
} from '@phosphor-icons/react';
import { Copy } from 'lucide-react';
import { HugeiconsIcon } from '@/components/ui/hugeicons';
import { Share03Icon } from '@hugeicons/core-free-icons';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string | null;
  selectedVisibilityType: 'public' | 'private';
  onVisibilityChange: (visibility: 'public' | 'private') => Promise<void>;
  isOwner?: boolean;
  user?: any;
  allowContinuation?: boolean;
  onAllowContinuationChange?: (value: boolean) => Promise<void>;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  chatId,
  selectedVisibilityType,
  onVisibilityChange,
  isOwner = true,
  user,
  allowContinuation = true,
  onAllowContinuationChange,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [isChangingSettings, setIsChangingSettings] = useState(false);

  // Use the current domain instead of hardcoding scira.ai
  const shareUrl = chatId
    ? `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://scira.ai'}/search/${chatId}`
    : '';

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setChoice(selectedVisibilityType);
    setIsShared(selectedVisibilityType === 'public');
  }, [selectedVisibilityType]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      sileo.success({ 
        title: 'Link copied to clipboard',
        description: 'You can now paste it anywhere',
        icon: <Copy className="h-4 w-4" />,
        button: {
          title: 'Open link',
          onClick: () => window.open(shareUrl, '_blank', 'noopener,noreferrer')
        }
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      sileo.error({ 
        title: 'Failed to copy link',
        description: 'Please try again',
        icon: <XLogoIcon className="h-4 w-4" weight="fill" />
      });
    }
  };

  const handleShareAndCopy = async () => {
    setIsChangingVisibility(true);

    try {
      await onVisibilityChange('public');
      setChoice('public');
      setIsShared(true);
      await handleCopyLink();
    } catch (error) {
      console.error('Error sharing chat:', error);
      sileo.error({ 
        title: 'Failed to share chat',
        description: 'Please try again',
        icon: <XLogoIcon className="h-4 w-4" weight="fill" />
      });
    } finally {
      setIsChangingVisibility(false);
    }
  };

  const handleMakePrivate = async () => {
    setIsChangingVisibility(true);

    try {
      await onVisibilityChange('private');
      setChoice('private');
      setIsShared(false);
      sileo.success({ 
        title: 'Chat is now private',
        description: 'Your chat is no longer publicly accessible',
        icon: <LockIcon className="h-4 w-4" weight="fill" />
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error making chat private:', error);
      sileo.error({ 
        title: 'Failed to make chat private',
        description: 'Please try again',
        icon: <XLogoIcon className="h-4 w-4" weight="fill" />
      });
    } finally {
      setIsChangingVisibility(false);
    }
  };

  const handleShareLinkedIn = (e: React.MouseEvent) => {
    e.preventDefault();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = (e: React.MouseEvent) => {
    e.preventDefault();
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareReddit = (e: React.MouseEvent) => {
    e.preventDefault();
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}`;
    window.open(redditUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'Shared Scira Chat',
        url: shareUrl,
      });
    } catch (error) {
      await handleCopyLink();
    }
  };

  const handleAllowContinuationChange = async (checked: boolean) => {
    setIsChangingSettings(true);
    try {
      await onAllowContinuationChange?.(checked);
      toast.success(checked ? 'Visitors can now continue chat' : 'Chat is now read-only for visitors');
    } catch (error) {
      console.error('Error updating continuation setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setIsChangingSettings(false);
    }
  };

  if (!chatId || !user || !isOwner) {
    return null;
  }

  const isPublic = isShared;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-100 sm:max-w-130 gap-0 p-0 border-0 shadow-lg">
        <div className="px-6 pt-6 pb-5">
          <DialogHeader className="space-y-1 pb-0">
            <DialogTitle className="text-base font-semibold tracking-tight">
              {isPublic ? 'Chat shared' : 'Share chat'}
            </DialogTitle>
            <p className="text-[13px] text-muted-foreground pt-0.5">
              {isPublic ? 'Future messages aren’t included' : 'Only messages up until now will be shared'}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 overflow-x-hidden">
          {isPublic ? (
            <div className="space-y-4">
              {/* Link Copy - Main Focus */}
              <div className="group relative overflow-hidden rounded-lg border bg-muted/40 transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2 px-3.5 py-2.5">
                  <div className="flex-1 min-w-0 relative">
                    <code
                      className="text-[13px] text-foreground/70 block font-medium pr-12"
                      style={{
                        maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                      }}
                    >
                      {shareUrl}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyLink}
                    className={cn(
                      'h-8 px-3 shrink-0 font-medium text-xs transition-all absolute right-2',
                      copied ? 'text-green-600 dark:text-green-500' : 'hover:bg-background/80',
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckIcon size={14} className="mr-1.5" weight="bold" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon size={14} className="mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Share - Streamlined */}
              <div className="flex items-center gap-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button variant="outline" size="sm" onClick={handleNativeShare} className="flex-1 h-9 font-medium">
                    <HugeiconsIcon icon={Share03Icon} size={15} strokeWidth={2} className="mr-2" />
                    Share
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShareLinkedIn}
                  title="Share on LinkedIn"
                  className="h-9 w-9 shrink-0"
                >
                  <LinkedinLogoIcon size={17} weight="fill" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShareTwitter}
                  title="Share on X"
                  className="h-9 w-9 shrink-0"
                >
                  <XLogoIcon size={17} weight="fill" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShareReddit}
                  title="Share on Reddit"
                  className="h-9 w-9 shrink-0"
                >
                  <RedditLogoIcon size={17} weight="fill" />
                </Button>
              </div>

              {/* Allow Continuation Toggle */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3.5 py-3">
                <div className="flex-1">
                  <label htmlFor="allow-continuation" className="text-sm font-medium text-foreground cursor-pointer">
                    Allow visitors to continue chat
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">Let others add messages to this conversation</p>
                </div>
                <Switch
                  id="allow-continuation"
                  checked={allowContinuation}
                  onCheckedChange={handleAllowContinuationChange}
                  disabled={isChangingSettings}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMakePrivate}
                  disabled={isChangingVisibility}
                  className={cn('w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/50')}
                >
                  <LockIcon size={14} className="mr-1.5" />
                  Make Private
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs -mr-2">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Access options */}
              <div className="rounded-2xl border bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setChoice('private')}
                  className={cn('w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/50')}
                >
                  <div className="mt-0.5">
                    <LockIcon size={16} weight="fill" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-1.5">Share this conversation</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                  Create a public link that anyone can access
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
                  Cancel
                </Button>
                <Button
                  onClick={handleShareAndCopy}
                  disabled={isChangingVisibility}
                  className="h-10 px-4 font-medium"
                >
                  {isChangingVisibility ? 'Creating…' : 'Create share link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
