import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/FirebaseCofig';

interface AuthGuardProps {
  children: ReactNode; // ✅ Explicitly define children as ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null); // ✅ Define Firebase user type
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); // ✅ Type is now correct
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !session && !user) {
      router.push('/Component/Login'); // Redirect to login if not authenticated
    }
  }, [loading, session, user, router]);

  if (loading || (!session && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-cyan-600 font-semibold text-lg">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
