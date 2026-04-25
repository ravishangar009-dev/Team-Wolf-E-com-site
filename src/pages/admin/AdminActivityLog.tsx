import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  action: string;
  product_name: string;
  changed_by: string;
  changed_by_email: string | null;
  details: string | null;
  created_at: string;
}

const AdminActivityLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('product_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setLogs(data as LogEntry[]);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all activity logs? This action cannot be undone.")) return;

    const { error } = await supabase
      .from('product_audit_log')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
    if (error) {
      toast.error("Failed to clear logs: " + error.message);
    } else {
      toast.success("All activity logs cleared");
      setLogs([]);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-outfit font-bold">Activity Log</h1>
          <p className="text-muted-foreground">Audit trail for all product modifications</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Track all additions, edits, and deletions performed by admins</CardDescription>
              </div>
              {logs.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleClearLogs}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Logs
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No activity logged yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          log.action === 'added' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          log.action === 'deleted' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.product_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.changed_by_email || 'Unknown Email'}</div>
                          <div className="text-xs text-muted-foreground font-mono">{log.changed_by.slice(0,8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.details || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLog;
