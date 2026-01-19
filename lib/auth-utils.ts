import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import { config } from 'dotenv';
import { headers } from 'next/headers';
import { User, user as userTable } from './db/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

config({
  path: '.env.local',
});

export const getSession = async () => {
  const { userId } = await clerkAuth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return null;
  }

  return {
    user: {
      id: userId,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.primaryEmailAddress?.emailAddress.split('@')[0] || '',
      image: clerkUser.imageUrl || null,
    },
  };
};

export const getUser = async (): Promise<User | null> => {
  const { userId } = await clerkAuth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
    return null;
  }

  const userEmail = clerkUser.primaryEmailAddress.emailAddress;

  // Try to find user by email in local DB
  let localUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, userEmail))
    .limit(1)
    .then((rows) => rows[0]);

  // If user doesn't exist, create them
  if (!localUser) {
    const newUser = {
      id: userId,
      email: userEmail,
      emailVerified: clerkUser.emailAddresses.some((e) => e.verification?.status === 'verified'),
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail.split('@')[0],
      image: clerkUser.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(userTable).values(newUser).onConflictDoNothing();
    localUser = newUser;
  }

  return localUser as User;
};
