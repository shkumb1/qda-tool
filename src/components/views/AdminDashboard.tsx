import { useState } from 'react';
import { Copy, Link, Check, Sparkles, LogOut, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  const [participantId, setParticipantId] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const baseUrl = window.location.origin;
  const generatedUrl = participantId
    ? `${baseUrl}/?participantId=${encodeURIComponent(participantId)}&aiEnabled=${aiEnabled}`
    : '';

  const handleCopyUrl = () => {
    if (!generatedUrl) return;
    
    navigator.clipboard.writeText(generatedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    
    toast({
      title: 'URL Copied!',
      description: 'Participant URL copied to clipboard',
    });
  };

  const handleGenerateBatch = () => {
    const count = parseInt(prompt('How many participants?') || '0');
    if (count <= 0) return;

    const aiEnabledCount = Math.ceil(count / 2);
    const urls: string[] = [];

    for (let i = 1; i <= count; i++) {
      const pid = `P${String(i).padStart(2, '0')}`;
      const ai = i <= aiEnabledCount;
      const group = ai ? 'AI' : 'No-AI';
      urls.push(`${group} - ${pid}: ${baseUrl}/?participantId=${pid}&aiEnabled=${ai}`);
    }

    const urlList = urls.join('\n\n');
    navigator.clipboard.writeText(urlList);
    
    toast({
      title: `${count} URLs Generated!`,
      description: 'All participant URLs copied to clipboard',
      duration: 5000,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage participants and view analytics</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="generator" className="gap-2">
              <Link className="h-4 w-4" />
              URL Generator
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* URL Generator Tab */}
          <TabsContent value="generator" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Participant URLs</CardTitle>
                <CardDescription>
                  Create custom URLs with pre-configured participant IDs and AI permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Participant ID Input */}
                <div className="space-y-2">
                  <Label htmlFor="participant-id">Participant ID</Label>
                  <Input
                    id="participant-id"
                    placeholder="e.g., P01, P02, Participant-A"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a unique identifier for this participant
                  </p>
                </div>

                {/* AI Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-toggle" className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4" />
                      Enable AI Assistance
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Participant will have access to AI code suggestions
                    </p>
                  </div>
                  <Switch
                    id="ai-toggle"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>

                {/* Generated URL */}
                {generatedUrl && (
                  <div className="space-y-2">
                    <Label>Generated URL</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {generatedUrl}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyUrl}
                        className="shrink-0"
                      >
                        {copiedUrl ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyUrl}
                    disabled={!generatedUrl}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    onClick={handleGenerateBatch}
                    variant="outline"
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Generate Batch
                  </Button>
                </div>

                {/* Instructions */}
                <div className="rounded-lg border border-accent bg-accent/10 p-4 space-y-2">
                  <h4 className="font-medium text-sm">How to Use:</h4>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Enter a participant ID (e.g., P01, P02)</li>
                    <li>Toggle AI on/off based on their experimental group</li>
                    <li>Click "Copy URL" and send to the participant via email</li>
                    <li>Or use "Generate Batch" to create multiple URLs at once (splits 50/50 AI/No-AI)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Research Analytics</CardTitle>
                <CardDescription>
                  View aggregated data from all participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics data will appear here after participants complete their sessions.</p>
                  <p className="text-sm mt-2">Participants export CSV files from their Analytics view.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
