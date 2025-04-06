
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PricingPlan } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Define the input schema - note that the numeric fields now use coerce instead of preprocess
const pricingPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price_monthly: z.coerce.number().min(0, "Price cannot be negative"),
  price_yearly: z.coerce.number().min(0, "Price cannot be negative"),
  category: z.string().optional(),
  plan_id: z.string().min(1, "Plan ID is required"),
  is_popular: z.boolean(),
  display_order: z.coerce.number().min(0, "Display order cannot be negative"),
  features: z.string().transform(val => 
    val.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  ),
});

// Define the form input type - features is a string in the form
type PricingPlanFormInput = {
  name: string;
  description: string;
  price_monthly: number | string;
  price_yearly: number | string;
  category?: string;
  plan_id: string;
  is_popular: boolean;
  display_order: number | string;
  features: string;
};

// Define the form output type - features is transformed to string[] by the schema
type PricingPlanFormOutput = z.output<typeof pricingPlanSchema>;

export function PricingPlanManager() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PricingPlanFormInput>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      category: "",
      plan_id: "",
      is_popular: false,
      display_order: 0,
      features: "",  // Keep as string for form input
    },
  });

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      if (data) {
        setPlans(data as unknown as PricingPlan[]);
      }
    } catch (error: any) {
      console.error("Error fetching pricing plans:", error);
      toast({
        title: "Error",
        description: `Failed to fetch pricing plans: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan: PricingPlan) => {
    setIsEditing(plan.id);
    
    // Convert features array to string for textarea
    const featuresString = Array.isArray(plan.features) 
      ? plan.features.join('\n')
      : typeof plan.features === 'string' 
        ? plan.features
        : '';
    
    form.reset({
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      category: plan.category || "",
      plan_id: plan.plan_id || "",
      is_popular: plan.is_popular || false,
      display_order: plan.display_order || 0,
      features: featuresString,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("pricing_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Plan deleted",
        description: "The pricing plan has been deleted successfully.",
      });

      fetchPlans();
    } catch (error: any) {
      console.error("Error deleting pricing plan:", error);
      toast({
        title: "Error",
        description: `Failed to delete pricing plan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: PricingPlanFormInput) => {
    try {
      setIsLoading(true);
      
      // Transform the form values using the schema
      const transformedValues = pricingPlanSchema.parse(values) as PricingPlanFormOutput;

      const planData = {
        name: transformedValues.name,
        description: transformedValues.description,
        price_monthly: transformedValues.price_monthly,
        price_yearly: transformedValues.price_yearly,
        category: transformedValues.category || null,
        plan_id: transformedValues.plan_id,
        is_popular: transformedValues.is_popular,
        display_order: transformedValues.display_order,
        features: transformedValues.features, // This is now string[] after transformation
      };

      if (isEditing) {
        // Update existing plan
        const { error } = await supabase
          .from("pricing_plans")
          .update(planData)
          .eq("id", isEditing);

        if (error) throw error;

        toast({
          title: "Plan updated",
          description: "The pricing plan has been updated successfully.",
        });
      } else {
        // Create new plan
        const { error } = await supabase
          .from("pricing_plans")
          .insert([planData]);

        if (error) throw error;

        toast({
          title: "Plan created",
          description: "The pricing plan has been created successfully.",
        });
      }

      // Reset form and refresh plans
      form.reset();
      setIsEditing(null);
      fetchPlans();
    } catch (error: any) {
      console.error("Error saving pricing plan:", error);
      toast({
        title: "Error",
        description: `Failed to save pricing plan: ${error.message}`,
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
            {isEditing ? "Edit Pricing Plan" : "Create Pricing Plan"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update an existing pricing plan"
              : "Create a new pricing plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PRO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Standard" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        In INR, without decimals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_yearly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        In INR, without decimals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. pro_monthly" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower numbers appear first
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter features, one per line"
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter one feature per line
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_popular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Popular Plan</FormLabel>
                      <FormDescription>
                        Highlight this plan as the most popular option
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
                    ? "Update Plan"
                    : "Create Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Pricing Plans</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Yearly Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No pricing plans found
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>₹{plan.price_monthly}</TableCell>
                    <TableCell>₹{plan.price_yearly}</TableCell>
                    <TableCell>
                      {plan.is_popular && (
                        <Badge className="bg-primary">Popular</Badge>
                      )}
                    </TableCell>
                    <TableCell>{plan.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
