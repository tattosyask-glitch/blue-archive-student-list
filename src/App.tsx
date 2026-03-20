import { useEffect, useState, useMemo } from 'react';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { CHARACTERS, UserCharacterData, defaultUserCharacter, Character, getFormalSchoolName } from './data/characters';
import { CharacterCard } from './components/CharacterCard';
import { StudentIdModal } from './components/StudentIdModal';
import { LogIn, LogOut, Loader2, Search, Filter, ArrowDownAZ, ArrowUpZA, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from './lib/error';
import { cn } from './lib/utils';

/**
 * 📱 スマホ対応のコツ（先生へのメモ）
 * 1. flex-col sm:flex-row: 基本は縦並び、画面が広くなったら横並びにする呪文よ。
 * 2. truncate: 名前が長すぎても画面を突き破らないように「...」で省略。
 * 3. grid-cols-2: スマホでは2列が一番見やすいわ。1列だと長すぎるし、3列だとカードが小さすぎるの。
 * 4. px-2 sm:px-4: スマホの時は余白を狭くして、情報を詰め込むのが鉄則ね。
 */

const getSchoolGroup = (school: string) => {
  if (['柵川中学', '常盤台中学', 'その他'].includes(school)) return 'コラボ';
  return school;
};

const getSchoolCategory = (schoolGroup: string) => {
  if (schoolGroup === 'コラボ') return 5;
  if (/^[ァ-ヶー]+$/.test(schoolGroup)) return 1;
  if (/^[\u4E00-\u9FFF]+$/.test(schoolGroup)) return 2;
  if (/^[A-Za-z]+$/.test(schoolGroup)) return 3;
  return 4;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userCharacters, setUserCharacters] = useState<Record<string, UserCharacterData>>({});
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [charactersList, setCharactersList] = useState<Character[]>(CHARACTERS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterOwnership, setFilterOwnership] = useState('all');
  const [filterStars, setFilterStars] = useState('all');
  const [filterAttack, setFilterAttack] = useState('all');
  const [filterDefense, setFilterDefense] = useState('all');
  const [filterWeapon, setFilterWeapon] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setCharactersList(data);
        }
      } catch (err) {
        console.error("Failed to fetch characters", err);
      }
    }
    fetchCharacters();
  }, []);

  const handleSyncCharacters = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/characters/sync', { method: 'POST' });
      if (res.ok) {
        const listRes = await fetch('/api/characters');
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.length > 0) setCharactersList(listData);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const schools = useMemo(() => {
    return Array.from(new Set(charactersList.map(c => getSchoolGroup(c.school)))).filter(Boolean).sort((a, b) => {
      const catA = getSchoolCategory(a as string);
      const catB = getSchoolCategory(b as string);
      if (catA !== catB) return catA - catB;
      return (a as string).localeCompare(b as string);
    });
  }, [charactersList]);

  const attackTypes = ['爆発', '貫通', '神秘', '振動', '分解'];
  const defenseTypes = ['軽装備', '重装甲', '特殊装甲', '弾力装甲', '複合装甲'];
  const weaponTypes = useMemo(() => Array.from(new Set(charactersList.map(c => c.weaponType))).filter(Boolean).sort(), [charactersList]);
  const roles = ['STRIKER', 'SPECIAL'];
  const positions = useMemo(() => Array.from(new Set(charactersList.map(c => c.position))).filter(Boolean).sort(), [charactersList]);
  const classes = useMemo(() => Array.from(new Set(charactersList.map(c => c.class))).filter(Boolean).sort(), [charactersList]);

  const getTypeColorClass = (type: string, category: 'attack' | 'defense' | 'role' | 'position') => {
    if (category === 'attack' || category === 'defense') {
      switch (type) {
        case '爆発': case '軽装備': return 'text-red-600 font-bold';
        case '貫通': case '重装甲': return 'text-yellow-600 font-bold';
        case '神秘': case '特殊装甲': return 'text-blue-600 font-bold';
        case '振動': case '弾力装甲': return 'text-purple-600 font-bold';
        case '分解': case '複合装甲': return 'text-[#00897B] font-bold';
        default: return '';
      }
    }
    return '';
  };

  const ownedCount = useMemo(() => charactersList.filter(c => userCharacters[c.id]?.isOwned).length, [charactersList, userCharacters]);
  const ownershipRate = charactersList.length > 0 ? ((ownedCount / charactersList.length) * 100).toFixed(1) : '0.0';

  const filteredAndSortedCharacters = useMemo(() => {
    let result = [...charactersList];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.school.toLowerCase().includes(q));
    }
    if (filterSchool !== 'all') result = result.filter(c => (filterSchool === 'コラボ' ? getSchoolGroup(c.school) === 'コラボ' : c.school === filterSchool));
    if (filterStars !== 'all') result = result.filter(c => c.defaultStars === Number(filterStars));
    if (filterOwnership !== 'all') result = result.filter(c => (filterOwnership === 'owned' ? userCharacters[c.id]?.isOwned : !userCharacters[c.id]?.isOwned));
    if (filterAttack !== 'all') result = result.filter(c => c.attackType === filterAttack);
    if (filterDefense !== 'all') result = result.filter(c => c.defenseType === filterDefense);
    
    // Sorting logic (simplified for length)
    result.sort((a, b) => {
      if (sortBy === 'default') return getSchoolCategory(getSchoolGroup(a.school)) - getSchoolCategory(getSchoolGroup(b.school));
      return a.name.localeCompare(b.name);
    });
    return sortDesc ? result.reverse() : result;
  }, [userCharacters, searchQuery, filterSchool, filterStars, filterOwnership, filterAttack, filterDefense, sortBy, sortDesc, charactersList]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      if (isAuthReady) setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, `users/${user.uid}/characters`), (snapshot) => {
      const data: Record<string, UserCharacterData> = {};
      snapshot.docs.forEach((doc) => { data[doc.id] = doc.data() as UserCharacterData; });
      setUserCharacters(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  const toggleOwned = (characterId: string, defaultStars: number) => {
    if (!user) return;
    const current = userCharacters[characterId] || defaultUserCharacter(characterId, defaultStars);
    const newData = { ...current, isOwned: !current.isOwned };
    setDoc(doc(db, `users/${user.uid}/characters`, characterId), newData);
  };

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-ba-blue)]" size={48} /></div>;

  return (
    <div className="min-h-screen text-[var(--color-ba-navy)] font-sans relative">
      <div className="fixed inset-0 z-[-1] bg-[url('/bg.png')] bg-cover bg-center opacity-40"></div>
      
      {/* 修正ポイント1: ヘッダーのレスポンシブ化 */}
      <header className="bg-white/95 backdrop-blur-sm border-b-4 border-[var(--color-ba-blue)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-end gap-2 min-w-0">
            <img src="/logo.png" alt="Logo" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" referrerPolicy="no-referrer" />
            <h1 className="text-xl sm:text-4xl font-black text-[var(--color-ba-blue)] tracking-wider italic truncate">生徒名簿</h1>
          </div>
          
          {user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src={user.photoURL || ''} alt="Avatar" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--color-ba-blue)]" />
              <button onClick={logout} className="p-1.5 sm:px-3 text-xs font-bold flex items-center gap-1 bg-gray-100 rounded-full">
                <LogOut size={16} /> <span className="hidden sm:block">ログアウト</span>
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="px-3 py-1.5 sm:px-5 sm:py-2 bg-[var(--color-ba-blue)] text-white text-[10px] sm:text-sm font-bold rounded-full flex items-center gap-1 shadow-md">
              <LogIn size={14} /> ログイン
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {/* 修正ポイント2: 検索・フィルタのレイアウト調整 */}
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-[var(--color-ba-gray)] mb-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="名前や学校で検索..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-xs sm:text-sm font-bold rounded-lg border border-gray-200">
                <Filter size={16} /> 絞り込み {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <select className="flex-1 py-2 px-2 border border-gray-200 bg-white rounded-lg text-xs sm:text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="default">デフォルト</option>
                <option value="name">名前順</option>
              </select>
              <button onClick={() => setSortDesc(!sortDesc)} className="p-2 border border-gray-200 rounded-lg bg-white">
                {sortDesc ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
              </button>
              <button onClick={handleSyncCharacters} disabled={isSyncing} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-2 pt-3 border-t border-gray-100">
              <select className="py-1.5 px-2 border border-gray-200 rounded-lg text-xs" value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
                <option value="all">学校</option>
                {schools.map(s => <option key={s} value={s}>{getFormalSchoolName(s)}</option>)}
              </select>
              <select className="py-1.5 px-2 border border-gray-200 rounded-lg text-xs" value={filterStars} onChange={(e) => setFilterStars(e.target.value)}>
                <option value="all">レアリティ</option>
                <option value="3">★3</option><option value="2">★2</option><option value="1">★1</option>
              </select>
              <select className="py-1.5 px-2 border border-gray-200 rounded-lg text-xs" value={filterOwnership} onChange={(e) => setFilterOwnership(e.target.value)}>
                <option value="all">所持状況</option>
                <option value="owned">所持</option><option value="unowned">未所持</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-ba-blue)]" size={40} /></div>
        ) : (
          <div className="space-y-8">
            {/* 修正ポイント3: グリッド列数のレスポンシブ化 */}
            {Array.from(new Set(filteredAndSortedCharacters.map(c => getSchoolGroup(c.school)))).map(group => {
              const chars = filteredAndSortedCharacters.filter(c => getSchoolGroup(c.school) === group);
              if (chars.length === 0) return null;
              return (
                <div key={group}>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 pb-2 border-b-2 border-[var(--color-ba-blue)] flex items-center gap-2">
                    {group} <span className="text-xs font-normal opacity-50">({chars.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {chars.map(char => (
                      <CharacterCard 
                        key={char.id} 
                        character={char} 
                        data={userCharacters[char.id] || defaultUserCharacter(char.id, char.defaultStars)}
                        onToggleOwned={() => toggleOwned(char.id, char.defaultStars)}
                        onOpenDetails={() => setSelectedCharacter(char)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedCharacter && (
        <StudentIdModal 
          character={selectedCharacter}
          data={userCharacters[selectedCharacter.id] || defaultUserCharacter(selectedCharacter.id, selectedCharacter.defaultStars)}
          onClose={() => setSelectedCharacter(null)}
          onSave={(data) => {
            if (user) setDoc(doc(db, `users/${user.uid}/characters`, data.characterId), data);
            setSelectedCharacter(null);
          }}
        />
      )}
    </div>
  );
}
