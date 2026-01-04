import { useState } from 'react';
import { Copy, Link, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function URLGenerator() {
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
      urls.push(`${baseUrl}/?participantId=${pid}&aiEnabled=${ai}`);
    }

    const urlList = urls.join('\n');
    navigator.clipboard.writeText(urlList);
    
    toast({
      title: `${count} URLs Generated!`,
      description: 'All participant URLs copied to clipboard',
      duration: 5000,
    });
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Participant URL Generator
          </CardTitle>
          <CardDescription>
            Generate custom URLs for research participants with pre-configured settings
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-toggle" className="flex items-center gap-2">
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
              Generate Batch
            </Button>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-accent bg-accent/10 p-4 space-y-2">
            <h4 className="font-medium text-sm">How to Use:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Enter a participant ID (e.g., P01, P02)</li>
              <li>Toggle AI on/off based on their experimental group</li>
              <li>Click "Copy URL" and send to the participant</li>
              <li>Or use "Generate Batch" to create multiple URLs at once</li>
            </ol>
          </div>

          {/* Example */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Example URLs:</p>
            <p>• With AI: <code>{baseUrl}/?participantId=P01&aiEnabled=true</code></p>
            <p>• Without AI: <code>{baseUrl}/?participantId=P06&aiEnabled=false</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
