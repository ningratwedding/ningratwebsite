
"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { submitContactForm } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "./ui/card";

const contactSchema = z.object({
  name: z.string().min(2, { message: "Nama harus terdiri dari minimal 2 karakter." }),
  eventType: z.string().min(3, { message: "Jenis acara wajib diisi." }),
  location: z.string().min(2, { message: "Lokasi wajib diisi." }),
  whatsapp: z.string().min(6, { message: "Nomor WhatsApp harus terdiri dari minimal 6 digit."}),
});

type FormState = {
  success: boolean;
  message: string;
  downloadUrl?: string | null;
  errors?: any;
} | null;

interface ContactFormProps {
    onFormSubmit: () => void;
}

export default function ContactForm({ onFormSubmit }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(submitContactForm, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      eventType: "",
      location: "",
      whatsapp: "",
    },
  });

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast({
        title: "Sukses!",
        description: state.message,
      });
      form.reset();
      
      if (state.downloadUrl) {
          window.open(state.downloadUrl, '_blank');
      }
      onFormSubmit();

    } else if (state.message) {
       toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, form, onFormSubmit]);

  return (
    <Card className="w-full bg-transparent border-none shadow-none p-0">
      <Form {...form}>
        <form
            ref={formRef}
            action={formAction}
            className="space-y-4"
        >
          <CardContent className="space-y-4 p-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap Anda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Acara *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Pernikahan, Pre-wedding" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi Acara *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kota atau venue acara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp *</FormLabel>
                  <FormControl>
                    <Input placeholder="08123456789" {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-6 p-0">
            <Button type="submit" className="w-full h-12" disabled={isPending}>
              {isPending ? "Mengirim..." : "Kirim & Unduh"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    