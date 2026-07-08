const fs = require('fs');
let content = fs.readFileSync('src/components/Timebox.tsx', 'utf8');

content = content.replace(
  "import { Play, Pause, Square, Clock, AlertCircle } from 'lucide-react';",
  "import { Play, Pause, Square, Clock, AlertCircle, Edit2, Check, X } from 'lucide-react';"
);

content = content.replace(
  '  const [showCelebration, setShowCelebration] = useState(false);',
  `  const [showCelebration, setShowCelebration] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  const handleEditClick = (b: Block) => {
    setEditingBlockId(b.id);
    setEditTitle(b.title);
    
    const sH = b.startTime.getHours().toString().padStart(2, '0');
    const sM = b.startTime.getMinutes().toString().padStart(2, '0');
    setEditStartTime(\`\${sH}:\${sM}\`);
    
    const eH = b.endTime.getHours().toString().padStart(2, '0');
    const eM = b.endTime.getMinutes().toString().padStart(2, '0');
    setEditEndTime(\`\${eH}:\${eM}\`);
  };

  const saveBlockEdit = (id: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        const newStart = new Date(b.startTime);
        const [sh, sm] = editStartTime.split(':');
        newStart.setHours(parseInt(sh, 10), parseInt(sm, 10), 0);
        
        const newEnd = new Date(b.endTime);
        const [eh, em] = editEndTime.split(':');
        newEnd.setHours(parseInt(eh, 10), parseInt(em, 10), 0);
        
        return { ...b, title: editTitle, startTime: newStart, endTime: newEnd };
      }
      return b;
    }));
    setEditingBlockId(null);
  };
`
);

fs.writeFileSync('src/components/Timebox.tsx', content);
