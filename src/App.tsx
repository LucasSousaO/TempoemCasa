import React, { useState, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { Navbar, NavTab } from './components/Navbar';
import { RouletteView } from './components/RouletteView';
import { TaskList } from './components/TaskList';
import { ShoppingView } from './components/ShoppingView';
import { LeaderboardView } from './components/LeaderboardView';
import { HomeHealthDashboard } from './components/HomeHealthDashboard';
import { TaskModal } from './components/TaskModal';
import { GroceryModal } from './components/GroceryModal';
import { WishlistModal } from './components/WishlistModal';
import { ActiveTimerModal } from './components/ActiveTimerModal';
import { SettingsModal } from './components/SettingsModal';
import { FamilySyncModal } from './components/FamilySyncModal';
import { EarnedPointsModal } from './components/EarnedPointsModal';
import { DomesticTask, GroceryItem, WishlistItem, RoomCategory } from './types';

function MainApp() {
  const { 
    addTask, 
    updateTask, 
    completeTask, 
    addGroceryItem, 
    updateGroceryItem, 
    addWishlistItem, 
    updateWishlistItem, 
    preferences 
  } = useTaskContext();

  const [currentTab, setCurrentTab] = useState<NavTab>('roulette');

  // Task Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DomesticTask | null>(null);

  // Grocery Modal states
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [editingGrocery, setEditingGrocery] = useState<GroceryItem | null>(null);

  // Wishlist Modal states
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<WishlistItem | null>(null);

  // Focus Timer, Settings & Family Sync Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<DomesticTask | null>(null);

  // Detect URL parameter for family invite (e.g. ?house=CASA-1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const houseParam = params.get('house');
    if (houseParam) {
      setIsFamilyModalOpen(true);
    }
  }, []);

  const handleOpenNewFromNavbar = () => {
    if (currentTab === 'shopping') {
      setEditingGrocery(null);
      setIsGroceryModalOpen(true);
    } else {
      setEditingTask(null);
      setIsTaskModalOpen(true);
    }
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: DomesticTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<DomesticTask, 'id' | 'createdAt' | 'completedCount'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  // Grocery handlers
  const handleOpenAddGrocery = () => {
    setEditingGrocery(null);
    setIsGroceryModalOpen(true);
  };

  const handleEditGrocery = (item: GroceryItem) => {
    setEditingGrocery(item);
    setIsGroceryModalOpen(true);
  };

  const handleSaveGrocery = (itemData: Omit<GroceryItem, 'id' | 'updatedAt'>) => {
    if (editingGrocery) {
      updateGroceryItem(editingGrocery.id, itemData);
    } else {
      addGroceryItem(itemData);
    }
  };

  // Wishlist handlers
  const handleOpenAddWishlist = () => {
    setEditingWishlist(null);
    setIsWishlistModalOpen(true);
  };

  const handleEditWishlist = (item: WishlistItem) => {
    setEditingWishlist(item);
    setIsWishlistModalOpen(true);
  };

  const handleSaveWishlist = (itemData: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased' | 'purchasedAt'>) => {
    if (editingWishlist) {
      updateWishlistItem(editingWishlist.id, itemData);
    } else {
      addWishlistItem(itemData);
    }
  };

  const handleStartTimer = (task: DomesticTask) => {
    setActiveTimerTask(task);
  };

  const handleCompleteFromTimer = (taskId: string, minutes: number) => {
    completeTask(taskId, minutes);
  };

  const isMobileFrame = preferences.viewMode === 'mobile';

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white ${isMobileFrame ? 'sm:py-6' : ''}`}>
      {/* Outer shell (Mock phone styling on desktop if mobile view mode is active) */}
      <div 
        className={`mx-auto w-full transition-all duration-300 flex-1 flex flex-col ${
          isMobileFrame 
            ? 'sm:max-w-md sm:bg-white sm:rounded-[36px] sm:shadow-2xl sm:border-8 sm:border-slate-800/90 sm:overflow-hidden relative min-h-[840px]' 
            : 'max-w-3xl bg-slate-50 min-h-screen'
        }`}
      >
        {/* iOS status bar pill indicator on desktop frame */}
        {isMobileFrame && (
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-white">
            <div className="w-28 h-4 bg-slate-800 rounded-full" />
          </div>
        )}

        {/* Navigation & Header */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewTask={handleOpenNewFromNavbar}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFamilyModal={() => setIsFamilyModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 py-5 pb-24 overflow-y-auto">
          {currentTab === 'roulette' && (
            <RouletteView
              onStartTimer={handleStartTimer}
              onOpenNewTaskModal={handleOpenNewTask}
            />
          )}

          {currentTab === 'tasks' && (
            <TaskList
              onAddTask={handleOpenNewTask}
              onEditTask={handleEditTask}
              onQuickStart={handleStartTimer}
            />
          )}

          {currentTab === 'shopping' && (
            <ShoppingView
              onOpenAddGrocery={handleOpenAddGrocery}
              onEditGrocery={handleEditGrocery}
              onOpenAddWishlist={handleOpenAddWishlist}
              onEditWishlist={handleEditWishlist}
            />
          )}

          {currentTab === 'ranking' && (
            <LeaderboardView
              onOpenFamilyModal={() => setIsFamilyModalOpen(true)}
            />
          )}

          {currentTab === 'routine' && (
            <HomeHealthDashboard
              onSelectRoomFilter={(_room: RoomCategory) => {
                setCurrentTab('tasks');
              }}
              onGoToChoreDraw={() => setCurrentTab('roulette')}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      <GroceryModal
        isOpen={isGroceryModalOpen}
        onClose={() => {
          setIsGroceryModalOpen(false);
          setEditingGrocery(null);
        }}
        onSave={handleSaveGrocery}
        initialItem={editingGrocery}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => {
          setIsWishlistModalOpen(false);
          setEditingWishlist(null);
        }}
        onSave={handleSaveWishlist}
        initialItem={editingWishlist}
      />

      {activeTimerTask && (
        <ActiveTimerModal
          task={activeTimerTask}
          onClose={() => setActiveTimerTask(null)}
          onComplete={handleCompleteFromTimer}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <FamilySyncModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />

      <EarnedPointsModal />
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <MainApp />
    </TaskProvider>
  );
}
