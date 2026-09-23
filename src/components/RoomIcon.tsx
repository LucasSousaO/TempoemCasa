import React from 'react';
import { 
  Utensils, 
  Sparkles, 
  Armchair, 
  BedDouble, 
  Shirt, 
  Flower2, 
  Home, 
  LucideProps 
} from 'lucide-react';
import { RoomCategory } from '../types';

interface RoomIconProps extends LucideProps {
  room: RoomCategory;
}

export const RoomIcon: React.FC<RoomIconProps> = ({ room, ...props }) => {
  switch (room) {
    case 'cozinha':
      return <Utensils {...props} />;
    case 'banheiro':
      return <Sparkles {...props} />;
    case 'sala':
      return <Armchair {...props} />;
    case 'quarto':
      return <BedDouble {...props} />;
    case 'lavanderia':
      return <Shirt {...props} />;
    case 'quintal':
      return <Flower2 {...props} />;
    case 'geral':
    default:
      return <Home {...props} />;
  }
};
