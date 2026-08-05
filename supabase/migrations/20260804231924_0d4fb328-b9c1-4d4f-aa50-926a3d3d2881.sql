
-- Excluir uma formação não deve apagar riders vinculados a ela — só desvincular,
-- igual já acontece com technical_riders.event_id. CASCADE aqui era um erro:
-- um rider é conteúdo próprio (channel list, mapa de palco), não um item
-- que só existe em função da formação (diferente de formation_members e
-- gear_checklist_items, que continuam CASCADE por serem partes da formação).
ALTER TABLE public.technical_riders DROP CONSTRAINT technical_riders_formation_id_fkey;
ALTER TABLE public.technical_riders
  ADD CONSTRAINT technical_riders_formation_id_fkey
  FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE SET NULL;
