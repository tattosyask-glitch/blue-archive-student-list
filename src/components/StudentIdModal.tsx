import { Character, UserCharacterData, getFormalSchoolName } from '../data/characters';
import { X, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';

interface Props {
  character: Character;
  data: UserCharacterData;
  onClose: () => void;
  onSave: (data: UserCharacterData) => void;
}

export function StudentIdModal({ character, data, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<UserCharacterData>(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleChange = (field: keyof UserCharacterData, value: number | boolean) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const getAttackColor = (type?: string) => {
    if (type === '爆発') return 'bg-red-600 text-white';
    if (type === '貫通') return 'bg-amber-500 text-white';
    if (type === '神秘') return 'bg-[var(--color-ba-blue)] text-white';
    if (type === '振動') return 'bg-purple-600 text-white';
    if (type === '分解') return 'bg-[#00897b] text-white';
    return 'bg-[var(--color-ba-gray)] text-[var(--color-ba-navy)]';
  };

  const getDefenseColor = (type?: string) => {
    if (type === '軽装備') return 'bg-red-600 text-white';
    if (type === '重装甲') return 'bg-amber-500 text-white';
    if (type === '特殊装甲') return 'bg-[var(--color-ba-blue)] text-white';
    if (type === '弾力装甲') return 'bg-purple-600 text-white';
    if (type === '複合装甲') return 'bg-[#00897b] text-white';
    return 'bg-[var(--color-ba-gray)] text-[var(--color-ba-navy)]';
  };

  const getRoleColor = (role?: string) => {
    if (role === 'SPECIAL') return 'text-[var(--color-ba-blue)]';
    if (role === 'STRIKER') return 'text-red-600';
    return 'text-[var(--color-ba-navy)]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative flex flex-col md:flex-row">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-[var(--color-ba-light)] transition-colors"
        >
          <X size={20} className="text-[var(--color-ba-navy)]" />
        </button>

        <div className="md:w-1/3 bg-[var(--color-ba-light)] p-6 flex flex-col items-center border-r border-[var(--color-ba-blue)]/20 relative">
          <div className="absolute top-4 left-4 text-[10px] font-black text-[var(--color-ba-blue)]/50 tracking-widest uppercase">Student ID</div>
          <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-md mb-4 bg-white mt-4">
            <img 
              src={character.imageUrl} 
              alt={character.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-black text-[var(--color-ba-navy)] mb-1">{character.name}</h2>
          <p className="text-sm text-[var(--color-ba-blue)] font-bold mb-4">{getFormalSchoolName(character.school)}</p>
          
          <div className="w-full grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="bg-white border border-[var(--color-ba-gray)] rounded p-1.5 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] leading-none font-bold">攻撃</span>
              <span className={`font-bold text-[10px] px-1 py-0.5 rounded-sm w-full whitespace-nowrap ${getAttackColor(character.attackType)}`}>{character.attackType || '-'}</span>
            </div>
            <div className="bg-white border border-[var(--color-ba-gray)] rounded p-1.5 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] leading-none font-bold">防御</span>
              <span className={`font-bold text-[10px] px-1 py-0.5 rounded-sm w-full whitespace-nowrap ${getDefenseColor(character.defenseType)}`}>{character.defenseType || '-'}</span>
            </div>
            <div className="bg-white border border-[var(--color-ba-gray)] rounded p-1.5 text-center flex flex-col items-center justify-center">
              <span className="font-black text-sm text-[var(--color-ba-navy)]">{character.weaponType || '-'}</span>
            </div>
            <div className="col-span-3 flex justify-between bg-white border border-[var(--color-ba-gray)] rounded p-1.5">
              <div className="text-center flex-1">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">役割</span>
                <span className={`font-black text-xs ${getRoleColor(character.role)}`}>{character.role || '-'}</span>
              </div>
              <div className="text-center flex-1 border-l border-[var(--color-ba-gray)]">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">ポジション</span>
                <span className="font-black text-xs text-[var(--color-ba-navy)]">{character.position || '-'}</span>
              </div>
              <div className="text-center flex-1 border-l border-[var(--color-ba-gray)]">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">クラス</span>
                <span className="font-black text-xs text-[var(--color-ba-navy)]">{character.class || '-'}</span>
              </div>
            </div>
            <div className="col-span-3 flex justify-between bg-white border border-[var(--color-ba-gray)] rounded p-1.5">
              <div className="text-center flex-1">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">市街</span>
                <span className="font-black text-[var(--color-ba-navy)]">{character.urban || '-'}</span>
              </div>
              <div className="text-center flex-1 border-l border-[var(--color-ba-gray)]">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">屋外</span>
                <span className="font-black text-[var(--color-ba-navy)]">{character.outdoors || '-'}</span>
              </div>
              <div className="text-center flex-1 border-l border-[var(--color-ba-gray)]">
                <span className="text-[var(--color-ba-navy)] opacity-60 block text-[10px] font-bold">屋内</span>
                <span className="font-black text-[var(--color-ba-navy)]">{character.indoors || '-'}</span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div>
              <label className="text-xs text-[var(--color-ba-navy)] opacity-60 font-black uppercase tracking-wider">Level</label>
              <input 
                type="number" 
                min={1} max={90}
                value={formData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-[var(--color-ba-gray)] rounded-lg px-3 py-2 text-center font-black text-lg text-[var(--color-ba-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-ba-navy)] opacity-60 font-black uppercase tracking-wider">Stars</label>
              <div className="flex justify-center gap-1 bg-white border border-[var(--color-ba-gray)] rounded-lg p-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleChange('stars', star)}
                    className={`p-1 rounded-md transition-colors ${formData.stars >= star ? 'text-[var(--color-ba-gold)]' : 'text-[var(--color-ba-gray)] hover:text-[var(--color-ba-gold)]/50'}`}
                  >
                    <Star size={20} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 p-6 bg-white flex flex-col gap-6 relative">
          {!auth.currentUser && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-50 text-yellow-800 text-xs text-center py-1 font-bold border-b border-yellow-200">
              ※ログインしていないため、変更は保存されません
            </div>
          )}
          <div className="border-b border-[var(--color-ba-gray)] pb-2 mt-2">
            <h3 className="text-lg font-black text-[var(--color-ba-navy)] flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--color-ba-blue)] rounded-full"></span>
              生徒情報
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-[var(--color-ba-navy)] border-b border-[var(--color-ba-gray)] pb-1">スキル</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <SkillInput label="EX" value={formData.exSkill} max={5} onChange={(v) => handleChange('exSkill', v)} />
                <SkillInput label="NS" value={formData.nsSkill} max={10} onChange={(v) => handleChange('nsSkill', v)} />
                <SkillInput label="PS" value={formData.psSkill} max={10} onChange={(v) => handleChange('psSkill', v)} />
                <SkillInput label="SS" value={formData.ssSkill} max={10} onChange={(v) => handleChange('ssSkill', v)} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-[var(--color-ba-navy)] border-b border-[var(--color-ba-gray)] pb-1">装備・武器</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--color-ba-navy)]">固有武器</span>
                  <input 
                    type="number" min={0} max={50}
                    value={formData.weaponLevel}
                    onChange={(e) => handleChange('weaponLevel', parseInt(e.target.value) || 0)}
                    className="w-16 bg-[var(--color-ba-bg)] border border-[var(--color-ba-gray)] rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--color-ba-navy)]">愛用品</span>
                  <select 
                    value={formData.favoriteItemLevel}
                    onChange={(e) => handleChange('favoriteItemLevel', parseInt(e.target.value))}
                    className="w-16 bg-[var(--color-ba-bg)] border border-[var(--color-ba-gray)] rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
                  >
                    <option value={0}>T0</option>
                    <option value={1}>T1</option>
                    <option value={2}>T2</option>
                  </select>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-[var(--color-ba-navy)] opacity-60 font-black block mb-1">装備</span>
                  <div className="flex gap-2">
                    <GearInput value={formData.gear1Level} onChange={(v) => handleChange('gear1Level', v)} />
                    <GearInput value={formData.gear2Level} onChange={(v) => handleChange('gear2Level', v)} />
                    <GearInput value={formData.gear3Level} onChange={(v) => handleChange('gear3Level', v)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 col-span-2">
              <h4 className="text-sm font-black text-[var(--color-ba-navy)] border-b border-[var(--color-ba-gray)] pb-1">能力解放</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <PotentialInput label="最大ＨＰ" value={formData.potentialHp || 0} onChange={(v) => handleChange('potentialHp', v)} />
                <PotentialInput label="攻撃力" value={formData.potentialAtk || 0} onChange={(v) => handleChange('potentialAtk', v)} />
                <PotentialInput label="治癒力" value={formData.potentialHeal || 0} onChange={(v) => handleChange('potentialHeal', v)} />
              </div>
            </div>

            <div className="space-y-4 col-span-2">
              <h4 className="text-sm font-black text-[var(--color-ba-navy)] border-b border-[var(--color-ba-gray)] pb-1">絆</h4>
              
              <div className="flex items-center gap-4 bg-[var(--color-ba-bg)] p-3 rounded-lg border border-[var(--color-ba-gray)]">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xl leading-none">♥</span>
                  <span className="text-sm font-bold text-[var(--color-ba-navy)]">絆ランク</span>
                </div>
                <input 
                  type="range" 
                  min={1} max={100}
                  value={formData.bondRank || 1}
                  onChange={(e) => handleChange('bondRank', parseInt(e.target.value) || 1)}
                  className="flex-1 accent-red-500"
                />
                <input 
                  type="number" min={1} max={100}
                  value={formData.bondRank || 1}
                  onChange={(e) => handleChange('bondRank', parseInt(e.target.value) || 1)}
                  className="w-16 bg-white border border-[var(--color-ba-gray)] rounded-md px-2 py-1 text-center font-black text-[var(--color-ba-navy)] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillInput({ label, value, max, onChange }: { label: string, value: number, max: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-[var(--color-ba-navy)] opacity-60 font-black mb-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-[var(--color-ba-bg)] border border-[var(--color-ba-gray)] rounded-md px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n === max ? 'MAX' : `Lv.${n}`}</option>
        ))}
      </select>
    </div>
  );
}

function GearInput({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex-1 flex items-center bg-[var(--color-ba-bg)] border border-[var(--color-ba-gray)] rounded-md overflow-hidden">
      <span className="px-2 py-1 text-xs font-black text-[var(--color-ba-navy)] opacity-40 bg-[var(--color-ba-gray)]/30 border-r border-[var(--color-ba-gray)]">T</span>
      <select 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        className="w-full px-1 py-1 text-sm font-bold text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n === 10 ? 'MAX' : n}</option>
        ))}
      </select>
    </div>
  );
}

function PotentialInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-[var(--color-ba-navy)] opacity-60 font-black mb-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-[var(--color-ba-bg)] border border-[var(--color-ba-gray)] rounded-md px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-ba-blue)]"
      >
        {Array.from({ length: 26 }, (_, i) => i).map(n => (
          <option key={n} value={n}>Lv.{n}</option>
        ))}
      </select>
    </div>
  );
}
