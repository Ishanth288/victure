
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronRight, ChevronLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { stableToast } from '@/components/ui/stable-toast';
import { Progress } from '@/components/ui/progress';
import { sanitizeInput } from '@/utils/securityUtils';

// Progressive form schema
const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

const extendedSchema = baseSchema.extend({
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const completeSchema = extendedSchema.extend({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredContact: z.enum(['email', 'phone', 'any']),
  howDidYouHear: z.string().optional(),
});

interface ProgressiveFormProps {
  onSubmit: (data: any) => void;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function ProgressiveForm({ onSubmit, onStepChange, className = '' }: ProgressiveFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const totalSteps = 3;
  
  // Form methods for the current step
  const stepOneForm = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const stepTwoForm = useForm<z.infer<typeof extendedSchema>>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      phoneNumber: '',
    },
  });
  
  const stepThreeForm = useForm<z.infer<typeof completeSchema>>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      phoneNumber: '',
      message: '',
      preferredContact: 'email',
      howDidYouHear: '',
    },
  });
  
  // Pass data to next step form
  const handleNextStep = async (data: any) => {
    if (step === 1) {
      stepTwoForm.reset({
        ...stepTwoForm.getValues(),
        name: data.name,
        email: data.email,
      });
      setStep(2);
    } else if (step === 2) {
      stepThreeForm.reset({
        ...stepThreeForm.getValues(),
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        phoneNumber: data.phoneNumber,
      });
      setStep(3);
    }
    
    if (onStepChange) {
      onStepChange(step + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      
      if (onStepChange) {
        onStepChange(step - 1);
      }
    }
  };
  
  const handleFinalSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // Sanitize all inputs before submitting
    const sanitizedData = Object.keys(data).reduce((acc: any, key) => {
      acc[key] = data[key] ? sanitizeInput(data[key].toString()) : '';
      return acc;
    }, {});
    
    try {
      await onSubmit(sanitizedData);
      setIsComplete(true);
      stableToast({
        title: "Form submitted successfully!",
        description: "We'll be in touch with you soon.",
        variant: "success"
      });
    } catch (error) {
      stableToast({
        title: "Error submitting form",
        description: "Please try again later.",
        variant: "destructive"
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get active form based on current step
  const getActiveForm = () => {
    switch (step) {
      case 1:
        return {
          form: stepOneForm,
          onSubmit: handleNextStep,
          renderFields: renderStepOne
        };
      case 2:
        return {
          form: stepTwoForm,
          onSubmit: handleNextStep,
          renderFields: renderStepTwo
        };
      case 3:
        return {
          form: stepThreeForm,
          onSubmit: handleFinalSubmit,
          renderFields: renderStepThree
        };
      default:
        return {
          form: stepOneForm,
          onSubmit: handleNextStep,
          renderFields: renderStepOne
        };
    }
  };
  
  const renderStepOne = () => (
    <>
      <div className="space-y-3">
        <FormField
          control={stepOneForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name*</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={stepOneForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address*</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <Button type="submit" className="flex items-center gap-2">
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </>
  );
  
  const renderStepTwo = () => (
    <>
      <div className="space-y-3">
        <FormField
          control={stepTwoForm.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Company Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={stepTwoForm.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 8900" type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex items-center gap-2">
          <ChevronLeft size={16} /> Back
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </>
  );
  
  const renderStepThree = () => (
    <>
      <div className="space-y-3">
        <FormField
          control={stepThreeForm.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message*</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please tell us how we can help you..." 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={stepThreeForm.control}
          name="preferredContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Method*</FormLabel>
              <div className="flex flex-wrap gap-3">
                {['email', 'phone', 'any'].map((value) => (
                  <FormControl key={value}>
                    <div className="flex items-center space-x-2">
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="flex flex-row gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <Label htmlFor="email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="phone" id="phone" />
                          <Label htmlFor="phone">Phone</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="any" id="any" />
                          <Label htmlFor="any">Either</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </FormControl>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={stepThreeForm.control}
          name="howDidYouHear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you hear about us?</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="search">Search Engine</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="friend">Friend/Colleague</SelectItem>
                  <SelectItem value="ad">Advertisement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex items-center gap-2">
          <ChevronLeft size={16} /> Back
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          {isSubmitting ? 'Submitting...' : 'Submit'} <Send size={16} />
        </Button>
      </div>
    </>
  );

  // Import components here to avoid circular dependencies
  const { FormField, FormItem, FormLabel, FormControl, FormMessage } = Form;
  const { Input } = require('@/components/ui/input');
  const { Textarea } = require('@/components/ui/textarea');
  const { RadioGroup, RadioGroupItem } = require('@/components/ui/radio-group');
  const { Label } = require('@/components/ui/label');
  const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = require('@/components/ui/select');
  
  const { form, onSubmit, renderFields } = getActiveForm();

  // Show a thank you screen when the form is complete
  if (isComplete) {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">Your message has been sent successfully. We'll be in touch with you soon.</p>
        <Button
          variant="outline"
          onClick={() => {
            setIsComplete(false);
            setStep(1);
            stepOneForm.reset();
            stepTwoForm.reset();
            stepThreeForm.reset();
          }}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex justify-between mb-1 text-sm">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-2" />
      </div>
      
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderFields()}
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}
