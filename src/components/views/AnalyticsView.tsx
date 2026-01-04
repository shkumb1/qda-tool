import { useQDAStore } from '@/store/qdaStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download, Clock, Code2, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AnalyticsView() {
  const { toast } = useToast();
  const {
    getResearchMetrics,
    exportResearchData,
    getActiveWorkspace,
    analyticsLogs,
  } = useQDAStore();

  const workspace = getActiveWorkspace();
  
  let metrics = null;
  try {
    metrics = getResearchMetrics();
  } catch (error) {
    console.error('Error calculating metrics:', error);
  }

  if (!workspace?.researchMode) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Research Mode Not Enabled</CardTitle>
            <CardDescription>
              Enable research mode in workspace settings to track analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Yet</CardTitle>
            <CardDescription>
              Start coding to see analytics and metrics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleExportData = () => {
    const csv = exportResearchData();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-data-${metrics.participantId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Data exported',
      description: 'Research data has been downloaded as CSV.',
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Research Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Participant: {metrics.participantId} | 
            AI {workspace.aiEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        <Button onClick={handleExportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Excerpts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Excerpts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExcerpts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.documentsProcessed} documents
            </p>
          </CardContent>
        </Card>

        {/* Total Codes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCodes}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.uniqueCodes} unique
            </p>
          </CardContent>
        </Card>

        {/* Coding Speed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coding Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.codingSpeed.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              excerpts per hour
            </p>
          </CardContent>
        </Card>

        {/* Active Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(metrics.totalActiveTime / 60000)}m
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(metrics.averageTimePerExcerpt)} per excerpt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Metrics (if enabled) */}
      {workspace.aiEnabled && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Assistance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Suggestions Requested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.aiSuggestionsRequested}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Suggestions Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.aiSuggestionsAccepted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.aiAcceptanceRate * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Last {Math.min(analyticsLogs.length, 20)} actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-auto">
            {analyticsLogs
              .slice(-20)
              .reverse()
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.details.codeName && (
                      <span className="text-muted-foreground ml-2">
                        "{log.details.codeName}"
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
