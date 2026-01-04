import { useState } from 'react';
import { useQDAStore } from '@/store/qdaStore';
import { BarChart3, Network, GitBranch, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ForceGraph } from '@/components/visualizations/ForceGraph';
import { TreeView } from '@/components/visualizations/TreeView';
import { FrequencyChart } from '@/components/visualizations/FrequencyChart';
import { CoOccurrenceGraph } from '@/components/visualizations/CoOccurrenceGraph';

type ViewType = 'force' | 'tree' | 'frequency' | 'cooccurrence';

const VIEWS = [
  { id: 'force' as ViewType, label: 'Force Graph', icon: Network },
  { id: 'tree' as ViewType, label: 'Tree View', icon: GitBranch },
  { id: 'frequency' as ViewType, label: 'Frequency', icon: BarChart3 },
  { id: 'cooccurrence' as ViewType, label: 'Co-occurrence', icon: Grid3X3 },
];

export function VisualizationsView() {
  const [activeViz, setActiveViz] = useState<ViewType>('force');
  const { codes, themes, excerpts } = useQDAStore();

  const renderVisualization = () => {
    switch (activeViz) {
      case 'force':
        return <ForceGraph codes={codes} themes={themes} />;
      case 'tree':
        return <TreeView codes={codes} />;
      case 'frequency':
        return <FrequencyChart codes={codes} />;
      case 'cooccurrence':
        return <CoOccurrenceGraph codes={codes} excerpts={excerpts} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visualizations</h2>
          <p className="text-sm text-muted-foreground">
            Explore relationships between codes and themes
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveViz(view.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                activeViz === view.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <view.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Container */}
      <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
        {codes.length > 0 ? (
          renderVisualization()
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Network className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Data to Visualize</h3>
            <p className="text-muted-foreground max-w-md">
              Create codes and code excerpts in your documents to see visualizations here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
