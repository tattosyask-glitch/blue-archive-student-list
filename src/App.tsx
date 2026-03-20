import { useEffect, useState, useMemo } from 'react';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { CHARACTERS, UserCharacterData, defaultUserCharacter, Character, getFormalSchoolName } from './data/characters';
import { CharacterCard } from './components/CharacterCard';
import { StudentIdModal } from './components/StudentIdModal';
import { LogIn, LogOut, Loader2, Search, Filter, ArrowDownAZ, ArrowUpZA, ArrowDown10, ArrowUp01, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from './lib/error';
import { cn } from './lib/utils';

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
          if (data && data.length > 0) {
            setCharactersList(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch characters from API, using fallback", err);
      }
    }
    fetchCharacters();
  }, []);

  const handleSyncCharacters = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/characters/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Re-fetch list
          const listRes = await fetch('/api/characters');
          if (listRes.ok) {
            const listData = await listRes.json();
            if (listData && listData.length > 0) {
              setCharactersList(listData);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync characters", err);
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
        case '爆発':
        case '軽装備':
          return 'text-red-600 font-bold';
        case '貫通':
        case '重装甲':
          return 'text-yellow-600 font-bold';
        case '神秘':
        case '特殊装甲':
          return 'text-blue-600 font-bold';
        case '振動':
        case '弾力装甲':
          return 'text-purple-600 font-bold';
        case '分解':
        case '複合装甲':
          return 'text-[#00897B] font-bold';
        default:
          return '';
      }
    } else if (category === 'role' || category === 'position') {
      switch (type.toLowerCase()) {
        case 'striker':
        case 'ストライカー':
          return 'text-red-600 font-bold';
        case 'special':
        case 'スペシャル':
          return 'text-blue-600 font-bold';
        case 'アタッカー':
          return 'text-red-600 font-bold';
        case 'タンク':
          return 'text-blue-600 font-bold';
        case 'ヒーラー':
          return 'text-green-600 font-bold';
        case 'サポーター':
          return 'text-yellow-600 font-bold';
        case 't.s':
        case 't.s.':
          return 'text-purple-600 font-bold';
        default:
          return '';
      }
    }
    return '';
  };

  const ownedCount = useMemo(() => {
    return charactersList.filter(c => userCharacters[c.id]?.isOwned).length;
  }, [charactersList, userCharacters]);

  const ownershipRate = charactersList.length > 0 
    ? ((ownedCount / charactersList.length) * 100).toFixed(1) 
    : '0.0';

  const filteredAndSortedCharacters = useMemo(() => {
    let result = [...charactersList];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.school.toLowerCase().includes(q) ||
        getFormalSchoolName(c.school).toLowerCase().includes(q)
      );
    }

    // Filter School
    if (filterSchool !== 'all') {
      if (filterSchool === 'コラボ') {
        result = result.filter(c => getSchoolGroup(c.school) === 'コラボ');
      } else {
        result = result.filter(c => c.school === filterSchool);
      }
    }

    // Filter Stars
    if (filterStars !== 'all') {
      result = result.filter(c => c.defaultStars === Number(filterStars));
    }

    // Filter Ownership
    if (filterOwnership !== 'all') {
      result = result.filter(c => {
        const isOwned = userCharacters[c.id]?.isOwned || false;
        return filterOwnership === 'owned' ? isOwned : !isOwned;
      });
    }

    if (filterAttack !== 'all') result = result.filter(c => c.attackType === filterAttack);
    if (filterDefense !== 'all') result = result.filter(c => c.defenseType === filterDefense);
    if (filterWeapon !== 'all') result = result.filter(c => c.weaponType === filterWeapon);
    if (filterRole !== 'all') result = result.filter(c => c.role === filterRole);
    if (filterPosition !== 'all') result = result.filter(c => c.position === filterPosition);
    if (filterClass !== 'all') result = result.filter(c => c.class === filterClass);

    // Sort
    result.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      const dataA = { ...defaultUserCharacter(a.id, a.defaultStars), ...(userCharacters[a.id] || {}) };
      const dataB = { ...defaultUserCharacter(b.id, b.defaultStars), ...(userCharacters[b.id] || {}) };

      if (sortBy === 'default') {
        const groupA = getSchoolGroup(a.school);
        const groupB = getSchoolGroup(b.school);
        if (groupA !== groupB) {
          const catA = getSchoolCategory(groupA);
          const catB = getSchoolCategory(groupB);
          if (catA !== catB) {
            return sortDesc ? catB - catA : catA - catB;
          }
          return groupA < groupB ? (sortDesc ? 1 : -1) : (sortDesc ? -1 : 1);
        }
        valA = a.name;
        valB = b.name;
      } else {
        switch (sortBy) {
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'rarity':
            valA = a.defaultStars;
            valB = b.defaultStars;
            break;
          case 'level':
            valA = dataA.isOwned ? dataA.level : -1;
            valB = dataB.isOwned ? dataB.level : -1;
            break;
          case 'stars':
            valA = dataA.isOwned ? dataA.stars : -1;
            valB = dataB.isOwned ? dataB.stars : -1;
            break;
          default:
            valA = a.name;
            valB = b.name;
        }
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    return result;
  }, [userCharacters, searchQuery, filterSchool, filterStars, filterOwnership, filterAttack, filterDefense, filterWeapon, filterRole, filterPosition, filterClass, sortBy, sortDesc, charactersList]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) {
      setUserCharacters({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = `users/${user.uid}/characters`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const data: Record<string, UserCharacterData> = {};
        snapshot.docs.forEach((doc) => {
          data[doc.id] = doc.data() as UserCharacterData;
        });
        setUserCharacters(data);
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleSaveCharacter = async (data: UserCharacterData) => {
    if (!user) return;
    
    setUserCharacters(prev => ({ ...prev, [data.characterId]: data }));
    
    const path = `users/${user.uid}/characters/${data.characterId}`;
    try {
      await setDoc(doc(db, `users/${user.uid}/characters`, data.characterId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const toggleOwned = (characterId: string, defaultStars: number) => {
    if (!user) return;
    const existingData = userCharacters[characterId] || {};
    const currentData = { ...defaultUserCharacter(characterId, defaultStars), ...existingData };
    handleSaveCharacter({ ...currentData, isOwned: !currentData.isOwned });
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="fixed inset-0 z-[-1] bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat bg-fixed opacity-60"></div>
        <Loader2 className="animate-spin text-[var(--color-ba-blue)]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--color-ba-navy)] font-sans relative">
      <div className="fixed inset-0 z-[-1] bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat bg-fixed opacity-60"></div>
      <header className="bg-white/90 backdrop-blur-sm border-b-4 border-[var(--color-ba-blue)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-end gap-3">
            <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" referrerPolicy="no-referrer" />
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ba-blue)] tracking-wider italic leading-none mb-1" style={{ fontFamily: '"ロゴアール Std", "Logo Ar Std", sans-serif' }}>生徒名簿</h1>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-[var(--color-ba-blue)]" referrerPolicy="no-referrer" />
                <span className="text-sm font-bold hidden sm:block">{user.displayName}</span>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-[var(--color-ba-navy)] hover:bg-[var(--color-ba-gray)] rounded-full transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">ログアウト</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--color-ba-blue)] hover:bg-[var(--color-ba-blue-dark)] text-white text-sm font-bold rounded-full transition-colors shadow-md"
            >
              <LogIn size={16} />
              ログインして保存
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!user && (
          <div className="bg-[var(--color-ba-light)] border border-[var(--color-ba-blue)]/30 rounded-xl p-4 mb-8 text-[var(--color-ba-blue-dark)] text-sm font-bold flex items-center gap-3 shadow-sm">
            <LogIn size={20} className="text-[var(--color-ba-blue)] flex-shrink-0" />
            <p>ログインすると、キャラクターの所持状況や育成データを保存できます。</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[var(--color-ba-blue)]" size={40} />
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-ba-gray)] mb-6 flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
                <div className="relative w-full lg:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-[var(--color-ba-navy)] opacity-40" />
                  </div>
                  <input
                    type="text"
                    placeholder="キャラクター名や学校名で検索..."
                    className="block w-full pl-10 pr-3 py-2 border border-[var(--color-ba-gray)] rounded-lg focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-[var(--color-ba-bg)] hover:bg-[var(--color-ba-gray)] text-[var(--color-ba-navy)] text-sm font-bold rounded-lg transition-colors border border-[var(--color-ba-gray)] flex-1 sm:flex-none"
                  >
                    <Filter size={16} className="opacity-80" />
                    <span>絞り込み</span>
                    {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="flex gap-2 flex-1 sm:flex-none min-w-[140px]">
                    <select
                      className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="default">デフォルト</option>
                      <option value="name">名前順</option>
                      <option value="rarity">初期レア順</option>
                      <option value="level">レベル順</option>
                      <option value="stars">現在レア順</option>
                    </select>
                    <button
                      onClick={() => setSortDesc(!sortDesc)}
                      className="p-2 border border-[var(--color-ba-gray)] bg-white rounded-lg hover:bg-[var(--color-ba-light)] text-[var(--color-ba-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)] shrink-0"
                      title="並び順を反転"
                    >
                      {sortDesc ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSyncCharacters}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-ba-bg)] hover:bg-[var(--color-ba-gray)] text-[var(--color-ba-navy)] text-sm font-bold rounded-lg transition-colors border border-[var(--color-ba-gray)] disabled:opacity-50 flex-1 sm:flex-none"
                    title="Wikiから最新のキャラクター情報を取得します"
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">キャラ情報更新</span>
                  </button>
                </div>
              </div>
              
              {isFilterOpen && (
                <div className="space-y-3 mt-3 pt-3 border-t border-[var(--color-ba-gray)]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <select
                  className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                >
                  <option value="all">学校</option>
                  {schools.map(school => (
                    <option key={school} value={school}>{getFormalSchoolName(school)}</option>
                  ))}
                </select>

                <select
                  className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                  value={filterStars}
                  onChange={(e) => setFilterStars(e.target.value)}
                >
                  <option value="all">レアリティ</option>
                  <option value="3">★3</option>
                  <option value="2">★2</option>
                  <option value="1">★1</option>
                </select>

                <select
                  className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                  value={filterOwnership}
                  onChange={(e) => setFilterOwnership(e.target.value)}
                >
                  <option value="all">所持状況</option>
                  <option value="owned">所持のみ</option>
                  <option value="unowned">未所持のみ</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <select
                  className={cn(
                    "block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm",
                    filterAttack !== 'all' ? getTypeColorClass(filterAttack, 'attack') : ""
                  )}
                  value={filterAttack}
                  onChange={(e) => setFilterAttack(e.target.value)}
                >
                  <option value="all" className="text-black font-normal">攻撃</option>
                  {attackTypes.map(type => (
                    <option key={type} value={type} className={getTypeColorClass(type, 'attack')}>{type}</option>
                  ))}
                </select>

                <select
                  className={cn(
                    "block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm",
                    filterDefense !== 'all' ? getTypeColorClass(filterDefense, 'defense') : ""
                  )}
                  value={filterDefense}
                  onChange={(e) => setFilterDefense(e.target.value)}
                >
                  <option value="all" className="text-black font-normal">防御</option>
                  {defenseTypes.map(type => (
                    <option key={type} value={type} className={getTypeColorClass(type, 'defense')}>{type}</option>
                  ))}
                </select>

                <select
                  className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                  value={filterWeapon}
                  onChange={(e) => setFilterWeapon(e.target.value)}
                >
                  <option value="all">武器種</option>
                  {weaponTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  className={cn(
                    "block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm",
                    filterRole !== 'all' ? getTypeColorClass(filterRole, 'role') : ""
                  )}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all" className="text-black font-normal">役割</option>
                  {roles.map(role => (
                    <option key={role} value={role} className={getTypeColorClass(role, 'role')}>{role}</option>
                  ))}
                </select>

                <select
                  className={cn(
                    "block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm",
                    filterPosition !== 'all' ? getTypeColorClass(filterPosition, 'position') : ""
                  )}
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                >
                  <option value="all" className="text-black font-normal">ポジション</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos} className={getTypeColorClass(pos, 'position')}>{pos}</option>
                  ))}
                </select>

                <select
                  className="block w-full py-2 px-3 border border-[var(--color-ba-gray)] bg-white rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-ba-blue)] focus:border-[var(--color-ba-blue)] sm:text-sm"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="all">クラス</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-[var(--color-ba-navy)] opacity-60 font-bold">
              表示件数: {filteredAndSortedCharacters.length} / {charactersList.length}
            </div>
            <div className="text-sm text-[var(--color-ba-navy)] opacity-80 font-bold">
              所持率: {ownedCount} / {charactersList.length} ({ownershipRate}%)
            </div>
          </div>

            {sortBy === 'default' ? (
              <div className="space-y-8">
                {Array.from(new Set<string>(filteredAndSortedCharacters.map(c => getSchoolGroup(c.school)))).map(schoolGroup => {
                  const schoolChars = filteredAndSortedCharacters.filter(c => getSchoolGroup(c.school) === schoolGroup);
                  if (schoolChars.length === 0) return null;
                  return (
                    <div key={schoolGroup}>
                      <h2 className="text-xl font-bold text-[var(--color-ba-navy)] mb-4 pb-2 border-b-2 border-[var(--color-ba-blue)] flex items-center gap-2">
                        {schoolGroup === 'コラボ' ? 'コラボ' : getFormalSchoolName(schoolGroup)}
                        <span className="text-sm font-normal opacity-60">({schoolChars.length})</span>
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {schoolChars.map(char => (
                          <CharacterCard 
                            key={char.id}
                            character={char}
                            data={{ ...defaultUserCharacter(char.id, char.defaultStars), ...(userCharacters[char.id] || {}) }}
                            onToggleOwned={() => toggleOwned(char.id, char.defaultStars)}
                            onOpenDetails={() => setSelectedCharacter(char)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAndSortedCharacters.map(char => (
                  <CharacterCard 
                    key={char.id}
                    character={char}
                    data={{ ...defaultUserCharacter(char.id, char.defaultStars), ...(userCharacters[char.id] || {}) }}
                    onToggleOwned={() => toggleOwned(char.id, char.defaultStars)}
                    onOpenDetails={() => setSelectedCharacter(char)}
                  />
                ))}
              </div>
            )}
            
            {filteredAndSortedCharacters.length === 0 && (
              <div className="text-center py-12 text-[var(--color-ba-navy)] opacity-60 font-bold">
                条件に一致するキャラクターが見つかりませんでした。
              </div>
            )}
          </>
        )}
      </main>

      {selectedCharacter && (
        <StudentIdModal 
          character={selectedCharacter}
          data={{ ...defaultUserCharacter(selectedCharacter.id, selectedCharacter.defaultStars), ...(userCharacters[selectedCharacter.id] || {}) }}
          onClose={() => setSelectedCharacter(null)}
          onSave={handleSaveCharacter}
        />
      )}
    </div>
  );
}
