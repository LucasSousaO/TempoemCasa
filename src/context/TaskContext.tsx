import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { 
  DomesticTask, 
  TaskCompletionLog, 
  UserPreferences, 
  RoomCategory, 
  GroceryItem, 
  WishlistItem,
  GroceryStatus,
  UserProfile,
  Household,
  HouseholdMember
} from '../types';
import { INITIAL_TASKS } from '../data/defaultTasks';
import { INITIAL_GROCERY_ITEMS, INITIAL_WISHLIST_ITEMS } from '../data/defaultMarketAndWishlist';
import { sounds } from '../utils/soundEffects';
import { computeTaskStatus } from '../utils/taskCalculations';
import { calculateTaskPoints, getLevelInfo } from '../utils/gamification';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType, 
  testFirestoreConnection 
} from '../services/firebase';

interface PointsPopupInfo {
  points: number;
  taskTitle: string;
  breakdown: { label: string; points: number }[];
}

interface TaskContextType {
  // Auth & Family
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  household: Household | null;
  householdMembers: HouseholdMember[];
  isAuthLoading: boolean;
  isCloudSyncing: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createHousehold: (name: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<{ success: boolean; message: string }>;
  leaveHousehold: () => Promise<void>;

  // Data
  tasks: DomesticTask[];
  logs: TaskCompletionLog[];
  groceryItems: GroceryItem[];
  wishlistItems: WishlistItem[];
  preferences: UserPreferences;

  // Points popup
  earnedPointsPopup: PointsPopupInfo | null;
  closeEarnedPointsPopup: () => void;

  // Task handlers
  addTask: (task: Omit<DomesticTask, 'id' | 'createdAt' | 'completedCount'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<DomesticTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  completeTask: (id: string, actualMinutesSpent?: number) => Promise<void>;
  undoCompleteTask: (logId: string) => Promise<void>;

  // Grocery handlers
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'updatedAt'>) => Promise<void>;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteGroceryItem: (id: string) => Promise<void>;
  setGroceryItemStatus: (id: string, status: GroceryStatus) => Promise<void>;
  cycleGroceryStatus: (id: string) => Promise<void>;
  clearPurchasedGrocery: () => Promise<void>;

  // Wishlist handlers
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased' | 'purchasedAt'>) => Promise<void>;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  toggleWishlistPurchased: (id: string) => Promise<void>;

  // Global actions
  resetToDefaults: () => Promise<void>;
  clearAllData: () => Promise<void>;
  importData: (imported: { 
    tasks: DomesticTask[]; 
    logs?: TaskCompletionLog[];
    groceryItems?: GroceryItem[];
    wishlistItems?: WishlistItem[];
  }) => boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Computed stats
  stats: {
    totalTasks: number;
    overdueCount: number;
    dueSoonCount: number;
    upToDateCount: number;
    homeHealthScore: number;
    completedThisWeek: number;
    totalMinutesSaved: number;
    groceryNeededCount: number;
    groceryHaveCount: number;
    groceryCartTotal: number;
    wishlistTotalCurto: number;
    wishlistTotalMedio: number;
    wishlistTotalLongo: number;
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TASKS: 'domestica_tasks_v1',
  LOGS: 'domestica_logs_v1',
  PREFS: 'domestica_prefs_v1',
  GROCERY: 'domestica_grocery_v1',
  WISHLIST: 'domestica_wishlist_v1',
  LOCAL_USER: 'domestica_local_user_v1',
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      uid: 'guest_user',
      displayName: 'Dona(o) da Casa',
      email: '',
      householdId: 'local_house',
      points: 240,
      level: 2,
      completedTasksCount: 6,
      totalMinutesSpent: 65,
      currentStreak: 2,
    };
  });

  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [earnedPointsPopup, setEarnedPointsPopup] = useState<PointsPopupInfo | null>(null);

  // Local fallback data
  const [tasks, setTasks] = useState<DomesticTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [logs, setLogs] = useState<TaskCompletionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'log-1',
        taskId: 't-qua-1',
        taskTitle: 'Arrumar cama e organizar mesas de cabeceira',
        room: 'quarto',
        minutesSpent: 5,
        pointsEarned: 40,
        completedByName: 'Dona(o) da Casa',
        completedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'log-2',
        taskId: 't-ger-2',
        taskTitle: 'Recolher lixos da casa e levar para fora',
        room: 'geral',
        minutesSpent: 5,
        pointsEarned: 40,
        completedByName: 'Dona(o) da Casa',
        completedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
      {
        id: 'log-3',
        taskId: 't-ban-2',
        taskTitle: 'Limpar espelho e pia do banheiro',
        room: 'banheiro',
        minutesSpent: 5,
        pointsEarned: 40,
        completedByName: 'Dona(o) da Casa',
        completedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ];
  });

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROCERY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GROCERY_ITEMS;
  });

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WISHLIST_ITEMS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      soundEnabled: true,
      hapticEnabled: true,
      prioritizeOverdueInDraw: true,
      viewMode: 'mobile',
    };
  });

  // Test connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync sound settings with audio synth
  useEffect(() => {
    sounds.setEnabled(preferences.soundEnabled);
  }, [preferences.soundEnabled]);

  // Save changes locally as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEYS.GROCERY, JSON.stringify(groceryItems));
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlistItems));
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(preferences));
      if (userProfile) {
        localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(userProfile));
      }
    } catch (e) {
      console.error(e);
    }
  }, [tasks, logs, groceryItems, wishlistItems, preferences, userProfile]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          setIsCloudSyncing(true);
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          let currentHouseholdId: string;

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            currentHouseholdId = data.householdId;
            setUserProfile(data);
          } else {
            // New user: create default profile and default household
            const code = 'CASA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const newHouseRef = doc(collection(db, 'households'));
            currentHouseholdId = newHouseRef.id;

            const newHouseholdData: Household = {
              id: currentHouseholdId,
              name: `Casa de ${user.displayName?.split(' ')[0] || 'Família'}`,
              inviteCode: code,
              createdBy: user.uid,
              createdAt: new Date().toISOString(),
            };

            await setDoc(newHouseRef, newHouseholdData);

            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Membro da Casa',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              householdId: currentHouseholdId,
              points: 0,
              level: 1,
              completedTasksCount: 0,
              totalMinutesSpent: 0,
              currentStreak: 1,
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);

            // Register member in household
            const memberDocRef = doc(db, 'households', currentHouseholdId, 'members', user.uid);
            await setDoc(memberDocRef, {
              uid: user.uid,
              displayName: user.displayName || 'Membro da Casa',
              photoURL: user.photoURL || '',
              role: 'owner',
              points: 0,
              level: 1,
              completedTasksCount: 0,
              totalMinutesSpent: 0,
              joinedAt: new Date().toISOString(),
            });

            // Seed default tasks, grocery and wishlist into new household
            const batch = writeBatch(db);
            INITIAL_TASKS.forEach((t) => {
              const tRef = doc(db, 'households', currentHouseholdId, 'tasks', t.id);
              batch.set(tRef, t);
            });
            INITIAL_GROCERY_ITEMS.forEach((g) => {
              const gRef = doc(db, 'households', currentHouseholdId, 'groceryItems', g.id);
              batch.set(gRef, g);
            });
            INITIAL_WISHLIST_ITEMS.forEach((w) => {
              const wRef = doc(db, 'households', currentHouseholdId, 'wishlistItems', w.id);
              batch.set(wRef, w);
            });
            await batch.commit();
          }

          // Fetch household info
          const houseDoc = await getDoc(doc(db, 'households', currentHouseholdId));
          if (houseDoc.exists()) {
            setHousehold({ id: houseDoc.id, ...houseDoc.data() } as Household);
          }
        } catch (error) {
          console.error('Error fetching user data from Firebase:', error);
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setHousehold(null);
        setHouseholdMembers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Household Members & Real-time shared data when logged in
  useEffect(() => {
    if (!currentUser || !household?.id) return;

    const houseId = household.id;
    setIsCloudSyncing(true);

    // 1. Members listener (Leaderboard / Gamification)
    const membersUnsub = onSnapshot(
      collection(db, 'households', houseId, 'members'),
      (snap) => {
        const mems: HouseholdMember[] = [];
        snap.forEach((docSnap) => {
          mems.push(docSnap.data() as HouseholdMember);
        });
        // Sort by points descending (Leaderboard)
        mems.sort((a, b) => (b.points || 0) - (a.points || 0));
        setHouseholdMembers(mems);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `households/${houseId}/members`)
    );

    // 2. Tasks listener
    const tasksUnsub = onSnapshot(
      collection(db, 'households', houseId, 'tasks'),
      (snap) => {
        const list: DomesticTask[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DomesticTask));
        if (list.length > 0) setTasks(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `households/${houseId}/tasks`)
    );

    // 3. Logs listener
    const logsUnsub = onSnapshot(
      collection(db, 'households', houseId, 'logs'),
      (snap) => {
        const list: TaskCompletionLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as TaskCompletionLog));
        list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `households/${houseId}/logs`)
    );

    // 4. Grocery items listener
    const groceryUnsub = onSnapshot(
      collection(db, 'households', houseId, 'groceryItems'),
      (snap) => {
        const list: GroceryItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as GroceryItem));
        setGroceryItems(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `households/${houseId}/groceryItems`)
    );

    // 5. Wishlist items listener
    const wishlistUnsub = onSnapshot(
      collection(db, 'households', houseId, 'wishlistItems'),
      (snap) => {
        const list: WishlistItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WishlistItem));
        setWishlistItems(list);
        setIsCloudSyncing(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `households/${houseId}/wishlistItems`)
    );

    return () => {
      membersUnsub();
      tasksUnsub();
      logsUnsub();
      groceryUnsub();
      wishlistUnsub();
    };
  }, [currentUser, household?.id]);

  // Login handler
  const loginWithGoogle = async () => {
    try {
      sounds.playSelect();
      await signInWithPopup(auth, googleProvider);
      sounds.playSuccess();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    sounds.playSelect();
    await fbSignOut(auth);
    setHousehold(null);
    setHouseholdMembers([]);
  };

  // Create new household
  const createHousehold = async (name: string): Promise<string> => {
    if (!currentUser) throw new Error('Faça login para criar um lar compartilhado.');

    const code = 'CASA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newHouseRef = doc(collection(db, 'households'));
    const houseId = newHouseRef.id;

    const newHouse: Household = {
      id: houseId,
      name: name.trim() || 'Nosso Lar',
      inviteCode: code,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    await setDoc(newHouseRef, newHouse);

    // Update user profile
    await updateDoc(doc(db, 'users', currentUser.uid), {
      householdId: houseId,
      updatedAt: new Date().toISOString(),
    });

    // Add member
    await setDoc(doc(db, 'households', houseId, 'members', currentUser.uid), {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Administrador',
      photoURL: currentUser.photoURL || '',
      role: 'owner',
      points: userProfile?.points || 0,
      level: userProfile?.level || 1,
      completedTasksCount: userProfile?.completedTasksCount || 0,
      totalMinutesSpent: userProfile?.totalMinutesSpent || 0,
      joinedAt: new Date().toISOString(),
    });

    // Seed tasks from current state
    const batch = writeBatch(db);
    tasks.forEach((t) => {
      batch.set(doc(db, 'households', houseId, 'tasks', t.id), t);
    });
    groceryItems.forEach((g) => {
      batch.set(doc(db, 'households', houseId, 'groceryItems', g.id), g);
    });
    wishlistItems.forEach((w) => {
      batch.set(doc(db, 'households', houseId, 'wishlistItems', w.id), w);
    });
    await batch.commit();

    setHousehold(newHouse);
    sounds.playSuccess();
    return code;
  };

  // Join existing household via invite code
  const joinHousehold = async (rawCode: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Faça login para entrar em uma família.' };

    const formattedCode = rawCode.trim().toUpperCase();
    try {
      const q = query(collection(db, 'households'), where('inviteCode', '==', formattedCode));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        return { success: false, message: 'Código de família não encontrado. Verifique e tente novamente!' };
      }

      const houseDoc = querySnap.docs[0];
      const targetHouse = { id: houseDoc.id, ...houseDoc.data() } as Household;

      // Add user to target household members
      await setDoc(doc(db, 'households', targetHouse.id, 'members', currentUser.uid), {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Membro da Família',
        photoURL: currentUser.photoURL || '',
        role: 'member',
        points: userProfile?.points || 0,
        level: userProfile?.level || 1,
        completedTasksCount: userProfile?.completedTasksCount || 0,
        totalMinutesSpent: userProfile?.totalMinutesSpent || 0,
        joinedAt: new Date().toISOString(),
      });

      // Update user doc
      await updateDoc(doc(db, 'users', currentUser.uid), {
        householdId: targetHouse.id,
        updatedAt: new Date().toISOString(),
      });

      setUserProfile((prev) => (prev ? { ...prev, householdId: targetHouse.id } : null));
      setHousehold(targetHouse);
      sounds.playSuccess();

      return { success: true, message: `Você entrou com sucesso no lar "${targetHouse.name}"! 🎉` };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Erro ao conectar ao lar familiar.' };
    }
  };

  const leaveHousehold = async () => {
    // Leaves and resets to a private household
    if (!currentUser) return;
    await createHousehold(`Lar Privado de ${currentUser.displayName?.split(' ')[0] || 'Convidado'}`);
  };

  // Task actions
  const addTask = async (taskData: Omit<DomesticTask, 'id' | 'createdAt' | 'completedCount'>) => {
    const newTask: DomesticTask = {
      ...taskData,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      completedCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (currentUser && household?.id) {
      try {
        await setDoc(doc(db, 'households', household.id, 'tasks', newTask.id), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `households/${household.id}/tasks/${newTask.id}`);
      }
    } else {
      setTasks((prev) => [newTask, ...prev]);
    }
    sounds.playSelect();
  };

  const updateTask = async (id: string, updates: Partial<DomesticTask>) => {
    if (currentUser && household?.id) {
      try {
        await updateDoc(doc(db, 'households', household.id, 'tasks', id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `households/${household.id}/tasks/${id}`);
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }
    sounds.playSelect();
  };

  const deleteTask = async (id: string) => {
    if (currentUser && household?.id) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `households/${household.id}/tasks/${id}`);
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const toggleFavorite = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    await updateTask(id, { isFavorite: !target.isFavorite });
  };

  // Complete task with Gamification XP calculation
  const completeTask = async (id: string, actualMinutesSpent?: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const completedAt = new Date().toISOString();
    const minutes = actualMinutesSpent ?? task.estimatedMinutes;
    const { status } = computeTaskStatus(task);
    const isOverdue = status === 'overdue';

    // Calculate gamification points
    const { totalPoints, breakdown } = calculateTaskPoints(task, minutes, isOverdue);

    const executorName = currentUser?.displayName || userProfile?.displayName || 'Você';
    const executorPhoto = currentUser?.photoURL || userProfile?.photoURL;
    const executorUid = currentUser?.uid || 'guest_user';

    const newLog: TaskCompletionLog = {
      id: 'log_' + Date.now(),
      taskId: task.id,
      taskTitle: task.title,
      room: task.room,
      minutesSpent: minutes,
      completedAt,
      completedByUid: executorUid,
      completedByName: executorName,
      completedByPhoto: executorPhoto,
      pointsEarned: totalPoints,
    };

    // Update local or cloud
    if (currentUser && household?.id) {
      try {
        const batch = writeBatch(db);

        // 1. Update task last completed
        const taskRef = doc(db, 'households', household.id, 'tasks', task.id);
        batch.update(taskRef, {
          lastCompletedAt: completedAt,
          completedCount: increment(1),
        });

        // 2. Add log
        const logRef = doc(db, 'households', household.id, 'logs', newLog.id);
        batch.set(logRef, newLog);

        // 3. Update member points and stats in household
        const memberRef = doc(db, 'households', household.id, 'members', currentUser.uid);
        batch.update(memberRef, {
          points: increment(totalPoints),
          completedTasksCount: increment(1),
          totalMinutesSpent: increment(minutes),
        });

        // 4. Update user profile
        const userRef = doc(db, 'users', currentUser.uid);
        batch.update(userRef, {
          points: increment(totalPoints),
          completedTasksCount: increment(1),
          totalMinutesSpent: increment(minutes),
          lastActiveAt: completedAt,
          updatedAt: completedAt,
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `households/${household.id}`);
      }
    } else {
      // Local fallback
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, lastCompletedAt: completedAt, completedCount: (t.completedCount || 0) + 1 }
            : t
        )
      );
      setLogs((prev) => [newLog, ...prev]);

      // Update local user profile points
      setUserProfile((prev) => {
        if (!prev) return null;
        const newPoints = (prev.points || 0) + totalPoints;
        const newLevel = getLevelInfo(newPoints).currentLevel.level;
        return {
          ...prev,
          points: newPoints,
          level: newLevel,
          completedTasksCount: (prev.completedTasksCount || 0) + 1,
          totalMinutesSpent: (prev.totalMinutesSpent || 0) + minutes,
        };
      });
    }

    // Trigger gamification celebration modal
    setEarnedPointsPopup({
      points: totalPoints,
      taskTitle: task.title,
      breakdown,
    });
    sounds.playSuccess();
  };

  const undoCompleteTask = async (logId: string) => {
    const logToRemove = logs.find((l) => l.id === logId);
    if (!logToRemove) return;

    if (currentUser && household?.id) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'logs', logId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `households/${household.id}/logs/${logId}`);
      }
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      setTasks((prev) =>
        prev.map((t) =>
          t.id === logToRemove.taskId
            ? { ...t, completedCount: Math.max(0, (t.completedCount || 1) - 1) }
            : t
        )
      );
    }
  };

  // Grocery Handlers
  const addGroceryItem = async (itemData: Omit<GroceryItem, 'id' | 'updatedAt'>) => {
    const newItem: GroceryItem = {
      ...itemData,
      id: 'groc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser && household?.id) {
      try {
        await setDoc(doc(db, 'households', household.id, 'groceryItems', newItem.id), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `households/${household.id}/groceryItems/${newItem.id}`);
      }
    } else {
      setGroceryItems((prev) => [newItem, ...prev]);
    }
    sounds.playSelect();
  };

  const updateGroceryItem = async (id: string, updates: Partial<GroceryItem>) => {
    const dataWithTime = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser && household?.id) {
      try {
        await updateDoc(doc(db, 'households', household.id, 'groceryItems', id), dataWithTime);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `households/${household.id}/groceryItems/${id}`);
      }
    } else {
      setGroceryItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...dataWithTime } : item))
      );
    }
  };

  const deleteGroceryItem = async (id: string) => {
    if (currentUser && household?.id) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'groceryItems', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `households/${household.id}/groceryItems/${id}`);
      }
    } else {
      setGroceryItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const setGroceryItemStatus = async (id: string, status: GroceryStatus) => {
    await updateGroceryItem(id, { status });
    if (status === 'in_cart') {
      sounds.playSuccess();
    } else {
      sounds.playSelect();
    }
  };

  const cycleGroceryStatus = async (id: string) => {
    const item = groceryItems.find((i) => i.id === id);
    if (!item) return;
    let nextStatus: GroceryStatus = 'need_to_buy';
    if (item.status === 'need_to_buy') nextStatus = 'in_cart';
    else if (item.status === 'in_cart') nextStatus = 'already_have';
    else nextStatus = 'need_to_buy';
    await setGroceryItemStatus(id, nextStatus);
  };

  const clearPurchasedGrocery = async () => {
    if (currentUser && household?.id) {
      try {
        const batch = writeBatch(db);
        groceryItems
          .filter((i) => i.status === 'in_cart')
          .forEach((i) => {
            const ref = doc(db, 'households', household.id, 'groceryItems', i.id);
            batch.update(ref, { status: 'already_have', updatedAt: new Date().toISOString() });
          });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `households/${household.id}/groceryItems`);
      }
    } else {
      setGroceryItems((prev) =>
        prev.map((item) => (item.status === 'in_cart' ? { ...item, status: 'already_have' } : item))
      );
    }
    sounds.playSuccess();
  };

  // Wishlist Handlers
  const addWishlistItem = async (itemData: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased' | 'purchasedAt'>) => {
    const newItem: WishlistItem = {
      ...itemData,
      id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      isPurchased: false,
      createdAt: new Date().toISOString(),
    };

    if (currentUser && household?.id) {
      try {
        await setDoc(doc(db, 'households', household.id, 'wishlistItems', newItem.id), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `households/${household.id}/wishlistItems/${newItem.id}`);
      }
    } else {
      setWishlistItems((prev) => [newItem, ...prev]);
    }
    sounds.playSelect();
  };

  const updateWishlistItem = async (id: string, updates: Partial<WishlistItem>) => {
    if (currentUser && household?.id) {
      try {
        await updateDoc(doc(db, 'households', household.id, 'wishlistItems', id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `households/${household.id}/wishlistItems/${id}`);
      }
    } else {
      setWishlistItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
  };

  const deleteWishlistItem = async (id: string) => {
    if (currentUser && household?.id) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'wishlistItems', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `households/${household.id}/wishlistItems/${id}`);
      }
    } else {
      setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const toggleWishlistPurchased = async (id: string) => {
    const item = wishlistItems.find((w) => w.id === id);
    if (!item) return;

    const willBePurchased = !item.isPurchased;
    const updates: Partial<WishlistItem> = {
      isPurchased: willBePurchased,
      purchasedAt: willBePurchased ? new Date().toISOString() : undefined,
    };

    await updateWishlistItem(id, updates);
    sounds.playSuccess();
  };

  const resetToDefaults = async () => {
    setTasks(INITIAL_TASKS);
    setGroceryItems(INITIAL_GROCERY_ITEMS);
    setWishlistItems(INITIAL_WISHLIST_ITEMS);
    sounds.playSelect();
  };

  const clearAllData = async () => {
    setTasks([]);
    setLogs([]);
    setGroceryItems([]);
    setWishlistItems([]);
  };

  const importData = (imported: { 
    tasks: DomesticTask[]; 
    logs?: TaskCompletionLog[];
    groceryItems?: GroceryItem[];
    wishlistItems?: WishlistItem[];
  }): boolean => {
    if (Array.isArray(imported.tasks)) {
      setTasks(imported.tasks);
      if (Array.isArray(imported.logs)) setLogs(imported.logs);
      if (Array.isArray(imported.groceryItems)) setGroceryItems(imported.groceryItems);
      if (Array.isArray(imported.wishlistItems)) setWishlistItems(imported.wishlistItems);
      return true;
    }
    return false;
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const closeEarnedPointsPopup = () => {
    setEarnedPointsPopup(null);
  };

  // Computed statistics
  const stats = useMemo(() => {
    let overdueCount = 0;
    let dueSoonCount = 0;
    let upToDateCount = 0;

    tasks.forEach((t) => {
      const { status } = computeTaskStatus(t);
      if (status === 'overdue') overdueCount++;
      else if (status === 'due_soon') dueSoonCount++;
      else if (status === 'up_to_date') upToDateCount++;
    });

    const activeTasksCount = tasks.filter((t) => t.frequencyType !== 'as_needed').length;
    const homeHealthScore =
      activeTasksCount === 0
        ? 100
        : Math.round(((upToDateCount + dueSoonCount * 0.5) / activeTasksCount) * 100);

    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const completedThisWeek = logs.filter(
      (l) => new Date(l.completedAt).getTime() >= oneWeekAgo
    ).length;

    const totalMinutesSaved = logs.reduce((acc, l) => acc + (l.minutesSpent || 0), 0);

    const groceryNeededCount = groceryItems.filter((i) => i.status === 'need_to_buy').length;
    const groceryHaveCount = groceryItems.filter((i) => i.status === 'already_have').length;
    const groceryCartTotal = groceryItems
      .filter((i) => i.status === 'need_to_buy' || i.status === 'in_cart')
      .reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);

    let wishlistTotalCurto = 0;
    let wishlistTotalMedio = 0;
    let wishlistTotalLongo = 0;

    wishlistItems.forEach((w) => {
      if (!w.isPurchased) {
        if (w.term === 'curto') wishlistTotalCurto += w.estimatedCost || 0;
        else if (w.term === 'medio') wishlistTotalMedio += w.estimatedCost || 0;
        else if (w.term === 'longo') wishlistTotalLongo += w.estimatedCost || 0;
      }
    });

    return {
      totalTasks: tasks.length,
      overdueCount,
      dueSoonCount,
      upToDateCount,
      homeHealthScore,
      completedThisWeek,
      totalMinutesSaved,
      groceryNeededCount,
      groceryHaveCount,
      groceryCartTotal,
      wishlistTotalCurto,
      wishlistTotalMedio,
      wishlistTotalLongo,
    };
  }, [tasks, logs, groceryItems, wishlistItems]);

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        userProfile,
        household,
        householdMembers,
        isAuthLoading,
        isCloudSyncing,
        loginWithGoogle,
        logout,
        createHousehold,
        joinHousehold,
        leaveHousehold,
        tasks,
        logs,
        groceryItems,
        wishlistItems,
        preferences,
        earnedPointsPopup,
        closeEarnedPointsPopup,
        addTask,
        updateTask,
        deleteTask,
        toggleFavorite,
        completeTask,
        undoCompleteTask,
        addGroceryItem,
        updateGroceryItem,
        deleteGroceryItem,
        setGroceryItemStatus,
        cycleGroceryStatus,
        clearPurchasedGrocery,
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        toggleWishlistPurchased,
        resetToDefaults,
        clearAllData,
        importData,
        updatePreferences,
        stats,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
