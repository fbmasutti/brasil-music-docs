import { createFileRoute } from "@tanstack/react-router";
import { Palette, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  ConfirmDelete,
  ListState,
} from "@/components/ui-kit";
import { useList, useRemove } from "@/lib/queries";
import { BRAND_PRESETS, patternStyle, FONT_STACKS } from "@/lib/brand-presets";
import { BrandKitFormDialog } from "@/components/BrandKitFormDialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/marca")({
  head: () => ({
    meta: [
      { title: "Identidade Visual — StageKit" },
      {
        name: "description",
        content:
          "Fotos, logo e paleta de cores prontos para gerar cards de divulgação e documentos com a sua cara.",
      },
      { property: "og:title", content: "Identidade Visual — StageKit" },
      {
        property: "og:description",
        content: "Sua identidade visual, pronta para reutilizar em cada formação.",
      },
    ],
  }),
  component: BrandKitPage,
});

function BrandKitPage() {
  const kitsQuery = useList("brand_kits", {
    order: { column: "created_at", ascending: false },
  });
  const kits = kitsQuery.data ?? [];
  const remove = useRemove("brand_kits", "Identidade removida");

  return (
    <PageContainer>
      <PageHeader
        title="Identidade Visual"
        subtitle="Foto, logo e paleta de cores por formação — usados nos cards de divulgação e nos documentos."
        actions={
          <BrandKitFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Nova identidade
              </Button>
            }
          />
        }
      />

      <Section title={kitsQuery.isLoading ? "Identidades" : `Identidades (${kits.length})`}>
        <ListState
          query={kitsQuery}
          skeleton="cards"
          empty={
            <BrandKitFormDialog
              trigger={
                <EmptyState
                  icon={<Palette className="size-5" />}
                  title="Nenhuma identidade criada"
                  description="Clique para criar uma identidade com foto, logo e paleta para os posts de divulgação."
                />
              }
            />
          }
        >
          {(items) => (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((kit) => {
                const preset = BRAND_PRESETS.find((p) => p.id === kit.preset);
                return (
                  <li key={kit.id} className="overflow-hidden rounded-lg border border-border">
                    <div
                      className="flex h-24 items-center justify-center px-3 text-center"
                      style={{
                        background: preset?.palette.bg ?? "var(--primary)",
                        ...(preset
                          ? patternStyle(preset.palette.pattern, preset.palette.accent)
                          : {}),
                      }}
                    >
                      {kit.photo_url ? (
                        <img src={kit.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : preset ? (
                        <span
                          className="text-sm font-bold leading-tight"
                          style={{
                            fontFamily: FONT_STACKS[preset.palette.fontFamily],
                            color: preset.palette.accent,
                          }}
                        >
                          {preset.label}
                        </span>
                      ) : (
                        <Palette className="size-6 text-white/70" />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{kit.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {preset?.label ?? kit.preset}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {kit.logo_url ? (
                          <img
                            src={kit.logo_url}
                            alt=""
                            className="size-8 rounded border border-border bg-card object-contain p-1"
                          />
                        ) : null}
                        <BrandKitFormDialog
                          kit={kit}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Editar ${kit.name}`}>
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDelete
                          title={`Remover "${kit.name}"?`}
                          description="As formações que usam esta identidade voltam ao visual padrão do StageKit. Essa ação não pode ser desfeita."
                          confirmLabel="Remover identidade"
                          onConfirm={() => remove.mutate(kit.id)}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Remover ${kit.name}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ListState>
      </Section>
    </PageContainer>
  );
}
