
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
import { Checkbox } from "./ui/checkbox";

const contactSchema = z.object({
  name: z.string().min(2, { message: "Nama harus terdiri dari minimal 2 karakter." }),
  email: z.string().email({ message: "Silakan masukkan email yang valid." }),
  whatsapp: z.string().min(6, { message: "Nomor WhatsApp harus terdiri dari minimal 6 digit."}),
  location: z.string().min(2, { message: "Lokasi wajib diisi." }),
  knowFrom: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Anda harus memilih setidaknya satu item.",
  }),
});

type FormState = {
  success: boolean;
  message: string;
  downloadUrl?: string | null;
  errors?: any;
} | null;

const knowFromItems = [
    { id: "friends_family", label: "Teman/Keluarga" },
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "ads", label: "Iklan" },
]

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(submitContactForm, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      location: "",
      knowFrom: [],
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

    } else if (state.message && (state.errors || !state.success)) {
       toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, form]);

  return (
    <Card className="w-full bg-transparent border-none shadow-none">
      <Form {...form}>
        <form
            ref={formRef}
            action={formAction}
            className="space-y-6"
            onSubmit={(evt) => {
                form.handleSubmit(() => {
                    // This will be called on successful validation, allowing the native form action to proceed.
                })(evt);
            }}
        >
          <CardContent className="space-y-6 p-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama *</FormLabel>
                  <FormControl>
                    <Input placeholder="Pranaja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="nama@contoh.com" {...field} />
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
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jakarta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="knowFrom"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Bagaimana Anda tahu tentang kami?</FormLabel>
                  </div>
                  {knowFromItems.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="knowFrom"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-8 p-0">
            <Button type="submit" className="w-full h-12" disabled={isPending}>
              {isPending ? "Mengunduh..." : "Unduh Sekarang"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
