
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Announcement } from "@/types/database";

const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  type: z.enum(["info", "warning", "success", "error"]),
  is_active: z.boolean(),
  expires_at: z.date().nullable(),
});

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      is_active: true,
      expires_at: null,
    },
  });

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setAnnouncements(data as unknown as Announcement[]);
      }
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: `Failed to fetch announcements: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleEdit = (announcement: Announcement) => {
    setIsEditing(announcement.id);
    form.reset({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type as "info" | "warning" | "success" | "error",
      is_active: announcement.is_active,
      expires_at: announcement.expires_at ? new Date(announcement.expires_at) : null,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Announcement deleted",
        description: "The announcement has been deleted successfully.",
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: `Failed to delete announcement: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
    try {
      setIsLoading(true);

      const announcementData = {
        title: values.title,
        message: values.message,
        type: values.type,
        is_active: values.is_active,
        expires_at: values.expires_at ? values.expires_at.toISOString() : null,
      };

      if (isEditing) {
        // Update existing announcement
        const { error } = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", isEditing);

        if (error) throw error;

        toast({
          title: "Announcement updated",
          description: "The announcement has been updated successfully.",
        });
      } else {
        // Create new announcement
        const { error } = await supabase
          .from("announcements")
          .insert([announcementData]);

        if (error) throw error;

        toast({
          title: "Announcement created",
          description: "The announcement has been created successfully.",
        });
      }

      // Reset form and refresh announcements
      form.reset();
      setIsEditing(null);
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Error",
        description: `Failed to save announcement: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Announcement" : "Create Announcement"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update an existing announcement"
              : "Create a new announcement to be displayed to users"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Announcement message" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select announcement type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No expiry date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave blank to never expire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Display this announcement to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : isEditing
                    ? "Update Announcement"
                    : "Create Announcement"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements found</p>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-base">{announcement.title}</CardTitle>
                    <CardDescription>
                      Created: {new Date(announcement.created_at!).toLocaleDateString()}
                      {announcement.expires_at && (
                        <> | Expires: {new Date(announcement.expires_at).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </div>
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      announcement.type === "info" && "bg-blue-100 text-blue-800",
                      announcement.type === "warning" && "bg-yellow-100 text-yellow-800",
                      announcement.type === "success" && "bg-green-100 text-green-800",
                      announcement.type === "error" && "bg-red-100 text-red-800"
                    )}
                  >
                    {announcement.type}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{announcement.message}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      Status: {announcement.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
