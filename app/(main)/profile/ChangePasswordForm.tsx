'use client';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updatePassword } from '@/lib/utils';

export default function ChangePasswordForm() {
  const { toast } = useToast();

  const changePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, 'Current password is required'),
      password: z
        .string()
        .min(6, 'Password should be at least 6 characters long'),
      rePassword: z
        .string()
        .min(6, 'Password should be at least 6 characters long'),
    })
    .refine(data => data.password === data.rePassword, {
      message: 'Passwords do not match',
      path: ['rePassword'],
    });

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: z.infer<typeof changePasswordSchema>) {
    try {
      await updatePassword(data.currentPassword, data.password);
      form.reset();
      toast({ title: 'Password changed successfully' });
    } catch (error) {
      toast({
        title: 'Error changing password',
        description: String(error),
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full space-y-4"
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rePassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row justify-end">
          <Button type="submit">Change Password</Button>
        </div>
      </form>
    </Form>
  );
}
