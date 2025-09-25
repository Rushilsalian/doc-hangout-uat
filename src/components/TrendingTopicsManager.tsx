import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";

const TrendingTopicsManager = () => {
  const { topics, loading, getTrendTypeLabel, getTrendTypeVariant } = useTrendingTopics();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: '',
    tag_name: '',
    trend_type: 'popular' as 'hot' | 'rising' | 'popular'
  });

  const handleAddTopic = async () => {
    if (!user || !newTopic.name.trim() || !newTopic.tag_name.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('trending_topics')
        .insert([{
          name: newTopic.name,
          description: newTopic.description || null,
          tag_name: newTopic.tag_name,
          trend_type: newTopic.trend_type,
          trend_score: Math.random() * 100 // Random score for demo
        }]);

      if (error) throw error;

      toast({ title: "Topic added successfully!" });
      setNewTopic({ name: '', description: '', tag_name: '', trend_type: 'popular' });
      setShowAddDialog(false);
      
      // Refresh the page to show new topic
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding topic:', error);
      if (error.code === '23505') {
        toast({ title: "Topic already exists", variant: "destructive" });
      } else {
        toast({ title: "Failed to add topic", variant: "destructive" });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Topics
          </CardTitle>
          {user && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suggest Trending Topic</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Topic name"
                    value={newTopic.name}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newTopic.description}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    placeholder="Tag name (e.g., ai-diagnostics)"
                    value={newTopic.tag_name}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, tag_name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  />
                  <Select value={newTopic.trend_type} onValueChange={(value: any) => setNewTopic(prev => ({ ...prev, trend_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="rising">Rising</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTopic}>Add Topic</Button>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : topics.length === 0 ? (
          <div className="text-center text-muted-foreground">No trending topics</div>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between text-sm">
              <span className="flex-1 truncate" title={topic.description || topic.name}>
                {topic.name}
              </span>
              <Badge variant={getTrendTypeVariant(topic.trend_type) as any}>
                {getTrendTypeLabel(topic.trend_type)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingTopicsManager;