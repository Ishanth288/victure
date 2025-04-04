
import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RegistrationData } from "@/types/registration";

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during sign in";
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (registrationData: RegistrationData) => {
    const { email, password, ...profileData } = registrationData;
    
    try {
      setLoading(true);
      
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Calculate trial expiration (30 days from now)
      const trialExpirationDate = new Date();
      trialExpirationDate.setDate(trialExpirationDate.getDate() + 30);
      
      // Create the user profile in Firestore
      await setDoc(doc(db, "profiles", user.uid), {
        id: user.uid,
        email: email,
        ...profileData,
        plan_type: "Free Trial",
        registration_date: new Date().toISOString(),
        trial_expiration_date: trialExpirationDate.toISOString(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      return { user, error: null };
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during registration";
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during sign out";
      return { error: errorMessage };
    }
  };

  // Get user profile data
  const getUserProfile = async (userId: string) => {
    try {
      const docRef = doc(db, "profiles", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { profile: docSnap.data(), error: null };
      } else {
        return { profile: null, error: "Profile not found" };
      }
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred while fetching profile";
      return { profile: null, error: errorMessage };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logOut,
    getUserProfile
  };
}
