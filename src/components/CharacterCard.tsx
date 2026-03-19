import { Character, UserCharacterData } from '../data/characters';
import { cn } from '../lib/utils';
import { Star } from 'lucide-react';

interface Props {
  key?: string | number;
  character: Character;
  data: UserCharacterData;
  onToggleOwned: () => void;
  onOpenDetails: () => void;
}

export function CharacterCard({ character, data, onToggleOwned, onOpenDetails }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--color-ba-gray)] overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-[var(--color-ba-blue)] transition-all duration-200">
      <div 
        className="relative aspect-square cursor-pointer group bg-[var(--color-ba-bg)]"
        onClick={onToggleOwned}
      >
        <img 
          src={character.imageUrl} 
          alt={character.name}
          referrerPolicy="no-referrer"
          className={cn(
            "w-full h-full object-cover transition-all duration-200",
            !data.isOwned && "opacity-40 grayscale"
          )}
        />
      </div>
      
      <div 
        className="p-3 flex flex-col gap-1 cursor-pointer hover:bg-[var(--color-ba-light)] transition-colors flex-1"
        onClick={onOpenDetails}
      >
        <h3 className="font-bold text-[var(--color-ba-navy)] text-[14px] sm:text-[15px] truncate" title={character.name}>
          {character.name}
        </h3>
        <div className="text-[11px] text-[var(--color-ba-navy)] opacity-60 font-bold mt-0.5">
          {character.school}
        </div>
        <div className={cn("flex flex-wrap gap-0.5 mt-1", data.weaponLevel >= 1 ? "text-[var(--color-ba-blue)]" : "text-[var(--color-ba-gold)]")}>
          {Array.from({ length: data.weaponLevel >= 1 ? data.weaponLevel : data.stars }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" />
          ))}
        </div>
        <div className="mt-auto pt-2 text-sm font-black text-[var(--color-ba-navy)]">
          Lv. {data.level}
        </div>
      </div>
    </div>
  );
}
