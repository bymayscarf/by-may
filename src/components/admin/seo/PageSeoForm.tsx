"use client";

import * as React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import LabelWithTooltip from "@/components/general/LabelWithTooltip";
import CharacterCountSEO from "@/components/seo/CharacterCountSEO";
import GoogleSearchPreview from "@/components/general/GoogleSearchPreview";
import { updateSEOSetting } from "@/lib/api/seo";
import { revalidatePagePath } from "@/app/actions/revalidate";

export interface PageSeoFormValues {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

interface PageSeoFormProps {
  initialValues: PageSeoFormValues;
  pageId: string;
  pageSlug: string;
  pageType: string;
  onSuccess?: () => void;
}

export function PageSeoForm({
  initialValues,
  pageId,
  pageSlug,
  pageType,
  onSuccess,
}: PageSeoFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      title: Yup.string().required("Judul wajib diisi"),
      description: Yup.string().required("Deskripsi wajib diisi"),
      keywords: Yup.string(),
      ogImage: Yup.string().url("URL tidak valid").nullable(),
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        // Update SEO data via API
        const result = await updateSEOSetting(pageId, {
          title: values.title,
          description: values.description,
          keywords: values.keywords || null,
          ogImage: values.ogImage || null,
        });
        // Revalidate using server action
        await revalidatePagePath(`/${pageSlug}`);

        // Trigger mutation to update the cache
        if (onSuccess) {
          onSuccess();
        }

        toast({
          title: "Pengaturan SEO diperbarui",
          description: `Pengaturan SEO untuk halaman ${pageType} telah berhasil diperbarui.`,
        });
      } catch (error) {
        console.error("Error updating SEO settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal memperbarui pengaturan SEO. Silakan coba lagi.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <LabelWithTooltip
            htmlFor="title"
            label="Judul Meta"
            tooltip="Judul yang muncul di hasil pencarian. Anda tidak perlu menyertakan 'By May Scarf' karena akan ditambahkan secara otomatis."
          />
          <Input
            id="title"
            placeholder="Masukkan judul meta"
            {...formik.getFieldProps("title")}
          />
          {formik.touched.title && formik.errors.title ? (
            <div className="text-red-500 text-sm">{formik.errors.title}</div>
          ) : null}
          <div className="flex justify-between">
            <CharacterCountSEO
              current={formik.values.title.length}
              type="title"
            />
            <span className="text-xs text-muted-foreground italic">
              Akan tampil sebagai: "{formik.values.title} | By May Scarf"
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <LabelWithTooltip
            htmlFor="description"
            label="Deskripsi Meta"
            tooltip="Ringkasan singkat yang muncul di hasil pencarian. Idealnya 150-160 karakter."
          />
          <Textarea
            id="description"
            placeholder="Masukkan deskripsi meta"
            {...formik.getFieldProps("description")}
          />
          {formik.touched.description && formik.errors.description ? (
            <div className="text-red-500 text-sm">
              {formik.errors.description}
            </div>
          ) : null}
          <CharacterCountSEO
            current={formik.values.description.length}
            type="description"
          />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip
            htmlFor="keywords"
            label="Kata Kunci"
            tooltip="Kata kunci yang dipisahkan koma terkait dengan halaman Anda. Kurang penting untuk SEO modern tetapi masih berguna untuk organisasi konten."
          />
          <Textarea
            id="keywords"
            placeholder="contoh: al-quran custom, sajadah, tasbih, hampers islami"
            {...formik.getFieldProps("keywords")}
          />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip
            htmlFor="ogImage"
            label="URL Gambar OG"
            tooltip="Gambar yang muncul ketika halaman Anda dibagikan di media sosial. Ukuran yang direkomendasikan: 1200 x 630 piksel."
          />
          <Input
            id="ogImage"
            placeholder="https://example.com/image.jpg"
            {...formik.getFieldProps("ogImage")}
          />
          {formik.touched.ogImage && formik.errors.ogImage ? (
            <div className="text-red-500 text-sm">{formik.errors.ogImage}</div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-lg p-4 bg-white space-y-2">
            <h4 className="text-sm font-medium text-gray-500">
              Pratinjau Pencarian Google
            </h4>
            <GoogleSearchPreview
              title={formik.values.title}
              description={formik.values.description}
              slug={pageSlug}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan SEO"}
        </Button>
      </div>
    </form>
  );
}
